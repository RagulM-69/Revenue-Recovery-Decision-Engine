"""
Revenue Recovery Decision Engine — Synthetic Data Generator
Generates realistic customer, payment, attempt, and failure event datasets
with realistic, learnable ground-truth recovery labels.
"""

import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple


class SyntheticDataGenerator:
    """
    Generates synthetic transaction datasets for a 30-day window.
    - Days 1 to 20: Training set (is_eval_set = False)
    - Days 21 to 30: Temporal Evaluation set (is_eval_set = True)
    """

    FAILURE_TAXONOMY = {
        "SOFT_DECLINE": ["insufficient_funds", "temporary_bank_decline", "limit_exceeded"],
        "HARD_DECLINE": ["card_permanently_blocked", "account_closed", "invalid_card_details"],
        "TECHNICAL_ERROR": ["network_timeout", "gateway_error", "bank_downtime"],
        "FRAUD_RISK": ["suspected_fraud", "velocity_check_failed"]
    }

    PAYMENT_METHODS = ["UPI", "CARD", "NET_BANKING", "NACH", "WALLET"]
    CUSTOMER_SEGMENTS = ["CONSUMER", "SME", "ENTERPRISE"]

    def __init__(self, seed: int = 42, num_customers: int = 500, num_payments: int = 3000):
        self.seed = seed
        self.num_customers = num_customers
        self.num_payments = num_payments
        random.seed(self.seed)

    def generate_all(self, pipeline_run_id: str, base_start_time: datetime = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate complete relational dataset for a pipeline run.
        """
        if base_start_time is None:
            # Fixed reference start time for 30-day window simulation
            base_start_time = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)

        customers = self._generate_customers(pipeline_run_id, base_start_time)
        payments, payment_attempts, failure_events = self._generate_payments_and_failures(
            pipeline_run_id, customers, base_start_time
        )

        return {
            "customers": customers,
            "payments": payments,
            "payment_attempts": payment_attempts,
            "failure_events": failure_events
        }

    def _generate_customers(self, pipeline_run_id: str, base_time: datetime) -> List[Dict[str, Any]]:
        customers = []
        for i in range(1, self.num_customers + 1):
            customer_id = str(uuid.uuid4())
            segment = random.choices(
                self.CUSTOMER_SEGMENTS,
                weights=[0.60, 0.30, 0.10]
            )[0]

            # Segment-specific success rate distributions
            if segment == "ENTERPRISE":
                success_rate = round(random.uniform(0.80, 0.98), 4)
                account_age = random.randint(180, 1000)
            elif segment == "SME":
                success_rate = round(random.uniform(0.65, 0.90), 4)
                account_age = random.randint(60, 500)
            else:  # CONSUMER
                success_rate = round(random.uniform(0.40, 0.85), 4)
                account_age = random.randint(10, 365)

            created_at = base_time - timedelta(days=account_age)

            customers.append({
                "customer_id": customer_id,
                "pipeline_run_id": pipeline_run_id,
                "external_customer_id": f"cust_{i:05d}",
                "segment": segment,
                "historical_success_rate": success_rate,
                "account_age_days": account_age,
                "created_at": created_at.isoformat()
            })

        return customers

    def _generate_payments_and_failures(
        self, pipeline_run_id: str, customers: List[Dict[str, Any]], base_time: datetime
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:

        payments = []
        payment_attempts = []
        failure_events = []

        for i in range(1, self.num_payments + 1):
            payment_id = str(uuid.uuid4())
            customer = random.choice(customers)

            # Random timestamp within 30-day window
            offset_seconds = random.randint(0, 30 * 24 * 3600)
            payment_time = base_time + timedelta(seconds=offset_seconds)

            # Days 1-20 -> train set (is_eval_set = False), Days 21-30 -> eval set (is_eval_set = True)
            day_number = (payment_time - base_time).days + 1
            is_eval_set = day_number > 20

            # Payment amount distribution based on segment
            if customer["segment"] == "ENTERPRISE":
                amount = round(random.uniform(5000.0, 100000.0), 2)
                method = random.choices(self.PAYMENT_METHODS, weights=[0.2, 0.3, 0.3, 0.2, 0.0])[0]
            elif customer["segment"] == "SME":
                amount = round(random.uniform(500.0, 15000.0), 2)
                method = random.choices(self.PAYMENT_METHODS, weights=[0.4, 0.3, 0.1, 0.1, 0.1])[0]
            else:
                amount = round(random.uniform(50.0, 3000.0), 2)
                method = random.choices(self.PAYMENT_METHODS, weights=[0.5, 0.2, 0.1, 0.0, 0.2])[0]

            payments.append({
                "payment_id": payment_id,
                "pipeline_run_id": pipeline_run_id,
                "customer_id": customer["customer_id"],
                "external_payment_id": f"pay_{i:06d}",
                "amount": amount,
                "currency": "INR",
                "payment_method": method,
                "created_at": payment_time.isoformat(),
                "is_eval_set": is_eval_set
            })

            # Failure Category & Reason assignment
            failure_category = random.choices(
                ["TECHNICAL_ERROR", "SOFT_DECLINE", "HARD_DECLINE", "FRAUD_RISK"],
                weights=[0.40, 0.35, 0.15, 0.10]
            )[0]

            failure_reason = random.choice(self.FAILURE_TAXONOMY[failure_category])

            # Initial Payment Attempt
            attempt_id = str(uuid.uuid4())
            payment_attempts.append({
                "attempt_id": attempt_id,
                "pipeline_run_id": pipeline_run_id,
                "payment_id": payment_id,
                "attempt_number": 1,
                "attempt_type": "INITIAL",
                "attempted_at": payment_time.isoformat(),
                "status": "FAILED",
                "failure_reason": failure_reason,
                "gateway_response_code": f"ERR_{failure_category[:4]}_{random.randint(100, 999)}"
            })

            # Latent Ground Truth Recoverability Calculation (Learnable Signal)
            ground_truth_is_recoverable = self._compute_latent_recoverability(
                failure_category=failure_category,
                failure_reason=failure_reason,
                customer_success_rate=customer["historical_success_rate"],
                amount=amount,
                payment_time=payment_time
            )

            # Failure Event record
            failure_events.append({
                "event_id": str(uuid.uuid4()),
                "pipeline_run_id": pipeline_run_id,
                "attempt_id": attempt_id,
                "payment_id": payment_id,
                "failure_reason": failure_reason,
                "failure_category": failure_category,
                "failed_at": payment_time.isoformat(),
                "ground_truth_is_recoverable": ground_truth_is_recoverable
            })

        return payments, payment_attempts, failure_events

    def _compute_latent_recoverability(
        self, failure_category: str, failure_reason: str,
        customer_success_rate: float, amount: float, payment_time: datetime
    ) -> bool:
        """
        Computes a non-random, learnable ground-truth boolean indicator.
        This provides clear signal for Logistic Regression and XGBoost models.
        """
        # Hard declines & fraud risks are strictly non-recoverable
        if failure_category == "HARD_DECLINE" or failure_reason in ["card_permanently_blocked", "account_closed"]:
            return False
        if failure_category == "FRAUD_RISK":
            return False

        # Base probability starting point by failure category
        if failure_category == "TECHNICAL_ERROR":
            base_prob = 0.80  # Gateway/network timeouts are highly recoverable
        elif failure_category == "SOFT_DECLINE":
            base_prob = 0.50  # Insufficient funds depends heavily on customer/amount
        else:
            base_prob = 0.10

        # Adjust by customer historical success rate
        prob = base_prob * 0.5 + customer_success_rate * 0.5

        # Amount penalty (very high amounts are slightly harder to auto-recover)
        if amount > 25000:
            prob *= 0.85

        # Business hours boost (higher recovery between 9 AM and 8 PM)
        hour = payment_time.hour
        if 9 <= hour <= 20:
            prob *= 1.10

        # Final deterministic threshold check with slight noise
        final_prob = min(max(prob, 0.0), 1.0)
        return random.random() < final_prob
