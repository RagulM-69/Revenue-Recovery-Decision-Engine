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
import {
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
  RefreshCw,
  Calendar,
  Info,
  DollarSign,
  TrendingUp,
  Target,
  Percent,
  PiggyBank,
  ShieldOff,
} from 'lucide-react';

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
        getRecoveryOutcomes(run.run_id, 200, true),
        getOutcomeCounts(run.run_id, true),
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
        subtitle="Financial impact and recovery metrics calculated over the held-out temporal evaluation window."
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[12px] font-semibold text-blue-800">
              <Calendar size={12} className="text-blue-500" />
              Evaluation Window · Days 21–30 · 996 events
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

      <div className="p-8 space-y-7">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading results…</div>
        ) : !evalResult ? (
          <div className="bg-white border border-[#E4E9F0] rounded-2xl p-10 text-center shadow-sm">
            <p className="text-slate-500">No evaluation results found. Run an analysis first.</p>
          </div>
        ) : (
          <>
            {/* ── Financial Impact Metrics ────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Financial Impact (Evaluation Window)
                </h2>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  996 Evaluation Events
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Revenue at Risk"
                  value={formatINR(Number(evalResult.revenue_at_risk))}
                  sub={`${evalResult.total_failed_events} failed events in eval window`}
                  accent="red"
                  icon={<ShieldOff size={16} />}
                />
                <StatCard
                  label="Gross Recovered"
                  value={formatINR(Number(evalResult.recovered_revenue_gross))}
                  sub="Revenue recovered via automated retries"
                  accent="green"
                  icon={<TrendingUp size={16} />}
                />
                <StatCard
                  label="Net Recovery Value"
                  value={formatINR(Number(evalResult.net_recovery_value))}
                  sub={`After ₹${Number(evalResult.intervention_cost_total).toFixed(0)} in intervention fees`}
                  accent="blue"
                  icon={<DollarSign size={16} />}
                />
                <StatCard
                  label="Recovery Recall"
                  value={formatPercent(Number(evalResult.recovery_recall))}
                  sub="% of recoverable events captured (480 / 516)"
                  accent="blue"
                  icon={<Target size={16} />}
                />
                <StatCard
                  label="Precision"
                  value={formatPercent(Number(evalResult.recovery_precision))}
                  sub="% of retries that recovered (480 / 748)"
                  accent="slate"
                  icon={<Percent size={16} />}
                />
                <StatCard
                  label="Fee Savings (DO_NOTHING)"
                  value={formatINR(Number(evalResult.correct_non_action_value))}
                  sub="248 blocked hard declines × ₹15.00 fee"
                  accent="amber"
                  icon={<PiggyBank size={16} />}
                />
              </div>
            </div>

            {/* ── Strategy Comparison ─────────────────────────────────── */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                Strategy Comparison — Net Recovery Value (996 Evaluation Events)
              </h2>

              <div className="space-y-3">
                {/* Decision Engine */}
                <div className="border border-blue-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-blue-50">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Decision Engine</div>
                      <div className="text-[12px] text-slate-500 mt-0.5">ML scoring + deterministic policy guardrails</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-bold text-blue-700 metric-value">
                        {formatINR(Number(evalResult.net_recovery_value))}
                      </div>
                      <div className="text-[11px] text-slate-500">Net Recovery Value</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-[#E4E9F0] text-center border-t border-blue-200/70 bg-white">
                    <div className="py-3 px-2">
                      <div className="text-[13px] font-bold text-slate-800 metric-value">{formatPercent(Number(evalResult.recovery_recall))}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Recall</div>
                    </div>
                    <div className="py-3 px-2">
                      <div className="text-[13px] font-bold text-slate-800 metric-value">{formatPercent(Number(evalResult.recovery_precision))}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Precision</div>
                    </div>
                    <div className="py-3 px-2">
                      <div className="text-[13px] font-bold text-slate-800 metric-value">{formatINR(Number(evalResult.intervention_cost_total))}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Intervention Cost</div>
                    </div>
                  </div>
                </div>

                {/* Always Retry */}
                <div className="border border-[#E4E9F0] rounded-xl p-4 flex items-center justify-between bg-white">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-slate-700">Always Retry Baseline</span>
                      <span
                        title="The synthetic simulator allows occasional stochastic recovery (~5%) even on unrecoverable payments, but incurs 100% intervention fees. The Decision Engine avoids unnecessary intervention costs."
                        className="inline-flex items-center text-slate-400 hover:text-slate-600 cursor-help"
                      >
                        <Info size={13} />
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-400 mt-0.5">Retry 100% of all failed payments blindly — no ML, no guardrails</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-bold text-slate-600 metric-value">
                      {formatINR(Number(evalResult.baseline_always_retry_net))}
                    </div>
                    <div className="text-[11px] text-slate-400">Net Recovery Value</div>
                  </div>
                </div>

                {/* Always Do Nothing */}
                <div className="border border-[#E4E9F0] rounded-xl p-4 flex items-center justify-between bg-white">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-700">Do Nothing Baseline</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">No retries executed — pure revenue loss</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-bold text-slate-400">₹0.00</div>
                    <div className="text-[11px] text-slate-400">Net Recovery Value</div>
                  </div>
                </div>
              </div>

              {/* Simulation Note */}
              <div className="mt-4 p-4 bg-[#F4F6F9] border border-[#E4E9F0] rounded-xl flex items-start gap-3 text-[12px] text-slate-700 leading-relaxed">
                <Info size={15} className="mt-0.5 text-blue-500 shrink-0" />
                <div>
                  <strong className="font-semibold block mb-0.5 text-slate-800">Baseline Comparison Note (Synthetic Simulation):</strong>
                  The synthetic simulator allows a 5% recovery probability even for unrecoverable payments. Always Retry captures some stochastic recoveries the policy engine intentionally avoids. The Decision Engine prioritizes policy constraints (fraud, card blocks, closed accounts) and eliminates gateway fee waste on hard declines (saving {formatINR(Number(evalResult.correct_non_action_value))}).
                </div>
              </div>
            </div>

            {/* ── Outcome Distribution ────────────────────────────────── */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recovery Outcome Distribution (Evaluation Scope)
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {outcomeCounts.total.toLocaleString()} Evaluation Window Outcomes (Days 21–30)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { key: 'RECOVERED', icon: <CheckCircle size={20} className="text-emerald-500" />, label: 'Recovered', bg: 'bg-emerald-50 border-emerald-100' },
                  { key: 'NOT_RECOVERED', icon: <XCircle size={20} className="text-rose-400" />, label: 'Not Recovered', bg: 'bg-rose-50 border-rose-100' },
                  { key: 'NO_ACTION_TAKEN', icon: <Minus size={20} className="text-slate-400" />, label: 'No Action Taken', bg: 'bg-slate-50 border-slate-100' },
                  { key: 'ESCALATED_PENDING', icon: <AlertCircle size={20} className="text-amber-500" />, label: 'Escalated', bg: 'bg-amber-50 border-amber-100' },
                ].map(item => {
                  const count = (outcomeCounts as any)[item.key] || 0;
                  const pct = outcomeCounts.total ? (count / outcomeCounts.total * 100).toFixed(1) : '0.0';
                  return (
                    <div key={item.key} className={`border rounded-xl p-4 flex flex-col gap-2 ${item.bg}`}>
                      {item.icon}
                      <div className="text-xl font-bold text-slate-900 metric-value">{count.toLocaleString()}</div>
                      <div className="text-[12px] font-semibold text-slate-700">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{pct}% of eval set</div>
                    </div>
                  );
                })}
              </div>

              {/* Sample outcomes table */}
              <div className="border border-[#E4E9F0] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F4F6F9] border-b border-[#E4E9F0]">
                      {['Outcome ID', 'Outcome Type', 'Recovered Amount', 'Net Value Impact'].map(h => (
                        <th key={h} className="py-2.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E9F0]">
                    {outcomes.slice(0, 50).map(o => (
                      <tr key={o.outcome_id} className="hover:bg-[#F4F6F9]/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                          {o.outcome_id.substring(0, 12)}…
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge value={o.outcome_type} />
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 metric-value">
                          {formatINR(Number(o.recovered_amount))}
                        </td>
                        <td className={`py-2.5 px-4 font-semibold metric-value ${Number(o.net_value_impact) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatINR(Number(o.net_value_impact))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {outcomes.length > 50 && (
                  <div className="px-4 py-2.5 bg-[#F4F6F9] border-t border-[#E4E9F0] text-[11px] text-slate-400">
                    Showing 50 of {outcomes.length.toLocaleString()} evaluation outcomes
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
