import { supabase } from './supabase';
import {
  PipelineRun,
  EvaluationResult,
  Decision,
  RecoveryOutcome,
  AuditLogEntry,
} from './types';

// Formatters
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
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

// Data Access API

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
      .limit(1);

    if (error || !data || data.length === 0) {
      console.warn('No completed pipeline run found:', error);
      return null;
    }
    return data[0] as PipelineRun;
  } catch (e) {
    console.error('Failed to fetch latest pipeline run:', e);
    return null;
  }
}

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
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }
    return data[0] as EvaluationResult;
  } catch (e) {
    console.error('Failed to fetch evaluation results:', e);
    return null;
  }
}

/**
 * Fetch decision counts and breakdown for a run.
 */
export async function getDecisionStats(runId: string) {
  try {
    const { data, error } = await supabase
      .from('recovery_decisions')
      .select('decision, count')
      .eq('pipeline_run_id', runId);

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Failed to fetch decision stats:', e);
    return [];
  }
}

/**
 * Fetch paginated/filtered decisions with payment & failure details.
 */
export async function getDecisions(
  runId: string,
  decisionFilter?: string,
  limit: number = 100
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
      .order('created_at', { ascending: false })
      .limit(limit);

    if (decisionFilter && decisionFilter !== 'ALL') {
      query = query.eq('decision', decisionFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

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
 * Fetch recovery outcomes.
 */
export async function getRecoveryOutcomes(
  runId: string,
  limit: number = 100
): Promise<RecoveryOutcome[]> {
  try {
    const { data, error } = await supabase
      .from('recovery_outcomes')
      .select('*')
      .eq('pipeline_run_id', runId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as RecoveryOutcome[];
  } catch (e) {
    console.error('Failed to fetch recovery outcomes:', e);
    return [];
  }
}

/**
 * Fetch audit log entries.
 */
export async function getAuditLogs(
  runId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('pipeline_run_id', runId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as AuditLogEntry[];
  } catch (e) {
    console.error('Failed to fetch audit logs:', e);
    return [];
  }
}
