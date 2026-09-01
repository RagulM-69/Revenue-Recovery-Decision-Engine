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
        // Fetch evaluation results and evaluation-scoped counts (996 events)
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
      <div className="bg-white border-b border-slate-200 px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">
              Revenue Recovery Decision Engine
            </p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Payment Recovery<br />Command Center
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-lg leading-relaxed">
              Intelligent automated decisions for failed payments — ML recovery scoring, deterministic policy guardrails, and financial impact analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/results"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <BarChart3 size={15} />
              View Results
            </Link>
            <Link
              href="/new-analysis"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Play size={14} />
              New Analysis
            </Link>
          </div>
        </div>

        {/* Run info & Evaluation Scope Badges */}
        {run && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-slate-700">Latest Analysis:</span>
              <span className="font-mono">{run.run_id.substring(0, 18)}…</span>
              <span>·</span>
              <span>{run.total_events_processed.toLocaleString()} total events</span>
              <span>·</span>
              <span>Completed {formatDate(run.completed_at || '')}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-semibold text-sky-800">
              <Calendar size={13} className="text-sky-600" />
              <span>Evaluation Window: Days 21–30 · 996 events</span>
            </div>
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
          <AlertCircle size={32} className="text-slate-300" />
          <div>
            <p className="text-slate-700 font-semibold">No analysis found</p>
            <p className="text-sm text-slate-500 mt-1">
              Run a new analysis to begin recovering failed payment revenue.
            </p>
          </div>
          <Link
            href="/new-analysis"
            className="flex items-center gap-2 mt-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Play size={14} />
            Start New Analysis
          </Link>
        </div>
      ) : (
        <div className="p-8 space-y-8">
          {/* ── Key Recovery Metrics ────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Key Performance Metrics
              </h2>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md">
                Evaluation Window · 996 events
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                label="Revenue at Risk"
                value={evalResult ? formatINR(Number(evalResult.revenue_at_risk)) : '—'}
                sub="996 eval window failed payments"
                accent="red"
              />
              <StatCard
                label="Gross Recovered"
                value={evalResult ? formatINR(Number(evalResult.recovered_revenue_gross)) : '—'}
                sub="Revenue recovered via retries"
                accent="green"
              />
              <StatCard
                label="Net Recovery Value"
                value={evalResult ? formatINR(Number(evalResult.net_recovery_value)) : '—'}
                sub="Gross recovered minus intervention fees"
                accent="green"
              />
              <StatCard
                label="Recovery Recall"
                value={evalResult ? formatPercent(Number(evalResult.recovery_recall)) : '—'}
                sub="% of recoverable payments captured"
                accent="blue"
              />
              <StatCard
                label="Precision"
                value={evalResult ? formatPercent(Number(evalResult.recovery_precision)) : '—'}
                sub="% of retries that actually recovered"
                accent="slate"
              />
            </div>
          </div>

          {/* ── Recovery Pipeline Flow ───────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
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
                  <ArrowRight key={i} size={16} className="text-slate-300 shrink-0" />
                ) : (
                  <div key={i} className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.sub}</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── Decision Distribution & Strategy Comparison ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Decision Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Decision Distribution
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">Evaluation Window · 996 events</span>
                </div>
                <Link
                  href="/decisions"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Full Run (3,000) <GitBranch size={12} />
                </Link>
              </div>

              {evalCounts ? (
                <div className="space-y-3">
                  {[
                    {
                      label: 'RETRY',
                      count: evalCounts.decisions.RETRY,
                      pct: retryPct,
                      color: 'bg-emerald-500',
                      textColor: 'text-emerald-700',
                      icon: <RotateCcw size={13} />,
                    },
                    {
                      label: 'DO NOTHING',
                      count: evalCounts.decisions.DO_NOTHING,
                      pct: doNothingPct,
                      color: 'bg-slate-300',
                      textColor: 'text-slate-600',
                      icon: <Minus size={13} />,
                    },
                    {
                      label: 'ESCALATE',
                      count: evalCounts.decisions.ESCALATE,
                      pct: escalatePct,
                      color: 'bg-amber-400',
                      textColor: 'text-amber-700',
                      icon: <AlertCircle size={13} />,
                    },
                  ].map((d) => (
                    <div key={d.label}>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className={`flex items-center gap-1.5 ${d.textColor}`}>
                          {d.icon}
                          {d.label}
                        </span>
                        <span className="text-slate-500">
                          {d.count.toLocaleString()} ({(d.pct * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.color}`}
                          style={{ width: `${d.pct * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <p className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 mt-3">
                    {evalCounts.decisions.DO_NOTHING} payments blocked — saved ≈ ₹{(evalCounts.decisions.DO_NOTHING * 15).toLocaleString()} in unrecoverable gateway fees.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No decision data.</p>
              )}
            </div>

            {/* Strategy Comparison */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Strategy Comparison
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">Evaluation Window · 996 events</span>
                </div>
                <Link
                  href="/results"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Full breakdown <BarChart3 size={12} />
                </Link>
              </div>

              {evalResult ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg border-l-2 border-l-emerald-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Decision Engine</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Intelligent ML + Policy guardrails
                        </div>
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {formatINR(Number(evalResult.net_recovery_value))}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Always Retry</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Retry 100% of failures blindly</div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {formatINR(Number(evalResult.baseline_always_retry_net))}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Do Nothing</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">No retries executed</div>
                      </div>
                      <span className="text-sm font-semibold text-slate-400">₹0.00</span>
                    </div>
                  </div>

                  <p className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                    Engine captures{' '}
                    <span className="font-semibold text-emerald-700">
                      {formatINR(Number(evalResult.net_recovery_value))}
                    </span>{' '}
                    net value — eliminating fee waste on unrecoverable payments.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No evaluation data available.</p>
              )}
            </div>
          </div>

          {/* ── Recovery Outcome Summary ─────────────────────────────────── */}
          {evalCounts && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Recovery Outcomes — Evaluation Scope
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {evalCounts.outcomes.total.toLocaleString()} Evaluation Window Events (Days 21–30)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Recovered',
                    count: evalCounts.outcomes.RECOVERED,
                    icon: <CheckCircle size={16} className="text-emerald-500" />,
                    sub: 'Payment successfully retried',
                  },
                  {
                    label: 'Not Recovered',
                    count: evalCounts.outcomes.NOT_RECOVERED,
                    icon: <XCircle size={16} className="text-rose-500" />,
                    sub: 'Retry attempted, not recovered',
                  },
                  {
                    label: 'No Action Taken',
                    count: evalCounts.outcomes.NO_ACTION_TAKEN,
                    icon: <Minus size={16} className="text-slate-400" />,
                    sub: 'Guardrails blocked retry',
                  },
                  {
                    label: 'Escalated',
                    count: evalCounts.outcomes.ESCALATED_PENDING,
                    icon: <AlertCircle size={16} className="text-amber-500" />,
                    sub: 'Sent for manual review',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="shrink-0">{item.icon}</div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">{item.label}</div>
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
