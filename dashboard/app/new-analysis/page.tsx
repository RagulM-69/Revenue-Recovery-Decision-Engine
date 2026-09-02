'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Upload,
  Play,
  CheckCircle,
  Circle,
  ArrowRight,
  Info,
  Zap,
  Database,
  Cpu,
  ShieldCheck,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

const PIPELINE_STEPS = [
  { label: 'Payment events loaded', icon: Database, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { label: 'Recovery features generated', icon: Zap, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { label: 'ML probabilities calculated', icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { label: 'Policy guardrails evaluated', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { label: 'Recovery outcomes simulated', icon: TrendingUp, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { label: 'Financial impact calculated', icon: BarChart3, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export default function NewAnalysisPage() {
  const [mode, setMode] = useState<null | 'demo' | 'upload'>(null);
  const [progress, setProgress] = useState<number>(-1);
  const [done, setDone] = useState(false);

  const runDemo = async () => {
    setMode('demo');
    setProgress(0);
    setDone(false);

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      await new Promise((res) => setTimeout(res, 700));
      setProgress(i + 1);
    }
    setDone(true);
  };

  const reset = () => {
    setMode(null);
    setProgress(-1);
    setDone(false);
  };

  return (
    <div className="flex-1">
      <PageHeader
        title="New Analysis"
        subtitle="Analyze failed payment events to determine which should be retried, escalated, or left untouched."
      />

      <div className="p-8 max-w-2xl space-y-5">
        {/* ── Not started ──────────────────────────────────────────────── */}
        {mode === null && (
          <>
            {/* What this analysis does */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[13px] font-bold text-slate-800 mb-1.5">What this analysis does</h2>
              <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
                The engine takes failed payment events, extracts features per payment attempt, scores each event with a calibrated ML model, applies deterministic policy guardrails (ERV thresholds, retry limits, failure-reason blocklist), simulates recovery outcomes, and calculates financial impact vs naive baselines.
              </p>

              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-[12px] text-blue-900">
                <Info size={13} className="mt-0.5 shrink-0 text-blue-500" />
                <span>
                  <strong>Expected input:</strong> A CSV file containing payment events with fields:{' '}
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-[11px] font-mono">payment_id, customer_id, amount, payment_method, failure_reason, failed_at</code>.
                </span>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Demo Analysis */}
              <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-semibold text-blue-700">
                    <CheckCircle size={10} />
                    Interactive Preview
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-900">Demo Analysis</h3>
                  <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                    This interactive preview walks through the 6-stage recovery workflow using the latest completed demo dataset. It does not reseed or rerun the backend pipeline.
                  </p>
                </div>
                <button
                  onClick={runDemo}
                  className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Play size={13} />
                  Run Demo Analysis
                </button>
              </div>

              {/* CSV Upload — Coming Soon */}
              <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm flex flex-col gap-4 opacity-60">
                <div>
                  <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-500">
                    Coming Soon
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-900">Upload CSV Dataset</h3>
                  <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                    Upload your own failed payment CSV export from Razorpay or your payment processor. Custom dataset processing is in development.
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 text-[13px] font-semibold rounded-xl cursor-not-allowed">
                  <Upload size={13} />
                  Upload CSV (Coming Soon)
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── In Progress / Done ────────────────────────────────────────── */}
        {mode === 'demo' && (
          <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-[14px] font-bold text-slate-900">
                {done ? 'Preview Complete' : 'Running Demo Analysis…'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                3,000 synthetic payment events · 500 customers · Interactive workflow preview
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(Math.max(progress, 0) / PIPELINE_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => {
                const completed = progress > i;
                const active = progress === i;
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      completed
                        ? 'bg-emerald-50 border-emerald-200'
                        : active
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-slate-50 border-[#E4E9F0]'
                    }`}>
                      {completed ? (
                        <CheckCircle size={14} className="text-emerald-500" />
                      ) : active ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      ) : (
                        <Icon size={13} className="text-slate-300" />
                      )}
                    </div>
                    <span
                      className={`text-[13px] font-medium transition-colors ${
                        completed
                          ? 'text-slate-800'
                          : active
                          ? 'text-blue-700 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {done && (
              <div className="pt-4 border-t border-[#E4E9F0] flex items-center gap-3">
                <a
                  href="/results"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm"
                >
                  View Results <ArrowRight size={13} />
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 text-[13px] font-semibold text-slate-600 border border-[#E4E9F0] rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Run Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
