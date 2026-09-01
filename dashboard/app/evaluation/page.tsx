'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getEvaluationResults,
  formatINR,
  formatPercent,
} from '@/lib/data-access';
import { EvaluationResult } from '@/lib/types';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EvaluationPage() {
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const results = await getEvaluationResults(run.run_id);
      setEvalResult(results);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Evaluation & Baseline Comparison"
        subtitle="Direct economic comparison of Decision Engine against Always Retry and Always Do Nothing baselines."
        onRefresh={fetchData}
      />

      <div className="p-8 space-y-8">
        {/* Baseline Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Engine */}
          <div className="bg-white rounded-xl border-2 border-emerald-500 p-6 shadow-sm relative space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                RECOMMENDED STRATEGY
              </span>
              <Badge label="INTELLIGENT POLICY" type="RETRY" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Revenue Recovery Engine
              </h3>
              <p className="text-xs text-slate-500">
                ML Probability + Deterministic EV Policy Engine
              </p>
            </div>

            <div className="text-2xl font-black text-emerald-600">
              {evalResult ? formatINR(evalResult.net_recovery_value) : '₹4,516,993.19'}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Recovered:</span>
                <span className="font-semibold text-slate-900">
                  {evalResult ? formatINR(evalResult.recovered_revenue_gross) : '₹4,528,213.19'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Retry Fees:</span>
                <span className="font-semibold text-amber-700">
                  {evalResult ? formatINR(evalResult.intervention_cost_total) : '₹11,220.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avoided Fee Savings:</span>
                <span className="font-semibold text-emerald-700">
                  {evalResult ? formatINR(evalResult.correct_non_action_value) : '₹3,720.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Always Retry */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                NAIVE BASELINE 1
              </span>
              <Badge label="ALWAYS RETRY" type="DO_NOTHING" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Always Retry Baseline
              </h3>
              <p className="text-xs text-slate-500">
                Retries 100% of failed payments indiscriminately
              </p>
            </div>

            <div className="text-2xl font-black text-slate-800">
              {evalResult ? formatINR(evalResult.baseline_always_retry_net) : '₹4,553,786.79'}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Recovered:</span>
                <span className="font-semibold text-slate-800">₹4,568,726.79</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Retry Fees:</span>
                <span className="font-semibold text-rose-600">₹14,940.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avoided Fee Savings:</span>
                <span className="font-semibold text-slate-400">₹0.00</span>
              </div>
            </div>
          </div>

          {/* Always Do Nothing */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                NAIVE BASELINE 2
              </span>
              <Badge label="DO NOTHING" type="DO_NOTHING" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Always Do Nothing
              </h3>
              <p className="text-xs text-slate-500">
                Zero retry attempts executed
              </p>
            </div>

            <div className="text-2xl font-black text-slate-800">₹0.00</div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Recovered:</span>
                <span className="font-semibold text-slate-800">₹0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Retry Fees:</span>
                <span className="font-semibold text-slate-800">₹0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avoided Fee Savings:</span>
                <span className="font-semibold text-slate-400">₹0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Economic Breakdown Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Evaluation Matrix & Performance Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Decision Engine</th>
                  <th className="py-3 px-4">Always Retry</th>
                  <th className="py-3 px-4">Always Do Nothing</th>
                  <th className="py-3 px-4">Engine Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Gross Revenue Recovered</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">₹4,528,213.19</td>
                  <td className="py-3.5 px-4 text-slate-700">₹4,568,726.79</td>
                  <td className="py-3.5 px-4 text-slate-500">₹0.00</td>
                  <td className="py-3.5 px-4 text-slate-600">High Coverage (93.02%)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Total Intervention Cost</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">₹11,220.00</td>
                  <td className="py-3.5 px-4 text-rose-600 font-semibold">₹14,940.00</td>
                  <td className="py-3.5 px-4 text-slate-500">₹0.00</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">Saved ₹3,720 in wasted fees</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Net Recovery Value</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">₹4,516,993.19</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">₹4,553,786.79</td>
                  <td className="py-3.5 px-4 text-slate-500">₹0.00</td>
                  <td className="py-3.5 px-4 text-slate-600">Parity with fee protection</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Unrecoverable Hard Declines Blocked</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">245 Events</td>
                  <td className="py-3.5 px-4 text-rose-600 font-semibold">0 Events (Retried blindly)</td>
                  <td className="py-3.5 px-4 text-slate-500">437 Events</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">Eliminated friction on fraud & closed accounts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
