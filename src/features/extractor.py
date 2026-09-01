"""
Revenue Recovery Decision Engine — Feature Engineering Module
Transforms raw entity records into engineered numerical feature vectors for ML training & scoring.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple


class FeatureExtractor:
    """
    Feature Extractor for ML models (Logistic Regression & XGBoost).
    Converts relational records/DataFrames into model feature matrices X and target vector y.
    """

    FEATURE_NAMES = [
        "hour_of_day",
        "day_of_week",
        "amount_log",
        "amount_bucket_code",
        "prior_attempt_count",
        "customer_historical_success_rate",
        "days_since_account_created",
        "hours_since_failure",
        # One-hot encoded failure categories
        "cat_SOFT_DECLINE",
        "cat_HARD_DECLINE",
        "cat_TECHNICAL_ERROR",
        "cat_FRAUD_RISK",
        # One-hot encoded payment methods
        "method_UPI",
        "method_CARD",
        "method_NET_BANKING",
        "method_NACH",
        "method_WALLET",
        # One-hot encoded customer segments
        "segment_CONSUMER",
        "segment_SME",
        "segment_ENTERPRISE"
    ]

    AMOUNT_BUCKETS = [0, 500, 2500, 10000, 50000, float("inf")]

    def extract_features(
        self,
        failure_events: List[Dict[str, Any]],
        payment_attempts: List[Dict[str, Any]],
        payments: List[Dict[str, Any]],
        customers: List[Dict[str, Any]]
    ) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
        """
        Build tabular feature DataFrame X, target Series y, and payment_id mapping Series.
        """
        df_events = pd.DataFrame(failure_events)
        df_attempts = pd.DataFrame(payment_attempts)
        df_payments = pd.DataFrame(payments)
        df_customers = pd.DataFrame(customers)

        # Clean duplicate/conflicting column names prior to merge
        if "payment_id" in df_attempts.columns:
            df_attempts = df_attempts.drop(columns=["payment_id"])
        if "pipeline_run_id" in df_attempts.columns:
            df_attempts = df_attempts.drop(columns=["pipeline_run_id"])
        if "pipeline_run_id" in df_payments.columns:
            df_payments = df_payments.drop(columns=["pipeline_run_id"])
        if "pipeline_run_id" in df_customers.columns:
            df_customers = df_customers.drop(columns=["pipeline_run_id"])

        df_customers = df_customers.rename(columns={"created_at": "customer_created_at"})
        df_payments = df_payments.rename(columns={"created_at": "payment_created_at"})

        # Merge relational data
        df = df_events.merge(df_payments, on="payment_id")
        df = df.merge(df_customers, on="customer_id")
        df = df.merge(df_attempts, on="attempt_id")

        # Convert timestamps
        failed_at = pd.to_datetime(df["failed_at"])
        attempted_at = pd.to_datetime(df["attempted_at"])
        created_at_cust = pd.to_datetime(df["customer_created_at"])

        # Temporal features
        df["hour_of_day"] = failed_at.dt.hour
        df["day_of_week"] = failed_at.dt.dayofweek

        # Monetary features
        df["amount_log"] = np.log1p(df["amount"].astype(float))
        df["amount_bucket_code"] = pd.cut(
            df["amount"].astype(float), bins=self.AMOUNT_BUCKETS, labels=False, right=True
        ).fillna(0).astype(int)

        # Customer & Attempt features
        df["prior_attempt_count"] = df["attempt_number"] - 1
        df["customer_historical_success_rate"] = df["historical_success_rate"].astype(float)

        days_account = (failed_at - created_at_cust).dt.total_seconds() / (24 * 3600)
        df["days_since_account_created"] = np.maximum(days_account, 0.0)

        hours_failure = (failed_at - attempted_at).dt.total_seconds() / 3600
        df["hours_since_failure"] = np.maximum(hours_failure, 0.0)

        # One-hot encoding categorical variables
        for cat in ["SOFT_DECLINE", "HARD_DECLINE", "TECHNICAL_ERROR", "FRAUD_RISK"]:
            df[f"cat_{cat}"] = (df["failure_category"] == cat).astype(int)

        for method in ["UPI", "CARD", "NET_BANKING", "NACH", "WALLET"]:
            df[f"method_{method}"] = (df["payment_method"] == method).astype(int)

        for seg in ["CONSUMER", "SME", "ENTERPRISE"]:
            df[f"segment_{seg}"] = (df["segment"] == seg).astype(int)

        X = df[self.FEATURE_NAMES].copy()
        y = df["ground_truth_is_recoverable"].astype(int) if "ground_truth_is_recoverable" in df.columns else pd.Series(0, index=df.index)
        payment_ids = df["payment_id"]

        return X, y, payment_ids
