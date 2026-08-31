# PROJECT_SPEC.md â€” Revenue Recovery Decision Engine

**Project:** Revenue Recovery Decision Engine
**Track:** AI Revenue Recovery (Razorpay AI Builder Internship / AI Buildathon 2026)
**Status:** Specification â€” Not Yet Implemented
**Last Updated:** 2026-08-31

---

## A. Problem

Every digital payment system faces a class of failures that are economically recoverable â€” but not all of them equally, and not all of them profitably.

When a payment fails (due to network timeout, insufficient funds, bank-side decline, card expiry, or other causes), a naive system has two options:

1. Retry blindly and hope the payment succeeds.
2. Do nothing and lose the revenue.

Both approaches are wrong when applied universally.

Blind retrying introduces costs:
- Retry fees charged by payment gateways
- Risk of triggering bank fraud detection systems
- Customer experience degradation (duplicate charge attempts)
- Wasted operational overhead

Blind inaction leaves recoverable revenue on the table. Research across payment processors consistently shows that a meaningful fraction of failed payments are recoverable â€” but the recovery potential varies significantly by failure reason, customer profile, payment amount, and time elapsed.

**The real problem is decision-making under uncertainty:**

> Given a failed payment, what is the optimal action â€” and can we quantify the expected economic value of that action before acting?

This project proposes an AI-assisted decision engine that answers that question for each failed payment individually.

---

## B. Goal

Build a **Revenue Recovery Decision Engine** that:

1. **Ingests** failed payment events from a synthetic transaction dataset.
2. **Scores** each failed payment using a trained ML model that estimates the probability of successful recovery.
3. **Applies** a deterministic policy engine that converts the probability score, payment amount, and contextual guardrails into one of three discrete actions.
4. **Executes** a simulated recovery action (not a real payment).
5. **Records** outcomes to an audit log.
6. **Evaluates** the end-to-end system using business-relevant metrics.

The key claim the system intends to demonstrate is:

> A disciplined, policy-constrained AI decision engine can recover more net revenue than either blind retry or blind inaction â€” because it knows when NOT to act.

---

## C. Non-Goals

The following are explicitly out of scope for this project:

| Non-Goal | Reason |
|---|---|
| Processing real customer payments | This is a synthetic simulation only |
| Connecting to production Razorpay payment systems | No production API credentials will be used |
| Making real money-moving decisions | All recovery actions are simulated |
| Giving an LLM authority over financial decisions | LLMs may explain; code decides |
| Building a full payment gateway | Out of scope |
| User authentication / access control | Not required for this internship submission |
| Real-time streaming pipeline | Batch simulation is sufficient |
| Multi-tenant SaaS architecture | Single-tenant simulation scope |
| Regulatory compliance (PCI-DSS, RBI guidelines) | Out of scope for synthetic simulation |
| Production deployment hardening | Submission-grade deployment only |

---

## D. Core Workflow

The system operates as a sequential pipeline:

```
[1] Detection
    A failed payment event arrives (synthetic).
    The event carries: payment ID, amount, failure reason,
    customer segment, payment method, attempt count, timestamp.

        â†“

[2] Feature Engineering
    Raw event fields are transformed into model features.
    Examples: time-of-day, day-of-week, failure category bucket,
    normalized amount, customer historical success rate,
    previous attempt count, days since last attempt.

        â†“

[3] ML Scoring
    A trained ML model receives the feature vector.
    Output: P(recovery) â€” a probability in [0, 1] that a
    recovery attempt for this payment will succeed.

        â†“

[4] Policy Decision
    A deterministic policy engine receives:
      - P(recovery) from the ML model
      - Payment amount
      - Failure context
      - Guardrail state (attempt count, elapsed time, etc.)
    
    Policy computes Expected Recovery Value (ERV):
      ERV = P(recovery) Ã— amount âˆ’ intervention_cost
    
    Policy then applies guardrails (see Section I) and
    emits exactly one of:
      â†’ RETRY
      â†’ ESCALATE
      â†’ DO_NOTHING

        â†“

[5] Simulated Action
    The chosen action is executed against a simulator:
    - RETRY: simulates a re-attempt; outcome is probabilistic
    - ESCALATE: routes to a simulated human queue
    - DO_NOTHING: no action taken; event is closed

        â†“

[6] Outcome Recording
    Actual outcome (recovered / not recovered / escalated)
    is written to an outcome record.

        â†“

[7] Audit Log
    Every event, decision, action, and outcome is written to
    an append-only audit log with timestamps. The log is the
    source of truth for all evaluation.

        â†“

[8] Evaluation
    Batch evaluation computes business metrics across the
    full evaluation window (see Section K).
```

---

## E. Decision Types

The policy engine emits exactly one of three decisions per failed payment event.

### RETRY

