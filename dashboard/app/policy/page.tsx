'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { InlineStat } from '@/components/ui/StatCard';
import { Info, ShieldCheck } from 'lucide-react';

const POLICY = {
  max_retry_count: 3,
  min_confidence: 0.05,
  high_value_threshold: 100000.00,
  min_erv: 0.00,
  intervention_cost_per_retry: 15.00,
  failure_reason_blocklist: [
    'FRAUD_DETECTED',
    'CARD_BLOCKED',
    'ACCOUNT_CLOSED',
    'STOLEN_CARD',
    'REGULATORY_BLOCK',
    'CARD_EXPIRED',
    'DO_NOT_HONOR',
  ],
};

interface ConfigRowProps {
  label: string;
  value: string;
  description: string;
  badge?: string;
}

const ConfigRow: React.FC<ConfigRowProps> = ({ label, value, description, badge }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-slate-100 last:border-0">
    <div className="sm:w-56 shrink-0">
      <div className="text-xs font-bold text-slate-700 font-mono">{label}</div>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        {badge && (
          <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-bold text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function PolicyPage() {
  return (
    <div className="flex-1">
      <PageHeader
        title="Policy Guardrails"
        subtitle="Deterministic business rules applied after ML scoring. These rules override the ML score for safety, cost control, and regulatory compliance."
      />

      <div className="p-8 space-y-6">
        {/* ── How the Policy Engine Works ────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800">
          <Info size={15} className="mt-0.5 shrink-0" />
          <div>
            <strong className="font-bold">How the Policy Engine Works:</strong> After the ML model scores each event with P(recovery), the policy engine applies these deterministic guardrails in sequence. If any rule blocks a payment, the decision is immediately set to DO_NOTHING or ESCALATE — the ML score alone cannot override safety rules.
          </div>
        </div>

        {/* ── Active Configuration ─────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Guardrail Configuration
            </h2>
            <span className="ml-auto px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-bold text-emerald-700">
              POLICY_V1
            </span>
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
            />
            <ConfigRow
              label="high_value_threshold"
              value={`₹${POLICY.high_value_threshold.toLocaleString('en-IN')}`}
              description="Payment amounts above this threshold are automatically escalated to the ESCALATE bucket for human review, regardless of ML score."
              badge="Escalation Trigger"
            />
            <ConfigRow
              label="min_erv"
              value={`₹${POLICY.min_erv.toFixed(2)}`}
              description="Minimum Expected Recovery Value required to justify a retry intervention. ERV = P(recovery) × payment_amount − intervention_cost. Events with ERV ≤ 0 are blocked."
            />
            <ConfigRow
              label="intervention_cost_per_retry"
              value={`₹${POLICY.intervention_cost_per_retry.toFixed(2)}`}
              description="Fixed gateway fee charged per retry attempt. Deducted from ERV calculation. Prevents retrying low-value payments where costs exceed recovery."
            />
          </div>
        </div>

        {/* ── Failure Reason Blocklist ─────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Failure Reason Blocklist
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Payments with any of these failure reasons are immediately set to DO_NOTHING, regardless of ML score. These represent hard declines, fraud, or regulatory blocks where retrying causes harm.
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {POLICY.failure_reason_blocklist.map(reason => (
                <span
                  key={reason}
                  className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-md text-[11px] font-semibold font-mono text-rose-700"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ERV Formula ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Expected Recovery Value Formula
          </h2>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
            <span className="text-emerald-400">ERV</span>{' '}
            = (P(recovery) × payment_amount) − intervention_cost
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            A positive ERV means the expected financial benefit of retrying exceeds the cost of intervention. Only events with ERV &gt; <code className="bg-slate-100 px-1 rounded">min_erv</code> are eligible for RETRY. This ensures the system is economically rational, not just statistically confident.
          </p>
        </div>
      </div>
    </div>
  );
}
