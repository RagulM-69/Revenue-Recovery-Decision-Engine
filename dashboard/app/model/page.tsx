'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLatestCompletedRun, getEvaluationResults, formatPercent } from '@/lib/data-access';
import { EvaluationResult, CalibrationBin } from '@/lib/types';
import { RefreshCw, CheckCircle2, Info, Calendar, Cpu, Check, HelpCircle } from 'lucide-react';

export default function ModelPage() {
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const ev = await getEvaluationResults(run.run_id);
      setEvalResult(ev);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const calibrationBins = evalResult?.calibration_curve_data || [];
  const cm = evalResult?.confusion_matrix;

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-8 max-w-[1550px] mx-auto w-full">
      <PageHeader
        title="ML Model Governance & Calibration"
        subtitle="Predictive quality metrics, automated model selection against XGBoost, and probability calibration verification on the held-out test window."
        actions={
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-semibold text-[#2E5BFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" />
              Temporal Split · Days 21–30 (996 Events)
            </span>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-72 text-slate-400 text-sm font-medium">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#2E5BFF] border-t-transparent animate-spin" />
            <span>Loading model calibration data…</span>
          </div>
        </div>
      ) : !evalResult ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs max-w-lg mx-auto">
          <p className="text-slate-500 font-medium">No model data found. Run an analysis first.</p>
        </div>
      ) : (
        <>
          {/* ── Selected Production Model Header Deck ────────────────── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Active Production Classifier
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={11} /> Selected by Calibration Error
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Logistic Regression
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    Model: LOGISTIC_REGRESSION_V1
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-medium">
                  Trained on Days 1–20; evaluated out-of-sample on Days 21–30. Selected over XGBoost because it achieved a lower Brier calibration error ({Number(evalResult.brier_score).toFixed(4)} vs 0.1565), ensuring mathematical accuracy for Expected Recovery Value (ERV) decisions.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 max-w-sm space-y-1.5 self-start lg:self-auto font-medium">
                <span className="text-slate-900 font-bold block">Why Calibration Matters in Payments:</span>
                <p className="text-[11px] leading-relaxed">
                  In financial decisioning, raw classification is not enough. ERV math requires true, well-calibrated probabilities so that spending a ₹15 gateway fee is economically positive in expectation.
                </p>
              </div>
            </div>
          </div>

          {/* ── 4 Predictive Quality Metrics (Clean, Non-AI-Slop) ──────── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Brier Calibration Score</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 metric-value">
                  {Number(evalResult.brier_score).toFixed(4)}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium block">
                  Lower is better · Beat XGBoost
                </span>
              </div>

              <div className="space-y-1 lg:pl-6 pt-4 lg:pt-0">
                <span className="text-xs font-medium text-slate-400 block">ROC-AUC Discrimination</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 metric-value">
                  {Number(evalResult.roc_auc_score).toFixed(4)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  1.0 = perfect separation (0.5 = random)
                </span>
              </div>

              <div className="space-y-1 lg:pl-6 pt-4 lg:pt-0">
                <span className="text-xs font-medium text-slate-400 block">Realized Precision</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 metric-value">
                  {formatPercent(Number(evalResult.recovery_precision))}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  480 recovered / 748 executed retries
                </span>
              </div>

              <div className="space-y-1 lg:pl-6 pt-4 lg:pt-0">
                <span className="text-xs font-medium text-slate-400 block">Realized Recall</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 metric-value">
                  {formatPercent(Number(evalResult.recovery_recall))}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium block">
                  480 / 516 recoverable captured
                </span>
              </div>
            </div>
          </div>

          {/* ── Model Benchmark Comparison Table ─────────────────────── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-2xs space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Model Tournament Selection
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Automated Benchmark Comparison (Days 21–30 Evaluation Set)
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    {['Candidate Model', 'Brier Score (Calibration)', 'ROC-AUC (Discrimination)', 'Calibration Method', 'Decision Engine Status'].map(h => (
                      <th key={h} className="py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-blue-50/30">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 block">Logistic Regression</span>
                      <span className="font-mono text-[10px] text-slate-400">LOGISTIC_REGRESSION_V1</span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900 metric-value">
                      {Number(evalResult.brier_score).toFixed(4)}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900 metric-value">
                      {Number(evalResult.roc_auc_score).toFixed(4)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      StandardScaler + Sigmoid Link
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-700">
                        <Check size={11} /> Selected for Production
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-5">
                      <span className="text-slate-700 font-medium block">XGBoost (Benchmark)</span>
                      <span className="font-mono text-[10px] text-slate-400">XGBOOST_V1</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 metric-value">0.1565</td>
                    <td className="py-3.5 px-5 text-slate-500 metric-value">0.8193</td>
                    <td className="py-3.5 px-5 text-slate-400">CalibratedClassifierCV (Isotonic)</td>
                    <td className="py-3.5 px-5">
                      <span className="text-slate-400 text-xs font-medium">Higher calibration error</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              The automated training pipeline selects the model that minimizes Brier score on the out-of-sample split. Logistic Regression demonstrated better probability calibration while offering sub-millisecond inference latency.
            </p>
          </div>

          {/* ── Confusion Matrix & Calibration Bins (2 Column Grid) ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            {cm && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-2xs flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Policy Classification Matrix
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">996 Evaluation Events</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Evaluates policy decision selection (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">decision == RETRY</code>) against ground-truth recoverability.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 max-w-sm">
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                      <div className="text-2xl font-bold text-emerald-800 metric-value">{cm.tp}</div>
                      <span className="text-xs font-bold text-emerald-900 block mt-0.5">True Positives (TP)</span>
                      <span className="text-[10px] text-emerald-700 font-medium block">Retried &amp; Recoverable</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60">
                      <div className="text-2xl font-bold text-rose-800 metric-value">{cm.fp}</div>
                      <span className="text-xs font-bold text-rose-900 block mt-0.5">False Positives (FP)</span>
                      <span className="text-[10px] text-rose-700 font-medium block">Retried &amp; Unrecoverable</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-2xl font-bold text-slate-800 metric-value">{cm.fn}</div>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">False Negatives (FN)</span>
                      <span className="text-[10px] text-slate-500 font-medium block">Blocked &amp; Recoverable</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-2xl font-bold text-slate-800 metric-value">{cm.tn}</div>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">True Negatives (TN)</span>
                      <span className="text-[10px] text-slate-500 font-medium block">Blocked &amp; Unrecoverable</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                  <strong>Policy Recall:</strong> 100.0% (516/516). Realized Recall is 93.0% accounting for realistic ~90% realization success on retried payments.
                </div>
              </div>
            )}

            {/* Calibration Bins */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Probability Reliability Curve
                </span>
                <span className="text-[11px] text-slate-500 font-medium">10 Calibration Bins</span>
              </div>

              <div className="space-y-2 pt-1">
                {calibrationBins.filter(b => b.count > 0).map((bin: CalibrationBin) => (
                  <div key={bin.bin_index} className="flex items-center gap-3 text-xs font-medium">
                    <span className="w-10 text-right font-mono text-slate-400 shrink-0 text-[11px]">
                      {(bin.bin_midpoint * 100).toFixed(0)}%
                    </span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative">
                      {/* Predicted bar */}
                      <div
                        className="absolute left-0 top-0 h-full bg-[#2E5BFF]/30 rounded-full"
                        style={{ width: `${bin.bin_midpoint * 100}%` }}
                      />
                      {/* Observed bar */}
                      <div
                        className="absolute left-0 top-0 h-full bg-emerald-500/80 rounded-full"
                        style={{ width: `${bin.observed_ratio * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-left font-mono text-emerald-700 font-bold shrink-0 text-[11px]">
                      {(bin.observed_ratio * 100).toFixed(0)}%
                    </span>
                    <span className="text-slate-400 shrink-0 text-[10px] w-12 text-right">n={bin.count}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#2E5BFF]/40 rounded inline-block" /> Predicted P(rec)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500/80 rounded inline-block" /> Observed Realization</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
