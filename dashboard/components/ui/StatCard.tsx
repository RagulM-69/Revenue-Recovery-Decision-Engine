import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'amber' | 'blue' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  accent = 'slate',
}) => {
  const accentBar: Record<string, string> = {
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
    amber: 'bg-amber-500',
    blue: 'bg-sky-500',
    slate: 'bg-slate-300',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-slate-300 transition-colors">
      <div className={`h-0.5 w-8 rounded-full ${accentBar[accent]}`} />
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
        {sub && (
          <div className="text-xs text-slate-500 mt-1 leading-relaxed">{sub}</div>
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
  <div className="flex items-baseline justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
);
