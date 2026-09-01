"""
Revenue Recovery Decision Engine — ML Model Trainer
Trains Logistic Regression baseline and XGBoost comparison models on temporal split data.
Evaluates calibration (Brier Score) and discrimination (ROC-AUC) to select production model.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import roc_auc_score, brier_score_loss
from xgboost import XGBClassifier


class ModelTrainer:
    """
    Trains, calibrates, and compares Logistic Regression and XGBoost models.
    Enforces temporal train/test split: Days 1-20 (train) vs Days 21-30 (eval).
    """

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.lr_model = make_pipeline(
            StandardScaler(),
            LogisticRegression(max_iter=2000, random_state=self.seed)
        )
        self.xgb_model = CalibratedClassifierCV(
            estimator=XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.05,
                random_state=self.seed,
                eval_metric="logloss"
            ),
            method="sigmoid",
            cv=3
        )

    def train_and_evaluate(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_eval: pd.DataFrame,
        y_eval: pd.Series
    ) -> Tuple[Any, str, Dict[str, Any]]:
        """
        Train both models on training set (Days 1-20) and evaluate on eval set (Days 21-30).
        Selects the model with the lower Brier Score (better calibration) as production model.
        """

        # 1. Train Logistic Regression
        self.lr_model.fit(X_train, y_train)
        lr_probs = self.lr_model.predict_proba(X_eval)[:, 1]
        lr_brier = brier_score_loss(y_eval, lr_probs)
        lr_auc = roc_auc_score(y_eval, lr_probs)

        # 2. Train Calibrated XGBoost
        self.xgb_model.fit(X_train, y_train)
        xgb_probs = self.xgb_model.predict_proba(X_eval)[:, 1]
        xgb_brier = brier_score_loss(y_eval, xgb_probs)
        xgb_auc = roc_auc_score(y_eval, xgb_probs)

        metrics = {
            "logistic_regression": {
                "brier_score": float(lr_brier),
                "roc_auc": float(lr_auc)
            },
            "xgboost": {
                "brier_score": float(xgb_brier),
                "roc_auc": float(xgb_auc)
            }
        }

        # Model Selection: Prefer lower Brier score (better calibration)
        if xgb_brier <= lr_brier:
            selected_model = self.xgb_model
            selected_name = "xgboost_v1"
        else:
            selected_model = self.lr_model
            selected_name = "logistic_regression_v1"

        metrics["selected_model_name"] = selected_name
        return selected_model, selected_name, metrics
