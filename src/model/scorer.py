"""
Revenue Recovery Decision Engine — ML Scorer Module
Generates calibrated probability scores P(recovery) for failure events using trained model.
"""

import numpy as np
import pandas as pd
from typing import Any, List


class ModelScorer:
    """
    Inference scoring module for estimating P(recovery) given engineered feature vectors.
    """

    def __init__(self, model: Any, model_name: str):
        self.model = model
        self.model_name = model_name

    def predict_p_recovery(self, X: pd.DataFrame) -> List[float]:
        """
        Generate calibrated P(recovery) probability scores in range [0.0, 1.0].
        """
        if X.empty:
            return []

        probs = self.model.predict_proba(X)[:, 1]
        # Clip probabilities strictly into [0.0, 1.0]
        calibrated_probs = np.clip(probs, 0.0, 1.0)
        return [round(float(p), 5) for p in calibrated_probs]
