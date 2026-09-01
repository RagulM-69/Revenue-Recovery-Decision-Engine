-- =============================================================================
-- Revenue Recovery Decision Engine — Supabase PostgreSQL Database Schema
-- Track: AI Revenue Recovery (Razorpay AI Buildathon 2026)
-- File: schema.sql
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PIPELINE RUNS
-- Tracks execution of the Python pipeline for run isolation.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NULL,
    total_events_processed INT NULL DEFAULT 0,
    config_snapshot JSONB NOT NULL,
    error_message TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status_completed ON pipeline_runs (status, completed_at DESC);

-- -----------------------------------------------------------------------------
-- 2. CUSTOMERS
-- Simulated customer/merchant profiles.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    external_customer_id VARCHAR(64) NOT NULL,
    segment VARCHAR(20) NOT NULL CHECK (segment IN ('CONSUMER', 'SME', 'ENTERPRISE')),
    historical_success_rate NUMERIC(5, 4) NOT NULL CHECK (historical_success_rate BETWEEN 0 AND 1),
    account_age_days INT NOT NULL CHECK (account_age_days >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_customers_run_external UNIQUE (pipeline_run_id, external_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_run ON customers (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers (pipeline_run_id, segment);

-- -----------------------------------------------------------------------------
-- 3. PAYMENTS
-- Simulated payment intents.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    external_payment_id VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'CARD', 'NET_BANKING', 'NACH', 'WALLET')),
    created_at TIMESTAMPTZ NOT NULL,
    is_eval_set BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_payments_run_external UNIQUE (pipeline_run_id, external_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_run ON payments (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_eval ON payments (pipeline_run_id, is_eval_set);

-- -----------------------------------------------------------------------------
-- 4. PAYMENT ATTEMPTS
-- Processing attempts for a payment (initial failure or recovery retry).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    attempt_number INT NOT NULL CHECK (attempt_number >= 1),
    attempt_type VARCHAR(20) NOT NULL DEFAULT 'INITIAL' CHECK (attempt_type IN ('INITIAL', 'RECOVERY_RETRY')),
    attempted_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
    failure_reason VARCHAR(50) NULL,
    gateway_response_code VARCHAR(30) NULL
);

CREATE INDEX IF NOT EXISTS idx_attempts_payment ON payment_attempts (payment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_run_status ON payment_attempts (pipeline_run_id, status);

-- -----------------------------------------------------------------------------
-- 5. FAILURE EVENTS
-- Ingested failed payment events requiring recovery decision.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS failure_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL UNIQUE REFERENCES payment_attempts(attempt_id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    failure_reason VARCHAR(50) NOT NULL,
    failure_category VARCHAR(30) NOT NULL CHECK (failure_category IN ('SOFT_DECLINE', 'HARD_DECLINE', 'TECHNICAL_ERROR', 'FRAUD_RISK')),
    failed_at TIMESTAMPTZ NOT NULL,
    ground_truth_is_recoverable BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_failure_events_run ON failure_events (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_failure_events_payment ON failure_events (payment_id);
CREATE INDEX IF NOT EXISTS idx_failure_events_category ON failure_events (pipeline_run_id, failure_category);

-- -----------------------------------------------------------------------------
-- 6. RECOVERY DECISIONS
-- ML prediction + Policy engine output for a failure event.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    event_id UUID NOT NULL UNIQUE REFERENCES failure_events(event_id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    p_recovery NUMERIC(6, 5) NOT NULL CHECK (p_recovery BETWEEN 0 AND 1),
    erv NUMERIC(12, 2) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('RETRY', 'ESCALATE', 'DO_NOTHING')),
    decision_reason TEXT NOT NULL,
    guardrails_applied JSONB NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    policy_version VARCHAR(20) NOT NULL DEFAULT '0.1.0-draft',
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_run ON recovery_decisions (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON recovery_decisions (pipeline_run_id, decision);
CREATE INDEX IF NOT EXISTS idx_decisions_event ON recovery_decisions (event_id);

-- -----------------------------------------------------------------------------
-- 7. RECOVERY ATTEMPTS
-- Executed recovery retries (populated ONLY when decision = RETRY).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_attempts (
    recovery_attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    decision_id UUID NOT NULL UNIQUE REFERENCES recovery_decisions(decision_id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    simulated_outcome VARCHAR(20) NOT NULL CHECK (simulated_outcome IN ('SUCCESS', 'FAILED')),
    intervention_cost NUMERIC(12, 2) NOT NULL CHECK (intervention_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_rec_attempts_run ON recovery_attempts (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_rec_attempts_decision ON recovery_attempts (decision_id);

-- -----------------------------------------------------------------------------
-- 8. RECOVERY OUTCOMES
-- Final outcome recorded for every failure event.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    event_id UUID NOT NULL UNIQUE REFERENCES failure_events(event_id) ON DELETE CASCADE,
    decision_id UUID NOT NULL UNIQUE REFERENCES recovery_decisions(decision_id) ON DELETE CASCADE,
    recovery_attempt_id UUID NULL REFERENCES recovery_attempts(recovery_attempt_id) ON DELETE SET NULL,
    outcome_type VARCHAR(25) NOT NULL CHECK (outcome_type IN ('RECOVERED', 'NOT_RECOVERED', 'ESCALATED_PENDING', 'NO_ACTION_TAKEN')),
    recovered_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (recovered_amount >= 0),
    net_value_impact NUMERIC(12, 2) NOT NULL,
    outcomed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_run ON recovery_outcomes (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_type ON recovery_outcomes (pipeline_run_id, outcome_type);

-- -----------------------------------------------------------------------------
-- 9. AUDIT LOG
-- Append-only system audit log.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor VARCHAR(30) NOT NULL CHECK (actor IN ('DATA_GENERATOR', 'ML_MODEL', 'POLICY_ENGINE', 'SIMULATOR', 'AUDIT_SYSTEM')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_run ON audit_log (pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (pipeline_run_id, created_at);

-- -----------------------------------------------------------------------------
-- 10. EVALUATION RESULTS
-- Batch evaluation results and dashboard metrics.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluation_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_run_id UUID NOT NULL UNIQUE REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    eval_window_start TIMESTAMPTZ NOT NULL,
    eval_window_end TIMESTAMPTZ NOT NULL,
    total_failed_events INT NOT NULL,
    revenue_at_risk NUMERIC(12, 2) NOT NULL,
    recovered_revenue_gross NUMERIC(12, 2) NOT NULL,
    intervention_cost_total NUMERIC(12, 2) NOT NULL,
    net_recovery_value NUMERIC(12, 2) NOT NULL,
    correct_non_action_value NUMERIC(12, 2) NOT NULL,
    false_intervention_rate NUMERIC(6, 5) NOT NULL,
    escalation_rate NUMERIC(6, 5) NOT NULL,
    recovery_precision NUMERIC(6, 5) NOT NULL,
    recovery_recall NUMERIC(6, 5) NOT NULL,
    brier_score NUMERIC(6, 5) NOT NULL,
    roc_auc_score NUMERIC(6, 5) NOT NULL,
    baseline_always_retry_net NUMERIC(12, 2) NOT NULL,
    baseline_always_do_nothing_net NUMERIC(12, 2) NOT NULL,
    net_value_vs_always_retry NUMERIC(12, 2) NOT NULL,
    net_value_vs_always_do_nothing NUMERIC(12, 2) NOT NULL,
    calibration_curve_data JSONB NOT NULL,
    confusion_matrix JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eval_run ON evaluation_results (pipeline_run_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all 10 tables
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;

-- 1. pipeline_runs RLS Policy (SELECT only for COMPLETED runs)
CREATE POLICY "Allow public SELECT on completed pipeline runs"
    ON pipeline_runs FOR SELECT
    TO anon, authenticated
    USING (status = 'COMPLETED');

-- RLS Policies for dependent tables (SELECT only for COMPLETED runs)
CREATE POLICY "Allow public SELECT on completed run customers"
    ON customers FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run payments"
    ON payments FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run payment_attempts"
    ON payment_attempts FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run failure_events"
    ON failure_events FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run recovery_decisions"
    ON recovery_decisions FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run recovery_attempts"
    ON recovery_attempts FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run recovery_outcomes"
    ON recovery_outcomes FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run audit_log"
    ON audit_log FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));

CREATE POLICY "Allow public SELECT on completed run evaluation_results"
    ON evaluation_results FOR SELECT
    TO anon, authenticated
    USING (pipeline_run_id IN (SELECT run_id FROM pipeline_runs WHERE status = 'COMPLETED'));