**Meaning:** The system believes a recovery attempt is likely to succeed and the expected value is positive.

**Trigger conditions (proposed, subject to policy configuration):**
- ERV > configurable positive threshold
- P(recovery) above a minimum confidence floor
- Attempt count has not exceeded the maximum retry limit
- Idempotency check passes (no prior recovery attempt for this event)
- Time since failure is within the recovery window

**Action:** A re-payment attempt is simulated.

---

### ESCALATE

**Meaning:** The payment is high-value or ambiguous. A human agent should review.

**Trigger conditions (proposed):**
- Payment amount exceeds a high-value threshold AND P(recovery) is moderate
- OR failure reason is classified as requiring manual review (e.g. disputed charge, fraud flag)
- OR ML model confidence is low (low P(recovery) but amount is large enough that the cost of being wrong is high)

**Action:** The payment is added to a simulated human review queue.

---

### DO_NOTHING

**Meaning:** A recovery attempt is not expected to be economically worthwhile or is actively risky.

**Trigger conditions (proposed):**
- ERV â‰¤ 0 (intervention cost exceeds expected recovery value)
- OR attempt count has exceeded the maximum retry limit
- OR failure reason is classified as definitively unrecoverable (e.g. account closed, card permanently blocked)
- OR idempotency check fails (duplicate recovery action would be triggered)

**Action:** No action. The event is closed and logged.

> **Design principle:** DO_NOTHING is not a failure. Correctly deciding not to act on an unrecoverable payment is a success. The evaluation metrics explicitly reward this.

---

## F. ML Responsibility

The ML model is responsible for a **single, well-defined prediction task:**

> Given features describing a failed payment event, estimate the probability that a recovery attempt initiated within the recovery window will result in a successfully completed payment.

**What the model does:**
- Produces a calibrated probability score: `P(recovery | features)`.
- Is trained on synthetic historical transaction data with temporal splitting (no data leakage).
- Is evaluated for calibration (not just rank ordering).

**What the model does NOT do:**
- Make the final action decision. That is the policy engine's responsibility.
- Access real payment systems or customer data.
- Generate explanations. That is optionally delegated to an LLM.

**Proposed model candidates (not yet decided):**
- Logistic Regression (interpretable baseline)
- Random Forest
- XGBoost / LightGBM

See `DECISIONS.md` for the open decision on model selection.

The model will be trained and evaluated with a **temporal split** to avoid data leakage (see Section K).

---

## G. Policy Responsibility

The policy engine is **pure deterministic code**. It receives:

1. The ML model's probability score `P(recovery)`
2. The payment amount
3. The failure context (reason, method, attempt count, elapsed time)
4. The current state of guardrails (idempotency table, attempt counters)

It computes:

```
Expected Recovery Value (ERV) =
    P(recovery) Ã— payment_amount âˆ’ intervention_cost
```

Where `intervention_cost` is a configurable constant representing the estimated cost of a re-attempt (gateway fees, operational overhead, etc.).

The policy then applies ordered guardrails (see Section I) and emits a final decision.

**The policy engine has no randomness and no ML inside it.** Given the same inputs, it always produces the same output. This makes it auditable, testable, and predictable.

---

## H. LLM Responsibility

An LLM is **optional** in this system and is not part of the critical decision path.

If an LLM is incorporated in a later phase, its permitted responsibilities are:

| Permitted | Not Permitted |
|---|---|
| Generating natural-language summaries of audit log entries | Determining the action (RETRY / ESCALATE / DO_NOTHING) |
| Explaining why a particular decision was made | Modifying the probability score |
| Surfacing patterns in the audit log for human review | Overriding any policy guardrail |
| Drafting escalation notes for human reviewers | Accessing any external system |

**Core principle:**

> LLM may explain. Code decides.

If an LLM is used, it will be called **after** the action decision has already been recorded. It cannot change the outcome.

---

## I. Guardrails

The policy layer will implement the following guardrails. These are enforced in deterministic code, not by the ML model.

| Guardrail | Description | Proposed Default |
|---|---|---|
| **Idempotency** | A given payment event ID may trigger at most one recovery action. Duplicate events are detected and silently discarded. | Required â€” no exceptions |
| **Max Retry Count** | A payment may be retried at most N times total across all recovery windows. | N = 3 (TBD) |
| **Recovery Window** | A recovery attempt may only be initiated within T hours of the original failure. | T = 72h (TBD) |
| **Monetary Threshold (Low)** | Payments below a minimum amount are not worth retrying (ERV would be negative). | Configurable |
| **Monetary Threshold (High)** | Payments above a high-value threshold require escalation regardless of P(recovery). | Configurable |
| **Confidence Floor** | If P(recovery) is below a minimum threshold, do not retry (prefer ESCALATE or DO_NOTHING). | Configurable |
| **Failure Reason Block List** | Certain failure reasons are classified as definitively unrecoverable and block retry unconditionally. | TBD â€” based on synthetic data schema |
| **ERV Positivity** | Only retry if ERV > 0 after accounting for intervention cost. | Required |

