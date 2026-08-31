# DECISIONS.md — Architectural Decision Log

**Project:** Revenue Recovery Decision Engine
**Last Updated:** 2026-08-31

This document records every architectural decision that has material impact on the system design.

- **DECIDED** — approved and locked; do not change without explicit instruction.
- **OPEN** — requires user approval before implementation proceeds.

---

## Decided

---

### D-001 — Database ✅ DECIDED

**Decision:** What database will store synthetic data, decisions, outcomes, and the audit log?

**Chosen:** Supabase PostgreSQL

**Rationale:** Cloud-hosted Postgres with a free tier, REST + realtime APIs, and native Vercel integration. Required for a live web dashboard. Pre-computed ML pipeline results are written to Supabase; Next.js reads them directly.

**Status: DECIDED — Supabase PostgreSQL.**

---

### D-002 — Backend Framework ✅ DECIDED

**Decision:** What backend framework (if any) will serve the API or orchestrate the pipeline?

**Chosen:** No separate backend server.

The architecture is:
- Python ML pipeline runs locally (or CI) and writes all results to Supabase.
- Next.js reads pre-computed results directly from Supabase.
- Next.js API routes handle only lightweight read-through queries to Supabase (no Python execution on Vercel).

**Explicitly rejected:** Running the Python ML pipeline inside Vercel Serverless Functions. Do not implement this.

**Status: DECIDED — no standalone backend server; Python writes to Supabase, Next.js reads from Supabase.**

---

### D-003 — ML Model Family ✅ DECIDED

**Decision:** Which supervised learning model(s) will produce P(recovery)?

**Chosen:** Logistic Regression (baseline) and XGBoost (comparison).

**Evaluation method:** Evidence-based selection using ROC-AUC and Brier score / calibration. The better-calibrated model is used for the production pipeline.

**Explicitly dropped:** Random Forest and LightGBM. Do not add them without explicit approval.

**Status: DECIDED — Logistic Regression baseline + XGBoost comparison; calibration-based selection.**

---

### D-004 — Frontend ✅ DECIDED

**Decision:** Will the submission include a web-based user interface, and what technology?

**Chosen:** Next.js + TypeScript + Tailwind CSS, deployed to Vercel.

**Status: DECIDED — Next.js + TypeScript + Tailwind CSS on Vercel.**

---

### D-005 — LLM Integration ✅ DECIDED

**Decision:** Should an LLM be included, and if so, which one?

**Chosen:** Optional Gemini API, explanation layer only. Not yet implemented.

**Constraints (locked):**
- The LLM must NEVER determine RETRY / ESCALATE / DO_NOTHING.
- The LLM must NEVER modify P(recovery).
- The LLM must NEVER override policy guardrails.
- The core application must remain fully functional if Gemini is unavailable.
- Gemini calls must be wrapped in failure-tolerant try/except; fall back to structured text template.
- Do NOT implement Gemini integration until explicitly instructed.

**Core principle:** LLM may explain. Code decides.

**Status: DECIDED — optional Gemini API, explanation-only, not yet implemented.**

---

### D-006 — Deployment ✅ DECIDED

**Decision:** How will the project be deployed for the submission?

**Chosen:** Vercel (Next.js frontend) + Supabase (PostgreSQL database).

**Constraints (locked):**
- AWS is explicitly excluded. Do not introduce any AWS service or AWS SDK.
- Python ML pipeline is NOT deployed to Vercel. It runs locally or in a separate environment.
- Only the Next.js application is deployed to Vercel.

**Status: DECIDED — Vercel (Next.js) + Supabase (data). AWS excluded.**

---

### D-007 — Programming Language ✅ DECIDED

**Decision:** What programming language is used for each layer?

**Chosen:**
- **Python** — synthetic data generation, feature engineering, ML training, ML scoring, policy engine, recovery simulator, audit logging, evaluation metrics.
- **TypeScript** — Next.js frontend and any Next.js API routes.

**Status: DECIDED — Python (ML pipeline) + TypeScript (frontend).**

---

### D-008 — Python to Supabase Write Method ✅ DECIDED

**Decision:** How does the Python pipeline write data to Supabase?

**Chosen:** supabase-py — the official Supabase Python client library.

**Rationale:** Simple setup requiring only the Supabase project URL and service role key. Supports bulk upserts adequate for 50,000 rows or fewer. Consistent with the Supabase ecosystem used on the frontend.

**Implementation note:** Use batch/bulk upserts, not row-by-row inserts. Tables should include a pipeline_run_id column so multiple runs are isolated and the UI can read from the latest completed run.

**Status: DECIDED — supabase-py official Python SDK, bulk upserts, run-isolated by pipeline_run_id.**

---

## Open

*(No architectural decisions are currently open. All decisions have been approved and locked.)*

---

## Decision Summary

| ID | Topic | Decision |
|---|---|---|
| D-001 | Database | Supabase PostgreSQL |
| D-002 | Backend | None — Python writes to Supabase, Next.js reads from Supabase |
| D-003 | ML Models | Logistic Regression (baseline) + XGBoost (comparison) |
| D-004 | Frontend | Next.js + TypeScript + Tailwind CSS |
| D-005 | LLM | Optional Gemini API, explanation-only, not yet implemented |
| D-006 | Deployment | Vercel (Next.js) + Supabase (data); AWS excluded |
| D-007 | Language | Python (pipeline) + TypeScript (frontend) |
| D-008 | Python to Supabase | supabase-py SDK, bulk upserts, pipeline_run_id isolation |

---

*All decisions are locked. Any change requires explicit user approval before implementation.*
