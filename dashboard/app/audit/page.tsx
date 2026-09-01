'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLatestCompletedRun, getAuditLogs, formatDate } from '@/lib/data-access';
import { AuditLogEntry } from '@/lib/types';
import { Search, ChevronDown, ChevronUp, RefreshCw, ShieldAlert } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filtered, setFiltered] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const load = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const list = await getAuditLogs(run.run_id, 200);
      setLogs(list);
      setFiltered(list);
      setTotalCount(run.total_events_processed);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
    <div className="flex-1">
      <PageHeader
        title="Audit Log"
        subtitle={`Immutable, append-only record of every system action. ${logs.length.toLocaleString()} entries from the latest analysis run.`}
        actions={
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      <div className="p-8 space-y-5">
        {/* Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by entity type, event type, actor, or entity ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading audit records…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              {logs.length === 0
                ? 'No audit records found. Run an analysis to generate audit entries.'
                : 'No records match your search.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Timestamp', 'Actor', 'Event Type', 'Entity Type', 'Entity ID', 'Payload'].map(h => (
                        <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.slice(0, 200).map(log => (
                      <React.Fragment key={log.log_id}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{log.actor}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 font-mono">
                              {log.event_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-600 font-mono">{log.entity_type}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {log.entity_id.substring(0, 14)}…
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setExpandedId(expandedId === log.log_id ? null : log.log_id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              {expandedId === log.log_id ? (
                                <><ChevronUp size={13} /> Hide</>
                              ) : (
                                <><ChevronDown size={13} /> Inspect</>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedId === log.log_id && (
                          <tr>
                            <td colSpan={6} className="px-4 py-0 bg-slate-950">
                              <pre className="text-[11px] text-emerald-400 font-mono py-4 overflow-x-auto whitespace-pre-wrap max-h-64">
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
              {filtered.length > 200 && (
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
                  Showing 200 of {filtered.length.toLocaleString()} records
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldAlert size={13} />
          <span>All audit entries are append-only. Records cannot be modified or deleted after creation.</span>
        </div>
      </div>
    </div>
  );
}
