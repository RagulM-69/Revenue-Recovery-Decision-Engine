import React from 'react';

interface BadgeProps {
  label: string;
  type?: 'RETRY' | 'ESCALATE' | 'DO_NOTHING' | 'RECOVERED' | 'NOT_RECOVERED' | 'ESCALATED_PENDING' | 'NO_ACTION_TAKEN' | 'COMPLETED' | 'RUNNING' | 'FAILED' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'default' }) => {
  const styles: Record<string, string> = {
    RETRY: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    RECOVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    
    ESCALATE: 'bg-amber-50 text-amber-800 border-amber-200/80',
    ESCALATED_PENDING: 'bg-amber-50 text-amber-800 border-amber-200/80',
    RUNNING: 'bg-amber-50 text-amber-800 border-amber-200/80',
    
    DO_NOTHING: 'bg-slate-100 text-slate-700 border-slate-200',
    NO_ACTION_TAKEN: 'bg-slate-100 text-slate-700 border-slate-200',
    
    NOT_RECOVERED: 'bg-rose-50 text-rose-700 border-rose-200/80',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200/80',
    
    default: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const selectedStyle = styles[type] || styles[label] || styles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${selectedStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75 shrink-0" />
      {label}
    </span>
  );
};
