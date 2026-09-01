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
  ChevronRight,
  Circle,
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
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
        }`}
      >
        <Icon
          size={15}
          className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}
        />
        <span>{item.label}</span>
        {isActive && (
          <ChevronRight size={12} className="ml-auto text-slate-400" />
        )}
      </Link>
    );
  };

  return (
    <aside className="w-60 bg-[#f0f4f8] border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            R²
          </div>
          <span className="font-bold text-[13px] text-slate-900 tracking-tight">
            Revenue Recovery
          </span>
        </div>
        <p className="text-[11px] text-slate-500 ml-9 font-normal">
          Decision Engine
        </p>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 space-y-1">
        <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Platform
        </div>
        {primaryNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        <div className="px-3 mt-5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Technical
        </div>
        {technicalNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Run Status Footer */}
      <div className="px-4 py-3.5 border-t border-slate-200 bg-white/60">
        <div className="flex items-center gap-2 mb-1">
          <Circle
            size={6}
            className={`fill-current ${currentRun ? 'text-emerald-500' : 'text-slate-300'}`}
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {currentRun ? 'Analysis Loaded' : 'No Analysis'}
          </span>
        </div>
        {currentRun ? (
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p className="font-mono truncate">
              {currentRun.run_id.substring(0, 16)}…
            </p>
            <p>
              {currentRun.total_events_processed.toLocaleString()} events
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">Run a new analysis to begin</p>
        )}
      </div>
    </aside>
  );
};
