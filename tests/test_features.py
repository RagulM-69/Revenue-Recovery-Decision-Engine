"""
Unit Tests for Phase 4 — Feature Engineering
"""

import uuid
import unittest
from datetime import datetime, timezone
from src.data_generator.generator import SyntheticDataGenerator
from src.features.extractor import FeatureExtractor


class TestFeatureExtractor(unittest.TestCase):

    def test_feature_extraction_pipeline(self):
        run_id = str(uuid.uuid4())
        generator = SyntheticDataGenerator(seed=101, num_customers=30, num_payments=150)
        dataset = generator.generate_all(run_id)

        extractor = FeatureExtractor()
        X, y, payment_ids = extractor.extract_features(
            dataset["failure_events"],
            dataset["payment_attempts"],
            dataset["payments"],
            dataset["customers"]
        )

        self.assertEqual(len(X), 150)
        self.assertEqual(len(y), 150)
        self.assertEqual(len(payment_ids), 150)

        # Check all feature columns exist
        for feat in FeatureExtractor.FEATURE_NAMES:
            self.assertIn(feat, X.columns)

        # Check target values are binary
        self.assertTrue(set(y.unique()).issubset({0, 1}))

        # Check amount_log non-negative
        self.assertTrue((X["amount_log"] > 0).all())


if __name__ == "__main__":
    unittest.main()
