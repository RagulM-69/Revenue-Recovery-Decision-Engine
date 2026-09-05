# Revenue Recovery Decision Engine

> An automated recovery decision engine that classifies failed payments into **RETRY**, **DO_NOTHING**, or **ESCALATE** — combining machine-learning recovery probability with deterministic risk guardrails and unit economics. Built for the Razorpay AI Builder Internship / AI Buildathon 2026.

---

## Track

**AI Revenue Recovery** — Razorpay AI Buildathon 2026

---

## The Problem

Every payment platform loses significant revenue to failed transactions. 
* A **naive system** retries every failure blindly — burning payment gateway fees, violating card network velocity limits, and irritating customers.
* A **passive system** does nothing — leaving substantial recoverable revenue on the table.

Revenue recovery is fundamentally a **decision problem under uncertainty**:
> Given a failed payment and its failure context, what is the optimal action — and what is its expected economic return?

This system solves that problem per transaction by pairing a well-calibrated machine learning probability model with a deterministic policy guardrail engine that enforces unit economics and safety vetoes.

---

## One-Line Description

A policy-constrained decision engine that classifies failed payments as **RETRY**, **DO_NOTHING**, or **ESCALATE** — proving that knowing when *not* to act is as valuable as recovering revenue.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Data & ML Pipeline** | Python (pandas, NumPy, scikit-learn, XGBoost) | Behavioral feature extraction, time-split model training & tournament |
| **Database** | Supabase PostgreSQL | Normalized transactional tables, decisions, and append-only audit trail |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS | Enterprise fintech console with SVG visualizations |
| **Icons & Design** | Lucide React, Custom SVG Charts | Restrained, professional SaaS design system |
| **Deployment** | Vercel (Dashboard) + Supabase (Database) | Cloud web dashboard and database |

---

## High-Level Architecture

```
                       FAILED PAYMENT EVENT
                                ↓
        ┌────────────────────────────────────────────────┐
        │ Stage 1: Terminal Blocklist Veto               │
        │ (card_permanently_blocked, account_closed,     │
        │  suspected_fraud, velocity_check_failed)       │
        └───────────────────────┬────────────────────────┘
                    [Pass]      │ [Match]
                                │ ───────────────→ DO_NOTHING
                                v
        ┌────────────────────────────────────────────────┐
        │ Stage 2: Retry Velocity Ceiling Check          │
        │ (Attempt count >= 3 limit)                     │
        └───────────────────────┬────────────────────────┘
                    [Pass]      │ [Limit Exceeded]
                                │ ───────────────→ DO_NOTHING
                                v
        ┌────────────────────────────────────────────────┐
        │ Stage 3: Calibrated Recovery Probability       │
        │ P(recovery) via Logistic Regression (Days 1–20)│
        └───────────────────────┬────────────────────────┘
                                │
                                v
        ┌────────────────────────────────────────────────┐
        │ Stage 4: High-Value Escalation Guardrail       │
        │ (Amount >= ₹1,00,000 AND P(recovery) < 0.85)   │
        └───────────────────────┬────────────────────────┘
                    [Pass]      │ [Triggered]
                                │ ───────────────→ ESCALATE (Human Review)
                                v
        ┌────────────────────────────────────────────────┐
        │ Stage 5: Expected Recovery Value (ERV) Math    │
        │ ERV = (P(recovery) × Amount) − ₹15 Gateway Fee │
        └───────────────────────┬────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               │                                 │
         [ERV > ₹0.00]                     [ERV <= ₹0.00]
               ↓                                 ↓
             RETRY                          DO_NOTHING
```

---

## Key Design Principles

