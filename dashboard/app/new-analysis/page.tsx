'use client';

import React, { useState, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatINR, formatPercent } from '@/lib/data-access';
import {
  parsePaymentCSV,
  processBatchThroughEngine,
  generateDecisionedCSV,
  SAMPLE_RAZORPAY_CSV,
  RawPaymentRecord,
  ProcessedBatchRecord,
  BatchSummary,
} from '@/lib/batch-processor';
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
  Download,
  FileText,
  AlertTriangle,
  RotateCcw,
  Minus,
  AlertCircle,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  ArrowDownToLine,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const PIPELINE_STEPS = [
  { label: 'Payment events loaded & normalized', icon: Database },
  { label: 'Feature vector extracted (behavioral signals)', icon: Zap },
  { label: 'Calibrated ML recovery probability generated', icon: Cpu },
  { label: 'Policy guardrails & ERV thresholds evaluated', icon: ShieldCheck },
  { label: 'Probabilistic recovery outcome execution simulated', icon: TrendingUp },
  { label: 'Financial impact & baseline benchmarks computed', icon: BarChart3 },
];

export default function NewAnalysisPage() {
  const [mode, setMode] = useState<null | 'demo' | 'upload'>(null);
  const [progress, setProgress] = useState<number>(-1);
  const [done, setDone] = useState(false);

  // Upload Batch State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedRecords, setParsedRecords] = useState<RawPaymentRecord[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [processedResults, setProcessedResults] = useState<{
    processed: ProcessedBatchRecord[];
    summary: BatchSummary;
  } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ProcessedBatchRecord | null>(null);
  const [filterDecision, setFilterDecision] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 1. Demo Run Handler ──────────────────────────────────────────────────
  const runDemo = async () => {
    setMode('demo');
    setProgress(0);
    setDone(false);

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      await new Promise((res) => setTimeout(res, 600));
      setProgress(i + 1);
    }
    setDone(true);
  };

  // ── 2. CSV File Selection & Parsing ───────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      const res = parsePaymentCSV(text);
      if (res.success && res.records) {
        setParsedRecords(res.records);
        setParseError(null);
      } else {
        setParseError(res.error || 'Failed to parse CSV file.');
        setParsedRecords([]);
      }
    };
    reader.readAsText(file);
  };

  // ── 3. 1-Click Sample Data Loader ─────────────────────────────────────────
  const handleLoadSampleCSV = () => {
    setCsvRawText(SAMPLE_RAZORPAY_CSV);
    const blob = new Blob([SAMPLE_RAZORPAY_CSV], { type: 'text/csv' });
    const sampleFile = new File([blob], 'razorpay_failed_payments_sample.csv', { type: 'text/csv' });
    setCsvFile(sampleFile);

    const res = parsePaymentCSV(SAMPLE_RAZORPAY_CSV);
    if (res.success && res.records) {
      setParsedRecords(res.records);
      setParseError(null);
    }
  };

  // ── 4. Download Sample CSV Template ──────────────────────────────────────
  const handleDownloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_RAZORPAY_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'razorpay_failed_payments_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── 5. Run Batch Processing on Uploaded Records ───────────────────────────
  const handleExecuteBatch = async () => {
    if (parsedRecords.length === 0) return;
    setProgress(0);
    setDone(false);

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      await new Promise((res) => setTimeout(res, 500));
      setProgress(i + 1);
    }

    const results = processBatchThroughEngine(parsedRecords);
    setProcessedResults(results);
    setDone(true);
  };

  // ── 6. Download Decisioned CSV ────────────────────────────────────────────
  const handleDownloadDecisionedCSV = () => {
    if (!processedResults) return;
    const csvContent = generateDecisionedCSV(processedResults.processed);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `decisioned_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setMode(null);
    setProgress(-1);
    setDone(false);
    setCsvFile(null);
    setCsvRawText('');
    setParsedRecords([]);
    setParseError(null);
    setProcessedResults(null);
    setSelectedRecord(null);
  };

  // Filter processed records
  const displayRecords = processedResults
    ? filterDecision === 'ALL'
      ? processedResults.processed
      : processedResults.processed.filter((r) => r.decision === filterDecision)
    : [];

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-8 max-w-5xl mx-auto w-full">
      <PageHeader
        title="Start Recovery Pipeline Analysis"
        subtitle="Execute the end-to-end payment recovery decisioning workflow on failed transaction records."
      />

      {/* ── Initial Choice View ────────────────────────────────────────── */}
      {mode === null && (
        <div className="space-y-6">
          {/* Workflow Explanation Banner */}
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-7 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-extrabold text-slate-900 mb-2">
              Decision Engine Processing Workflow
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-5">
              The engine ingests failed payment events, synthesizes attempt history, applies a calibrated Logistic Regression model, enforces deterministic policy guardrails (ERV floor, retry velocity caps, terminal failure blocklist), and calculates exact net financial gains against blind retry baselines.
            </p>

            <div className="flex items-start gap-3 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-slate-700 font-medium">
              <Info size={16} className="mt-0.5 shrink-0 text-[#2E5BFF]" />
              <span>
                <strong>Expected schema:</strong> Standard payment ledger export containing fields:{' '}
                <code className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#2E5BFF]">
                  payment_id, customer_id, amount, payment_method, failure_reason, failed_at
                </code>
              </span>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Demo Analysis Option */}
            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-[28px] p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-700">
                  <Database size={11} />
                  Demo Dataset
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Demo Dataset Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                  Run the interactive 6-stage walkthrough using the completed 3,000 synthetic transaction dataset across 500 customers.
                </p>
              </div>

              <div className="pt-6">
                <button
                  onClick={runDemo}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-extrabold rounded-2xl transition-all shadow-2xs cursor-pointer"
                >
                  <Play size={14} className="text-[#2E5BFF]" />
                  <span>Run Demo Walkthrough</span>
                </button>
              </div>
            </div>

            {/* Production Integration: Upload Merchant CSV (NOW FULLY ACTIVE!) */}
            <div className="bg-white border-2 border-[#2E5BFF]/30 hover:border-[#2E5BFF] rounded-[28px] p-7 shadow-[0_4px_25px_-4px_rgba(46,91,255,0.08)] flex flex-col justify-between transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-bold text-[#2E5BFF]">
                  <Upload size={11} />
                  Batch Ingestion
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Upload Merchant CSV
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                  Upload actual failed transaction ledger exports from Razorpay webhooks or payment aggregators. Processes custom batches with live policy evaluation.
                </p>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setMode('upload')}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-[#2E5BFF] hover:bg-blue-700 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Upload size={14} className="fill-white" />
                  <span>Open Ingestion Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Demo Mode Progress View ────────────────────────────────────── */}
      {mode === 'demo' && (
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                {done ? 'Demo Pipeline Analysis Complete' : 'Executing Recovery Pipeline…'}
              </h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-[#2E5BFF] border border-blue-200'}`}>
                {done ? '100% Completed' : `Stage ${Math.min(progress + 1, 6)} of 6`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              3,000 synthetic transaction events · 500 customer accounts · Interactive preview
            </p>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2E5BFF] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(Math.max(progress, 0) / PIPELINE_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3 pt-2">
            {PIPELINE_STEPS.map((step, i) => {
              const completed = progress > i;
              const active = progress === i;
              const Icon = step.icon;

              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    completed
                      ? 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                      : active
                      ? 'bg-blue-50/60 border-blue-200 text-[#2E5BFF]'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      completed
                        ? 'bg-emerald-500 text-white'
                        : active
                        ? 'bg-[#2E5BFF] text-white'
                        : 'bg-slate-200/70 text-slate-400'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle size={16} />
                    ) : active ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${completed || active ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {done && (
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <Link
                href="/results"
                className="flex items-center gap-2 px-6 py-3 bg-[#2E5BFF] hover:bg-blue-700 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20"
              >
                <span>View Global Financial Results</span>
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={resetAll}
                className="px-5 py-3 text-xs font-bold text-slate-600 border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Return to Analysis Menu
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Upload Mode: Ingestion Studio & Execution ─────────────────── */}
      {mode === 'upload' && !done && (
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E5BFF]">
                  Production Ingestion Studio
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E5BFF]" />
                <span className="text-xs font-semibold text-slate-500">Custom Batch Processing</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                Upload Merchant Failed Payment Ledger
              </h2>
            </div>

            <button
              onClick={resetAll}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
            >
              ← Back to Menu
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#2E5BFF] bg-slate-50/70 hover:bg-blue-50/30 rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 group-hover:border-[#2E5BFF]/30 text-[#2E5BFF] flex items-center justify-center mx-auto mb-3 shadow-2xs transition-colors">
              <Upload size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {csvFile ? csvFile.name : 'Click to select CSV ledger or drag and drop here'}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Supports standard Razorpay webhook exports (.csv up to 25MB)
            </p>

            {/* Quick Action Helpers */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleLoadSampleCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-bold text-[#2E5BFF] shadow-2xs transition-all cursor-pointer"
              >
                <FileText size={12} />
                Load 20-Transaction Template Sample
              </button>
              <button
                onClick={handleDownloadSampleTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-bold text-slate-600 shadow-2xs transition-all cursor-pointer"
              >
                <Download size={12} />
                Download Blank Template CSV
              </button>
            </div>
          </div>

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 font-medium">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">CSV Schema Validation Error:</strong>
                {parseError}
              </div>
            </div>
          )}

          {/* Pre-Execution Ingestion Summary */}
          {parsedRecords.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Batch Ingestion Summary
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      Ready for Decision Engine Scoring
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={12} /> Schema Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Total Records</span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block metric-value">
                      {parsedRecords.length}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Revenue at Risk</span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block metric-value">
                      {formatINR(parsedRecords.reduce((acc, r) => acc + r.amount, 0))}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Payment Methods</span>
                    <span className="text-xs font-extrabold text-slate-700 mt-0.5 block truncate">
                      {Array.from(new Set(parsedRecords.map((r) => r.payment_method))).join(', ')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Intervention Cost</span>
                    <span className="text-base font-extrabold text-[#2E5BFF] mt-0.5 block metric-value">
                      ₹15.00 / retry
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button to Execute Pipeline */}
              <button
                onClick={handleExecuteBatch}
                disabled={progress >= 0}
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#2E5BFF] hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {progress >= 0 ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Processing Batch (Stage {progress} of 6)…</span>
                  </>
                ) : (
                  <>
                    <Play size={15} className="fill-white" />
                    <span>Process {parsedRecords.length} Transactions Through Decision Engine</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Upload Mode: Completed Batch Results View ───────────────────── */}
      {mode === 'upload' && done && processedResults && (
        <div className="space-y-7">
          {/* Executive Return Banner */}
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-7 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={13} /> Batch Decisioning Complete
                  </span>
                  <span className="text-xs text-slate-400 font-medium">·</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {processedResults.summary.total_records} Custom Ledger Records
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 metric-value">
                    {formatINR(processedResults.summary.net_recovery_value)}
                  </span>
                  <span className="text-xs font-extrabold text-[#2E5BFF] bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                    Net Value Created
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Gross recovered: <strong className="text-slate-800">{formatINR(processedResults.summary.gross_recovered)}</strong> across{' '}
                  <strong className="text-slate-800">{processedResults.summary.retry_count} retries</strong> (₹{processedResults.summary.intervention_fees} in gateway fees). Policy guardrails avoided{' '}
                  <strong className="text-emerald-700">{formatINR(processedResults.summary.fees_saved)}</strong> in fee waste on hard declines.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={handleDownloadDecisionedCSV}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2E5BFF] hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <ArrowDownToLine size={14} />
                  <span>Download Decisioned CSV</span>
                </button>
                <button
                  onClick={resetAll}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Analyze New Batch
                </button>
              </div>
            </div>
          </div>

          {/* Batch KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Ingested
              </span>
              <span className="text-2xl font-extrabold text-slate-900 metric-value block mt-1">
                {processedResults.summary.total_records}
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {formatINR(processedResults.summary.revenue_at_risk)} at risk
              </span>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Retries Approved
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 metric-value block mt-1">
                {processedResults.summary.retry_count}
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Positive ERV (&gt; ₹0.00)
              </span>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Blocked / Do Nothing
              </span>
              <span className="text-2xl font-extrabold text-slate-600 metric-value block mt-1">
                {processedResults.summary.do_nothing_count}
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Avoided ₹{processedResults.summary.fees_saved} fees
              </span>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Escalations
              </span>
              <span className="text-2xl font-extrabold text-amber-700 metric-value block mt-1">
                {processedResults.summary.escalate_count}
              </span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                High-value manual review
              </span>
            </div>
          </div>

          {/* Filter & Batch Results Table */}
          <div className="bg-white border border-slate-200/80 rounded-[28px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Processed Batch Decisions
                </h3>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  Interactive Decision &amp; Guardrail Inspector
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200/80">
                {['ALL', 'RETRY', 'DO_NOTHING', 'ESCALATE'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterDecision(f)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      filterDecision === f
                        ? 'bg-white text-[#2E5BFF] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80">
                    {['Payment ID', 'Amount', 'Method', 'Failure Reason', 'P(rec)', 'ERV', 'Decision', 'Outcome', 'Inspect'].map((h) => (
                      <th key={h} className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayRecords.map((r) => (
                    <tr key={r.payment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-mono text-[11px] text-slate-500">
                        {r.payment_id}
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-900 metric-value whitespace-nowrap">
                        {formatINR(r.amount)}
                      </td>
                      <td className="py-3 px-5 text-slate-600 font-medium">
                        {r.payment_method}
                      </td>
                      <td className="py-3 px-5 text-slate-500 font-medium max-w-[170px] truncate">
                        {r.failure_reason}
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-700 metric-value">
                        {formatPercent(r.p_recovery)}
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-900 metric-value whitespace-nowrap">
                        {formatINR(r.erv)}
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge value={r.decision} />
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge value={r.simulated_outcome} />
                      </td>
                      <td className="py-3 px-5">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-[#2E5BFF] hover:bg-blue-50 transition-colors cursor-pointer"
                          aria-label="Inspect guardrails"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium flex items-center justify-between px-6">
              <span>Showing {displayRecords.length} of {processedResults.processed.length} batch records</span>
              <button
                onClick={handleDownloadDecisionedCSV}
                className="text-[#2E5BFF] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download size={12} />
                Export Ledger with Decision Columns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Over Detail Inspector Drawer ────────────────────────── */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-slate-950/40 z-50 flex justify-end backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Custom Batch Decision Trace</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  ID: {selectedRecord.payment_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {/* Decision Action */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Action
                  </span>
                  <StatusBadge value={selectedRecord.decision} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount</span>
                    <span className="text-xs font-bold text-slate-900 metric-value block mt-0.5">
                      {formatINR(selectedRecord.amount)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">P(recovery)</span>
                    <span className="text-xs font-bold text-slate-900 metric-value block mt-0.5">
                      {formatPercent(selectedRecord.p_recovery)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Value (ERV)</span>
                    <span className="text-xs font-bold text-slate-900 metric-value block mt-0.5">
                      {formatINR(selectedRecord.erv)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Simulated Outcome</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {selectedRecord.simulated_outcome}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Decision Rationale
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 leading-relaxed font-medium">
                  {selectedRecord.decision_reason}
                </p>
              </div>

              {/* Guardrails Trace */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Policy Guardrail Evaluation Checklist
                </span>
                <div className="space-y-2">
                  {selectedRecord.guardrails.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 border border-slate-200/80 rounded-xl bg-white shadow-2xs"
                    >
                      {check.status === 'PASS' ? (
                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      ) : check.status === 'TRIGGERED' ? (
                        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800">{check.rule}</div>
                        {check.detail && (
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{check.detail}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
