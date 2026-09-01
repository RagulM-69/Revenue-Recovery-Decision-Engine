'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import {
  getLatestCompletedRun,
  getAuditLogs,
  formatDate,
} from '@/lib/data-access';
import { AuditLogEntry } from '@/lib/types';
import { History, Search, Eye, X, Code } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    const run = await getLatestCompletedRun();
    if (run) {
      const logList = await getAuditLogs(run.run_id, 1000);
      setLogs(logList);
      setFilteredLogs(logList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLogs(logs);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (l) =>
            l.actor.toLowerCase().includes(q) ||
            l.event_type.toLowerCase().includes(q) ||
            l.entity_id.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, logs]);

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Audit Trail & Security Logs"
        subtitle="Immutable append-only audit trail logging all policy evaluations, model scoring events, and recovery decisions."
        onRefresh={fetchData}
      />

      <div className="p-8 space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Actor, Event Type, or Entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total Audit Records: {filteredLogs.length}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Entity ID</th>
                  <th className="py-3.5 px-4 text-right">View Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No audit entries found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.slice(0, 100).map((item) => (
                    <tr
                      key={item.log_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.actor}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge label={item.event_type} type="COMPLETED" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.entity_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {item.entity_id.substring(0, 12)}...
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(item)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          <Code size={14} />
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

      {/* JSON Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Audit Event Payload Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-400">
              <p><span className="text-slate-500">Log ID:</span> {selectedLog.log_id}</p>
              <p><span className="text-slate-500">Event Type:</span> {selectedLog.event_type}</p>
              <p><span className="text-slate-500">Actor:</span> {selectedLog.actor}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800 font-mono text-xs text-emerald-400">
              <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Payload Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