| Principle | Description |
|---|---|
| **Restraint as Value** | `DO_NOTHING` is a first-class, rewarded decision that prevents fee waste and customer friction. |
| **Model Calibration over Raw AUC** | Model selection prioritizes the **Brier Score** over ROC-AUC alone to ensure probability estimates are mathematically accurate for ERV calculation. |
| **Strict Temporal Split** | Models are trained strictly on Days 1–20 and evaluated out-of-sample on Days 21–30, eliminating time-travel data leakage. |
| **Unit Economics Hurdle** | Retries are approved only when $\text{ERV} = (P(\text{recovery}) \times \text{Amount}) - \text{₹}15.00 > \text{₹}0.00$. |
| **Deterministic Guardrails** | Business policies and compliance vetoes are enforced in pure code — identical inputs always produce identical decisions. |
| **Immutable Auditability** | Every decision, probability score, rule check, and financial outcome is stored in an append-only ledger. |
| **Separation of Concerns** | The ML model estimates likelihood; the policy engine decides action; the financial evaluation measures net value created. |

---

## Live Performance & Benchmark Results (Out-of-Sample Days 21–30)

Evaluating 996 unseen synthetic failed payment transactions from Days 21–30 against standard operational baselines:

| Metric | Decision Engine (Active) | Naive "Always Retry" | "Do Nothing" Baseline |
|---|---|---|---|
| **Net Recovery Value** | **₹45,16,993.19** | ₹45,53,786.79 | ₹0.00 |
| **Gross Recovered** | ₹45,28,213.19 | ₹45,68,726.79 | ₹0.00 |
| **Intervention Fees Incurred** | **₹11,220.00** (748 retries) | ₹14,940.00 (996 retries) | ₹0.00 |
| **Fee Waste Saved** | **₹3,720.00** (248 vetoes) | ₹0.00 | ₹0.00 |
| **Recovery Precision** | **64.2%** | 51.8% | 0.0% |
| **Recovery Recall** | **93.0%** (480 / 516 captured) | 100.0% | 0.0% |

> **Important evaluation note:** In this synthetic simulator, unrecoverable transactions have a 5% stochastic recovery probability. This causes the Always Retry baseline to achieve slightly higher simulated net value than the decision engine. The engine's objective is therefore evaluated on decision quality, recovery recall, intervention precision, and avoidance of inappropriate retries rather than claiming financial superiority over blind retry in this simulation.

---

## Key Application Features & Upgrades

### 1. Overview Dashboard (`/`)
* **Unified Financial Performance Deck**: Left-side hero tracking Net Value Created (₹45,16,993.19) and recovery yield progress; right-side 4-metric diagnostic matrix.
* **Interactive Trajectory Curve**: Scrubbable day-by-day cumulative recovery and daily velocity charts.
* **Failure Taxonomy Inspector**: Breakdown of declines (soft declines, network timeouts, terminal blocklist) with interactive policy rules.

### 2. Merchant CSV Batch Ingestion Studio (`/new-analysis`)
* **Live CSV File Ingestion**: Drag-and-drop or upload custom payment failure exports from Razorpay webhooks or aggregator logs.
* **Schema Verification**: Validates payment IDs, amounts, decline codes, attempt numbers, and payment methods.
* **1-Click Sample Ingestion**: Pre-loaded 20-transaction test suite covering standard retries, velocity limits, and blocklisted accounts.
* **Batch Execution & Export**: Processes batches through the client-side decision engine and exports decisioned CSVs with audit traces.

### 3. System Architecture & Simulation Playground (`/how-it-works`)
* **Top Section — Interactive Decision Studio**:
  * Clickable 4-scenario switcher (Recoverable Soft Decline, Terminal Blocklist Decline, Velocity Limit Exceeded, High-Value Escalation).
  * Animated 5-stage visual stepper with live telemetry.
  * Live ERV Unit Economics calculator sandbox with live Amount and Probability sliders.
* **Bottom Section — Comprehensive Architecture Reference**:
  * In-depth documentation of all 5 stages, failure taxonomies, and the 3-tier architectural separation of concerns (ML Classifier vs Policy Engine vs Financial Evaluator).

### 4. Deterministic Policy Guardrails & Sandbox (`/policy`)
* **Top Section — Interactive Policy Simulator**:
  * Dynamic sliders for payment amount and model probability with decline reason selector.
  * Live calculation of gross expectation, retry fees, ERV, and assigned actions.
