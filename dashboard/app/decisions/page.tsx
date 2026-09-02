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
  SlidersHorizontal,
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
    if (!run) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-8 max-w-[1550px] mx-auto w-full">
      <PageHeader
        title="Recovery Decisions Console"
        subtitle={`Operational log of all ${counts.total.toLocaleString()} autonomous decisions evaluated across the full 30-day transaction history.`}
        actions={
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
              <Database size={12} className="text-slate-500" />
              Full Dataset: {counts.total.toLocaleString()} Records
            </span>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        }
      />

      {/* ── Clean Operational Decision Metrics Bar ───────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400 block">Total Decisions</span>
            <div className="text-2xl font-bold text-slate-900 metric-value">
              {counts.total.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">Lifetime operational ledger</span>
          </div>

          <div className="space-y-1 sm:pl-6 pt-3 sm:pt-0">
            <span className="text-xs font-medium text-slate-400 block">Retries Approved</span>
            <div className="text-2xl font-bold text-emerald-700 metric-value">
              {counts.RETRY.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              {counts.total ? ((counts.RETRY / counts.total) * 100).toFixed(1) : 0}% · Positive ERV &gt; 0
            </span>
          </div>

          <div className="space-y-1 sm:pl-6 pt-3 sm:pt-0">
            <span className="text-xs font-medium text-slate-400 block">Blocked by Guardrails</span>
            <div className="text-2xl font-bold text-slate-700 metric-value">
              {counts.DO_NOTHING.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              {counts.total ? ((counts.DO_NOTHING / counts.total) * 100).toFixed(1) : 0}% · Avoided fee waste
            </span>
          </div>

          <div className="space-y-1 sm:pl-6 pt-3 sm:pt-0">
            <span className="text-xs font-medium text-slate-400 block">Escalated Reviews</span>
            <div className="text-2xl font-bold text-amber-700 metric-value">
              {counts.ESCALATE.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">High-value manual reviews</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Payment ID, Event ID, or decline reason…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5BFF]/20 focus:border-[#2E5BFF] transition-all font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setDecisionFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                decisionFilter === f
                  ? 'bg-white text-[#2E5BFF] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Decisions Table Container ────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {['Payment ID', 'Amount', 'Method', 'Decline Reason', 'P(rec)', 'ERV', 'Decision', 'Trace'].map(h => (
                  <th key={h} className="py-3 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-medium">
                    Loading decision records…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-medium">
                    No decisions match your search query.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 200).map(item => (
                  <tr key={item.decision_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono text-[11px] text-slate-500">
                      {item.payment_id.substring(0, 14)}…
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900 metric-value whitespace-nowrap">
                      {item.payment ? formatINR(Number(item.payment.amount)) : '—'}
                    </td>
                    <td className="py-3 px-5 text-slate-600 font-medium capitalize">
                      {item.payment?.payment_method?.replace(/_/g, ' ').toLowerCase() || '—'}
                    </td>
                    <td className="py-3 px-5 text-slate-500 font-medium max-w-[170px] truncate">
                      {item.failure_event?.failure_reason || '—'}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-700 metric-value">
                      {formatPercent(Number(item.p_recovery))}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900 metric-value whitespace-nowrap">
                      {formatINR(Number(item.erv))}
                    </td>
                    <td className="py-3 px-5">
                      <StatusBadge value={item.decision} />
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => setSelected(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2E5BFF] hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Inspect guardrail checklist"
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
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Showing latest {Math.min(filtered.length, 200)} sampled records · {counts.total.toLocaleString()} total recorded</span>
            <span>Active Policy Rules</span>
          </div>
        )}
      </div>

      {/* ── Slide-Over Detail Inspector Drawer ────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 bg-slate-950/40 z-50 flex justify-end backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Decision Audit Trace</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  ID: {selected.decision_id}
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
              {/* Decision Action */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Decision</span>
                  <StatusBadge value={selected.decision} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-medium text-slate-400 block">Amount</span>
                    <span className="font-bold text-slate-900 metric-value block mt-0.5">
                      {selected.payment ? formatINR(Number(selected.payment.amount)) : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-medium text-slate-400 block">P(recovery)</span>
                    <span className="font-bold text-slate-900 metric-value block mt-0.5">
                      {formatPercent(Number(selected.p_recovery))}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-medium text-slate-400 block">Expected Value (ERV)</span>
                    <span className="font-bold text-slate-900 metric-value block mt-0.5">
                      {formatINR(Number(selected.erv))}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-medium text-slate-400 block">Model Identifier</span>
                    <span className="font-mono text-slate-700 block mt-0.5 text-[11px]">
                      {selected.model_version || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Decision Rationale
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed font-medium">
                  {selected.decision_reason || 'No specific rationale recorded.'}
                </p>
              </div>

              {/* Guardrails Checklist Trace */}
              {selected.guardrails_applied && selected.guardrails_applied.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Policy Guardrail Evaluation Trace
                  </span>
                  <div className="space-y-2">
                    {selected.guardrails_applied.map((check, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-white text-xs"
                      >
                        {check.status === 'PASS' ? (
                          <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                        ) : check.status === 'TRIGGERED' ? (
                          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle size={15} className="text-rose-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-800 block">{check.rule}</span>
                          {check.detail && (
                            <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">{check.detail}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 font-medium">
                Policy: {selected.policy_version} · Decided at {formatDate(selected.decided_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
