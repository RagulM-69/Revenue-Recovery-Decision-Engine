'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  RotateCcw,
  Cpu,
  BarChart3,
  ShieldAlert,
  History,
  Activity,
  Layers,
} from 'lucide-react';
import { PipelineRun } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface SidebarProps {
  currentRun?: PipelineRun | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRun }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: <LayoutDashboard size={17} /> },
    { label: 'Decisions', href: '/decisions', icon: <GitBranch size={17} /> },
    { label: 'Recovery', href: '/recovery', icon: <RotateCcw size={17} /> },
    { label: 'Model Performance', href: '/model', icon: <Cpu size={17} /> },
    { label: 'Evaluation', href: '/evaluation', icon: <BarChart3 size={17} /> },
    { label: 'Policy Guardrails', href: '/policy', icon: <ShieldAlert size={17} /> },
    { label: 'Audit Log', href: '/audit', icon: <History size={17} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800/80 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-xs">
          R
        </div>
        <div>
          <h1 className="font-bold text-xs text-white tracking-wider uppercase">
            Revenue Recovery
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">
            AI Decision Engine
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Platform Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Pipeline Status Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="text-emerald-400" />
            PIPELINE RUN
          </span>
          <Badge
            label={currentRun?.status || 'COMPLETED'}
            type={currentRun?.status as any || 'COMPLETED'}
          />
        </div>
        <div className="text-[11px] text-slate-400 space-y-1 font-mono">
          <p className="truncate">
            <span className="text-slate-500">ID:</span>{' '}
            {currentRun?.run_id ? `${currentRun.run_id.substring(0, 10)}...` : '125559cc...'}
          </p>
          <p>
            <span className="text-slate-500">Records:</span>{' '}
            {currentRun?.total_events_processed || 3000} Events
          </p>
        </div>
      </div>
    </aside>
  );
};
