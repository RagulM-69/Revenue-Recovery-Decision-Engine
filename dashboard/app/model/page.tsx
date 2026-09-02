'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { getLatestCompletedRun, getEvaluationResults, formatPercent } from '@/lib/data-access';
import { EvaluationResult, CalibrationBin } from '@/lib/types';
import { RefreshCw, CheckCircle, Info, Calendar, Cpu, Activity, Target, BarChart2 } from 'lucide-react';

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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[12px] font-semibold text-blue-800">
              <Calendar size={12} className="text-blue-500" />
              Evaluation Window · Days 21–30 · 996 events
            </span>
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-600 border border-[#E4E9F0] bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-7">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading model data…</div>
        ) : !evalResult ? (
          <div className="bg-white border border-[#E4E9F0] rounded-2xl p-10 text-center shadow-sm">
            <p className="text-slate-500">No model data found. Run an analysis first.</p>
          </div>
        ) : (
          <>
            {/* ── Selected Production Model ──────────────────────────── */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Selected Production Model
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <Cpu size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-[17px] font-mono tracking-tight">LOGISTIC_REGRESSION_V1</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">
                      Selected via temporal train/eval split — Days 1–20 train, Days 21–30 eval
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 shrink-0">
                    <CheckCircle size={11} /> Production
                  </span>
                </div>
                <div className="flex items-start gap-2 p-3 bg-[#F4F6F9] border border-[#E4E9F0] rounded-xl text-[12px] text-slate-600 max-w-xs">
                  <Info size={13} className="mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    Model selection is automatic. The calibration process picks the model with the lower Brier score on the held-out eval window.
                  </span>
                </div>
              </div>
            </div>

            {/* ── Predictive Quality Metrics ──────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Predictive Quality Metrics (Realized Simulation Recovery)
                </h2>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  996 Evaluation Events
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Brier Score"
                  value={Number(evalResult.brier_score).toFixed(4)}
                  sub="Lower is better. Measures probability calibration quality."
                  accent="blue"
                  icon={<Activity size={16} />}
                />
                <StatCard
                  label="ROC-AUC"
                  value={Number(evalResult.roc_auc_score).toFixed(4)}
                  sub="Discrimination ability. 1.0 = perfect, 0.5 = random."
                  accent="blue"
                  icon={<BarChart2 size={16} />}
                />
                <StatCard
                  label="Recovery Precision"
                  value={formatPercent(Number(evalResult.recovery_precision))}
                  sub="Realized recovery: 480 recovered / 748 retries"
                  accent="slate"
                  icon={<CheckCircle size={16} />}
                />
                <StatCard
                  label="Recovery Recall"
                  value={formatPercent(Number(evalResult.recovery_recall))}
                  sub="Realized recall: 480 recovered / 516 recoverable"
                  accent="slate"
                  icon={<Target size={16} />}
                />
              </div>
            </div>

            {/* ── Model Benchmark Table ───────────────────────────────── */}
            <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Model Benchmark Comparison
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[#E4E9F0]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F4F6F9] border-b border-[#E4E9F0]">
                      {['Model', 'Brier Score', 'ROC-AUC', 'Calibration', 'Status'].map(h => (
                        <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E9F0]">
                    <tr className="bg-blue-50/40 hover:bg-blue-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-[12px]">LOGISTIC_REGRESSION_V1</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 metric-value">{Number(evalResult.brier_score).toFixed(4)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 metric-value">{Number(evalResult.roc_auc_score).toFixed(4)}</td>
                      <td className="py-3.5 px-4 text-slate-500">StandardScaler + sigmoid</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700">
                          <CheckCircle size={10} /> Production
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F4F6F9] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[12px]">XGBOOST_V1 (comparison)</td>
                      <td className="py-3.5 px-4 text-slate-500 metric-value">0.1565</td>
                      <td className="py-3.5 px-4 text-slate-500 metric-value">0.8193</td>
                      <td className="py-3.5 px-4 text-slate-400">CalibratedClassifierCV</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-400">Not selected</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                XGBoost had a marginally higher Brier score (0.1565 vs 0.1563), so Logistic Regression was selected automatically for production scoring.
              </p>
            </div>

            {/* ── Confusion Matrix & Calibration ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Policy Classification Confusion Matrix */}
              {cm && (
                <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Policy Classification Matrix
                      </h2>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        Policy vs Ground Truth
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">
                      Measures policy classification selection (<code className="bg-slate-100 px-1 rounded text-[11px]">decision == RETRY</code>) vs latent ground-truth recoverability across 996 eval events.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 max-w-xs">
                      {[
                        { label: 'True Positives (TP)', value: cm.tp, sub: 'Retried & Recoverable', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                        { label: 'False Positives (FP)', value: cm.fp, sub: 'Retried & Unrecoverable', color: 'bg-rose-50 border-rose-200 text-rose-900' },
                        { label: 'False Negatives (FN)', value: cm.fn, sub: 'Blocked & Recoverable', color: 'bg-rose-50 border-rose-200 text-rose-900' },
                        { label: 'True Negatives (TN)', value: cm.tn, sub: 'Blocked & Unrecoverable', color: 'bg-slate-50 border-slate-200 text-slate-800' },
                      ].map(cell => (
                        <div key={cell.label} className={`border rounded-xl p-3.5 ${cell.color}`}>
                          <div className="text-[22px] font-bold metric-value">{cell.value}</div>
                          <div className="text-[10px] font-bold mt-0.5">{cell.label}</div>
                          <div className="text-[9px] opacity-70 mt-0.5">{cell.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-5 pt-3 border-t border-[#E4E9F0] leading-relaxed">
                    <strong>Note:</strong> Policy Precision is 68.98% (516/748) and Policy Recall is 100.0% (516/516). Realized Precision (64.17%) and Recall (93.02%) account for the ~90% simulation realization success rate on retried payments.
                  </p>
                </div>
              )}

              {/* Calibration Bins */}
              <div className="bg-white border border-[#E4E9F0] rounded-2xl p-6 shadow-sm">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                  Reliability / Calibration Bins (10 Bins)
                </h2>
                <div className="space-y-2">
                  {calibrationBins.filter(b => b.count > 0).map((bin: CalibrationBin) => (
                    <div key={bin.bin_index} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-right font-mono text-slate-400 shrink-0 text-[11px]">
                        {(bin.bin_midpoint * 100).toFixed(1)}%
                      </span>
                      <div className="flex-1 h-3.5 bg-slate-100 rounded-lg overflow-hidden relative">
                        {/* Predicted bar */}
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-200 rounded-lg"
                          style={{ width: `${bin.bin_midpoint * 100}%` }}
                        />
                        {/* Observed bar */}
                        <div
                          className="absolute left-0 top-0 h-full bg-emerald-500/70 rounded-lg"
                          style={{ width: `${bin.observed_ratio * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-left font-mono text-emerald-700 shrink-0 text-[11px] font-semibold">
                        {(bin.observed_ratio * 100).toFixed(0)}%
                      </span>
                      <span className="text-slate-400 shrink-0 text-[11px]">n={bin.count}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#E4E9F0] text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 bg-blue-200 rounded inline-block" /> Predicted</span>
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
