import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'purple';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  accent = 'slate',
  icon,
}) => {
  const iconBg: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-500',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-500',
    purple: 'bg-violet-50 text-violet-600',
  };

  const valueColor: Record<string, string> = {
    green: 'text-emerald-700',
    red: 'text-rose-600',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    slate: 'text-slate-900',
    purple: 'text-violet-700',
  };

  return (
    <div className="bg-white border border-[#E4E9F0] rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
          {label}
        </div>
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className={`text-[26px] font-bold tracking-tight metric-value leading-none ${valueColor[accent]}`}>
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{sub}</div>
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

export const InlineStat: React.FC<InlineStatProps> = ({ label, value, valueClass = 'text-slate-900' }) => (
  <div className="flex items-baseline justify-between py-2.5 border-b border-[#E4E9F0] last:border-0">
    <span className="text-[12px] text-slate-500">{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
);
