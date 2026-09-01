import { supabase } from './supabase';
import {
  PipelineRun,
  EvaluationResult,
  Decision,
  RecoveryOutcome,
  AuditLogEntry,
} from './types';

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  if (value === null || value === undefined) return '0.0%';
  // Value may come as decimal (0.64) or already percentage (64) — normalize
  const pct = value <= 1.0 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dateString;
  }
}

// ─── Pipeline Runs ────────────────────────────────────────────────────────────

/**
 * Fetch the latest completed pipeline run.
 */
export async function getLatestCompletedRun(): Promise<PipelineRun | null> {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('No completed pipeline run found:', error);
      return null;
    }
    return data as PipelineRun;
  } catch (e) {
    console.error('Failed to fetch latest pipeline run:', e);
    return null;
  }
}

/**
 * Fetch all completed pipeline runs for a run selector.
 */
export async function getAllCompletedRuns(): Promise<PipelineRun[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('started_at', { ascending: false });

    if (error) return [];
    return (data || []) as PipelineRun[];
  } catch (e) {
    return [];
  }
}

// ─── Evaluation Results ───────────────────────────────────────────────────────

/**
 * Fetch evaluation results for a given pipeline run.
 */
export async function getEvaluationResults(
  runId: string
): Promise<EvaluationResult | null> {
  try {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('pipeline_run_id', runId)
      .single();

    if (error) {
      console.warn('Evaluation results not found:', error);
      return null;
    }
    return data as EvaluationResult;
  } catch (e) {
    console.error('Failed to fetch evaluation results:', e);
    return null;
  }
}

// ─── Decisions ────────────────────────────────────────────────────────────────

/**
 * Fetch paginated/filtered decisions with payment & failure details.
 * Uses correct column name: decided_at (not created_at).
 */
export async function getDecisions(
  runId: string,
  decisionFilter?: string,
  limit: number = 500
): Promise<Decision[]> {
  try {
    let query = supabase
      .from('recovery_decisions')
      .select(`
        *,
        payments (amount, payment_method, customer_id),
        failure_events (failure_category, failure_reason, failed_at)
      `)
      .eq('pipeline_run_id', runId)
      .order('decided_at', { ascending: false })
      .limit(limit);

    if (decisionFilter && decisionFilter !== 'ALL') {
      query = query.eq('decision', decisionFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getDecisions error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      payment: row.payments,
      failure_event: row.failure_events,
    }));
  } catch (e) {
    console.error('Failed to fetch decisions:', e);
    return [];
  }
}

/**
 * Count decisions grouped by type for a run.
 */
export async function getDecisionCounts(
  runId: string
): Promise<{ RETRY: number; ESCALATE: number; DO_NOTHING: number; total: number }> {
  try {
    const { data, error } = await supabase
      .from('recovery_decisions')
      .select('decision')
      .eq('pipeline_run_id', runId);

    if (error || !data) return { RETRY: 0, ESCALATE: 0, DO_NOTHING: 0, total: 0 };

    const counts = { RETRY: 0, ESCALATE: 0, DO_NOTHING: 0, total: data.length };
    for (const row of data) {
      if (row.decision === 'RETRY') counts.RETRY++;
      else if (row.decision === 'ESCALATE') counts.ESCALATE++;
      else if (row.decision === 'DO_NOTHING') counts.DO_NOTHING++;
    }
    return counts;
  } catch (e) {
    return { RETRY: 0, ESCALATE: 0, DO_NOTHING: 0, total: 0 };
  }
}

// ─── Recovery Outcomes ────────────────────────────────────────────────────────

/**
 * Fetch recovery outcomes for a run.
 */
export async function getRecoveryOutcomes(
  runId: string,
  limit: number = 500
): Promise<RecoveryOutcome[]> {
  try {
    const { data, error } = await supabase
      .from('recovery_outcomes')
      .select('*')
      .eq('pipeline_run_id', runId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getRecoveryOutcomes error:', error);
      return [];
    }
    return (data || []) as RecoveryOutcome[];
  } catch (e) {
    console.error('Failed to fetch recovery outcomes:', e);
    return [];
  }
}

/**
 * Count recovery outcomes grouped by type for a run.
 */
export async function getOutcomeCounts(
  runId: string
): Promise<{ RECOVERED: number; NOT_RECOVERED: number; ESCALATED_PENDING: number; NO_ACTION_TAKEN: number; total: number }> {
  try {
    const { data, error } = await supabase
      .from('recovery_outcomes')
      .select('outcome_type')
      .eq('pipeline_run_id', runId);

    if (error || !data) return { RECOVERED: 0, NOT_RECOVERED: 0, ESCALATED_PENDING: 0, NO_ACTION_TAKEN: 0, total: 0 };

    const counts = { RECOVERED: 0, NOT_RECOVERED: 0, ESCALATED_PENDING: 0, NO_ACTION_TAKEN: 0, total: data.length };
    for (const row of data) {
      if (row.outcome_type in counts) {
        (counts as any)[row.outcome_type]++;
      }
    }
    return counts;
  } catch (e) {
    return { RECOVERED: 0, NOT_RECOVERED: 0, ESCALATED_PENDING: 0, NO_ACTION_TAKEN: 0, total: 0 };
  }
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Fetch audit log entries for a run.
 * Uses correct column name: created_at (actual DB column).
 */
export async function getAuditLogs(
  runId: string,
  limit: number = 500
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('pipeline_run_id', runId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getAuditLogs error:', error);
      return [];
    }
    return (data || []) as AuditLogEntry[];
  } catch (e) {
    console.error('Failed to fetch audit logs:', e);
    return [];
  }
}
