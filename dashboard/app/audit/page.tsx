'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLatestCompletedRun, getAuditLogs, formatDate } from '@/lib/data-access';
import { AuditLogEntry } from '@/lib/types';
import { Search, ChevronDown, ChevronUp, RefreshCw, Database, Lock } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filtered, setFiltered] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(3000);

  const load = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const list = await getAuditLogs(run.run_id, 200);
      setLogs(list);
      setFiltered(list);
      setTotalCount(run.total_events_processed || 3000);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(logs);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      logs.filter(
        l =>
          l.entity_type.toLowerCase().includes(q) ||
          l.event_type.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.entity_id.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, logs]);

  return (
    <div className="flex-1 p-8 sm:p-10 space-y-8 max-w-[1550px] mx-auto w-full">
      <PageHeader
        title="Immutable Audit Ledger"
        subtitle={`Tamper-evident operational audit trail recording every automated model prediction, policy evaluation, and simulated outcome across all ${totalCount.toLocaleString()} pipeline events.`}
        actions={
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
              <Database size={12} className="text-slate-500" />
              {totalCount.toLocaleString()} Total Records
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

      {/* ── Search Input ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event type, entity type, actor, or entity ID…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5BFF]/20 focus:border-[#2E5BFF] transition-all font-medium"
          />
        </div>
      </div>

      {/* ── Audit Table ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            Verifying tamper-evident audit records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            No audit records match your search query.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    {['Timestamp', 'Actor', 'Event Type', 'Entity Type', 'Entity ID', 'Audit Payload'].map(h => (
                      <th key={h} className="py-3 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 200).map(log => (
                    <React.Fragment key={log.log_id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3 px-5 font-mono text-[11px] text-slate-800 font-semibold">{log.actor}</td>
                        <td className="py-3 px-5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 font-mono">
                            {log.event_type}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-600 font-mono text-[11px]">{log.entity_type}</td>
                        <td className="py-3 px-5 font-mono text-[11px] text-slate-400">
                          {log.entity_id.substring(0, 16)}…
                        </td>
                        <td className="py-3 px-5">
                          <button
                            onClick={() => setExpandedId(expandedId === log.log_id ? null : log.log_id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#2E5BFF] transition-colors cursor-pointer"
                          >
                            {expandedId === log.log_id ? (
                              <><ChevronUp size={12} /> Hide Payload</>
                            ) : (
                              <><ChevronDown size={12} /> View Payload</>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedId === log.log_id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-slate-950 border-y border-slate-800">
                            <pre className="text-[11px] text-emerald-400 font-mono py-1 overflow-x-auto whitespace-pre-wrap max-h-60 leading-relaxed">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Showing latest {filtered.length.toLocaleString()} of {totalCount.toLocaleString()} audit records</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Lock size={11} /> Append-Only Ledger
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
