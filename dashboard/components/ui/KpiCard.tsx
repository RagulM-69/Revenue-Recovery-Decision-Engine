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
    success: 'bg-emerald-50/60 border-emerald-200 text-emerald-950',
    warning: 'bg-amber-50/60 border-amber-200 text-amber-950',
    danger: 'bg-rose-50/60 border-rose-200 text-rose-950',
    info: 'bg-sky-50/60 border-sky-200 text-sky-950',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-rose-100 text-rose-600',
    info: 'bg-sky-100 text-sky-600',
  };

  return (
    <div
      className={`p-5 rounded-xl border shadow-sm transition-all duration-150 hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className={`p-2.5 rounded-lg ${iconBgStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
