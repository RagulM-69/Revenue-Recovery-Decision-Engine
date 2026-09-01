"""
Revenue Recovery Decision Engine — Evaluation Layer
Computes business metrics, baseline comparisons, calibration curves, and writes evaluation_results.
"""

import uuid
import numpy as np
import pandas as pd
from typing import Dict, List, Any
from sklearn.metrics import brier_score_loss, roc_auc_score, confusion_matrix
from supabase import Client
from src.db_client import get_supabase_client


class SystemEvaluator:
    """
    Computes business and ML evaluation metrics over the held-out temporal evaluation window (Days 21-30).
    Compares engine performance against 'Always Retry' and 'Always Do Nothing' baselines under identical simulation math.
    """

    def __init__(self, intervention_cost: float = 15.00, client: Client = None):
        self.intervention_cost = intervention_cost
        self.client = client or get_supabase_client()

    def evaluate_run(
        self,
        pipeline_run_id: str,
        failure_events: List[Dict[str, Any]],
        payments: List[Dict[str, Any]],
        decisions: List[Dict[str, Any]],
        recovery_attempts: List[Dict[str, Any]],
        recovery_outcomes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compute evaluation metrics over evaluation window and write to evaluation_results table.
        """
        df_events = pd.DataFrame(failure_events)
        df_payments = pd.DataFrame(payments)
        df_decisions = pd.DataFrame(decisions)
        df_outcomes = pd.DataFrame(recovery_outcomes)

        # Merge data
        df = df_events.merge(df_payments[["payment_id", "amount", "is_eval_set"]], on="payment_id")
        df = df.merge(df_decisions[["event_id", "decision", "p_recovery", "erv"]], on="event_id")
        df = df.merge(df_outcomes[["event_id", "outcome_type", "recovered_amount", "net_value_impact"]], on="event_id")

        # Filter to temporal evaluation window (Days 21-30)
        df_eval = df[df["is_eval_set"]].copy()
        if df_eval.empty:
            df_eval = df.copy()  # Fallback if eval flag missing

        total_failed_events = len(df_eval)
        revenue_at_risk = float(df_eval["amount"].sum())

        # Business Outcomes
        recovered_df = df_eval[df_eval["outcome_type"] == "RECOVERED"]
        recovered_revenue_gross = float(recovered_df["amount"].sum())

        retries_df = df_eval[df_eval["decision"] == "RETRY"]
        intervention_cost_total = float(len(retries_df) * self.intervention_cost)
        net_recovery_value = float(recovered_revenue_gross - intervention_cost_total)

        # Correct Non-Action Value (Avoided intervention costs on unrecoverable payments)
        correct_non_actions = df_eval[
            (df_eval["decision"] == "DO_NOTHING") & (~df_eval["ground_truth_is_recoverable"])
        ]
        correct_non_action_value = float(len(correct_non_actions) * self.intervention_cost)

        # Rates & Precision/Recall: Realized Simulation Recovery Metrics
        # NOTE: recovery_precision and recovery_recall measure ACTUAL SIMULATED RECOVERIES vs retries/ground-truth.
        # - Realized Precision = (Actual RECOVERED count) / (Total RETRY decisions)
        # - Realized Recall    = (Actual RECOVERED count) / (Total ground-truth recoverable payments)
        retry_count = len(retries_df)
        recovered_count = len(recovered_df)
        failed_retry_count = len(df_eval[df_eval["outcome_type"] == "NOT_RECOVERED"])
        escalation_count = len(df_eval[df_eval["decision"] == "ESCALATE"])
        total_recoverable = len(df_eval[df_eval["ground_truth_is_recoverable"]])

        false_intervention_rate = float(failed_retry_count / retry_count) if retry_count > 0 else 0.0
        escalation_rate = float(escalation_count / total_failed_events) if total_failed_events > 0 else 0.0
        recovery_precision = float(recovered_count / retry_count) if retry_count > 0 else 0.0
        recovery_recall = float(recovered_count / total_recoverable) if total_recoverable > 0 else 0.0

        # Model Metrics
        y_true = df_eval["ground_truth_is_recoverable"].astype(int).values
        y_prob = df_eval["p_recovery"].astype(float).values

        brier = float(brier_score_loss(y_true, y_prob)) if len(y_true) > 0 else 0.0
        roc_auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.5

        # Baseline Comparisons
        # Baseline 1: Always Retry (evaluated under identical simulator expectation: 90% rec on true, 5% on false)
        rec_sum = df_eval[df_eval["ground_truth_is_recoverable"]]["amount"].sum()
        unrec_sum = df_eval[~df_eval["ground_truth_is_recoverable"]]["amount"].sum()
        always_retry_recovered = float(0.90 * rec_sum + 0.05 * unrec_sum)
        baseline_always_retry_net = float(always_retry_recovered - (total_failed_events * self.intervention_cost))

        # Baseline 2: Always Do Nothing
        baseline_always_do_nothing_net = 0.00

        net_value_vs_always_retry = float(net_recovery_value - baseline_always_retry_net)
        net_value_vs_always_do_nothing = float(net_recovery_value - baseline_always_do_nothing_net)

        # Calibration Curve Data (10 probability bins)
        bins = np.linspace(0.0, 1.0, 11)
        bin_ids = np.digitize(y_prob, bins) - 1
        calibration_curve = []

        for b in range(10):
            mask = bin_ids == b
            count = int(np.sum(mask))
            if count > 0:
                mean_pred = float(np.mean(y_prob[mask]))
                observed_ratio = float(np.mean(y_true[mask]))
            else:
                mean_pred = float((bins[b] + bins[b+1]) / 2)
                observed_ratio = 0.0

            calibration_curve.append({
                "bin_index": b,
                "bin_midpoint": round(mean_pred, 4),
                "observed_ratio": round(observed_ratio, 4),
                "count": count
            })

        # Policy Classification Confusion Matrix (Policy Action vs Ground Truth)
        # NOTE: This matrix measures classifier policy selection (RETRY vs DO_NOTHING) against latent ground truth.
        # It differs from realized simulation precision/recall because simulation has a ~90% realization rate on recoverable payments.
        y_pred_retry = (df_eval["decision"] == "RETRY").astype(int).values
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred_retry, labels=[0, 1]).ravel()

        results_record = {
            "result_id": str(uuid.uuid4()),
            "pipeline_run_id": pipeline_run_id,
            "eval_window_start": str(df_eval["failed_at"].min()),
            "eval_window_end": str(df_eval["failed_at"].max()),
            "total_failed_events": total_failed_events,
            "revenue_at_risk": round(revenue_at_risk, 2),
            "recovered_revenue_gross": round(recovered_revenue_gross, 2),
            "intervention_cost_total": round(intervention_cost_total, 2),
            "net_recovery_value": round(net_recovery_value, 2),
            "correct_non_action_value": round(correct_non_action_value, 2),
            "false_intervention_rate": round(false_intervention_rate, 4),
            "escalation_rate": round(escalation_rate, 4),
            "recovery_precision": round(recovery_precision, 4),
            "recovery_recall": round(recovery_recall, 4),
            "brier_score": round(brier, 4),
            "roc_auc_score": round(roc_auc, 4),
            "baseline_always_retry_net": round(baseline_always_retry_net, 2),
            "baseline_always_do_nothing_net": round(baseline_always_do_nothing_net, 2),
            "net_value_vs_always_retry": round(net_value_vs_always_retry, 2),
            "net_value_vs_always_do_nothing": round(net_value_vs_always_do_nothing, 2),
            "calibration_curve_data": calibration_curve,
            "confusion_matrix": {"tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)}
        }

        # Write to Supabase evaluation_results table
        self.client.table("evaluation_results").upsert(results_record).execute()
        return results_record
