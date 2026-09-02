'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Play,
  GitBranch,
  TrendingUp,
  Cpu,
  ShieldAlert,
  History,
  Circle,
  Zap,
} from 'lucide-react';
import { PipelineRun } from '@/lib/types';

interface SidebarProps {
  currentRun?: PipelineRun | null;
}

const primaryNav = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'New Analysis', href: '/new-analysis', icon: Play },
  { label: 'Decisions', href: '/decisions', icon: GitBranch },
  { label: 'Results', href: '/results', icon: TrendingUp },
];

const technicalNav = [
  { label: 'Model', href: '/model', icon: Cpu },
  { label: 'Policy', href: '/policy', icon: ShieldAlert },
  { label: 'Audit', href: '/audit', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentRun }) => {
  const pathname = usePathname();

  const NavItem = ({
    item,
  }: {
    item: { label: string; href: string; icon: React.ElementType };
  }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
        }`}
      >
        <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-600'
            : 'text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100'
        }`}>
          <Icon size={14} />
        </span>
        <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
      </Link>
    );
  };

  return (
    <aside className="w-60 bg-white border-r border-[#E4E9F0] flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#E4E9F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-[13px] text-slate-900 tracking-tight block leading-tight">
              Revenue Recovery
            </span>
            <span className="text-[10px] text-slate-400 font-normal leading-tight">
              Decision Engine
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-4 space-y-0.5">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Platform
        </div>
        {primaryNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        <div className="px-3 mt-5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Technical
        </div>
        {technicalNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Run Status Footer */}
      <div className="px-4 py-4 border-t border-[#E4E9F0] bg-slate-50/60">
        <div className="flex items-center gap-2 mb-1.5">
          <Circle
            size={6}
            className={`fill-current ${currentRun ? 'text-emerald-500' : 'text-slate-300'}`}
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {currentRun ? 'Analysis Loaded' : 'No Analysis'}
          </span>
        </div>
        {currentRun ? (
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p className="font-mono truncate text-slate-500">
              {currentRun.run_id.substring(0, 16)}…
            </p>
            <p className="font-medium">
              {currentRun.total_events_processed.toLocaleString()} events processed
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">Run a new analysis to begin</p>
        )}
      </div>
    </aside>
  );
};
