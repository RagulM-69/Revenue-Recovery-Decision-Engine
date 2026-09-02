'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  LayoutDashboard,
  ChevronDown,
  X,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Sliders,
  Database,
  Command,
  Check,
  Building,
  User,
  Key,
  ShieldCheck,
  Cpu,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TopHeaderProps {
  currentRunId?: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  read: boolean;
  link: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'High-Value Recovery Successful',
    desc: '₹84,500 recovered on 2nd retry attempt via UPI (Customer SME #482).',
    time: '2m ago',
    type: 'success',
    read: false,
    link: '/decisions',
  },
  {
    id: '2',
    title: 'Policy Guardrail Intervention',
    desc: 'Velocity check failure blocked by Rule #2. Avoided ₹15 gateway fee on terminal decline.',
    time: '14m ago',
    type: 'warning',
    read: false,
    link: '/policy',
  },
  {
    id: '3',
    title: 'Evaluation Run Completed',
    desc: '996 held-out events scored. Realized recall reached 93.0% with ₹45.17L net value.',
    time: '1h ago',
    type: 'info',
    read: false,
    link: '/results',
  },
  {
    id: '4',
    title: 'Model Auto-Calibration Check',
    desc: 'Logistic Regression calibrated with lower Brier score (0.1563) than XGBoost (0.1565).',
    time: '3h ago',
    type: 'info',
    read: true,
    link: '/model',
  },
];

const SEARCH_SHORTCUTS = [
  { label: 'Overview Dashboard', category: 'Pages', href: '/', icon: LayoutDashboard },
  { label: 'How It Works (System Architecture)', category: 'Pages', href: '/how-it-works', icon: BookOpen },
  { label: 'Recovery Decisions Console', category: 'Pages', href: '/decisions', icon: RotateCcw },
  { label: 'Results & Financial Impact', category: 'Pages', href: '/results', icon: CheckCircle },
  { label: 'ML Model Governance', category: 'Pages', href: '/model', icon: Cpu },
  { label: 'Deterministic Policy Rules', category: 'Pages', href: '/policy', icon: ShieldCheck },
  { label: 'Immutable Audit Trail', category: 'Pages', href: '/audit', icon: Database },
  { label: 'Run New Analysis', category: 'Actions', href: '/new-analysis', icon: ExternalLink },
  { label: 'Filter: Soft Declines (Insufficient Funds)', category: 'Filters', href: '/decisions', icon: Sliders },
  { label: 'Filter: High-Value Payments (> ₹50,000)', category: 'Filters', href: '/decisions', icon: Sliders },
];

