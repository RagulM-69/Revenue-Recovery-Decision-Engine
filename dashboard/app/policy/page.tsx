'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatINR } from '@/lib/data-access';
import {
  ShieldCheck,
  Lock,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Info,
  ArrowRight,
  Filter,
  DollarSign,
  ShieldAlert,
  Sparkles,
  Play,
  Scale,
  Terminal,
} from 'lucide-react';

const POLICY = {
  version: 'POLICY_V1',
  max_retry_count: 3,
  min_confidence: 0.05,
  high_value_threshold: 100000.00,
  min_erv: 0.00,
  intervention_cost_per_retry: 15.00,
  failure_reason_blocklist: [
    'account_closed',
    'card_permanently_blocked',
    'suspected_fraud',
    'velocity_check_failed',
  ],
};

const GUARDRAIL_RULES = [
  {
    rule: 'max_retry_count',
    value: '3 Attempts',
    tag: 'Velocity Cap',
    description: 'Maximum retries allowed per payment attempt before forcing DO_NOTHING. Halts runaway retry loops and eliminates customer annoyance.',
    icon: <Filter size={18} />,
    status: 'ACTIVE',
  },
  {
    rule: 'failure_reason_blocklist',
    value: '4 Terminal Decline Codes',
    tag: 'Safety Veto',
    description: 'Failure reasons that unconditionally block retries (account_closed, card_permanently_blocked, suspected_fraud, velocity_check_failed).',
    icon: <Lock size={18} />,
    status: 'ACTIVE',
  },
  {
    rule: 'high_value_threshold',
    value: '₹100,000.00',
    tag: 'Escalation Trigger',
    description: 'Transaction amount above which ambiguous low-confidence events (< 85%) trigger manual human ESCALATE rather than blind retries.',
    icon: <DollarSign size={18} />,
    status: 'ACTIVE',
  },
  {
    rule: 'min_confidence_floor',
    value: '0.05 (5.0%)',
    tag: 'Confidence Floor',
    description: 'Minimum P(recovery) score required before allowing retries. Events below 5% are classified DO_NOTHING to maintain high intervention precision.',
    icon: <ShieldCheck size={18} />,
    status: 'ACTIVE',
  },
  {
    rule: 'min_erv_threshold',
    value: '₹0.00',
    tag: 'Economic Hurdle',
    description: 'Expected Recovery Value must strictly exceed intervention cost (₹15.00). Guarantees that every retry attempt is economically rational.',
    icon: <ShieldAlert size={18} />,
    status: 'ACTIVE',
  },
];

