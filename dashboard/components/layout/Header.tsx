'use client';

import React from 'react';
import { RefreshCw, Database } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
          <Database size={14} />
          <span>Supabase Connected</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
};
