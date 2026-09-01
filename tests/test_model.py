"""
Unit Tests for Phase 5 — ML Model Training & Scoring
"""

import uuid
import unittest
import pandas as pd
from src.data_generator.generator import SyntheticDataGenerator
from src.features.extractor import FeatureExtractor
from src.model.trainer import ModelTrainer
from src.model.scorer import ModelScorer


class TestModelTrainer(unittest.TestCase):

    def test_model_training_and_scoring(self):
        run_id = str(uuid.uuid4())
        generator = SyntheticDataGenerator(seed=202, num_customers=50, num_payments=400)
        dataset = generator.generate_all(run_id)

        extractor = FeatureExtractor()
        X, y, payment_ids = extractor.extract_features(
            dataset["failure_events"],
            dataset["payment_attempts"],
            dataset["payments"],
            dataset["customers"]
        )

        df_payments = pd.DataFrame(dataset["payments"])
        is_eval = df_payments["is_eval_set"].values

        X_train, y_train = X[~is_eval], y[~is_eval]
        X_eval, y_eval = X[is_eval], y[is_eval]

        self.assertGreater(len(X_train), 0)
        self.assertGreater(len(X_eval), 0)

        # Train models
        trainer = ModelTrainer(seed=42)
        model, model_name, metrics = trainer.train_and_evaluate(X_train, y_train, X_eval, y_eval)

        self.assertIn(model_name, ["logistic_regression_v1", "xgboost_v1"])
        self.assertIn("logistic_regression", metrics)
        self.assertIn("xgboost", metrics)

        # Score probabilities
        scorer = ModelScorer(model, model_name)
        p_recovery = scorer.predict_p_recovery(X_eval)

        self.assertEqual(len(p_recovery), len(X_eval))
        for p in p_recovery:
            self.assertTrue(0.0 <= p <= 1.0)


if __name__ == "__main__":
    unittest.main()