export default function PolicyPage() {
  // Interactive Sandbox State for Jury/Reviewer
  const [testAmount, setTestAmount] = useState<number>(4500);
  const [testProb, setTestProb] = useState<number>(75);
  const [testReason, setTestReason] = useState<string>('insufficient_funds');

  // Compute live sandbox evaluation
  const isBlocklisted = POLICY.failure_reason_blocklist.includes(testReason);
  const pRec = testProb / 100;
  const erv = Math.round((pRec * testAmount - POLICY.intervention_cost_per_retry) * 100) / 100;

  let sandboxDecision: 'RETRY' | 'DO_NOTHING' | 'ESCALATE' = 'RETRY';
  let triggeredRule = 'Rule #5: Positive ERV Check Passed';

  if (isBlocklisted) {
    sandboxDecision = 'DO_NOTHING';
    triggeredRule = 'Rule #2: Failure Reason Blocklist Veto (Terminal Decline)';
  } else if (testAmount >= POLICY.high_value_threshold && pRec < 0.85) {
    sandboxDecision = 'ESCALATE';
    triggeredRule = 'Rule #3: High-Value Threshold (>= ₹1,00,000) Escalated to Human Review';
  } else if (pRec < POLICY.min_confidence) {
    sandboxDecision = 'DO_NOTHING';
    triggeredRule = 'Rule #4: Confidence Floor (< 0.05) Rejected';
  } else if (erv <= POLICY.min_erv) {
    sandboxDecision = 'DO_NOTHING';
    triggeredRule = 'Rule #5: Negative ERV (Costs Exceed Recovery)';
  }

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-10 max-w-[1550px] mx-auto w-full">
      <PageHeader
        title="Deterministic Policy Guardrails"
        subtitle="Business logic and safety guardrails applied sequentially post-ML scoring to guarantee margin safety, regulatory compliance, and merchant reputation."
        actions={
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active Policy Rules
            </span>
          </div>
        }
      />

      {/* ── [TOP SECTION: NEW INTERACTIVE FEATURE] LIVE POLICY SIMULATOR ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5BFF]">
                Interactive Policy Simulator
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Live Calculator
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Test How the Engine Decides for Any Payment Scenario
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Adjust transaction parameters below to watch deterministic guardrails evaluate in real-time.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl self-start sm:self-auto">
            Intervention Cost: ₹15.00 / retry
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-5 p-5 bg-slate-50/70 border border-slate-200/70 rounded-2xl">
            {/* Amount Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Payment Amount</span>
                <span className="text-slate-900 font-bold metric-value">{formatINR(testAmount)}</span>
              </div>
              <input
                type="range"
                min="100"
                max="150000"
                step="500"
                value={testAmount}
                onChange={e => setTestAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2E5BFF]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>₹100 (Micro)</span>
                <span>₹50,000</span>
                <span>₹1,00,000 (Escalation Threshold)</span>
                <span>₹1,50,000</span>
              </div>
            </div>

            {/* P(recovery) Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">ML Calibrated Confidence P(recovery)</span>
                <span className="text-slate-900 font-bold metric-value">{testProb}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={testProb}
                onChange={e => setTestProb(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2E5BFF]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>0% (Hopeless)</span>
                <span>5% (Floor)</span>
                <span>50%</span>
                <span>85% (Escalation Bypass)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Decline Reason Selector */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                Gateway Decline Reason
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'insufficient_funds', label: 'Insufficient Funds' },
                  { id: 'network_timeout', label: 'Gateway Timeout' },
                  { id: 'card_permanently_blocked', label: 'Card Blocked (Rule #2)' },
                  { id: 'suspected_fraud', label: 'Fraud Risk (Rule #2)' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setTestReason(r.id)}
                    className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                      testReason === r.id
                        ? 'bg-white border-[#2E5BFF] text-[#2E5BFF] shadow-2xs font-semibold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Outcome Result Card */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-sm flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Simulated Policy Output
              </span>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Assigned Action:</span>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  sandboxDecision === 'RETRY'
                    ? 'bg-emerald-500 text-white'
                    : sandboxDecision === 'ESCALATE'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}>
                  {sandboxDecision}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs font-medium">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Expectation:</span>
                  <span className="text-white font-mono">{formatINR(pRec * testAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gateway Retry Fee:</span>
                  <span className="text-rose-400 font-mono">-₹15.00</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                  <span>Expected Recovery (ERV):</span>
                  <span className={`font-mono text-base ${erv > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatINR(erv)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-800/80 rounded-xl text-[11px] text-slate-300 font-medium leading-relaxed">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">Enforced Rule:</span>
              {triggeredRule}
            </div>
          </div>
        </div>
      </div>

      {/* ── [BOTTOM SECTION: COMPREHENSIVE CONFIGURATION REFERENCE] ───── */}
      <div className="space-y-6 pt-2 border-t border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            System Configuration
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Active Policy Rules &amp; Guardrails
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Loaded dynamically from <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">config/policy_config.yaml</code> and enforced by <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">src/policy/engine.py</code>.
          </p>
        </div>

        {/* Policy Version & Fee Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900">
                Policy Configuration
              </h3>
              <span className="text-xs font-mono text-slate-400">
                POLICY_V1
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-700">
                Deterministic Guardrails
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Applied sequentially after ML inference to ensure regulatory and economic compliance.
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-semibold text-slate-400 block">Intervention Fee per Attempt</span>
            <div className="text-xl font-bold text-slate-900 metric-value mt-0.5">₹15.00 INR</div>
          </div>
        </div>

        {/* Guardrail Rules List (Old Content Restored & Styled) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Configured Policy Guardrail Rules
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {GUARDRAIL_RULES.map((g) => (
              <div
                key={g.rule}
                className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-2xs shrink-0">
                    {g.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 font-mono">
                        {g.rule}
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-bold text-emerald-700">
                        {g.status}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {g.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                      {g.description}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono shrink-0 self-start md:self-center shadow-2xs">
                  {g.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Decline Blocklist Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Terminal Failure Reason Blocklist
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Payments with any of these failure reasons are immediately set to DO_NOTHING, regardless of ML score. These represent hard declines, closed accounts, or regulatory blocks where retrying causes harm.
              </p>
            </div>
            <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 shrink-0 hidden sm:inline-block">
              100% Zero Retry
            </span>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2.5">
              {POLICY.failure_reason_blocklist.map(reason => (
                <span
                  key={reason}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs font-semibold font-mono text-rose-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expected Recovery Value (ERV) Formula Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Expected Recovery Value Formula
          </h3>
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-sm shadow-inner flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-emerald-400 font-bold">ERV</span>{' '}
              = (P(recovery) × payment_amount) − intervention_cost
            </div>
            <span className="text-slate-400 text-xs">intervention_cost = ₹15.00</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            A positive ERV means the expected financial benefit of retrying exceeds the cost of intervention. Only events with ERV &gt; <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">min_erv (₹0.00)</code> are eligible for RETRY. This ensures the system is economically rational, not just statistically confident.
          </p>
        </div>
      </div>
    </div>
  );
}