export const TopHeader: React.FC<TopHeaderProps> = ({ currentRunId }) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
        setShowProfile(false);
        setShowScopeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredShortcuts = SEARCH_SHORTCUTS.filter(s =>
    s.label.toLowerCase().includes(paletteQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <>
      <header className="px-8 py-3.5 flex items-center justify-between gap-6 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        {/* Interactive Search Bar -> Triggers Command Palette */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full pl-10 pr-12 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-full text-xs text-left text-slate-400 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              <span className="truncate">Search payments, rules, or jump to page...</span>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
              <Command size={10} />K
            </div>
          </button>
        </div>

        {/* Right Interactive Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Subtle "How It Works" Header Link */}
          <Link
            href="/how-it-works"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-600 transition-all shadow-2xs"
            title="Read system architecture & decision flow guide"
          >
            <HelpCircle size={13} className="text-slate-500" />
            <span>How It Works</span>
          </Link>

          <button
            onClick={() => setShowScopeModal(true)}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200/70 rounded-full text-xs font-semibold text-[#2E5BFF] transition-all cursor-pointer shadow-2xs"
            title="Click to view evaluation split methodology"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" />
            <span>Eval Scope: Days 21–30</span>
          </button>

          {/* Interactive Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(prev => !prev);
                setShowProfile(false);
              }}
              className={`relative p-2 rounded-full border transition-all cursor-pointer ${
                showNotifications
                  ? 'bg-blue-50 border-[#2E5BFF] text-[#2E5BFF]'
                  : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-600 shadow-2xs'
              }`}
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#2E5BFF] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">System Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-white bg-[#2E5BFF] px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-[#2E5BFF] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.map(item => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => {
                        setNotifications(prev =>
                          prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
                        );
                        setShowNotifications(false);
                      }}
                      className={`p-4 flex items-start gap-3 hover:bg-slate-50/80 transition-colors block ${
                        !item.read ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'success' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={13} />
                          </div>
                        ) : item.type === 'warning' ? (
                          <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <AlertTriangle size={13} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-[#2E5BFF] flex items-center justify-center">
                            <RotateCcw size={13} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs ${!item.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
                  <Link
                    href="/audit"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-[#2E5BFF] hover:underline inline-flex items-center gap-1"
                  >
                    View Complete Audit Log <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Interactive User Profile Button & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(prev => !prev);
                setShowNotifications(false);
              }}
              className={`flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full border transition-all cursor-pointer ${
                showProfile
                  ? 'bg-blue-50 border-[#2E5BFF]'
                  : 'bg-white border-slate-200/90 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2E5BFF] to-[#6086FF] flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm">
                RP
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  Razorpay Reviewer
                </span>
                <span className="block text-[10px] text-slate-400 font-medium leading-tight">
                  Buildathon Console
                </span>
              </div>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${showProfile ? 'rotate-180 text-[#2E5BFF]' : ''}`} />
            </button>

            {/* Profile Dropdown Panel */}
            {showProfile && (
              <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-4 bg-gradient-to-b from-blue-50/70 to-white border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#2E5BFF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      RP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Razorpay Reviewer</h4>
                      <p className="text-[10px] text-slate-500 font-mono">reviewer@buildathon.internal</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" /> Admin Access
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 space-y-0.5 text-xs font-semibold text-slate-700">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Workspace
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 text-slate-900">
                    <span className="flex items-center gap-2">
                      <Building size={13} className="text-[#2E5BFF]" />
                      Revenue Recovery Engine
                    </span>
                    <Check size={13} className="text-emerald-600" />
                  </div>

                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Navigation
                  </div>
                  <Link
                    href="/policy"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <ShieldCheck size={13} className="text-slate-400" />
                    Policy Guardrails Config
                  </Link>
                  <Link
                    href="/audit"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Database size={13} className="text-slate-400" />
                    Audit Logs Ledger
                  </Link>
                  <Link
                    href="/model"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Cpu size={13} className="text-slate-400" />
                    ML Model Status
                  </Link>
                </div>

                <div className="p-2 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => {
                      alert('Session is locked to Demo Mode for the Razorpay Buildathon.');
                      setShowProfile(false);
                    }}
                    className="w-full text-center px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Sign Out (Demo Session)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Interactive Command Palette Modal (⌘K) ───────────────────── */}
      {showCommandPalette && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search size={18} className="text-[#2E5BFF] shrink-0" />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                placeholder="Type a command, page name, or filter..."
                value={paletteQuery}
                onChange={e => setPaletteQuery(e.target.value)}
                className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setShowCommandPalette(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-50">
              {filteredShortcuts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No matching commands or pages found for &quot;{paletteQuery}&quot;.
                </div>
              ) : (
                filteredShortcuts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowCommandPalette(false);
                        router.push(item.href);
                      }}
                      className="w-full px-4 py-3 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#2E5BFF] group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <Icon size={14} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-[#2E5BFF]">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-[#2E5BFF] transition-colors" />
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium px-5">
              <span>Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd> to navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Scope Explanation Modal ──────────────────────── */}
      {showScopeModal && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowScopeModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-[#2E5BFF] flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Dual Scope Methodology Explained
                  </h3>
                  <span className="text-xs text-slate-400">Why 996 vs 3,000 events</span>
                </div>
              </div>
              <button
                onClick={() => setShowScopeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <strong className="text-[#2E5BFF] block mb-1">
                  1. Evaluation Scope (Days 21–30 · 996 Events):
                </strong>
                Used for model evaluation, Brier score, ROC-AUC, and financial ROI. Follows strict financial ML standards where the model is tested strictly on held-out future events (Days 21–30) without temporal data leakage.
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <strong className="text-slate-800 block mb-1">
                  2. Operational / Audit Scope (Days 1–30 · 3,000 Events):
                </strong>
                Used in the Decisions and Audit tabs. Represents the complete lifetime payment ledger across the entire merchant history for compliance and dispute verification.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowScopeModal(false)}
                className="px-5 py-2.5 bg-[#2E5BFF] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
