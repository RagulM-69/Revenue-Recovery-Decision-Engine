'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getDecisions,
  getDecisionCounts,
  formatINR,
  formatPercent,
  formatDate,
} from '@/lib/data-access';
import { Decision } from '@/lib/types';
import {
  Search,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  RotateCcw,
  Minus,
  AlertCircle,
} from 'lucide-react';

const FILTERS = ['ALL', 'RETRY', 'DO_NOTHING', 'ESCALATE'] as const;

export default function DecisionsPage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filtered, setFiltered] = useState<Decision[]>([]);
  const [selected, setSelected] = useState<Decision | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ RETRY: 0, ESCALATE: 0, DO_NOTHING: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (!run) { setLoading(false); return; }
    setRunId(run.run_id);
    const [list, dc] = await Promise.all([
      getDecisions(run.run_id, 'ALL', 500, false),
      getDecisionCounts(run.run_id, false),
    ]);
    setDecisions(list);
    setFiltered(list);
    setCounts(dc);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let r = decisions;
    if (decisionFilter !== 'ALL') r = r.filter(d => d.decision === decisionFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        d =>
          d.payment_id.toLowerCase().includes(q) ||
          d.event_id.toLowerCase().includes(q) ||
          d.decision_reason?.toLowerCase().includes(q) ||
          d.failure_event?.failure_reason?.toLowerCase().includes(q)
      );
    }
    setFiltered(r);
  }, [decisionFilter, searchQuery, decisions]);

  const summaryItems = [
    {
      label: 'Total Decisions',
      sublabel: 'Full Run · Days 1–30',
      value: counts.total,
      valueClass: 'text-slate-900',
      icon: <Database size={16} className="text-slate-400" />,
      bg: 'bg-white',
    },
    {
      label: 'RETRY',
      sublabel: 'Active intervention',
      value: counts.RETRY,
      valueClass: 'text-emerald-700',
      icon: <RotateCcw size={16} className="text-emerald-500" />,
      bg: 'bg-white',
    },
    {
      label: 'DO NOTHING',
      sublabel: 'Blocked by guardrails',
      value: counts.DO_NOTHING,
      valueClass: 'text-slate-600',
      icon: <Minus size={16} className="text-slate-400" />,
      bg: 'bg-white',
    },
    {
      label: 'ESCALATE',
      sublabel: 'Sent for human review',
      value: counts.ESCALATE,
      valueClass: 'text-amber-700',
      icon: <AlertCircle size={16} className="text-amber-500" />,
      bg: 'bg-white',
    },
  ];

  return (
    <div className="flex-1">
      <PageHeader
        title="Recovery Decisions"
        subtitle={`Operational audit view across all ${counts.total.toLocaleString()} automated decisions — search, filter, and inspect each ML score, ERV calculation, and guardrail evaluation.`}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-[#E4E9F0] rounded-lg text-[12px] font-semibold text-slate-700">
              <Database size={12} className="text-slate-500" />
              Full Run · {counts.total.toLocaleString()} events
            </span>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-600 border border-[#E4E9F0] bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-5">
        {/* ── Summary Count Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.map(item => (
            <div key={item.label} className={`${item.bg} border border-[#E4E9F0] rounded-2xl px-5 py-4 shadow-sm flex items-start gap-3`}>
              <div className="w-8 h-8 rounded-xl bg-[#F4F6F9] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{item.label}</div>
                <div className={`text-[22px] font-bold mt-0.5 metric-value ${item.valueClass}`}>
                  {item.value.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.sublabel}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E4E9F0] rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, Event ID, or failure reason…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F4F6F9] border border-[#E4E9F0] rounded-xl text-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#F4F6F9] rounded-xl p-1 border border-[#E4E9F0]">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setDecisionFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  decisionFilter === f
                    ? 'bg-white text-slate-900 shadow-sm border border-[#E4E9F0]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* ── Decisions Table ─────────────────────────────────────────── */}
        <div className="bg-white border border-[#E4E9F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E4E9F0] bg-[#F4F6F9]">
                  {['Payment ID', 'Amount', 'Method', 'Failure Reason', 'P(rec)', 'ERV', 'Decision', 'Inspect'].map(h => (
                    <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9F0]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[13px] text-slate-400">
                      Loading decisions…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[13px] text-slate-400">
                      {decisions.length === 0
                        ? 'No decisions found. Run a new analysis first.'
                        : 'No decisions match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 200).map(item => (
                    <tr
                      key={item.decision_id}
                      className="hover:bg-[#F4F6F9]/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {item.payment_id.substring(0, 14)}…
                      </td>
                      <td className="py-3 px-4 text-[12px] font-semibold text-slate-900 whitespace-nowrap metric-value">
                        {item.payment ? formatINR(Number(item.payment.amount)) : '—'}
                      </td>
                      <td className="py-3 px-4 text-[12px] text-slate-600 capitalize">
                        {item.payment?.payment_method?.replace(/_/g, ' ').toLowerCase() || '—'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-[160px] truncate">
                        {item.failure_event?.failure_reason || '—'}
                      </td>
                      <td className="py-3 px-4 text-[12px] font-semibold text-slate-700 whitespace-nowrap metric-value">
                        {formatPercent(Number(item.p_recovery))}
                      </td>
                      <td className="py-3 px-4 text-[12px] font-semibold text-slate-900 whitespace-nowrap metric-value">
                        {formatINR(Number(item.erv))}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge value={item.decision} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelected(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          aria-label="Inspect decision"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-2.5 bg-[#F4F6F9] border-t border-[#E4E9F0] text-[11px] text-slate-500">
              Showing latest {Math.min(filtered.length, 200)} sampled records for audit · {counts.total.toLocaleString()} total decisions recorded
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ───────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 bg-slate-950/40 z-50 flex justify-end backdrop-blur-[2px]"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col border-l border-[#E4E9F0]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E9F0] sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">Decision Audit</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {selected.decision_id}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {/* Final Decision */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Decision</span>
                  <StatusBadge value={selected.decision} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Payment Amount', value: selected.payment ? formatINR(Number(selected.payment.amount)) : '—' },
                    { label: 'P(recovery)', value: formatPercent(Number(selected.p_recovery)) },
                    { label: 'Expected Recovery Value', value: formatINR(Number(selected.erv)) },
                    { label: 'Model Version', value: selected.model_version || '—' },
                    { label: 'Payment Method', value: selected.payment?.payment_method?.replace(/_/g, ' ') || '—' },
                    { label: 'Failure Reason', value: selected.failure_event?.failure_reason || '—' },
                  ].map(f => (
                    <div key={f.label} className="bg-[#F4F6F9] border border-[#E4E9F0] rounded-xl p-3">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</div>
                      <div className="text-[12px] font-semibold text-slate-900 mt-1 break-all">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Reason */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Decision Reason
                </div>
                <p className="text-[12px] text-slate-700 bg-[#F4F6F9] border border-[#E4E9F0] rounded-xl p-3 leading-relaxed">
                  {selected.decision_reason || 'No reason recorded.'}
                </p>
              </div>

              {/* Guardrail Checklist */}
              {selected.guardrails_applied && selected.guardrails_applied.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Guardrail Evaluation Checklist
                  </div>
                  <div className="space-y-2">
                    {selected.guardrails_applied.map((check, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 border border-[#E4E9F0] rounded-xl bg-white"
                      >
                        {check.status === 'PASS' ? (
                          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        ) : check.status === 'TRIGGERED' ? (
                          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{check.rule}</div>
                          {check.detail && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{check.detail}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-2 border-t border-[#E4E9F0]">
                Policy: {selected.policy_version} · Decided: {formatDate(selected.decided_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
