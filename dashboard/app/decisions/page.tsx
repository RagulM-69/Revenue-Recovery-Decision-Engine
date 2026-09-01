'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getDecisions,
  formatINR,
  formatPercent,
  formatDate,
} from '@/lib/data-access';
import { Decision } from '@/lib/types';
import { Search, Filter, Eye, X, CheckCircle, AlertOctagon, Info } from 'lucide-react';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const list = await getDecisions(run.run_id, 'ALL', 1000);
      setDecisions(list);
      setFilteredDecisions(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle filtering
  useEffect(() => {
    let result = decisions;

    if (decisionFilter !== 'ALL') {
      result = result.filter((d) => d.decision === decisionFilter);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.payment_id.toLowerCase().includes(q) ||
          d.event_id.toLowerCase().includes(q) ||
          d.decision_reason.toLowerCase().includes(q)
      );
    }

    setFilteredDecisions(result);
  }, [decisionFilter, searchQuery, decisions]);

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Recovery Decisions"
        subtitle="Search, filter, and inspect automated policy decisions, P(recovery) scores, ERV math, and guardrail checklists."
        onRefresh={fetchData}
      />

      <div className="p-8 space-y-6">
        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Payment ID or Event ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Filter size={15} className="text-slate-400" />
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              {['ALL', 'RETRY', 'ESCALATE', 'DO_NOTHING'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDecisionFilter(filter)}
                  className={`px-3 py-1.5 rounded-md transition-all duration-150 cursor-pointer ${
                    decisionFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decisions Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Payment ID</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">P(recovery)</th>
                  <th className="py-3.5 px-4">ERV</th>
                  <th className="py-3.5 px-4">Decision</th>
                  <th className="py-3.5 px-4">Model</th>
                  <th className="py-3.5 px-4">Reason Summary</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading decisions data...
                    </td>
                  </tr>
                ) : filteredDecisions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No decisions match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredDecisions.slice(0, 100).map((item) => (
                    <tr
                      key={item.decision_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {item.payment_id.substring(0, 12)}...
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.payment ? formatINR(item.payment.amount) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatPercent(item.p_recovery)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatINR(item.erv)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge label={item.decision} type={item.decision} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {item.model_version}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                        {item.decision_reason}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedDecision(item)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Decision Inspection Drawer / Modal */}
      {selectedDecision && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Decision Inspection Audit
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedDecision.decision_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedDecision(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Decision Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">FINAL DECISION</span>
                <Badge label={selectedDecision.decision} type={selectedDecision.decision} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-500">P(recovery):</span>{' '}
                  <span className="font-bold text-slate-900">
                    {formatPercent(selectedDecision.p_recovery)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Expected Recovery (ERV):</span>{' '}
                  <span className="font-bold text-slate-900">
                    {formatINR(selectedDecision.erv)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Model Version:</span>{' '}
                  <span className="font-mono text-slate-700">{selectedDecision.model_version}</span>
                </div>
                <div>
                  <span className="text-slate-500">Policy Version:</span>{' '}
                  <span className="font-mono text-slate-700">{selectedDecision.policy_version}</span>
                </div>
              </div>
            </div>

            {/* Guardrail Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Audited Guardrail Evaluation Checklist
              </h4>
              <div className="space-y-2">
                {selectedDecision.guardrails_applied &&
                  selectedDecision.guardrails_applied.map((check, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3"
                    >
                      {check.status === 'PASS' ? (
                        <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      ) : check.status === 'TRIGGERED' ? (
                        <AlertOctagon size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <X className="text-rose-500 mt-0.5 shrink-0" size={16} />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {check.rule}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {check.detail || `Status: ${check.status}`}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDecision(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
