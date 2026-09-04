"""
Revenue Recovery Decision Engine — Deterministic Policy Engine
Applies Expected Recovery Value (ERV) math and ordered guardrails to emit RETRY / ESCALATE / DO_NOTHING.
"""

import os
import yaml
from typing import Dict, List, Any, Tuple


class PolicyEngine:
    """
    Pure deterministic policy engine.
    Given P(recovery), amount, failure context, and guardrails -> emits decision + audited guardrail checklist.
    """

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "config", "policy_config.yaml"
            )

        self.config = self._load_config(config_path)
        self.policy_version = self.config.get("version", "1.0.0")

        p_cfg = self.config.get("policy", self.config)
        self.intervention_cost = float(p_cfg.get("intervention_cost", 15.00))

        g_cfg = p_cfg.get("guardrails", {})
        self.max_retry_count = int(g_cfg.get("max_retry_count", 3))
        self.recovery_window_hours = int(g_cfg.get("recovery_window_hours", 72))
        self.min_confidence = float(g_cfg.get("min_confidence", 0.05))
        self.min_erv = float(g_cfg.get("min_erv", 0.00))
        self.high_value_threshold = float(g_cfg.get("high_value_threshold", 100000.00))
        self.low_value_threshold = float(g_cfg.get("low_value_threshold", 100.00))

        self.failure_blocklist = set(p_cfg.get("failure_reason_blocklist", []))

    def _load_config(self, path: str) -> Dict[str, Any]:
        """Load external YAML policy configuration."""
        if not os.path.exists(path):
            # Fallback default dict
            return {
                "version": "1.0.0",
                "policy": {
                    "intervention_cost": 15.00,
                    "guardrails": {
                        "max_retry_count": 3,
                        "min_confidence": 0.05,
                        "min_erv": 0.00,
                        "high_value_threshold": 100000.00
                    },
                    "failure_reason_blocklist": [
                        "account_closed",
                        "card_permanently_blocked",
                        "suspected_fraud",
                        "velocity_check_failed"
                    ]
                }
            }
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def evaluate_decision(
        self,
        p_recovery: float,
        amount: float,
        failure_reason: str,
        attempt_number: int = 1,
        prior_retries: int = 0
    ) -> Tuple[str, float, str, List[Dict[str, Any]]]:
        """
        Evaluate Expected Recovery Value (ERV) and ordered policy guardrails.
        
        Returns:
            Tuple[decision, erv, decision_reason, guardrails_applied_list]
        """
        # Step 1: ERV Calculation
        erv = round(p_recovery * amount - self.intervention_cost, 2)
        guardrails_checks = []

        # Step 2: Ordered Guardrails

        # Rule 1: Max Retry Count Check
        if attempt_number > self.max_retry_count or prior_retries >= self.max_retry_count:
            guardrails_checks.append({
                "rule": "max_retry_count",
                "status": "FAIL",
                "detail": f"Attempt count ({attempt_number}) exceeded limit ({self.max_retry_count})"
            })
            return "DO_NOTHING", erv, "Exceeded maximum allowed retry attempts", guardrails_checks
        else:
            guardrails_checks.append({"rule": "max_retry_count", "status": "PASS"})

        # Rule 2: Failure Reason Blocklist Check
        if failure_reason in self.failure_blocklist:
            guardrails_checks.append({
                "rule": "failure_reason_blocklist",
                "status": "FAIL",
                "detail": f"Failure reason '{failure_reason}' is unrecoverable"
            })
            return "DO_NOTHING", erv, f"Failure reason '{failure_reason}' is unconditionally blocked", guardrails_checks
        else:
            guardrails_checks.append({"rule": "failure_reason_blocklist", "status": "PASS"})

        # Rule 3: High-Value Threshold Escalation Check
        if amount >= self.high_value_threshold and p_recovery < 0.85:
            guardrails_checks.append({
                "rule": "high_value_threshold",
                "status": "TRIGGERED",
                "detail": f"High value amount (INR {amount}) with ambiguous confidence ({p_recovery})"
            })
            return "ESCALATE", erv, "High-value transaction requires manual escalation", guardrails_checks
        else:
            guardrails_checks.append({"rule": "high_value_threshold", "status": "PASS"})

        # Rule 4: Confidence Floor Check
        if p_recovery < self.min_confidence:
            guardrails_checks.append({
                "rule": "confidence_floor",
                "status": "FAIL",
                "detail": f"P(recovery) ({p_recovery:.4f}) below minimum threshold ({self.min_confidence})"
            })
            return "DO_NOTHING", erv, f"Recovery confidence ({p_recovery:.2f}) below threshold ({self.min_confidence})", guardrails_checks
        else:
            guardrails_checks.append({"rule": "confidence_floor", "status": "PASS"})

        # Rule 5: Positive ERV Check
        if erv > self.min_erv:
            guardrails_checks.append({
                "rule": "min_erv",
                "status": "PASS",
                "detail": f"Expected Recovery Value (INR {erv}) > {self.min_erv}"
            })
            return "RETRY", erv, f"Positive ERV (INR {erv}) warrants recovery retry", guardrails_checks
        else:
            guardrails_checks.append({
                "rule": "min_erv",
                "status": "FAIL",
                "detail": f"ERV (INR {erv}) <= {self.min_erv} after intervention cost (INR {self.intervention_cost})"
            })
            return "DO_NOTHING", erv, "Expected recovery value is non-positive", guardrails_checks
