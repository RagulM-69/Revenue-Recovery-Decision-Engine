"""
Unit Tests for Phase 6 — Deterministic Policy Engine
"""

import unittest
from src.policy.engine import PolicyEngine


class TestPolicyEngine(unittest.TestCase):

    def setUp(self):
        self.engine = PolicyEngine()

    def test_retry_decision(self):
        """High P(recovery) + moderate amount -> RETRY with positive ERV."""
        decision, erv, reason, checks = self.engine.evaluate_decision(
            p_recovery=0.75, amount=1000.0, failure_reason="insufficient_funds"
        )
        self.assertEqual(decision, "RETRY")
        self.assertEqual(erv, 735.0)  # 0.75 * 1000 - 15 = 735.0
        self.assertIn("Positive ERV", reason)

    def test_blocklist_decision(self):
        """Failure reason in blocklist -> DO_NOTHING unconditionally."""
        decision, erv, reason, checks = self.engine.evaluate_decision(
            p_recovery=0.90, amount=5000.0, failure_reason="account_closed"
        )
        self.assertEqual(decision, "DO_NOTHING")
        self.assertIn("blocked", reason)

    def test_high_value_escalate_decision(self):
        """High value payment (>= 100,000) with moderate P(recovery) -> ESCALATE."""
        decision, erv, reason, checks = self.engine.evaluate_decision(
            p_recovery=0.60, amount=150000.0, failure_reason="temporary_bank_decline"
        )
        self.assertEqual(decision, "ESCALATE")
        self.assertIn("escalation", reason)

    def test_low_confidence_do_nothing(self):
        """P(recovery) below confidence floor (0.05) -> DO_NOTHING."""
        decision, erv, reason, checks = self.engine.evaluate_decision(
            p_recovery=0.01, amount=2000.0, failure_reason="network_timeout"
        )
        self.assertEqual(decision, "DO_NOTHING")
        self.assertIn("below threshold", reason)

    def test_determinism(self):
        """Identical inputs must yield identical decisions, ERV, and guardrail outputs."""
        res1 = self.engine.evaluate_decision(0.80, 500.0, "gateway_error")
        res2 = self.engine.evaluate_decision(0.80, 500.0, "gateway_error")
        self.assertEqual(res1, res2)


if __name__ == "__main__":
    unittest.main()
