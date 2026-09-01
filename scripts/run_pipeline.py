"""
Revenue Recovery Decision Engine — End-to-End Batch Pipeline Runner
Executes Phase 3 through Phase 10 end-to-end and writes all outputs to Supabase.
"""

import sys
import os
import uuid
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_generator import SyntheticDataGenerator, DataWriter
from src.features import FeatureExtractor
from src.model import ModelTrainer, ModelScorer
from src.policy import PolicyEngine
from src.simulator import RecoverySimulator
from src.audit import AuditLogger, OutcomeWriter
from src.evaluation import SystemEvaluator


def run_pipeline(seed: int = 42, num_customers: int = 500, num_payments: int = 3000):
    print("==================================================================")
    print(" Revenue Recovery Decision Engine — End-to-End Execution")
    print("==================================================================")

    run_id = str(uuid.uuid4())
    print(f"-> Initiating Pipeline Run ID: {run_id}")

    config_snapshot = {
        "seed": seed,
        "num_customers": num_customers,
        "num_payments": num_payments,
        "simulation_days": 30,
        "temporal_split_day": 20,
        "version": "1.0.0"
    }

    writer = DataWriter()

    try:
        # Step 1: Create pipeline_runs entry in RUNNING state
        print("\n[1/7] Creating pipeline_runs record in Supabase...")
        writer.create_pipeline_run(run_id, config_snapshot)

        # Step 2: Synthetic Data Generation & Database Seeding
        print("\n[2/7] Generating synthetic dataset and writing to Supabase...")
        generator = SyntheticDataGenerator(seed=seed, num_customers=num_customers, num_payments=num_payments)
        dataset = generator.generate_all(run_id)
        writer.write_dataset(run_id, dataset)
        print(f"      Seeded {len(dataset['failure_events'])} failed payment events.")

        # Step 3: Feature Engineering
        print("\n[3/7] Extracting features for ML models...")
        extractor = FeatureExtractor()
        X, y, payment_ids = extractor.extract_features(
            dataset["failure_events"],
            dataset["payment_attempts"],
            dataset["payments"],
            dataset["customers"]
        )

        # Temporal Train/Eval Split (Days 1-20 Train / Days 21-30 Eval)
        df_payments = pd.DataFrame(dataset["payments"])
        is_eval_mask = df_payments["is_eval_set"].values

        X_train, y_train = X[~is_eval_mask], y[~is_eval_mask]
        X_eval, y_eval = X[is_eval_mask], y[is_eval_mask]

        print(f"      Train Set (Days 1-20): {len(X_train)} samples")
        print(f"      Eval Set (Days 21-30):  {len(X_eval)} samples")

        # Step 4: ML Model Training & Model Selection
        print("\n[4/7] Training Logistic Regression & XGBoost models...")
        trainer = ModelTrainer(seed=seed)
        selected_model, model_name, metrics = trainer.train_and_evaluate(X_train, y_train, X_eval, y_eval)

        print(f"      Model Selection: {model_name.upper()}")
        print(f"      - Logistic Regression Brier Score: {metrics['logistic_regression']['brier_score']:.4f} (AUC: {metrics['logistic_regression']['roc_auc']:.4f})")
        print(f"      - XGBoost Brier Score:             {metrics['xgboost']['brier_score']:.4f} (AUC: {metrics['xgboost']['roc_auc']:.4f})")

        # ML Scoring across all events
        scorer = ModelScorer(selected_model, model_name)
        p_recovery_scores = scorer.predict_p_recovery(X)

        # Step 5: Deterministic Policy Engine Evaluation & Recovery Simulation
        print("\n[5/7] Evaluating Policy Engine guardrails & simulating actions...")
        policy_engine = PolicyEngine()
        simulator = RecoverySimulator(intervention_cost=policy_engine.intervention_cost, seed=seed)

        decisions = []
        recovery_attempts = []
        recovery_outcomes = []
        audit_entries = []

        events = dataset["failure_events"]
        payments_dict = {p["payment_id"]: p for p in dataset["payments"]}

        for idx, event in enumerate(events):
            event_id = event["event_id"]
            pay_id = event["payment_id"]
            payment = payments_dict[pay_id]
            amount = payment["amount"]
            failure_reason = event["failure_reason"]
            p_rec = p_recovery_scores[idx]

            # Policy Decision
            decision, erv, decision_reason, guardrails_checks = policy_engine.evaluate_decision(
                p_recovery=p_rec,
                amount=amount,
                failure_reason=failure_reason
            )

            decision_id = str(uuid.uuid4())
            decisions.append({
                "decision_id": decision_id,
                "pipeline_run_id": run_id,
                "event_id": event_id,
                "payment_id": pay_id,
                "p_recovery": p_rec,
                "erv": erv,
                "decision": decision,
                "decision_reason": decision_reason,
                "guardrails_applied": guardrails_checks,
                "model_version": model_name,
                "policy_version": policy_engine.policy_version
            })

            # Action Simulation
            outcome_type, sim_outcome, rec_amount, net_impact = simulator.simulate_action(
                decision=decision,
                payment_amount=amount,
                ground_truth_is_recoverable=event["ground_truth_is_recoverable"]
            )

            rec_attempt_id = None
            if decision == "RETRY":
                rec_attempt_id = str(uuid.uuid4())
                recovery_attempts.append({
                    "recovery_attempt_id": rec_attempt_id,
                    "pipeline_run_id": run_id,
                    "decision_id": decision_id,
                    "payment_id": pay_id,
                    "simulated_outcome": sim_outcome,
                    "intervention_cost": policy_engine.intervention_cost
                })

            outcome_id = str(uuid.uuid4())
            recovery_outcomes.append({
                "outcome_id": outcome_id,
                "pipeline_run_id": run_id,
                "event_id": event_id,
                "decision_id": decision_id,
                "recovery_attempt_id": rec_attempt_id,
                "outcome_type": outcome_type,
                "recovered_amount": rec_amount,
                "net_value_impact": net_impact
            })

            # Audit Log Entry
            audit_entries.append({
                "log_id": str(uuid.uuid4()),
                "pipeline_run_id": run_id,
                "entity_type": "RECOVERY_DECISION",
                "entity_id": decision_id,
                "event_type": "POLICY_EVALUATED",
                "actor": "POLICY_ENGINE",
                "payload": {
                    "event_id": event_id,
                    "payment_id": pay_id,
                    "amount": amount,
                    "p_recovery": p_rec,
                    "erv": erv,
                    "decision": decision,
                    "outcome_type": outcome_type,
                    "net_value_impact": net_impact
                }
            })

        # Write Decisions, Outcomes, and Audit Log to Supabase
        print("      Writing decisions, outcomes, and audit logs to Supabase...")
        outcome_writer = OutcomeWriter()
        outcome_writer.write_results(decisions, recovery_attempts, recovery_outcomes)

        audit_logger = AuditLogger()
        audit_logger.log_entries(audit_entries)

        # Step 6: Evaluation Layer & Metric Computation
        print("\n[6/7] Computing evaluation metrics over Days 21-30...")
        evaluator = SystemEvaluator(intervention_cost=policy_engine.intervention_cost)
        eval_results = evaluator.evaluate_run(
            pipeline_run_id=run_id,
            failure_events=dataset["failure_events"],
            payments=dataset["payments"],
            decisions=decisions,
            recovery_attempts=recovery_attempts,
            recovery_outcomes=recovery_outcomes
        )

        print("\n==================================================================")
        print(" PERFORMANCE & BUSINESS METRICS SUMMARY (Days 21-30 Evaluation)")
        print("==================================================================")
        print(f" Revenue at Risk:                INR {eval_results['revenue_at_risk']:,.2f}")
        print(f" Gross Recovered Revenue:         INR {eval_results['recovered_revenue_gross']:,.2f}")
        print(f" Total Intervention Cost:        INR {eval_results['intervention_cost_total']:,.2f}")
        print(f" NET RECOVERY VALUE:             INR {eval_results['net_recovery_value']:,.2f}")
        print(f" Correct Non-Action Value:       INR {eval_results['correct_non_action_value']:,.2f}")
        print(f" Recovery Precision:             {eval_results['recovery_precision']*100:.2f}%")
        print(f" Recovery Recall:                {eval_results['recovery_recall']*100:.2f}%")
        print(f" Model Brier Score (Calibration): {eval_results['brier_score']:.4f}")
        print(f" Model ROC-AUC Score:            {eval_results['roc_auc_score']:.4f}")
        print("------------------------------------------------------------------")
        print(f" Baseline Always Retry Net Value: INR {eval_results['baseline_always_retry_net']:,.2f}")
        print(f" NET LIFT vs Always Retry:       INR {eval_results['net_value_vs_always_retry']:,.2f}")
        print("==================================================================")

        # Step 7: Finalize Pipeline Run State
        print("\n[7/7] Finalizing pipeline run status...")
        writer.mark_run_completed(run_id, len(events))
        print("      Pipeline run status set to 'COMPLETED'.")

        return eval_results

    except Exception as e:
        print(f"\n[ERROR] Pipeline execution failed: {e}")
        writer.mark_run_failed(run_id, str(e))
        raise e


if __name__ == "__main__":
    run_pipeline()
