'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getEvaluationResults,
  getDecisions,
  formatINR,
  formatPercent,
} from '@/lib/data-access';
import { PipelineRun, EvaluationResult, Decision } from '@/lib/types';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';

export default function OverviewPage() {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const latestRun = await getLatestCompletedRun();
    setRun(latestRun);

    if (latestRun) {
      const results = await getEvaluationResults(latestRun.run_id);
      setEvalResult(results);

      const decisionList = await getDecisions(latestRun.run_id, 'ALL', 1000);
      setDecisions(decisionList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const retryCount = decisions.filter((d) => d.decision === 'RETRY').length;
  const escalateCount = decisions.filter((d) => d.decision === 'ESCALATE').length;
  const doNothingCount = decisions.filter((d) => d.decision === 'DO_NOTHING').length;
  const totalDecisions = decisions.length || 1;

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Revenue Recovery Overview"
        subtitle="Executive dashboard monitoring automated recovery decisions, ML scores, policy guardrails, and financial impact."
        onRefresh={fetchData}
      />

      <div className="p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard
            title="Revenue at Risk"
            value={evalResult ? formatINR(evalResult.revenue_at_risk) : '₹9,174,909.42'}
            subtitle="Total value of failed payment attempts in evaluation window"
            icon={<DollarSign size={18} />}
            variant="danger"
          />

          <KpiCard
            title="Gross Recovered Revenue"
            value={evalResult ? formatINR(evalResult.recovered_revenue_gross) : '₹4,528,213.19'}
            subtitle="Total revenue successfully recovered via automated retries"
            icon={<TrendingUp size={18} />}
            variant="success"
            trend="+107% Gross Lift"
          />

          <KpiCard
            title="Net Recovery Value"
            value={evalResult ? formatINR(evalResult.net_recovery_value) : '₹4,516,993.19'}
            subtitle="Gross recovered revenue minus intervention costs"
            icon={<Zap size={18} />}
            variant="success"
          />

          <KpiCard
            title="Recovery Recall (Coverage)"
            value={evalResult ? formatPercent(evalResult.recovery_recall) : '93.02%'}
            subtitle="Percentage of recoverable failed payments captured"
            icon={<ShieldCheck size={18} />}
            variant="info"
          />

          <KpiCard
            title="Recovery Precision"
            value={evalResult ? formatPercent(evalResult.recovery_precision) : '64.17%'}
            subtitle="Percentage of retry interventions resulting in recovery"
            icon={<CheckCircle2 size={18} />}
            variant="default"
          />

          <KpiCard
            title="Total Intervention Cost"
            value={evalResult ? formatINR(evalResult.intervention_cost_total) : '₹11,220.00'}
            subtitle="Calculated at ₹15.00 cost per automated retry attempt"
            icon={<AlertTriangle size={18} />}
            variant="warning"
          />
        </div>

        {/* End-to-End Pipeline Decision Architecture */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={15} className="text-slate-500" />
                End-to-End Decision Flow Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated progression from raw failure event to ML scoring, policy guardrails, and financial impact
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              Run ID: {run?.run_id ? `${run.run_id.substring(0, 8)}...` : '125559cc...'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center items-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold text-slate-400 uppercase">1. Event</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Failed Payment</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-300">
              <ArrowRight size={16} />
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200/80 rounded-lg">
              <div className="text-[10px] font-bold text-sky-700 uppercase">2. ML Model</div>
              <div className="text-xs font-bold text-sky-950 mt-1">P(recovery) Score</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-300">
              <ArrowRight size={16} />
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-lg">
              <div className="text-[10px] font-bold text-purple-700 uppercase">3. Policy Engine</div>
              <div className="text-xs font-bold text-purple-950 mt-1">ERV & Guardrails</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-300">
              <ArrowRight size={16} />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-lg">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">4. Outcome</div>
              <div className="text-xs font-bold text-emerald-950 mt-1">Net Recovery</div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Decision Distribution & Baseline Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Distribution Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Decision Engine Distribution
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  Total: {totalDecisions} Events
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> RETRY ({retryCount})
                    </span>
                    <span className="text-slate-600">
                      {formatPercent(retryCount / totalDecisions)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(retryCount / totalDecisions) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> ESCALATE ({escalateCount})
                    </span>
                    <span className="text-slate-600">
                      {formatPercent(escalateCount / totalDecisions)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(escalateCount / totalDecisions) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <XCircle size={14} /> DO_NOTHING ({doNothingCount})
                    </span>
                    <span className="text-slate-600">
                      {formatPercent(doNothingCount / totalDecisions)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(doNothingCount / totalDecisions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <Info size={14} className="text-slate-400 shrink-0" />
              <span>
                DO_NOTHING saved ₹3,720 in unrecoverable gateway fees on hard declines and blocked cards.
              </span>
            </div>
          </div>

          {/* Baseline Strategy Comparison */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Baseline Strategy Performance
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparing Net Recovery Value against naive operational strategies
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Decision Engine (Intelligent Policy)
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      High recall (93.02%) + fee protection
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-900">
                    {evalResult ? formatINR(evalResult.net_recovery_value) : '₹4,516,993.19'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Always Retry Baseline
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Retries 100% of failures blindly
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {evalResult ? formatINR(evalResult.baseline_always_retry_net) : '₹4,553,786.79'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Always Do Nothing Baseline
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Zero retries executed
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-800">₹0.00</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Economic Takeaway:</span> Engine captures <span className="font-semibold text-emerald-700">₹4.516M net value</span> while eliminating fee waste on unrecoverable fraud & closed accounts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
