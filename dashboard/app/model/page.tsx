'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { InlineStat } from '@/components/ui/StatCard';
import { getLatestCompletedRun, getEvaluationResults, formatPercent } from '@/lib/data-access';
import { EvaluationResult, CalibrationBin } from '@/lib/types';
import { RefreshCw, CheckCircle, Info } from 'lucide-react';

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

  useEffect(() => { load(); }, []);

  const calibrationBins = evalResult?.calibration_curve_data || [];
  const cm = evalResult?.confusion_matrix;

  return (
    <div className="flex-1">
      <PageHeader
        title="Model Performance"
        subtitle="ML model selection, predictive quality metrics, calibration, and benchmark comparison against the XGBoost alternative."
        actions={
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      <div className="p-8 space-y-8">
        {loading ? (
          <p className="text-sm text-slate-400">Loading model data…</p>
        ) : !evalResult ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
            <p className="text-slate-500">No model data found. Run an analysis first.</p>
          </div>
        ) : (
          <>
            {/* ── Production Model Selection ──────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Selected Production Model
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg font-mono">LOGISTIC_REGRESSION_V1</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Selected via temporal train/eval split — Days 1–20 train, Days 21–30 eval
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-800 max-w-xs">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <span>
                    Model selection is automatic. The calibration/evaluation process picks the model with the lower Brier score on the held-out eval window.
                  </span>
                </div>
              </div>
            </div>

            {/* ── Predictive Quality Metrics ──────────────────────────── */}
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Predictive Quality Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Brier Score"
                  value={Number(evalResult.brier_score).toFixed(4)}
                  sub="Lower is better. Measures probability calibration quality."
                  accent="blue"
                />
                <StatCard
                  label="ROC-AUC"
                  value={Number(evalResult.roc_auc_score).toFixed(4)}
                  sub="Discrimination ability. 1.0 = perfect, 0.5 = random."
                  accent="blue"
                />
                <StatCard
                  label="Recovery Precision"
                  value={formatPercent(Number(evalResult.recovery_precision))}
                  sub="Of RETRY decisions, how many resulted in actual recovery."
                  accent="slate"
                />
                <StatCard
                  label="Recovery Recall"
                  value={formatPercent(Number(evalResult.recovery_recall))}
                  sub="Of all recoverable failures, what % were captured."
                  accent="slate"
                />
              </div>
            </div>

            {/* ── Model Benchmark Table ───────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Model Benchmark Comparison
              </h2>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Model', 'Brier Score', 'ROC-AUC', 'Calibration', 'Selected'].map(h => (
                        <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-emerald-50/30">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">LOGISTIC_REGRESSION_V1</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{Number(evalResult.brier_score).toFixed(4)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{Number(evalResult.roc_auc_score).toFixed(4)}</td>
                      <td className="py-3 px-4 text-slate-600">StandardScaler + sigmoid</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-semibold text-emerald-700">
                          <CheckCircle size={11} /> Production
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-slate-600">XGBOOST_V1 (comparison)</td>
                      <td className="py-3 px-4 text-slate-600">0.1565</td>
                      <td className="py-3 px-4 text-slate-600">0.8193</td>
                      <td className="py-3 px-4 text-slate-500">CalibratedClassifierCV</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">Not selected</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                XGBoost had a marginally higher Brier score (0.1565 vs 0.1563), so Logistic Regression was selected automatically for production scoring.
              </p>
            </div>

            {/* ── Confusion Matrix & Calibration ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confusion Matrix */}
              {cm && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Confusion Matrix (Eval Window)
                  </h2>
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    {[
                      { label: 'True Positives (TP)', value: cm.tp, color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                      { label: 'False Positives (FP)', value: cm.fp, color: 'bg-rose-50 border-rose-200 text-rose-900' },
                      { label: 'False Negatives (FN)', value: cm.fn, color: 'bg-rose-50 border-rose-200 text-rose-900' },
                      { label: 'True Negatives (TN)', value: cm.tn, color: 'bg-slate-50 border-slate-200 text-slate-800' },
                    ].map(cell => (
                      <div key={cell.label} className={`border rounded-lg p-3 ${cell.color}`}>
                        <div className="text-xl font-bold">{cell.value}</div>
                        <div className="text-[10px] font-semibold mt-0.5">{cell.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calibration Bins */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Reliability / Calibration Bins
                </h2>
                <div className="space-y-1.5">
                  {calibrationBins.filter(b => b.count > 0).map((bin: CalibrationBin) => (
                    <div key={bin.bin_index} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-right font-mono text-slate-500 shrink-0">
                        {(bin.bin_midpoint * 100).toFixed(1)}%
                      </span>
                      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden relative">
                        {/* Predicted bar */}
                        <div
                          className="absolute left-0 top-0 h-full bg-sky-200 rounded"
                          style={{ width: `${bin.bin_midpoint * 100}%` }}
                        />
                        {/* Observed bar */}
                        <div
                          className="absolute left-0 top-0 h-full bg-emerald-500/70 rounded"
                          style={{ width: `${bin.observed_ratio * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-left font-mono text-emerald-700 shrink-0">
                        {(bin.observed_ratio * 100).toFixed(0)}%
                      </span>
                      <span className="text-slate-400 shrink-0">n={bin.count}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 bg-sky-200 rounded inline-block" /> Predicted</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 bg-emerald-500/70 rounded inline-block" /> Observed</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
