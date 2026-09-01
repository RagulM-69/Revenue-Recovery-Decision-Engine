# Revenue Recovery Decision Engine

> An AI-assisted decision engine that determines whether to retry, escalate, or abandon a failed payment — built for the Razorpay AI Builder Internship / AI Buildathon 2026.

---

## Track

**AI Revenue Recovery** — Razorpay AI Buildathon 2026

---

## Problem

Every payment platform loses revenue to failed transactions. A naive system retries everything, wasting money and risking fraud flags. A cautious system does nothing, leaving recoverable revenue on the table.

The real problem is a **decision problem under uncertainty**:

> Given a failed payment, what is the optimal action — and what is its expected economic value?

This project builds a system that answers that question, per payment, using a trained ML model and a deterministic policy engine.

---

## One-Line Description

A policy-constrained AI decision engine that classifies failed payments as RETRY, ESCALATE, or DO NOTHING — and demonstrates that knowing when not to act is as valuable as recovering revenue.

---

## Technology Stack

| Layer | Technology |
|---|---|
| ML Pipeline | Python — pandas, NumPy, scikit-learn, XGBoost |
| Database | Supabase PostgreSQL |
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Deployment | Vercel (frontend) + Supabase (data) |
| LLM | Optional Gemini API — explanation only |

---

## High-Level Architecture

```
Python ML Pipeline (runs locally)
        |
        | supabase-py → bulk upserts
        v
  Supabase PostgreSQL
        |
        | @supabase/supabase-js
        v
  Next.js Dashboard (Vercel)
```

```
Synthetic Data Generation
        ↓
Feature Engineering
        ↓
ML Recovery Model  →  P(recovery)
[Logistic Regression baseline + XGBoost comparison]
        ↓
Deterministic Policy Engine
↓  (guardrails: idempotency · ERV · thresholds · retry limits)
RETRY / ESCALATE / DO NOTHING
        ↓
Recovery Simulator
        ↓
Outcome Recording → Audit Log (Supabase)
        ↓
Evaluation Metrics → Dashboard (Next.js on Vercel)
```

An optional Gemini API explanation layer may be added for audit summaries and escalation notes.
**The LLM does not make financial decisions.**

> LLM may explain. Code decides.

---

## Key Design Principles

| Principle | Description |
|---|---|
| **Restraint** | DO NOTHING is a valid, correct, and rewarded outcome |
| **Real ML** | Recovery probability comes from a trained model, not an LLM guess |
| **Temporal integrity** | Train/test split is time-based (Days 1–20 / 21–30), not random |
| **Expected-value decisioning** | Policy uses ERV = P(recovery) × amount − cost, not a simple threshold |
| **Idempotency** | No payment triggers duplicate recovery actions |
| **Auditability** | Every decision and outcome is logged to an append-only audit trail in Supabase |
| **Determinism** | Policy engine is pure code — same inputs always produce same outputs |
| **Calibration** | Model selection is based on Brier score (calibrated probability), not just AUC |

---

## Development Status

> This project is in the documentation / pre-implementation phase.
> No production code has been written yet.

| Component | Status |
|---|---|
| Project specification (PROJECT_SPEC.md) | ✅ Complete |
| Architecture document (ARCHITECTURE.md) | ✅ Complete |
| Decision log (DECISIONS.md) | ✅ Complete — all decisions locked |
| Python environment setup | 🔲 Planned |
| Supabase project + schema | 🔲 Planned |
| Synthetic data generator | 🔲 Planned |
| Feature engineering | 🔲 Planned |
| ML model training (LR + XGBoost) | 🔲 Planned |
| Policy engine | 🔲 Planned |
| Recovery simulator | 🔲 Planned |
| Audit logging | 🔲 Planned |
| Evaluation metrics | 🔲 Planned |
| Next.js dashboard | 🔲 Planned |
| Vercel deployment | 🔲 Planned |
| Gemini LLM explanation layer | 🔲 Optional — planned for later phase |

---

## Simulation Disclaimer

**This project operates entirely on synthetic data.**

- No real customer payments are processed.
- No production Razorpay APIs are called.
- No real money moves.
- No real customer data is used.

All transactions, customers, payment events, and outcomes are generated programmatically for demonstration purposes.

---

## Evaluation Methodology

The system will be evaluated against two baselines:

| Baseline | Strategy |
|---|---|
| Always Retry | Retry every failed payment unconditionally |
| Always Do Nothing | Never attempt recovery |

A well-performing system should outperform both baselines on **net recovery value** (gross recovery minus intervention costs).

**Temporal split:** Training data covers Days 1–20. Evaluation data covers Days 21–30.
This prevents temporal data leakage and reflects real-world deployment conditions.

**Key metrics:**
- Net Recovery Value vs. both baselines
- Recovery Precision / Recall
- False Intervention Rate
- Model Calibration (Brier Score)
- Escalation Rate
- Correct Non-Action Value

---

## Project Files

| File | Description |
|---|---|
| [PROJECT_SPEC.md](PROJECT_SPEC.md) | Full project specification |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and component design |
| [DECISIONS.md](DECISIONS.md) | Architectural decision log — all decisions locked |
| [config/policy_config.yaml](config/policy_config.yaml) | Policy guardrail configuration (placeholder) |

---

## Deployment Target

**Vercel** (Next.js frontend) + **Supabase** (PostgreSQL database).
AWS is explicitly excluded from this project.

---

*Built for the Razorpay AI Builder Internship / AI Buildathon 2026.*
