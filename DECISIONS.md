# DECISIONS.md — Architectural Decision Log

**Project:** Revenue Recovery Decision Engine
**Last Updated:** 2026-08-31

This document records every architectural decision that has material impact on the system design.

Decisions that have not yet been approved are marked **OPEN**.
Decisions that have been approved and implemented are marked **DECIDED**.

---

## Decision Log

---

### D-001 — Database

**Decision:** What database will store synthetic data, decisions, outcomes, and the audit log?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **SQLite** | Zero infrastructure, simple setup, file-based, easy to ship with the project | Single-file, not suitable for multi-process concurrent writes, not cloud-hosted |
| **PostgreSQL (local)** | Full relational DB, concurrent writes, robust | Requires local Postgres install, harder to deploy |
| **Supabase PostgreSQL** | Cloud-hosted Postgres, free tier, web dashboard, REST + realtime APIs, integrates with Vercel | External dependency, requires account, latency |
| **DuckDB** | Columnar, excellent for analytical queries (evaluation metrics), file-based, no server needed | Less mature for transactional writes, limited ecosystem |

**Recommendation:** Start with **SQLite** for local development (zero friction, portable). If a web UI is needed for the submission, consider migrating to **Supabase** later.

**Rationale:** The workload is predominantly analytical (batch evaluation), not highly concurrent transactional. SQLite is sufficient for a simulation. Supabase would be needed only if the submission requires a live web interface with a shared backend.

**Status: OPEN — awaiting user decision.**

---

### D-002 — Backend Framework

**Decision:** What backend framework (if any) will serve the API or orchestrate the pipeline?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **No server / scripts only** | Simplest — pipeline runs as CLI scripts, no HTTP layer needed | Cannot serve a web UI or expose an API |
| **FastAPI (Python)** | Native Python, async, auto-generates OpenAPI docs, lightweight | Requires Python runtime on deployment target |
| **Flask (Python)** | Minimal, widely known | Less modern than FastAPI, no async out of the box |
| **Next.js API Routes** | If using Next.js for frontend, API routes unify frontend/backend | Running Python ML code from Next.js is awkward (subprocess or separate service) |

**Recommendation:** Depends on whether a web UI is part of the submission. If yes: **FastAPI** (Python) for the backend + separate frontend. If no: no server needed — CLI scripts only.

**Rationale:** The core pipeline is Python (data generation, ML, policy). A Python backend avoids language boundary friction. FastAPI is the modern standard for Python APIs.

**Status: OPEN — awaiting user decision (depends on D-004: Frontend).**

---

### D-003 — ML Model Family

**Decision:** Which supervised learning model will produce `P(recovery)`?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **Logistic Regression** | Highly interpretable, natively calibrated, fast to train, good baseline | May underfit if failure patterns are non-linear |
| **Random Forest** | Handles non-linear interactions, robust to outliers, feature importances built-in | Requires Platt scaling or isotonic regression for calibration |
| **XGBoost** | Typically best tabular performance, handles missing values | More hyperparameters, calibration required |
| **LightGBM** | Faster than XGBoost on large datasets, similar performance | Same calibration caveats |

**Recommendation:** Train **all four** as a comparison. Use **Logistic Regression** as the official baseline. Select the best-calibrated model (Brier score) for production use in the demo. This approach strengthens the evaluation narrative.

**Rationale:** Training multiple models is low-cost on synthetic data. Comparing calibration across model families is a differentiator that demonstrates ML rigor.

**Status: OPEN — awaiting user decision.**

---

### D-004 — Frontend

**Decision:** Will the submission include a web-based user interface?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **No frontend** | Simplest — results shown via CLI output / Jupyter notebook | Weaker visual impression for judges |
| **Static HTML + vanilla JS** | No build toolchain, easily deployed to Vercel | Limited interactivity, more CSS effort |
| **Next.js** | React-based, full SSR/SSG, Vercel-native, rich ecosystem | Requires Node.js build, may be overkill |
| **Streamlit (Python)** | Native Python, rapid prototype dashboards, minimal frontend code | Not easily deployable to Vercel without workarounds, not production-grade |

**Recommendation:** If a UI is desired for submission: **Next.js** (Vercel-native, aligns with deployment constraint). If time is limited: **Streamlit** for a quick internal demo.

