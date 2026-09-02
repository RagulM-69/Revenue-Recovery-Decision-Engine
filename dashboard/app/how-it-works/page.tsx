'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatINR, formatPercent } from '@/lib/data-access';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowDown,
  Play,
  RotateCcw,
  Scale,
  Zap,
  HelpCircle,
  Check,
  Sliders,
  Flame,
  ArrowUpRight,
  Info,
  BookOpen,
  Layers,
  Activity,
} from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  tag: string;
  amount: number;
  method: string;
  reason: string;
  attempt: number;
  p_recovery: number;
  erv: number;
  decision: 'RETRY' | 'DO_NOTHING' | 'ESCALATE';
  failedStage: number | null;
  stageDetails: {
    stage1: { pass: boolean; note: string };
    stage2: { pass: boolean; note: string };
    stage3: { pass: boolean; note: string };
    stage4: { pass: boolean; note: string; triggered?: boolean };
    stage5: { pass: boolean; note: string };
  };
  outcomeSummary: string;
}

const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'recoverable_soft',
    name: 'Recoverable Soft Decline',
    tag: 'Normal Retry',
    amount: 1450.00,
    method: 'UPI',
    reason: 'insufficient_funds',
    attempt: 1,
    p_recovery: 0.78,
    erv: 1116.00,
    decision: 'RETRY',
    failedStage: null,
    stageDetails: {
      stage1: { pass: true, note: 'insufficient_funds is a soft decline. NOT on terminal blocklist.' },
      stage2: { pass: true, note: 'Attempt #1 is well within velocity cap (max 3).' },
      stage3: { pass: true, note: 'Model predicts high P(recovery) = 78.0% for UPI soft decline.' },
      stage4: { pass: true, note: 'Amount ₹1,450 is under ₹1,00,000 threshold. Automated processing.' },
      stage5: { pass: true, note: 'ERV = (0.78 × ₹1,450) − ₹15 = +₹1,116.00 > ₹0.00.' },
    },
    outcomeSummary: 'Payment retried automatically. ₹1,450 recovered on 1st attempt. Net created: +₹1,435.00.',
  },
  {
    id: 'terminal_block',
    name: 'Terminal Card Decline',
    tag: 'Safety Veto',
    amount: 3200.00,
    method: 'CARD',
    reason: 'card_permanently_blocked',
    attempt: 1,
    p_recovery: 0.02,
    erv: 0.00,
    decision: 'DO_NOTHING',
    failedStage: 1,
    stageDetails: {
      stage1: { pass: false, note: 'card_permanently_blocked is on Terminal Blocklist! VETOED IMMEDIATELY.' },
      stage2: { pass: false, note: 'Skipped. Execution halted at Stage 1.' },
      stage3: { pass: false, note: 'Latent probability is near-zero (0.02).' },
      stage4: { pass: false, note: 'Skipped.' },
      stage5: { pass: false, note: 'Skipped. ₹15 gateway fee saved from fee waste.' },
    },
    outcomeSummary: 'Rule #2 halts retry unconditionally. Zero customer annoyance, saved ₹15 fee waste.',
  },
  {
    id: 'velocity_limit',
    name: 'Velocity Limit Exceeded',
    tag: 'Rate Limit',
    amount: 890.00,
    method: 'CARD',
    reason: 'temporary_bank_decline',
    attempt: 4,
    p_recovery: 0.62,
    erv: 536.80,
    decision: 'DO_NOTHING',
    failedStage: 2,
    stageDetails: {
      stage1: { pass: true, note: 'temporary_bank_decline is allowed.' },
      stage2: { pass: false, note: 'Attempt #4 exceeds strict velocity ceiling of 3 attempts!' },
      stage3: { pass: false, note: 'Model scoring bypassed due to velocity cap.' },
      stage4: { pass: false, note: 'Skipped.' },
      stage5: { pass: false, note: 'Halted to protect merchant reputation and card network rules.' },
    },
    outcomeSummary: 'Rule #1 blocks attempt #4 to comply with card network rules and avoid endless retry loops.',
  },
  {
    id: 'high_value_escalate',
    name: 'High-Value Payment (₹1.25L)',
    tag: 'Human Review',
    amount: 125000.00,
    method: 'NET_BANKING',
    reason: 'limit_exceeded',
    attempt: 1,
    p_recovery: 0.58,
    erv: 72485.00,
    decision: 'ESCALATE',
    failedStage: 4,
    stageDetails: {
      stage1: { pass: true, note: 'limit_exceeded is a temporary limit decline.' },
      stage2: { pass: true, note: 'Attempt #1 is within velocity limits.' },
      stage3: { pass: true, note: 'Model predicts moderate P(recovery) = 58.0%.' },
      stage4: { pass: false, triggered: true, note: 'Amount ≥ ₹1,00,000 AND confidence < 85%. Triggers manual review!' },
      stage5: { pass: true, note: 'Routed to dedicated enterprise operations queue.' },
    },
    outcomeSummary: 'Rule #3 routes to operations team. Avoids accidental massive bank debit without human signoff.',
  },
];

