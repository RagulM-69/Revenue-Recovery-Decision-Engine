"""
Revenue Recovery Decision Engine — Recovery Simulator Module
Simulates execution of RETRY, ESCALATE, and DO_NOTHING decisions.
"""

import random
from typing import Dict, Any, Tuple


class RecoverySimulator:
    """
    Simulates recovery outcome execution.
    Seeded by latent ground truth for RETRY actions.
    """

    def __init__(self, intervention_cost: float = 15.00, seed: int = 42):
        self.intervention_cost = intervention_cost
        self.seed = seed if seed is not None else 42
        self.rng = random.Random(self.seed)

    def simulate_action(
        self,
        decision: str,
        payment_amount: float,
        ground_truth_is_recoverable: bool
    ) -> Tuple[str, str, float, float]:
        """
        Simulates outcome for a decision.

        Returns:
            Tuple[outcome_type, simulated_outcome, recovered_amount, net_value_impact]
        """
        if decision == "RETRY":
            # RETRY outcome is probabilistic based on ground truth recoverability
            if ground_truth_is_recoverable:
                # 90% chance of success when true ground truth is recoverable
                success = self.rng.random() < 0.90
            else:
                # 5% chance of accidental recovery when ground truth is false
                success = self.rng.random() < 0.05

            if success:
                outcome_type = "RECOVERED"
                sim_outcome = "SUCCESS"
                rec_amount = float(payment_amount)
                net_impact = round(rec_amount - self.intervention_cost, 2)
            else:
                outcome_type = "NOT_RECOVERED"
                sim_outcome = "FAILED"
                rec_amount = 0.00
                net_impact = round(-self.intervention_cost, 2)

            return outcome_type, sim_outcome, rec_amount, net_impact

        elif decision == "ESCALATE":
            return "ESCALATED_PENDING", "PENDING", 0.00, 0.00

        else:  # DO_NOTHING
            return "NO_ACTION_TAKEN", "NO_ACTION", 0.00, 0.00
