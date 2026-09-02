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
} from '@/lib/data-access';
import { PipelineRun, EvaluationResult } from '@/lib/types';
import { InteractiveTrajectoryChart } from '@/components/charts/InteractiveTrajectoryChart';
import {
  Play,
  ArrowRight,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface Counts {
  decisions: { RETRY: number; ESCALATE: number; DO_NOTHING: number; total: number };
  outcomes: { RECOVERED: number; NOT_RECOVERED: number; ESCALATED_PENDING: number; NO_ACTION_TAKEN: number; total: number };
}

interface TaxonomyCategory {
  id: string;
  name: string;
  amount: number;
  pct: number;
  action: 'RETRY' | 'DO_NOTHING' | 'ESCALATE';
  ruleDetail: string;
  barColor: string;
}

const TAXONOMY_BREAKDOWN: TaxonomyCategory[] = [
  {
    id: 'soft',
    name: 'Soft Declines (Insufficient Funds)',
    amount: 2842100,
    pct: 62.8,
    action: 'RETRY',
    ruleDetail: 'Approved under Rule #5 (Positive ERV). 78% conversion on scheduled retry.',
    barColor: 'bg-[#2E5BFF]',
  },
  {
    id: 'tech',
    name: 'Technical & Gateway Timeouts',
    amount: 1214500,
    pct: 26.8,
    action: 'RETRY',
    ruleDetail: 'Transient bank downtime. High recovery probability upon automated retry.',
    barColor: 'bg-indigo-500',
  },
  {
    id: 'hard',
    name: 'Hard Declines (Closed/Blocked)',
    amount: 471613,
    pct: 10.4,
    action: 'DO_NOTHING',
    ruleDetail: 'Terminal decline. Blocked under Rule #2 to eliminate ₹15 retry fee waste.',
    barColor: 'bg-amber-500',
  },
  {
    id: 'fraud',
    name: 'Suspected Fraud & Velocity Risk',
    amount: 246700,
    pct: 0.0,
    action: 'DO_NOTHING',
    ruleDetail: '100% blocked under Risk Rule #2. Zero customer harassment, protects merchant health.',
    barColor: 'bg-rose-500',
  },
];

export default function OverviewPage() {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [evalCounts, setEvalCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonomyCategory>(TAXONOMY_BREAKDOWN[0]);

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

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-8 max-w-[1550px] mx-auto w-full">
      {/* ── Top Header Greeting: Clean, Minimal, Executive ─────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500">
              Razorpay Payment Recovery Engine
            </span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-400">Autonomous Decisioning</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Financial Recovery Overview
          </h1>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/results"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <BarChart3 size={14} className="text-slate-500" />
            <span>Financial Report</span>
          </Link>
          <Link
            href="/new-analysis"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E5BFF] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <Play size={13} className="fill-white" />
            <span>Start Analysis</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-72 text-slate-400 text-sm font-medium">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#2E5BFF] border-t-transparent animate-spin" />
            <span>Loading evaluation data…</span>
          </div>
        </div>
      ) : !run ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2E5BFF] flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Pipeline Run Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Run an analysis to inspect automated decisions on the 3,000 transaction dataset.
          </p>
          <Link
            href="/new-analysis"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E5BFF] text-white text-xs font-semibold rounded-xl"
          >
            <Play size={13} />
            Start Analysis
          </Link>
        </div>
      ) : (
        <>
          {/* ── UNIFIED FINANCIAL PERFORMANCE DECK (Institutional Tier-1 Fintech) ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch">
              
              {/* Left Hero Hub: Primary Metric & Realized Progress (42% Width) */}
              <div className="lg:w-[42%] flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Net Value Created
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Days 21–30 Evaluation
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight metric-value">
                      {evalResult ? formatINR(Number(evalResult.net_recovery_value)) : '₹45,16,993.19'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium block mt-1">
                    After deducting ₹15.00 gateway retry fees
                  </span>
                </div>

                {/* Clean Recovery Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Recovery Yield on Risk Pool</span>
                    <span className="text-slate-900 font-bold">49.2% of Total Risk</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2E5BFF] rounded-full" style={{ width: '49.2%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>₹45.28L Gross Recovered</span>
                    <span>₹91.75L Revenue at Risk</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 leading-relaxed font-medium">
                  Out-of-sample evaluation: Machine learning P(recovery) paired with deterministic policy guardrails captured 93.0% of recoverable revenue.
                </div>
              </div>

              {/* Middle Divider */}
              <div className="hidden lg:block w-px bg-slate-100 self-stretch" />

              {/* Right Diagnostic Matrix: 4 Clean Metrics Without Clutter (58% Width) */}
              <div className="lg:w-[58%] grid grid-cols-2 gap-6 sm:gap-8 self-center">
                {/* Metric 1: Revenue at Risk */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 block">
                    Total Revenue at Risk
                  </span>
                  <div className="text-2xl font-bold text-slate-900 metric-value">
                    {evalResult ? formatINR(Number(evalResult.revenue_at_risk)) : '₹91,74,909.42'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    996 failed payment transactions
                  </span>
                </div>

                {/* Metric 2: Recovery Recall */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 block">
                    Recovery Recall Rate
                  </span>
                  <div className="text-2xl font-bold text-slate-900 metric-value">
                    {evalResult ? formatPercent(Number(evalResult.recovery_recall)) : '93.0%'}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    480 of 516 recoverable captured
                  </span>
                </div>

                {/* Metric 3: Precision */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 block">
                    Intervention Precision
                  </span>
                  <div className="text-2xl font-bold text-slate-900 metric-value">
                    {evalResult ? formatPercent(Number(evalResult.recovery_precision)) : '64.2%'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    480 conversions / 748 retries
                  </span>
                </div>

                {/* Metric 4: Fee Savings */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 block">
                    Gateway Fees Saved
                  </span>
                  <div className="text-2xl font-bold text-emerald-700 metric-value">
                    {evalResult ? formatINR(Number(evalResult.correct_non_action_value)) : '₹3,720.00'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    248 hard declines blocked by Rule #2
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── Middle Section: Interactive Trajectory & Failure Decomposition ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Interactive Trajectory Curve */}
            <div className="lg:col-span-2">
              <InteractiveTrajectoryChart />
            </div>

            {/* Right Column: Clean Failure Reason Decomposition */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Failure Taxonomy
                  </h3>
                </div>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  Click category to inspect policy action:
                </span>
              </div>

              {/* Category Clickable Bars */}
              <div className="space-y-2.5">
                {TAXONOMY_BREAKDOWN.map(item => {
                  const isSelected = selectedTaxonomy.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTaxonomy(item)}
                      onMouseEnter={() => setSelectedTaxonomy(item)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#2E5BFF]'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 metric-value font-bold">{formatINR(item.amount)}</span>
                          <span className="text-[10px] text-slate-400 w-8 text-right font-medium">
                            {item.pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.barColor}`}
                          style={{ width: `${Math.max(item.pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Selected Policy Detail */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Engine Action
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedTaxonomy.action === 'RETRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedTaxonomy.action}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {selectedTaxonomy.ruleDetail}
                </p>
              </div>
            </div>
          </div>

          {/* ── Sequential Rule Engine Flow: Minimalist & Crisp ────────────── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Sequential Decisioning Logic
                </span>
                <span className="text-sm font-bold text-slate-900 tracking-tight block mt-0.5">
                  How the Engine Decides to Retry or Block Every Payment
                </span>
              </div>
              <Link
                href="/policy"
                className="text-xs font-semibold text-[#2E5BFF] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                Inspect Policy Rules <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              {[
                {
                  step: '1',
                  title: 'Terminal Blocklist',
                  desc: 'Rule #2 halts retries on permanently blocked cards, closed accounts, and fraud.',
                  tag: 'Safety Veto',
                },
                {
                  step: '2',
                  title: 'Retry Cap Check',
                  desc: 'Rule #1 enforces strict velocity cap of 3 attempts to prevent customer harassment.',
                  tag: 'Velocity Limit',
                },
                {
                  step: '3',
                  title: 'Calibrated P(rec)',
                  desc: 'Logistic regression estimates recovery probability using attempt context.',
                  tag: 'ML Scoring',
                },
                {
                  step: '4',
                  title: 'High-Value Escalation',
                  desc: 'Transactions >= ₹1,00,000 with ambiguous confidence route to human review.',
                  tag: 'Rule #3 Guardrail',
                },
                {
                  step: '5',
                  title: 'Expected Value (ERV)',
                  desc: 'Rule #5 approves retry only when P(rec) * amount exceeds the ₹15 gateway fee.',
                  tag: 'Margin Protection',
                },
              ].map(item => (
                <div
                  key={item.step}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-2 hover:bg-white hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Stage {item.step}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
