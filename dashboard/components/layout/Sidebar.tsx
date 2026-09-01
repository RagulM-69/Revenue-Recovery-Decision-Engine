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
} from 'lucide-react';
import { PipelineRun } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface SidebarProps {
  currentRun?: PipelineRun | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRun }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Decisions', href: '/decisions', icon: <GitBranch size={18} /> },
    { label: 'Recovery', href: '/recovery', icon: <RotateCcw size={18} /> },
    { label: 'Model Performance', href: '/model', icon: <Cpu size={18} /> },
    { label: 'Evaluation', href: '/evaluation', icon: <BarChart3 size={18} /> },
    { label: 'Policy Guardrails', href: '/policy', icon: <ShieldAlert size={18} /> },
    { label: 'Audit Log', href: '/audit', icon: <History size={18} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
          R
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide">
            Revenue Recovery
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            AI Decision Engine v1.0
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Pipeline Status Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-400 animate-pulse" />
            PIPELINE STATUS
          </span>
          <Badge
            label={currentRun?.status || 'COMPLETED'}
            type={currentRun?.status as any || 'COMPLETED'}
          />
        </div>
        <div className="text-[11px] text-slate-400 space-y-1 font-mono">
          <p className="truncate">
            <span className="text-slate-500">Run:</span>{' '}
            {currentRun?.run_id ? `${currentRun.run_id.substring(0, 8)}...` : 'c17c364d...'}
          </p>
          <p>
            <span className="text-slate-500">Events:</span>{' '}
            {currentRun?.total_events_processed || 3000}
          </p>
        </div>
      </div>
    </aside>
  );
};
