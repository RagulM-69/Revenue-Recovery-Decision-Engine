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
 * Explicit limit=5000 avoids PostgREST 1000-row default truncation.
 * Supports evalOnly filter (evaluation set: Days 21-30).
 */
export async function getDecisions(
  runId: string,
  decisionFilter?: string,
  limit: number = 500,
  evalOnly: boolean = false
): Promise<Decision[]> {
  try {
    let query = supabase
      .from('recovery_decisions')
      .select(`
        *,
        payments!inner (amount, payment_method, customer_id, is_eval_set),
        failure_events (failure_category, failure_reason, failed_at)
      `)
      .eq('pipeline_run_id', runId)
      .order('decided_at', { ascending: false })
      .limit(limit);

    if (evalOnly) {
      query = query.eq('payments.is_eval_set', true);
    }

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
 * Explicit limit(5000) prevents PostgREST default 1000-row truncation cap.
 * Supports evalOnly filter to return counts specifically for evaluation scope.
 */
export async function getDecisionCounts(
  runId: string,
  evalOnly: boolean = false
): Promise<{ RETRY: number; ESCALATE: number; DO_NOTHING: number; total: number }> {
  try {
    let query = supabase
      .from('recovery_decisions')
      .select('decision, payments!inner(is_eval_set)')
      .eq('pipeline_run_id', runId)
      .limit(5000);

    if (evalOnly) {
      query = query.eq('payments.is_eval_set', true);
    }

    const { data, error } = await query;
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
 * Supports evalOnly filter for evaluation window.
 */
export async function getRecoveryOutcomes(
  runId: string,
  limit: number = 500,
  evalOnly: boolean = false
): Promise<RecoveryOutcome[]> {
  try {
    let query = supabase
      .from('recovery_outcomes')
      .select(`
        *,
        failure_events!inner(failed_at, payments!inner(is_eval_set))
      `)
      .eq('pipeline_run_id', runId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (evalOnly) {
      query = query.eq('failure_events.payments.is_eval_set', true);
    }

    const { data, error } = await query;
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
 * Explicit limit(5000) prevents PostgREST default 1000-row truncation cap.
 * Supports evalOnly filter for evaluation scope.
 */
export async function getOutcomeCounts(
  runId: string,
  evalOnly: boolean = false
): Promise<{ RECOVERED: number; NOT_RECOVERED: number; ESCALATED_PENDING: number; NO_ACTION_TAKEN: number; total: number }> {
  try {
    let query = supabase
      .from('recovery_outcomes')
      .select('outcome_type, failure_events!inner(payments!inner(is_eval_set))')
      .eq('pipeline_run_id', runId)
      .limit(5000);

    if (evalOnly) {
      query = query.eq('failure_events.payments.is_eval_set', true);
    }

    const { data, error } = await query;

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
