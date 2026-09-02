import React from 'react';

type DecisionType = 'RETRY' | 'ESCALATE' | 'DO_NOTHING';
type OutcomeType = 'RECOVERED' | 'NOT_RECOVERED' | 'ESCALATED_PENDING' | 'NO_ACTION_TAKEN';
type StatusType = 'COMPLETED' | 'RUNNING' | 'FAILED';

type BadgeVariant = DecisionType | OutcomeType | StatusType | 'default';

interface StatusBadgeProps {
  value: string;
  variant?: BadgeVariant;
}

const variantMap: Record<string, string> = {
  RETRY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RECOVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  ESCALATE: 'bg-amber-50 text-amber-800 border-amber-200',
  ESCALATED_PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  RUNNING: 'bg-blue-50 text-blue-700 border-blue-200',

  DO_NOTHING: 'bg-slate-100 text-slate-600 border-slate-200',
  NO_ACTION_TAKEN: 'bg-slate-100 text-slate-600 border-slate-200',

  NOT_RECOVERED: 'bg-rose-50 text-rose-700 border-rose-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',

  default: 'bg-slate-100 text-slate-600 border-slate-200',
};

const dotMap: Record<string, string> = {
  RETRY: 'bg-emerald-500',
  RECOVERED: 'bg-emerald-500',
  COMPLETED: 'bg-emerald-500',
  ESCALATE: 'bg-amber-500',
  ESCALATED_PENDING: 'bg-amber-500',
  RUNNING: 'bg-blue-500',
  DO_NOTHING: 'bg-slate-400',
  NO_ACTION_TAKEN: 'bg-slate-400',
  NOT_RECOVERED: 'bg-rose-500',
  FAILED: 'bg-rose-500',
  default: 'bg-slate-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ value, variant }) => {
  const key = variant || value;
  const cls = variantMap[key] || variantMap.default;
  const dot = dotMap[key] || dotMap.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {value.replace(/_/g, ' ')}
    </span>
  );
};

// Keep old Badge export for any legacy usage
export const Badge = StatusBadge;
