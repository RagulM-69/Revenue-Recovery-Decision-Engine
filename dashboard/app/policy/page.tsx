'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock, DollarSign, Filter } from 'lucide-react';

export default function PolicyPage() {
  const guardrails = [
    {
      rule: 'max_retry_count',
      value: '3 Attempts',
      description: 'Maximum retries allowed per payment attempt before forcing DO_NOTHING',
      icon: <Filter size={18} />,
      status: 'ACTIVE',
    },
    {
      rule: 'failure_reason_blocklist',
      value: 'account_closed, card_permanently_blocked, suspected_fraud, velocity_check_failed',
      description: 'Failure reasons that unconditionally block retries to prevent customer friction & fraud',
      icon: <Lock size={18} />,
      status: 'ACTIVE',
    },
    {
      rule: 'high_value_threshold',
      value: '₹100,000.00',
      description: 'Transaction amount above which ambiguous low-confidence events trigger manual ESCALATE',
      icon: <DollarSign size={18} />,
      status: 'ACTIVE',
    },
    {
      rule: 'min_confidence',
      value: '0.05 (5.0%)',
      description: 'Minimum P(recovery) score required before allowing positive ERV retries',
      icon: <ShieldCheck size={18} />,
      status: 'ACTIVE',
    },
    {
      rule: 'min_erv',
      value: '₹0.00',
      description: 'Expected Recovery Value must strictly exceed intervention cost (₹15.00)',
      icon: <ShieldAlert size={18} />,
      status: 'ACTIVE',
    },
  ];

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Policy & Guardrail Configuration"
        subtitle="Inspect active deterministic policy thresholds, failure reason blocklists, and guardrail rules."
      />

      <div className="p-8 space-y-8">
        {/* Active Policy Version Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Active Policy Configuration: v1.0.0
              </h2>
              <Badge label="DETERMINISTIC GUARDRAILS" type="COMPLETED" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Loaded from <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">config/policy_config.yaml</code>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Intervention Fee per Attempt</span>
            <div className="text-lg font-bold text-slate-900">₹15.00 INR</div>
          </div>
        </div>

        {/* Guardrails List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Configured Policy Guardrail Rules
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {guardrails.map((g) => (
              <div
                key={g.rule}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-xl mt-0.5">
                    {g.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 font-mono">
                        {g.rule}
                      </h4>
                      <Badge label={g.status} type="COMPLETED" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {g.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono self-end md:self-center">
                  {g.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
