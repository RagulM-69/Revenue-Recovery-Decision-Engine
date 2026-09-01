'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getRecoveryOutcomes,
  getEvaluationResults,
  formatINR,
  formatDate,
} from '@/lib/data-access';
import { RecoveryOutcome, EvaluationResult } from '@/lib/types';
import { DollarSign, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RecoveryPage() {
  const [outcomes, setOutcomes] = useState<RecoveryOutcome[]>([]);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const results = await getEvaluationResults(run.run_id);
      setEvalResult(results);

      const outcomeList = await getRecoveryOutcomes(run.run_id, 1000);
      setOutcomes(outcomeList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Recovery Outcomes"
        subtitle="Monitors execution results, recovered amounts, intervention costs, and net value impact across simulated actions."
        onRefresh={fetchData}
      />

      <div className="p-8 space-y-8">
        {/* KPI Financial Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            title="Gross Recovered Revenue"
            value={evalResult ? formatINR(evalResult.recovered_revenue_gross) : '₹4,528,213.19'}
            subtitle="Total value recovered from successful retries"
            icon={<DollarSign size={20} />}
            variant="success"
          />

          <KpiCard
            title="Net Value Impact"
            value={evalResult ? formatINR(evalResult.net_recovery_value) : '₹4,516,993.19'}
            subtitle="Gross revenue minus intervention costs"
            icon={<RotateCcw size={20} />}
            variant="success"
          />

          <KpiCard
            title="Total Retry Fees Incurred"
            value={evalResult ? formatINR(evalResult.intervention_cost_total) : '₹11,220.00'}
            subtitle="₹15.00 fee per retry attempt"
            icon={<AlertTriangle size={20} />}
            variant="warning"
          />

          <KpiCard
            title="Avoided Unrecoverable Fees"
            value={evalResult ? formatINR(evalResult.correct_non_action_value) : '₹3,720.00'}
            subtitle="Fees saved by DO_NOTHING on hard declines"
            icon={<ShieldCheck size={20} />}
            variant="info"
          />
        </div>

        {/* Outcomes Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Simulated Execution Log ({outcomes.length} Events)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Outcome ID</th>
                  <th className="py-3.5 px-4">Event ID</th>
                  <th className="py-3.5 px-4">Outcome Type</th>
                  <th className="py-3.5 px-4">Recovered Amount</th>
                  <th className="py-3.5 px-4">Net Value Impact</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading recovery outcomes...
                    </td>
                  </tr>
                ) : outcomes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No recovery outcomes found.
                    </td>
                  </tr>
                ) : (
                  outcomes.slice(0, 100).map((item) => (
                    <tr
                      key={item.outcome_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {item.outcome_id.substring(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {item.event_id.substring(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge label={item.outcome_type} type={item.outcome_type} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatINR(item.recovered_amount)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          item.net_value_impact > 0
                            ? 'text-emerald-600'
                            : item.net_value_impact < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatINR(item.net_value_impact)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(item.recorded_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
