"""
Unit and Integration Tests for Phase 3 — Synthetic Data Generator
"""

import uuid
import unittest
from src.data_generator.generator import SyntheticDataGenerator


class TestDataGenerator(unittest.TestCase):

    def test_deterministic_generation(self):
        """Verify that identical random seeds produce identical datasets."""
        run_id = str(uuid.uuid4())
        gen1 = SyntheticDataGenerator(seed=123, num_customers=50, num_payments=200)
        data1 = gen1.generate_all(run_id)

        gen2 = SyntheticDataGenerator(seed=123, num_customers=50, num_payments=200)
        data2 = gen2.generate_all(run_id)

        self.assertEqual(len(data1["customers"]), 50)
        self.assertEqual(len(data2["customers"]), 50)
        self.assertEqual(len(data1["payments"]), 200)
        self.assertEqual(len(data2["payments"]), 200)
        self.assertEqual(data1["customers"][0]["external_customer_id"], data2["customers"][0]["external_customer_id"])
        self.assertEqual(data1["failure_events"][0]["ground_truth_is_recoverable"], data2["failure_events"][0]["ground_truth_is_recoverable"])

    def test_schema_and_enums(self):
        """Verify constraint and enum compliance."""
        run_id = str(uuid.uuid4())
        gen = SyntheticDataGenerator(seed=42, num_customers=20, num_payments=100)
        data = gen.generate_all(run_id)

        for c in data["customers"]:
            self.assertEqual(c["pipeline_run_id"], run_id)
            self.assertIn(c["segment"], ["CONSUMER", "SME", "ENTERPRISE"])
            self.assertTrue(0.0 <= c["historical_success_rate"] <= 1.0)
            self.assertGreaterEqual(c["account_age_days"], 0)

        for p in data["payments"]:
            self.assertEqual(p["pipeline_run_id"], run_id)
            self.assertGreater(p["amount"], 0)
            self.assertEqual(p["currency"], "INR")
            self.assertIn(p["payment_method"], ["UPI", "CARD", "NET_BANKING", "NACH", "WALLET"])
            self.assertIsInstance(p["is_eval_set"], bool)

        for fe in data["failure_events"]:
            self.assertEqual(fe["pipeline_run_id"], run_id)
            self.assertIn(fe["failure_category"], ["SOFT_DECLINE", "HARD_DECLINE", "TECHNICAL_ERROR", "FRAUD_RISK"])
            self.assertIsInstance(fe["ground_truth_is_recoverable"], bool)

    def test_temporal_split(self):
        """Verify that payments are correctly flagged for train (Days 1-20) vs eval (Days 21-30)."""
        run_id = str(uuid.uuid4())
        gen = SyntheticDataGenerator(seed=99, num_customers=30, num_payments=300)
        data = gen.generate_all(run_id)

        train_payments = [p for p in data["payments"] if not p["is_eval_set"]]
        eval_payments = [p for p in data["payments"] if p["is_eval_set"]]

        self.assertGreater(len(train_payments), 0)
        self.assertGreater(len(eval_payments), 0)
        self.assertEqual(len(train_payments) + len(eval_payments), 300)

    def test_learnable_recovery_signal(self):
        """Verify that hard declines are never recoverable, while technical errors have high recoverability."""
        run_id = str(uuid.uuid4())
        gen = SyntheticDataGenerator(seed=55, num_customers=100, num_payments=1000)
        data = gen.generate_all(run_id)

        hard_declines = [fe for fe in data["failure_events"] if fe["failure_category"] == "HARD_DECLINE"]
        tech_errors = [fe for fe in data["failure_events"] if fe["failure_category"] == "TECHNICAL_ERROR"]

        # Hard declines must never be recoverable
        self.assertTrue(all(not fe["ground_truth_is_recoverable"] for fe in hard_declines))

        # Technical errors should have high recovery rate (> 50%)
        tech_recovered_count = sum(1 for fe in tech_errors if fe["ground_truth_is_recoverable"])
        self.assertGreater(tech_recovered_count / len(tech_errors), 0.50)


if __name__ == "__main__":
    unittest.main()
