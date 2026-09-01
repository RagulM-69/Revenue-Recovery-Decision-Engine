import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="px-8 pt-8 pb-6 border-b border-slate-200 bg-white flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 font-normal max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-3">{actions}</div>}
    </div>
  );
};
