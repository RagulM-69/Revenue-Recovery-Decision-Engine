import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trend?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    success: 'bg-white border-slate-200 text-slate-900 border-l-4 border-l-emerald-500',
    warning: 'bg-white border-slate-200 text-slate-900 border-l-4 border-l-amber-500',
    danger: 'bg-white border-slate-200 text-slate-900 border-l-4 border-l-rose-500',
    info: 'bg-white border-slate-200 text-slate-900 border-l-4 border-l-sky-500',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100',
    info: 'bg-sky-50 text-sky-600 border border-sky-100',
  };

  return (
    <div
      className={`p-5 rounded-xl border shadow-2xs transition-all duration-200 hover:shadow-xs ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className={`p-2.5 rounded-lg ${iconBgStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 shrink-0">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
