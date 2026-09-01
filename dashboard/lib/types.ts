export interface PipelineRun {
  run_id: string;
  started_at: string;
  completed_at?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  total_events_processed: number;
  config_snapshot: Record<string, any>;
  error_log?: string;
}

export interface CalibrationBin {
  bin_index: number;
  bin_midpoint: number;
  observed_ratio: number;
  count: number;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface EvaluationResult {
  result_id: string;
  pipeline_run_id: string;
  eval_window_start: string;
  eval_window_end: string;
  total_failed_events: number;
  revenue_at_risk: number;
  recovered_revenue_gross: number;
  intervention_cost_total: number;
  net_recovery_value: number;
  correct_non_action_value: number;
  false_intervention_rate: number;
  escalation_rate: number;
  recovery_precision: number;
  recovery_recall: number;
  brier_score: number;
  roc_auc_score: number;
  baseline_always_retry_net: number;
  baseline_always_do_nothing_net: number;
  net_value_vs_always_retry: number;
  net_value_vs_always_do_nothing: number;
  calibration_curve_data: CalibrationBin[];
  confusion_matrix: ConfusionMatrix;
}

export interface DecisionGuardrailCheck {
  rule: string;
  status: 'PASS' | 'FAIL' | 'TRIGGERED';
  detail?: string;
}

export interface Decision {
  decision_id: string;
  pipeline_run_id: string;
  event_id: string;
  payment_id: string;
  p_recovery: number;
  erv: number;
  decision: 'RETRY' | 'ESCALATE' | 'DO_NOTHING';
  decision_reason: string;
  guardrails_applied: DecisionGuardrailCheck[];
  model_version: string;
  policy_version: string;
  decided_at: string; // actual column name
  // Joined fields
  payment?: {
    amount: number;
    payment_method: string;
    customer_id: string;
  };
  failure_event?: {
    failure_category: string;
    failure_reason: string;
    failed_at: string;
  };
}

export interface RecoveryOutcome {
  outcome_id: string;
  pipeline_run_id: string;
  event_id: string;
  decision_id: string;
  recovery_attempt_id?: string;
  outcome_type: 'RECOVERED' | 'NOT_RECOVERED' | 'ESCALATED_PENDING' | 'NO_ACTION_TAKEN';
  recovered_amount: number;
  net_value_impact: number;
  recorded_at: string;
}

export interface AuditLogEntry {
  log_id: string;
  pipeline_run_id: string;
  created_at: string; // actual column name in DB
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor: string;
  payload: Record<string, any>;
}
