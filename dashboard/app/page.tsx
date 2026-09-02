'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getLatestCompletedRun,
  getEvaluationResults,
  getDecisionCounts,
  getOutcomeCounts,
  formatINR,
  formatPercent,
  formatDate,
} from '@/lib/data-access';
import { PipelineRun, EvaluationResult } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';
import {
  Play,
  ArrowRight,
  BarChart3,
  GitBranch,
  CheckCircle,
  XCircle,
  Minus,
  RotateCcw,
  AlertCircle,
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Percent,
  Info,
} from 'lucide-react';

interface Counts {
  decisions: { RETRY: number; ESCALATE: number; DO_NOTHING: number; total: number };
  outcomes: { RECOVERED: number; NOT_RECOVERED: number; ESCALATED_PENDING: number; NO_ACTION_TAKEN: number; total: number };
}

export default function OverviewPage() {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [evalCounts, setEvalCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const r = await getLatestCompletedRun();
      setRun(r);
      if (r) {
        const [ev, dc, oc] = await Promise.all([
          getEvaluationResults(r.run_id),
          getDecisionCounts(r.run_id, true),
          getOutcomeCounts(r.run_id, true),
        ]);
        setEvalResult(ev);
        setEvalCounts({ decisions: dc, outcomes: oc });
      }
      setLoading(false);
    }
    load();
  }, []);

  const retryPct = evalCounts ? (evalCounts.decisions.RETRY / (evalCounts.decisions.total || 1)) : 0;
  const doNothingPct = evalCounts ? (evalCounts.decisions.DO_NOTHING / (evalCounts.decisions.total || 1)) : 0;
  const escalatePct = evalCounts ? (evalCounts.decisions.ESCALATE / (evalCounts.decisions.total || 1)) : 0;

  return (
    <div className="flex-1">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E4E9F0] px-8 py-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-2">
              Revenue Recovery Decision Engine
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Payment Recovery Command Center
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-500 max-w-lg leading-relaxed">
              Intelligent automated decisions for failed payments — ML recovery scoring, deterministic policy guardrails, and financial impact analysis.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/results"
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-slate-700 border border-[#E4E9F0] bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <BarChart3 size={14} />
              View Results
            </Link>
            <Link
              href="/new-analysis"
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Play size={13} />
              New Analysis
            </Link>
          </div>
        </div>

        {/* Scope Badges & Note */}
        {run && (
          <div className="mt-5 pt-4 border-t border-[#E4E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-[#E4E9F0] rounded-lg text-[12px] text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-700">Full Run / Operational Activity:</span>
                <span>Days 1–30 · {run.total_events_processed.toLocaleString()} events</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[12px] font-semibold text-blue-800">
                <Calendar size={12} className="text-blue-500" />
                <span>Evaluation Window: Days 21–30 · 996 events</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-lg">
              <strong className="text-slate-700">Scope Note:</strong> Financial &amp; model evaluation uses the held-out Evaluation Window (996 events).{' '}
              <Link href="/decisions" className="text-blue-600 font-medium hover:underline">Decisions</Link> and{' '}
              <Link href="/audit" className="text-blue-600 font-medium hover:underline">Audit</Link> represent the complete operational run (3,000 events).
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
          Loading analysis data…
        </div>
      ) : !run ? (
        /* ── No Run State ─────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center h-80 gap-4 text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-semibold">No analysis found</p>
            <p className="text-[13px] text-slate-500 mt-1">
              Run a new analysis to begin recovering failed payment revenue.
            </p>
          </div>
          <Link
            href="/new-analysis"
            className="flex items-center gap-2 mt-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Play size={14} />
            Start New Analysis
          </Link>
        </div>
      ) : (
        <div className="p-8 space-y-7">

          {/* ── Key Recovery Metrics ────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Key Performance Metrics
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                <Calendar size={11} /> Evaluation Window · 996 events
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                label="Revenue at Risk"
                value={evalResult ? formatINR(Number(evalResult.revenue_at_risk)) : '—'}
                sub="996 eval window failed payments"
                accent="red"
                icon={<DollarSign size={16} />}
              />
              <StatCard
                label="Gross Recovered"
                value={evalResult ? formatINR(Number(evalResult.recovered_revenue_gross)) : '—'}
                sub="Revenue recovered via retries"
                accent="green"
                icon={<TrendingUp size={16} />}
              />
              <StatCard
                label="Net Recovery Value"
                value={evalResult ? formatINR(Number(evalResult.net_recovery_value)) : '—'}
                sub="After intervention fees"
                accent="green"
                icon={<CheckCircle size={16} />}
              />
              <StatCard
                label="Recovery Recall"
                value={evalResult ? formatPercent(Number(evalResult.recovery_recall)) : '—'}
                sub="% of recoverable payments captured"
                accent="blue"
                icon={<Target size={16} />}
              />
              <StatCard
                label="Precision"
                value={evalResult ? formatPercent(Number(evalResult.recovery_precision)) : '—'}
                sub="% of retries that recovered"
                accent="slate"
                icon={<Percent size={16} />}
              />
            </div>
          </div>

          {/* ── Recovery Pipeline Flow ────────────────────────────────────── */}
          <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
              End-to-End Recovery Pipeline
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Failed Payment', sub: '996 eval events' },
                null,
                { label: 'ML Recovery Score', sub: 'P(recovery) per event' },
                null,
                { label: 'Policy Guardrails', sub: 'ERV, retry limits, blocklist' },
                null,
                { label: 'Recovery Action', sub: 'RETRY / ESCALATE / DO_NOTHING' },
                null,
                { label: 'Financial Outcome', sub: evalResult ? formatINR(Number(evalResult.net_recovery_value)) + ' net' : '—' },
              ].map((item, i) =>
                item === null ? (
                  <ArrowRight key={i} size={14} className="text-slate-300 shrink-0" />
                ) : (
                  <div key={i} className="flex-1 min-w-[110px] bg-[#F4F6F9] border border-[#E4E9F0] rounded-xl p-3 text-center">
                    <div className="text-[12px] font-semibold text-slate-700">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── Decision Distribution & Strategy Comparison ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Decision Distribution */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Decision Distribution
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">Evaluation Window · 996 events</span>
                </div>
                <Link
                  href="/decisions"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Full Run (3,000) <GitBranch size={12} />
                </Link>
              </div>

              {evalCounts ? (
                <div className="space-y-4">
                  {[
                    {
                      label: 'RETRY',
                      count: evalCounts.decisions.RETRY,
                      pct: retryPct,
                      bar: 'bg-emerald-500',
                      textColor: 'text-emerald-700',
                      icon: <RotateCcw size={12} />,
                    },
                    {
                      label: 'DO NOTHING',
                      count: evalCounts.decisions.DO_NOTHING,
                      pct: doNothingPct,
                      bar: 'bg-slate-300',
                      textColor: 'text-slate-600',
                      icon: <Minus size={12} />,
                    },
                    {
                      label: 'ESCALATE',
                      count: evalCounts.decisions.ESCALATE,
                      pct: escalatePct,
                      bar: 'bg-amber-400',
                      textColor: 'text-amber-700',
                      icon: <AlertCircle size={12} />,
                    },
                  ].map((d) => (
                    <div key={d.label}>
                      <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                        <span className={`flex items-center gap-1.5 ${d.textColor}`}>
                          {d.icon}
                          {d.label}
                        </span>
                        <span className="text-slate-500">
                          {d.count.toLocaleString()} ({(d.pct * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.bar}`}
                          style={{ width: `${d.pct * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <p className="pt-2 text-[11px] text-slate-500 border-t border-[#E4E9F0] mt-3">
                    {evalCounts.decisions.DO_NOTHING} payments blocked — saved ≈ ₹{(evalCounts.decisions.DO_NOTHING * 15).toLocaleString()} in unrecoverable gateway fees.
                  </p>
                </div>
              ) : (
                <p className="text-[12px] text-slate-400">No decision data.</p>
              )}
            </div>

            {/* Strategy Comparison */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Strategy Comparison
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">Evaluation Window · 996 events</span>
                </div>
                <Link
                  href="/results"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Full breakdown <BarChart3 size={12} />
                </Link>
              </div>

              {evalResult ? (
                <div className="space-y-3">
                  {/* Decision Engine — highlighted */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-bold text-slate-800">Decision Engine</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">ML scoring + policy guardrails</div>
                      </div>
                      <span className="text-[17px] font-bold text-blue-700 metric-value">
                        {formatINR(Number(evalResult.net_recovery_value))}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-[#E4E9F0] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-700">Always Retry</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Retry 100% of failures blindly</div>
                    </div>
                    <span className="text-[14px] font-semibold text-slate-600 metric-value">
                      {formatINR(Number(evalResult.baseline_always_retry_net))}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-[#E4E9F0] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-700">Do Nothing</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">No retries executed</div>
                    </div>
                    <span className="text-[14px] font-semibold text-slate-400">₹0.00</span>
                  </div>

                  <p className="pt-2 text-[11px] text-slate-500 border-t border-[#E4E9F0]">
                    Engine captures{' '}
                    <span className="font-semibold text-emerald-700">
                      {formatINR(Number(evalResult.net_recovery_value))}
                    </span>{' '}
                    net value — eliminating fee waste on unrecoverable payments.
                  </p>
                </div>
              ) : (
                <p className="text-[12px] text-slate-400">No evaluation data available.</p>
              )}
            </div>
          </div>

          {/* ── Recovery Outcome Summary ─────────────────────────────────── */}
          {evalCounts && (
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recovery Outcomes — Evaluation Scope
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {evalCounts.outcomes.total.toLocaleString()} Evaluation Window Events (Days 21–30)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Recovered',
                    count: evalCounts.outcomes.RECOVERED,
                    icon: <CheckCircle size={18} className="text-emerald-500" />,
                    sub: 'Payment successfully retried',
                    bg: 'bg-emerald-50 border-emerald-100',
                  },
                  {
                    label: 'Not Recovered',
                    count: evalCounts.outcomes.NOT_RECOVERED,
                    icon: <XCircle size={18} className="text-rose-400" />,
                    sub: 'Retry attempted, not recovered',
                    bg: 'bg-rose-50 border-rose-100',
                  },
                  {
                    label: 'No Action Taken',
                    count: evalCounts.outcomes.NO_ACTION_TAKEN,
                    icon: <Minus size={18} className="text-slate-400" />,
                    sub: 'Guardrails blocked retry',
                    bg: 'bg-slate-50 border-slate-100',
                  },
                  {
                    label: 'Escalated',
                    count: evalCounts.outcomes.ESCALATED_PENDING,
                    icon: <AlertCircle size={18} className="text-amber-500" />,
                    sub: 'Sent for manual review',
                    bg: 'bg-amber-50 border-amber-100',
                  },
                ].map((item) => (
                  <div key={item.label} className={`flex items-start gap-3 p-4 border rounded-xl ${item.bg}`}>
                    <div className="shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-xl font-bold text-slate-900 metric-value">
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-[12px] font-semibold text-slate-700">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