* **Bottom Section — Complete Configuration Reference**:
  * Configured rules table (`max_retry_count: 3`, `high_value_threshold: ₹100,000`, `min_confidence: 0.05`, `min_erv: ₹0.00`).
  * Terminal failure reason blocklist card (`account_closed`, `card_permanently_blocked`, `suspected_fraud`, `velocity_check_failed`).

### 5. Model Governance & Predictive Calibration (`/model`)
* **Brier Score Tournament Table**: Head-to-head comparison of Logistic Regression ($0.1563$) vs XGBoost ($0.1565$).
* **Reliability Curve**: Calibrated curve proving probability integrity.
* **Confusion Matrix & Feature Weights**: Transparent evaluation metrics for model auditing.

### 6. Operational Decisions Console (`/decisions`)
* Searchable and filterable table of transactions with decision pills.
* **Slide-over Audit Drawer**: Complete rule-by-rule evaluation trace and rationale for every transaction.

### 7. Immutable Audit Ledger (`/audit`)
* Tamper-evident ledger logging every prediction, policy check, and outcome across all transactions.
* Expandable raw JSON payloads for regulatory traceability.

---

## Project Structure

```
Revenue-Recovery-Decision-Engine/
├── config/
│   ├── model_config.yaml         # Training hyperparams, features, and split dates
│   └── policy_config.yaml        # Deterministic guardrails, blocklists, and fee thresholds
├── src/
│   ├── data_generator/
│   │   └── generator.py          # Synthetic transaction dataset generator (3,000 events)
│   ├── features/
│   │   └── extractor.py          # Behavioral and historical feature extraction
│   ├── model/
│   │   ├── trainer.py            # Model training & Brier calibration tournament
│   │   └── scorer.py             # Inference probability scorer
│   ├── policy/
│   │   └── engine.py             # Deterministic 5-stage policy & ERV decision engine
│   ├── simulator/
│   │   └── engine.py             # Multi-attempt recovery simulator
│   ├── audit/
│   │   ├── logger.py             # Immutable audit event builder
│   │   └── writer.py             # Supabase audit log persistence
│   └── evaluation/
│       └── evaluator.py          # Business impact, ROI calculation, and baseline comparison
├── dashboard/
│   ├── app/
│   │   ├── page.tsx              # Financial Overview dashboard
│   │   ├── new-analysis/         # Merchant CSV batch ingestion studio
│   │   ├── how-it-works/         # Architecture guide & interactive simulation studio
│   │   ├── results/              # Financial return & strategy benchmark comparison
│   │   ├── model/                # Model tournament & calibration governance
│   │   ├── policy/               # Policy guardrails & ERV simulator
│   │   ├── decisions/            # Operational decision ledger & audit drawer
│   │   └── audit/                # Immutable audit log ledger
│   ├── components/               # Reusable UI cards, tables, drawers, and charts
│   └── lib/
│       ├── data-access.ts        # Supabase client & cached data queries
│       └── batch-processor.ts    # Client-side CSV batch evaluator
├── scripts/                      # Pipeline orchestration scripts
└── sql/                          # Supabase PostgreSQL schema and migration scripts
```

---

## Local Development Setup

### 1. Backend ML Pipeline (Python)
```bash
# Clone the repository
git clone https://github.com/RagulM-69/Revenue-Recovery-Decision-Engine.git
cd Revenue-Recovery-Decision-Engine

# Install Python dependencies
pip install -r requirements.txt

# Run the complete end-to-end pipeline (generates data, trains models, evaluates policy)
python scripts/run_pipeline.py
```

### 2. Frontend Dashboard (Next.js)
```bash
cd dashboard

# Install dependencies
npm install

# Set up local environment variables in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Simulation Disclaimer

**This project operates entirely on synthetic data for demonstration purposes.**
- **Synthetic data only** (All transactions, histories, failure patterns, and outcomes are simulated)
- **No real customer payments**
- **No real money movement**
- **No production Razorpay payment APIs are called**

---

*Built for the Razorpay AI Builder Internship / AI Buildathon 2026.*