All guardrail thresholds are externalized as configuration values â€” not hardcoded in business logic.

---

## J. Data (Conceptual Entities)

The following conceptual data entities are proposed. No database has been chosen or created yet (see `DECISIONS.md`).

All data in this project is **synthetic**. No real customer data is used.

### Customer
Represents a simulated merchant/end-user.

Key attributes: customer_id, segment (SME / Enterprise / Consumer), historical_success_rate, account_age_days.

### Payment
A single payment intent.

Key attributes: payment_id, customer_id, amount, currency, payment_method, created_at.

### PaymentAttempt
A single attempt to process a payment (the original or a recovery attempt).

Key attributes: attempt_id, payment_id, attempted_at, status (success / failed), failure_reason, gateway_response_code.

### FailureEvent
A structured record created when a PaymentAttempt fails.

Key attributes: event_id, attempt_id, payment_id, failure_reason, failure_category, failure_at, is_recoverable_flag (heuristic, not deterministic).

### RecoveryDecision
The output of the policy engine for a given FailureEvent.

Key attributes: decision_id, event_id, decision (RETRY / ESCALATE / DO_NOTHING), p_recovery, erv, decision_at, policy_version, guardrails_applied.

### RecoveryAttempt
A simulated recovery action taken based on a RETRY decision.

Key attributes: attempt_id, decision_id, payment_id, initiated_at, simulated_outcome (success / failed).

### RecoveryOutcome
The final recorded outcome for a given FailureEvent.

Key attributes: outcome_id, event_id, decision_id, outcome_type (recovered / not_recovered / escalated / no_action), recovered_amount, outcome_at.

### AuditLogEntry
An append-only record of every system event.

Key attributes: log_id, entity_type, entity_id, event_type, event_at, payload (JSON), actor (system / policy_engine / ml_model / simulator).

---

## K. Evaluation Methodology

### Temporal Train/Test Split

The synthetic dataset will be generated to cover a defined time window (e.g. 30 days).

**Training window:** Days 1â€“20
**Evaluation window:** Days 21â€“30

This split is non-random and strictly temporal. No event from Day 21+ will appear in training data. This prevents temporal leakage and reflects how the system would behave in production.

### Baseline Comparisons

The system's performance will be compared against two baselines:

1. **Always Retry:** Retry every failed payment regardless of any signal.
2. **Always Do Nothing:** Never attempt recovery.

A well-designed system should outperform both baselines on net recovery value.

### Model Evaluation

The ML model will be evaluated on the held-out evaluation window:

- **AUC-ROC** â€” rank ordering of recovery probability
- **Calibration** â€” Brier score, reliability diagram (predicted probability vs. actual recovery rate)
- **Precision / Recall** at a range of decision thresholds

### Policy Evaluation

The policy engine will be evaluated on business outcomes:

- How often did RETRY decisions result in actual recovery?
- How often did DO_NOTHING decisions correctly avoid a costly intervention?
- What fraction of high-value payments were correctly escalated?

### Business Metrics

See Section L.

---

## L. Metrics

The following business metrics will be computed over the evaluation window.

No numerical results are fabricated here. These definitions describe what will be measured.

| Metric | Definition |
|---|---|
| **Revenue at Risk** | Total payment amount across all FailureEvents in the evaluation window |
| **Recovered Revenue (Gross)** | Total amount recovered via successful RETRY outcomes |
| **Intervention Cost (Total)** | Total cost of all recovery attempts (successful or not) |
| **Net Recovery Value** | Recovered Revenue (Gross) âˆ’ Intervention Cost (Total) |
| **Correct Non-Action Value** | Amount saved by correctly issuing DO_NOTHING on payments that would have failed even if retried (avoids wasted intervention cost) |
| **False Intervention Rate** | Fraction of RETRY decisions that did not result in recovery |
| **Escalation Rate** | Fraction of FailureEvents routed to human review |
| **Recovery Precision** | Of all events where RETRY was chosen, what fraction succeeded |
| **Recovery Recall** | Of all events that were recoverable, what fraction did the system RETRY |
| **Model Calibration (Brier Score)** | Mean squared error between predicted P(recovery) and actual outcome |
| **Net Value vs. Baseline (Always Retry)** | Net Recovery Value âˆ’ Net Value of the Always Retry baseline |
| **Net Value vs. Baseline (Do Nothing)** | Net Recovery Value âˆ’ 0 (always zero for do-nothing baseline) |

---

*This document is a specification. Nothing described here is yet implemented.*

