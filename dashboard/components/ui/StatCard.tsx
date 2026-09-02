import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent?: 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'purple';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  trend,
  accent = 'blue',
  icon,
}) => {
  const iconTheme: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
    red: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-600' },
    amber: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
    blue: { bg: 'bg-blue-50 border-blue-100', text: 'text-[#2E5BFF]' },
    slate: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
    purple: { bg: 'bg-violet-50 border-violet-100', text: 'text-violet-600' },
  };

  const theme = iconTheme[accent] || iconTheme.blue;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-2xs ${theme.bg} ${theme.text}`}>
            {icon}
          </div>
        )}
        {trend && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          {label}
        </span>
        <div className="text-[26px] font-extrabold text-slate-900 tracking-tight metric-value leading-none">
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-slate-400 font-medium mt-2 leading-relaxed">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

interface InlineStatProps {
  label: string;
  value: string;
  valueClass?: string;
}

export const InlineStat: React.FC<InlineStatProps> = ({
  label,
  value,
  valueClass = 'text-slate-900',
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <span className={`text-xs font-bold ${valueClass}`}>{value}</span>
  </div>
);
