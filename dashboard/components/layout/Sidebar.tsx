'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Play,
  GitBranch,
  TrendingUp,
  Cpu,
  ShieldAlert,
  History,
  Zap,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { PipelineRun } from '@/lib/types';
import { RevenueLogo } from '@/components/ui/RevenueLogo';

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
        className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[13px] transition-all duration-200 ${
          isActive
            ? 'bg-white text-[#2E5BFF] font-bold shadow-lg shadow-blue-950/20'
            : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
        }`}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 transition-colors ${
            isActive ? 'text-[#2E5BFF]' : 'text-white/80 group-hover:text-white'
          }`}
        >
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </span>
        <span className="tracking-tight">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#2E5BFF] via-[#2A55F5] to-[#1E44D9] flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl shadow-blue-900/10">
      {/* Brand Header */}
      <div className="px-6 pt-7 pb-6">
        <RevenueLogo variant="sidebar" />
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
          Platform
        </div>
        {primaryNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        <div className="px-3 pt-5 pb-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
          Technical
        </div>
        {technicalNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Operational Status Card */}
      <div className="p-4">
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-white tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Pipeline Active
            </span>
            <span className="text-[10px] text-white/60 font-medium">
              Operational
            </span>
          </div>

          <p className="text-xs text-white/75 leading-relaxed mb-3 font-normal">
            {currentRun
              ? `${currentRun.total_events_processed.toLocaleString()} transactions evaluated.`
              : 'Payment decision engine operational.'}
          </p>

          <Link
            href="/new-analysis"
            className="flex items-center justify-between w-full px-3.5 py-2 bg-white text-[#2E5BFF] hover:bg-white/95 rounded-xl text-xs font-semibold shadow-2xs transition-all"
          >
            <span>Run Analysis</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Subtle Bottom Reference Link */}
        <div className="pt-2.5 px-1 flex items-center justify-between text-[11px] text-white/70 font-medium">
          <Link
            href="/how-it-works"
            className="hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <BookOpen size={13} />
            <span>How It Works</span>
          </Link>
          <span className="text-[10px] text-white/40">Guide &amp; Logic</span>
        </div>
      </div>
    </aside>
  );
};
