'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getEvaluationResults,
  getRecoveryOutcomes,
  getOutcomeCounts,
  formatINR,
  formatPercent,
} from '@/lib/data-access';
import { EvaluationResult, RecoveryOutcome } from '@/lib/types';
import { InlineStat } from '@/components/ui/StatCard';
import { CheckCircle, XCircle, Minus, AlertCircle, RefreshCw } from 'lucide-react';

export default function ResultsPage() {
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [outcomes, setOutcomes] = useState<RecoveryOutcome[]>([]);
  const [outcomeCounts, setOutcomeCounts] = useState({ RECOVERED: 0, NOT_RECOVERED: 0, ESCALATED_PENDING: 0, NO_ACTION_TAKEN: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const [ev, oc, occ] = await Promise.all([
        getEvaluationResults(run.run_id),
        getRecoveryOutcomes(run.run_id, 200),
        import('@/lib/data-access').then(m => m.getOutcomeCounts(run.run_id)),
      ]);
      setEvalResult(ev);
      setOutcomes(oc);
      setOutcomeCounts(occ);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex-1">
      <PageHeader
        title="Results & Business Impact"
        subtitle="Financial impact of the recovery engine vs baseline strategies. All metrics from the latest completed analysis."
        actions={
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        }
      />

      <div className="p-8 space-y-8">
        {loading ? (
          <p className="text-sm text-slate-400">Loading results…</p>
        ) : !evalResult ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
            <p className="text-slate-500">No evaluation results found. Run an analysis first.</p>
          </div>
        ) : (
          <>
            {/* ── Financial Impact Metrics ────────────────────────────── */}
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Financial Impact
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Revenue at Risk"
                  value={formatINR(Number(evalResult.revenue_at_risk))}
                  sub={`${evalResult.total_failed_events} failed events in eval window`}
                  accent="red"
                />
                <StatCard
                  label="Gross Recovered"
                  value={formatINR(Number(evalResult.recovered_revenue_gross))}
                  sub="Revenue recovered via automated retries"
                  accent="green"
                />
                <StatCard
                  label="Net Recovery Value"
                  value={formatINR(Number(evalResult.net_recovery_value))}
                  sub={`After ₹${Number(evalResult.intervention_cost_total).toFixed(0)} in intervention costs`}
                  accent="green"
                />
                <StatCard
                  label="Recovery Recall"
                  value={formatPercent(Number(evalResult.recovery_recall))}
                  sub="% of recoverable events captured"
                  accent="blue"
                />
                <StatCard
                  label="Precision"
                  value={formatPercent(Number(evalResult.recovery_precision))}
                  sub="% of retries that actually recovered"
                  accent="slate"
                />
                <StatCard
                  label="Fee Savings (DO_NOTHING)"
                  value={formatINR(Number(evalResult.correct_non_action_value))}
                  sub="Avoided gateway fees on hard declines"
                  accent="amber"
                />
              </div>
            </div>

            {/* ── Strategy Comparison ─────────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                Strategy Comparison — Net Recovery Value
              </h2>

              <div className="space-y-4">
                {/* Decision Engine */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Decision Engine</div>
                      <div className="text-xs text-slate-500">ML scoring + deterministic policy guardrails</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">
                        {formatINR(Number(evalResult.net_recovery_value))}
                      </div>
                      <div className="text-[11px] text-slate-500">Net Recovery Value</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-slate-100 text-center px-0 py-0">
                    <div className="py-3 px-2">
                      <div className="text-xs font-bold text-slate-700">{formatPercent(Number(evalResult.recovery_recall))}</div>
                      <div className="text-[10px] text-slate-500">Recall</div>
                    </div>
                    <div className="py-3 px-2">
                      <div className="text-xs font-bold text-slate-700">{formatPercent(Number(evalResult.recovery_precision))}</div>
                      <div className="text-[10px] text-slate-500">Precision</div>
                    </div>
                    <div className="py-3 px-2">
                      <div className="text-xs font-bold text-slate-700">{formatINR(Number(evalResult.intervention_cost_total))}</div>
                      <div className="text-[10px] text-slate-500">Intervention Cost</div>
                    </div>
                  </div>
                </div>

                {/* Always Retry */}
                <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Always Retry Baseline</div>
                    <div className="text-xs text-slate-500">Retry 100% of all failed payments blindly — no ML, no guardrails</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-700">
                      {formatINR(Number(evalResult.baseline_always_retry_net))}
                    </div>
                    <div className="text-[11px] text-slate-500">Net Recovery Value</div>
                  </div>
                </div>

                {/* Always Do Nothing */}
                <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Do Nothing Baseline</div>
                    <div className="text-xs text-slate-500">No retries executed — pure revenue loss</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-400">₹0.00</div>
                    <div className="text-[11px] text-slate-500">Net Recovery Value</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span className="font-semibold">Economic Takeaway:</span> The Decision Engine recovers{' '}
                <span className="font-semibold">{formatINR(Number(evalResult.net_recovery_value))}</span> vs
                the{' '}
                <span className="font-semibold">{formatINR(Number(evalResult.baseline_always_retry_net))}</span>{' '}
                Always Retry baseline — while eliminating{' '}
                <span className="font-semibold">{formatINR(Number(evalResult.correct_non_action_value))}</span>{' '}
                in unnecessary gateway fees on unrecoverable payments.
              </div>
            </div>

            {/* ── Outcome Distribution ────────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                Recovery Outcome Distribution
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                {[
                  { key: 'RECOVERED', icon: <CheckCircle size={18} className="text-emerald-500" />, label: 'Recovered' },
                  { key: 'NOT_RECOVERED', icon: <XCircle size={18} className="text-rose-400" />, label: 'Not Recovered' },
                  { key: 'NO_ACTION_TAKEN', icon: <Minus size={18} className="text-slate-400" />, label: 'No Action Taken' },
                  { key: 'ESCALATED_PENDING', icon: <AlertCircle size={18} className="text-amber-500" />, label: 'Escalated' },
                ].map(item => {
                  const count = (outcomeCounts as any)[item.key] || 0;
                  const pct = outcomeCounts.total ? (count / outcomeCounts.total * 100).toFixed(1) : '0.0';
                  return (
                    <div key={item.key} className="border border-slate-100 rounded-lg p-4 bg-slate-50 flex flex-col gap-2">
                      {item.icon}
                      <div className="text-lg font-bold text-slate-900">{count.toLocaleString()}</div>
                      <div className="text-[11px] font-semibold text-slate-600">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{pct}% of total</div>
                    </div>
                  );
                })}
              </div>

              {/* Sample outcomes table */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Outcome ID', 'Outcome Type', 'Recovered Amount', 'Net Value Impact'].map(h => (
                        <th key={h} className="py-2.5 px-4 font-bold text-[10px] text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {outcomes.slice(0, 50).map(o => (
                      <tr key={o.outcome_id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {o.outcome_id.substring(0, 12)}…
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge value={o.outcome_type} />
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {formatINR(Number(o.recovered_amount))}
                        </td>
                        <td className={`py-2.5 px-4 font-semibold ${Number(o.net_value_impact) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatINR(Number(o.net_value_impact))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {outcomes.length > 50 && (
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
                    Showing 50 of {outcomes.length.toLocaleString()} outcomes
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
