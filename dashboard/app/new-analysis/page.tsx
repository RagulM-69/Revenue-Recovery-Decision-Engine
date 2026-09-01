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
} from 'lucide-react';

const PIPELINE_STEPS = [
  'Payment events loaded',
  'Recovery features generated',
  'ML probabilities calculated',
  'Policy guardrails evaluated',
  'Recovery outcomes simulated',
  'Financial impact calculated',
];

export default function NewAnalysisPage() {
  const [mode, setMode] = useState<null | 'demo' | 'upload'>(null);
  const [progress, setProgress] = useState<number>(-1); // -1 = not started
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

      <div className="p-8 max-w-2xl space-y-6">
        {/* ── Not started ──────────────────────────────────────────────── */}
        {mode === null && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-1">What this analysis does</h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                The engine takes failed payment events, extracts features per payment attempt, scores each event with a calibrated ML model, applies deterministic policy guardrails (ERV thresholds, retry limits, failure-reason blocklist), simulates recovery outcomes, and calculates financial impact vs naive baselines.
              </p>

              <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-800">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  <strong>Expected input:</strong> A CSV file containing payment events with fields: <code>payment_id, customer_id, amount, payment_method, failure_reason, failed_at</code>.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Demo Dataset */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] font-semibold text-emerald-700">
                    <CheckCircle size={11} />
                    Available Now
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Try Demo Dataset</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Run the engine on 3,000 synthetic payment events across 500 customers. Instantly see how the pipeline works end-to-end.
                  </p>
                </div>
                <button
                  onClick={runDemo}
                  className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <Play size={14} />
                  Run Demo Analysis
                </button>
              </div>

              {/* CSV Upload — Coming Soon */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 opacity-70">
                <div>
                  <div className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-500">
                    Coming Soon
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Upload CSV Dataset</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Upload your own failed payment CSV export from Razorpay or your payment processor. Custom dataset processing is in development.
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 text-sm font-semibold rounded-lg cursor-not-allowed">
                  <Upload size={14} />
                  Upload CSV (Coming Soon)
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── In Progress / Done ────────────────────────────────────────── */}
        {mode === 'demo' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {done ? 'Analysis Complete' : 'Running Demo Analysis…'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                3,000 synthetic payment events · 500 customers
              </p>
            </div>

            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => {
                const completed = progress > i;
                const active = progress === i;
                return (
                  <div key={step} className="flex items-center gap-3">
                    {completed ? (
                      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    ) : active ? (
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-200 shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        completed
                          ? 'text-slate-800'
                          : active
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {done && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <a
                  href="/results"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  View Results <ArrowRight size={14} />
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
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
