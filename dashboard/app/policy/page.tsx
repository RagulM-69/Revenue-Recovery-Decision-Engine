'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Info, ShieldCheck, Lock, AlertOctagon } from 'lucide-react';

const POLICY = {
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

interface ConfigRowProps {
  label: string;
  value: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const ConfigRow: React.FC<ConfigRowProps> = ({ label, value, description, badge, badgeColor = 'bg-blue-50 border-blue-200 text-blue-700' }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-[#E4E9F0] last:border-0">
    <div className="sm:w-64 shrink-0">
      <div className="text-[12px] font-bold text-slate-700 font-mono">{label}</div>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[14px] font-bold text-slate-900">{value}</span>
        {badge && (
          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[12px] text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function PolicyPage() {
  return (
    <div className="flex-1">
      <PageHeader
        title="Policy Guardrails"
        subtitle="Deterministic business rules applied after ML scoring. These rules override the ML score for safety, cost control, and regulatory compliance."
        actions={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] font-semibold text-emerald-700">
            <Lock size={12} />
            POLICY_V1 · Active
          </span>
        }
      />

      <div className="p-8 space-y-6">
        {/* ── How the Policy Engine Works ────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-[12px] text-blue-900 leading-relaxed">
          <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
          <div>
            <strong className="font-bold">How the Policy Engine Works:</strong> After the ML model scores each event with P(recovery), the policy engine applies these deterministic guardrails in sequence. If any rule triggers, the decision is immediately set to DO_NOTHING or ESCALATE — the ML score alone cannot override safety rules.
          </div>
        </div>

        {/* ── Active Guardrail Configuration ─────────────────────────── */}
        <div className="bg-white border border-[#E4E9F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E4E9F0] bg-[#F4F6F9] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck size={14} className="text-emerald-600" />
            </div>
            <h2 className="text-[12px] font-bold text-slate-700">
              Active Guardrail Configuration
            </h2>
          </div>

          <div className="px-6">
            <ConfigRow
              label="max_retry_count"
              value={String(POLICY.max_retry_count)}
              description="Maximum number of automated retry attempts allowed per payment before the system stops intervening. Prevents harassment of unrecoverable customers."
              badge="Limit"
            />
            <ConfigRow
              label="min_confidence"
              value={`${(POLICY.min_confidence * 100).toFixed(0)}% P(recovery)`}
              description="Minimum ML recovery probability required to trigger a RETRY action. Events with P(recovery) below this threshold are marked DO_NOTHING."
              badge="Floor"
              badgeColor="bg-slate-100 border-slate-200 text-slate-600"
            />
            <ConfigRow
              label="high_value_threshold"
              value={`₹${POLICY.high_value_threshold.toLocaleString('en-IN')}`}
              description="Payment amounts above this threshold are automatically escalated for human review regardless of ML score, when P(recovery) < 0.85."
              badge="Escalation Trigger"
              badgeColor="bg-amber-50 border-amber-200 text-amber-700"
            />
            <ConfigRow
              label="min_erv"
              value={`₹${POLICY.min_erv.toFixed(2)}`}
              description="Minimum Expected Recovery Value required to justify a retry intervention. ERV = P(recovery) × payment_amount − intervention_cost. Events with ERV ≤ 0 are blocked."
              badge="Threshold"
              badgeColor="bg-slate-100 border-slate-200 text-slate-600"
            />
            <ConfigRow
              label="intervention_cost_per_retry"
              value={`₹${POLICY.intervention_cost_per_retry.toFixed(2)}`}
              description="Fixed gateway fee charged per retry attempt. Deducted from ERV calculation. Prevents retrying low-value payments where costs exceed recovery."
              badge="Cost"
              badgeColor="bg-rose-50 border-rose-200 text-rose-600"
            />
          </div>
        </div>

        {/* ── Failure Reason Blocklist ─────────────────────────────── */}
        <div className="bg-white border border-[#E4E9F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E4E9F0] bg-[#F4F6F9] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertOctagon size={14} className="text-rose-500" />
            </div>
            <div>
              <h2 className="text-[12px] font-bold text-slate-700">Failure Reason Blocklist</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Payments with any of these reasons are immediately set to DO_NOTHING, regardless of ML score.
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {POLICY.failure_reason_blocklist.map(reason => (
                <span
                  key={reason}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-[11px] font-semibold font-mono text-rose-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ERV Formula ─────────────────────────────────────────── */}
        <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Expected Recovery Value Formula
          </h2>
          <div className="bg-slate-950 text-slate-100 rounded-xl p-5 font-mono text-[13px]">
            <span className="text-blue-400">ERV</span>{' '}
            = (<span className="text-emerald-400">P(recovery)</span> × <span className="text-amber-300">payment_amount</span>) − <span className="text-rose-400">intervention_cost</span>
          </div>
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">
            A positive ERV means the expected financial benefit of retrying exceeds the cost of intervention. Only events with ERV &gt;{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700">min_erv</code>{' '}
            are eligible for RETRY. This ensures the system is economically rational, not just statistically confident.
          </p>
        </div>
      </div>
    </div>
  );
}