export default function HowItWorksPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(PRESET_SCENARIOS[0]);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Live ERV Calculator Sandbox
  const [calcAmount, setCalcAmount] = useState<number>(3500);
  const [calcProb, setCalcProb] = useState<number>(75);

  const calcERV = Math.round(((calcProb / 100) * calcAmount - 15.00) * 100) / 100;
  const calcDecision = calcERV > 0 ? 'RETRY' : 'DO_NOTHING';

  // Live Simulation Stepper
  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    for (let i = 1; i <= 5; i++) {
      setActiveStage(i);
      await new Promise(r => setTimeout(r, 650));
    }
    setIsSimulating(false);
  };

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-12 max-w-[1550px] mx-auto w-full">
      {/* ── TOP SECTION: HERO & OVERVIEW ──────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xs relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
              Decision Engine Architecture
            </span>
            <span className="text-xs text-slate-400 font-medium">· System Guide</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How the Engine Decides What to Do With a Failed Payment
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Every failed payment passes through a sequence of safety checks, machine-learning scoring, and financial rules before the engine decides whether to retry it, leave it alone, or send it for review.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-bold">Failed Payment</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">1. Blocklist Veto</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">2. Velocity Cap</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[#2E5BFF]">3. ML Scoring</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-lg text-violet-700">4. High Value</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">5. ERV Math</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold">Action</span>
          </div>
        </div>
      </div>

      {/* ── [TOP CONTENT] INTERACTIVE DECISION STUDIO (LIVE SIMULATOR) ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5BFF]">
                Interactive Decision Studio
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Live Simulator
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Test Real-World Payment Scenarios
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select any scenario below to see how each stage of the engine executes dynamically.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-[#2E5BFF] hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Play size={13} className={isSimulating ? 'animate-spin' : 'fill-white'} />
            <span>{isSimulating ? 'Simulating Pipeline…' : 'Animate Pipeline Run'}</span>
          </button>
        </div>

        {/* 4 Interactive Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setActiveStage(sc.failedStage ? sc.failedStage : 5);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-blue-50/60 border-[#2E5BFF] shadow-xs'
                    : 'bg-slate-50/60 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {sc.tag}
                    </span>
                    <StatusBadge value={sc.decision} />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{sc.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {formatINR(sc.amount)} · {sc.method}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-200/50">
                  Decline: {sc.reason} (Attempt #{sc.attempt})
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Scenario Telemetry Deck */}
        <div className="p-6 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Testing Transaction:
              </span>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900">
                {formatINR(selectedScenario.amount)} · {selectedScenario.method} · {selectedScenario.reason} (Attempt #{selectedScenario.attempt})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Final Emitted Action:</span>
              <StatusBadge value={selectedScenario.decision} />
            </div>
          </div>

          {/* 5 Stages Visual Stepper */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: 1, title: 'Terminal Blocklist', detail: selectedScenario.stageDetails.stage1 },
              { num: 2, title: 'Velocity Cap', detail: selectedScenario.stageDetails.stage2 },
              { num: 3, title: 'ML Scoring', detail: selectedScenario.stageDetails.stage3 },
              { num: 4, title: 'High-Value Check', detail: selectedScenario.stageDetails.stage4 },
              { num: 5, title: 'ERV Economics', detail: selectedScenario.stageDetails.stage5 },
            ].map((st) => {
              const isCurrent = activeStage === st.num;
              const hasFailed = selectedScenario.failedStage === st.num;
              const isPassed = !hasFailed && (selectedScenario.failedStage === null || selectedScenario.failedStage > st.num);

              return (
                <div
                  key={st.num}
                  onClick={() => setActiveStage(st.num)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isCurrent
                      ? 'bg-white border-[#2E5BFF] shadow-2xs ring-2 ring-blue-500/10'
                      : hasFailed
                      ? 'bg-rose-50/50 border-rose-200'
                      : isPassed
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-100/60 border-slate-200/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Stage {st.num}
                    </span>
                    {hasFailed ? (
                      <XCircle size={15} className="text-rose-500" />
                    ) : isPassed ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 text-xs block">{st.title}</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {st.detail.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outcome Realization Callout */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700 font-medium">
            <Info size={16} className="text-[#2E5BFF] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-bold block mb-0.5">Execution Summary:</strong>
              {selectedScenario.outcomeSummary}
            </div>
          </div>
        </div>
      </div>

      {/* ── [TOP CONTENT] INTERACTIVE ERV CALCULATOR SANDBOX ──────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xs space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5BFF] block">
            Unit Economics Playground
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Live Expected Recovery Value (ERV) Calculator
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Slide the payment amount and recovery probability to watch the ERV economics decide whether a retry is financially rational.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Sliders */}
          <div className="lg:col-span-2 space-y-5 p-5 bg-slate-50/70 border border-slate-200/70 rounded-2xl">
            {/* Amount Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Payment Amount at Risk</span>
                <span className="text-slate-900 font-bold metric-value">{formatINR(calcAmount)}</span>
              </div>
              <input
                type="range"
                min="100"
                max="50000"
                step="250"
                value={calcAmount}
                onChange={e => setCalcAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2E5BFF]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>₹100 (Micro)</span>
                <span>₹15,000</span>
                <span>₹35,000</span>
                <span>₹50,000</span>
              </div>
            </div>

            {/* Probability Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Model Calibrated P(recovery)</span>
                <span className="text-slate-900 font-bold metric-value">{calcProb}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={calcProb}
                onChange={e => setCalcProb(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2E5BFF]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>0% (Dead)</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Outcome Card */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Economic Hurdle
                </span>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  calcDecision === 'RETRY' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {calcDecision}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs font-medium">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Expectation:</span>
                  <span className="text-white font-mono">{formatINR((calcProb / 100) * calcAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Intervention Cost:</span>
                  <span className="text-rose-400 font-mono">-₹15.00</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                  <span>Net ERV:</span>
                  <span className={`font-mono text-base ${calcERV > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatINR(calcERV)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed font-medium">
              {calcERV > 0
                ? 'Positive ERV warrants automated retry. The expected recovery exceeds the ₹15 gateway fee.'
                : 'Negative ERV. Retrying costs more in fees than expected return. DO_NOTHING protects margin.'}
            </div>
          </div>
        </div>
      </div>

      {/* ── [BOTTOM CONTENT] COMPREHENSIVE ARCHITECTURE & STAGE BREAKDOWN ── */}
      <div className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Comprehensive Reference
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Five Stages. One Decision.
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Detailed step-by-step logic matching config/policy_config.yaml
          </span>
        </div>

        {/* Five Stage Deep-Dive Cards */}
        <div className="space-y-6">
          {/* STAGE 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="lg:w-3/5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center justify-center">
                    01
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Terminal Blocklist Check
                  </span>
                  <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 rounded-full text-[11px] font-bold text-rose-700">
                    Safety Veto
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Stop Payments That Should Never Be Retried
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Some failures are not temporary problems. If a card is permanently blocked, an account is closed, or the payment looks fraudulent, trying again will not fix the problem. The engine checks the failure reason before considering any retry.
                </p>

                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Active Terminal Decline Taxonomy (Zero Retry Allowed):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'account_closed', reason: 'Bank account permanently shut down' },
                      { code: 'card_permanently_blocked', reason: 'Hotlisted / canceled card' },
                      { code: 'suspected_fraud', reason: 'High-risk security flagged' },
                      { code: 'velocity_check_failed', reason: 'Card network rate limit violation' },
                    ].map(item => (
                      <span
                        key={item.code}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800"
                        title={item.reason}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {item.code}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-xs">
                  <div>
                    <strong className="text-slate-800 block">Why it matters:</strong>
                    <span className="text-slate-500 font-medium">
                      Prevents unnecessary retries, protects customers from spam notifications, and avoids wasting intervention fees.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:w-2/5 p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 font-medium text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Stage 1 Logic Flow
                </span>

                <div className="space-y-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Failed Payment</span>
                    <span className="text-[11px] text-slate-400">Gateway Webhook</span>
                  </div>

                  <div className="flex justify-center text-slate-300">
                    <ArrowDown size={14} />
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs text-center">
                    <span className="font-bold text-slate-800">Is this a blocked failure reason?</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-rose-700 uppercase block">YES</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">DO_NOTHING</span>
                      <span className="text-[10px] text-rose-600 block mt-0.5">Saves ₹15 fee</span>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">NO</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">Continue</span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">Check retry cap</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-200/60">
                  <strong>Technical Detail:</strong> Deterministic Rule #2 (hard-coded safety veto, not an ML prediction).
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="lg:w-3/5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold flex items-center justify-center">
                    02
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Retry Velocity Cap
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-700">
                    Velocity Limit
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Do Not Keep Retrying Forever
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Sometimes a payment can be retried, but repeatedly retrying the same payment can annoy customers and waste money. The engine enforces a strict maximum retry limit of <strong>3 attempts</strong>.
                </p>

                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Active Configuration:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                      Maximum retries = 3
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      (Attempt #4 emits DO_NOTHING)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-xs">
                  <div>
                    <strong className="text-slate-800 block">Why it matters:</strong>
                    <span className="text-slate-500 font-medium">
                      Prevents repeated attempts from turning recovery into customer harassment or unnecessary cost.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:w-2/5 p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 font-medium text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Stage 2 Velocity Flow
                </span>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 p-2 bg-white border border-slate-200 rounded text-center">
                      <span className="text-[10px] text-slate-400 block">Attempt 1</span>
                      <span className="text-emerald-700 font-bold text-xs">Allowed</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-300" />
                    <div className="flex-1 p-2 bg-white border border-slate-200 rounded text-center">
                      <span className="text-[10px] text-slate-400 block">Attempt 2</span>
                      <span className="text-emerald-700 font-bold text-xs">Allowed</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-300" />
                    <div className="flex-1 p-2 bg-white border border-slate-200 rounded text-center">
                      <span className="text-[10px] text-slate-400 block">Attempt 3</span>
                      <span className="text-amber-700 font-bold text-xs">Allowed</span>
                    </div>
                    <ArrowRight size={12} className="text-slate-300" />
                    <div className="flex-1 p-2 bg-rose-50 border border-rose-200 rounded text-center">
                      <span className="text-[10px] text-rose-500 block">Attempt 4</span>
                      <span className="text-rose-700 font-bold text-xs">STOP</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs text-center">
                    <span className="text-slate-500 block text-[11px]">Retry limit reached</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">→ DO_NOTHING</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-200/60">
                  <strong>Technical Detail:</strong> Deterministic Rule #1 (hard ceiling on retry velocity).
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="lg:w-3/5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#2E5BFF] text-xs font-extrabold flex items-center justify-center">
                    03
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recovery Probability
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-semibold text-[#2E5BFF]">
                    Calibrated Classifier
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Estimate the Chance of Recovery
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  The machine-learning model evaluates payment context and customer history to estimate how likely the payment is to recover if retried.
                </p>

                <div className="pt-1 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    What P(recovery) Means:
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    The calibrated probability that retrying this transaction will recover the money. Evaluated using Logistic Regression (model identifier: <span className="font-mono text-slate-800">LOGISTIC_REGRESSION_V1</span>), trained on Days 1–20 and evaluated on the held-out Days 21–30 window.
                  </p>
                </div>
              </div>

              <div className="lg:w-2/5 p-5 bg-blue-50/40 border border-blue-200/60 rounded-xl space-y-3 font-medium text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E5BFF] block">
                  ML Inference Flow
                </span>

                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-600">Payment Context</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-600">Customer History</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-600">Failure Information</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-slate-600">Previous Attempts</div>
                  </div>

                  <div className="flex justify-center text-[#2E5BFF]">
                    <ArrowDown size={14} />
                  </div>

                  <div className="p-2.5 bg-white border-2 border-[#2E5BFF] rounded-xl shadow-2xs text-center">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      Logistic Regression Model
                    </span>
                  </div>

                  <div className="flex justify-center text-[#2E5BFF]">
                    <ArrowDown size={14} />
                  </div>

                  <div className="p-2.5 bg-[#2E5BFF] text-white rounded-xl text-center shadow-xs">
                    <span className="text-base font-extrabold block metric-value">
                      P(recovery) = 74.5%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 4 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="lg:w-3/5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-extrabold flex items-center justify-center">
                    04
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    High-Value Escalation Guardrail
                  </span>
                  <span className="px-2.5 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-[11px] font-bold text-violet-700">
                    Human Review
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Be More Careful With High-Value Payments
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  A large payment deserves extra caution. If the payment is very valuable but the model is not confident enough, the engine does not blindly retry it.
                </p>

                <div className="pt-2 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Active Configuration:
                  </span>
                  <p className="text-slate-600 font-medium">
                    High-value threshold = <strong>₹100,000</strong>. Confidence threshold = <strong>85%</strong>.<br />
                    <em>If amount ≥ ₹100,000 AND P(recovery) &lt; 85%, the engine sends the payment to ESCALATE.</em>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-xs">
                  <div>
                    <strong className="text-slate-800 block">Why it matters:</strong>
                    <span className="text-slate-500 font-medium">
                      Combines automation with human judgment when the financial risk is high.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:w-2/5 p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 font-medium text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Stage 4 Decision Tree
                </span>

                <div className="space-y-2 pt-1">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs text-center">
                    <span className="font-bold text-slate-900 text-xs">₹100,000+ Payment</span>
                  </div>

                  <div className="flex justify-center text-slate-300">
                    <ArrowDown size={14} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-amber-700 block uppercase">Confidence &lt; 85%</span>
                      <span className="text-xs font-bold text-amber-900 block mt-1">ESCALATE</span>
                      <span className="text-[10px] text-amber-700 block mt-0.5">Human Review</span>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-emerald-700 block uppercase">Confidence ≥ 85%</span>
                      <span className="text-xs font-bold text-emerald-900 block mt-1">Continue</span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">To Stage 5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 5 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="lg:w-3/5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold flex items-center justify-center">
                    05
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Expected Recovery Value (ERV)
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-700">
                    Margin Protection
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Only Retry When the Recovery Is Worth It
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  If ERV is positive, retrying is financially worthwhile.
                </p>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Formula:
                  </span>
                  <div className="text-sm font-mono font-bold text-emerald-950">
                    ERV = P(recovery) × payment amount − intervention cost
                  </div>
                  <div className="text-slate-600 pt-1">
                    Active intervention cost: <strong>₹15 per retry</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1 font-medium text-slate-700">
                  <span className="font-bold text-slate-900 block">Accurate Calculation Example:</span>
                  <div>Payment amount = ₹567.87 · P(recovery) = 74.5% (0.745)</div>
                  <div>Expected gross = 0.745 × ₹567.87 = ₹423.06</div>
                  <div>Less ₹15 intervention cost = <strong className="text-emerald-700">ERV ≈ ₹408.06</strong></div>
                  <div className="pt-1 text-[11px] text-emerald-800 font-bold">ERV &gt; ₹0 → Decision is RETRY</div>
                </div>
              </div>

              <div className="lg:w-2/5 p-5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl space-y-3 font-medium text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Stage 5 Gate
                </span>

                <div className="space-y-2 pt-1">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs flex justify-between">
                    <span className="text-slate-600">Probability × Amount:</span>
                    <span className="font-bold text-slate-900 font-mono">₹423.06</span>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs flex justify-between text-rose-700">
                    <span>− ₹15 Fee:</span>
                    <span className="font-bold font-mono">-₹15.00</span>
                  </div>

                  <div className="p-2.5 bg-white border-2 border-emerald-500 rounded-xl shadow-2xs flex justify-between items-center">
                    <span className="font-bold text-slate-900">ERV:</span>
                    <span className="font-bold text-emerald-700 font-mono">+₹408.06</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg text-center font-bold text-xs">
                      RETRY
                    </div>
                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg text-center font-bold text-xs">
                      DO_NOTHING
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── [BOTTOM CONTENT] THREE ACTION CARDS ───────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xs space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Final Decision
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            From Five Checks to One Action
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <StatusBadge value="RETRY" />
              <h4 className="text-base font-bold text-slate-900">RETRY</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Try the payment again because the expected recovery is worth the intervention.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <StatusBadge value="DO_NOTHING" />
              <h4 className="text-base font-bold text-slate-900">DO_NOTHING</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Do not retry because the payment is blocked, the retry limit is reached, confidence is too low, or the economics do not make sense.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border-2 border-amber-400 bg-amber-50/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <StatusBadge value="ESCALATE" />
              <h4 className="text-base font-bold text-slate-900">ESCALATE</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Send the payment for human review when the payment is high-value and the model is not confident enough.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── [BOTTOM CONTENT] ARCHITECTURAL SEPARATION OF CONCERNS ──────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xs space-y-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            System Design Philosophy
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Why Not Let the Model Decide Everything?
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1 max-w-3xl">
            The ML model estimates probability. It does not control the business decision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2E5BFF] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">ML Model</h4>
            <span className="text-[11px] font-bold text-[#2E5BFF] block uppercase">estimates &quot;How likely is recovery?&quot;</span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Calibrated inference based on error code, timing, and customer history.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Policy Engine</h4>
            <span className="text-[11px] font-bold text-indigo-700 block uppercase">decides &quot;Should we actually retry?&quot;</span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Deterministic vetoes, velocity checks, and margin protection rules.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Financial Evaluation</h4>
            <span className="text-[11px] font-bold text-emerald-700 block uppercase">measures &quot;Did the decision create value?&quot;</span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Quantifies real money saved and recovered vs naive baselines.
            </p>
          </div>
        </div>
      </div>

      {/* ── [BOTTOM CONTENT] REAL PAYMENT WALKTHROUGH ──────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xs space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Concrete Trace
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Let&apos;s Follow One Payment
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Payment: ₹567.87 · UPI · gateway_error
          </p>
        </div>

        <div className="space-y-3">
          {[
            { stage: 'Stage 1', desc: 'Not blocked → continue', pass: true },
            { stage: 'Stage 2', desc: 'Retry count below 3 → continue', pass: true },
            { stage: 'Stage 3', desc: 'P(recovery) = 74.5%', pass: true },
            { stage: 'Stage 4', desc: 'Not high-value → continue', pass: true },
            { stage: 'Stage 5', desc: 'ERV = (0.745 × ₹567.87) − ₹15 = +₹408.06 → positive ERV', pass: true },
          ].map(s => (
            <div key={s.stage} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-medium">
              <span className="font-bold text-slate-800">{s.stage}</span>
              <span className="text-slate-600">{s.desc}</span>
              <span className="text-emerald-700 font-bold">PASS</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">Final Decision: <span className="text-emerald-700">RETRY</span></span>
          <span className="text-slate-600">Simulated outcome: Recovered ₹567.87 (Net impact: +₹552.87)</span>
        </div>
      </div>
    </div>
  );
}