**Rationale:** Vercel is the stated deployment target. Next.js is the native framework for Vercel and requires no deployment configuration beyond `vercel deploy`.

**Status: OPEN — awaiting user decision.**

---

### D-005 — LLM Integration

**Decision:** Should an LLM be included, and if so, which one?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **No LLM** | Simplest, no API keys required, lower cost, cleaner demo of ML-only approach | Less visually impressive for judges who expect AI features |
| **Optional LLM explanation layer** | Adds natural-language audit summaries, escalation notes, differentiates the UI | Adds external API dependency, prompt engineering required, cost |
| **Google Gemini API** | Free tier available, strong instruction-following, no AWS dependency | External dependency |
| **OpenAI API** | Widely known, strong ecosystem | Cost, external dependency |
| **Local LLM (Ollama)** | No API keys, offline, free | Not deployable to Vercel, resource intensive |

**Recommendation:** Include an **optional** Gemini API explanation layer if the submission has a web UI. Make it clearly optional — the system must function correctly without it. Do NOT add the LLM SDK until this decision is confirmed.

**Rationale:** Per the project principle "LLM may explain, code decides" — if an LLM is added, it must be clearly decorative/explanatory. The Gemini API is a natural fit given the Google DeepMind context and free tier availability.

**Status: OPEN — awaiting user decision.**

---

### D-006 — Deployment

**Decision:** How will the project be deployed for the submission?

**Constraints already confirmed:**
- ✅ Target: **Vercel**
- ❌ AWS: explicitly excluded

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **Vercel (frontend only)** | Simplest — static export or Next.js frontend, all computation happens locally | ML pipeline must be pre-run; no live inference |
| **Vercel + Vercel Serverless Functions** | Can run lightweight Python logic as serverless functions | Python functions on Vercel have cold start / size limits; ML model serialization needed |
| **Vercel + Supabase** | Vercel frontend + cloud database with pre-computed results | Two external services; results must be pre-computed and stored |
| **CLI-only (no deployment)** | Runs entirely locally, maximum simplicity | No shareable web link for judges |

**Recommendation:** For the submission: **Vercel + Supabase** if a live web demo is desired (pre-computed results stored in Supabase, served to a Next.js frontend). If not: **CLI-only** with a notebook or HTML export as the demo artifact.

**Rationale:** Running the ML pipeline live in Vercel Serverless Functions is technically challenging (model size, Python environment, cold start). Pre-computing results and serving them from a database is more reliable.

**Status: OPEN — awaiting user decision (depends on D-004: Frontend).**

---

### D-007 — Programming Language

**Decision:** What programming language will be used for the core pipeline?

**Options:**

| Option | Notes |
|---|---|
| **Python** | Natural choice for ML (scikit-learn, XGBoost, pandas, numpy). All ML libraries are Python-native. |
| **TypeScript / Node.js** | Strong if frontend is Next.js, but ML ecosystem is poor |
| **Mixed (Python backend + TypeScript frontend)** | Cleanest separation if a web UI is required |

**Recommendation:** **Python** for the core pipeline (data generation, ML, policy engine, evaluation). **TypeScript** only if a Next.js frontend is chosen.

**Rationale:** The ML stack is Python-native. The policy engine is pure logic and can be ported to any language later, but Python keeps the initial implementation simple.

**Status: OPEN — awaiting user decision (implicitly decided by D-002 and D-004, but recorded here for completeness).**

---

## Decided

*(None yet — all decisions await user approval.)*

---

## Decision Priority Order

The following decisions block each other. Resolving them in this order is recommended:

1. **D-004 (Frontend)** — determines if a web UI is needed at all
2. **D-001 (Database)** — depends on whether a cloud-accessible DB is needed (Supabase only needed for a live web demo)
3. **D-006 (Deployment)** — depends on D-004
4. **D-002 (Backend)** — depends on D-004 and D-006
5. **D-005 (LLM)** — depends on D-004 (only add LLM if there's a UI to show it)
6. **D-003 (ML Model)** — independent; can be decided anytime
7. **D-007 (Language)** — largely determined by D-003 and D-002

---

*Decisions will be updated as they are resolved.*
