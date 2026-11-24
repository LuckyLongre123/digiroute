'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  FileText,
  Code2,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import type { FormattedConsentLog, ConsentAuditSummary } from '@/lib/consent-logger';

type FilterTab = 'ALL_EVENTS' | 'ACCEPTED_ONLY' | 'REVOKED_ONLY' | 'USER_SUMMARY';

interface UserStatusItem {
  userId: string;
  userEmail: string;
  userName: string | null;
  currentStatus: 'ACCEPTED' | 'REVOKED';
  lastUpdatedAt: string;
  formattedDateIST: string;
}

export default function AdminConsentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConsentAuditSummary>({
    totalAcceptedUsers: 0,
    totalRevokedUsers: 0,
    totalEvents: 0,
  });
  const [logs, setLogs] = useState<FormattedConsentLog[]>([]);
  const [userStatuses, setUserStatuses] = useState<UserStatusItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL_EVENTS');
  const [expandedRawIds, setExpandedRawIds] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/consent-logs', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setLogs(data.logs || []);
        setUserStatuses(data.userStatuses || []);
      } else {
        throw new Error(data.error || 'Failed to fetch consent logs');
      }
    } catch (err) {
      console.error('[AdminConsent] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load consent logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleRaw = (id: string) => {
    setExpandedRawIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter logs based on search query and active tab
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.userEmail.toLowerCase().includes(q) ||
        (log.userName && log.userName.toLowerCase().includes(q)) ||
        log.userId.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'ACCEPTED_ONLY') return log.action === 'ACCEPTED';
      if (activeTab === 'REVOKED_ONLY') return log.action === 'REVOKED';
      return true;
    });
  }, [logs, searchQuery, activeTab]);

  // Filter user statuses for user summary tab
  const filteredUserStatuses = useMemo(() => {
    return userStatuses.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.userEmail.toLowerCase().includes(q) ||
        (u.userName && u.userName.toLowerCase().includes(q)) ||
        u.userId.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'ACCEPTED_ONLY') return u.currentStatus === 'ACCEPTED';
      if (activeTab === 'REVOKED_ONLY') return u.currentStatus === 'REVOKED';
      return true;
    });
  }, [userStatuses, searchQuery, activeTab]);

  return (
    <div className="space-y-6 font-mono text-zinc-100">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Consent &amp; Legal Audit Ledger
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Immutable, timestamped audit log of citizen Age (13+) and Terms of Service consent events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          type="button"
          className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Active Accepted Citizens</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {summary.totalAcceptedUsers}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/80">
            Currently valid legal consent
          </p>
        </div>

        <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Consent Revoked</span>
            <UserX className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {summary.totalRevokedUsers}
          </div>
          <p className="mt-1 text-[11px] text-amber-400/80">
            Revoked / unticked via Settings
          </p>
        </div>

        <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Total Audit Events</span>
            <FileText className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {summary.totalEvents}
          </div>
          <p className="mt-1 text-[11px] text-cyan-400/80">
            Immutable log entries recorded
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-[4px] border border-zinc-800 bg-zinc-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ALL_EVENTS')}
            className={`cursor-pointer rounded-[3px] px-3 py-1.5 transition-colors ${
              activeTab === 'ALL_EVENTS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All Events ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCEPTED_ONLY')}
            className={`cursor-pointer rounded-[3px] px-3 py-1.5 transition-colors ${
              activeTab === 'ACCEPTED_ONLY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Accepted Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REVOKED_ONLY')}
            className={`cursor-pointer rounded-[3px] px-3 py-1.5 transition-colors ${
              activeTab === 'REVOKED_ONLY'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Revoked Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('USER_SUMMARY')}
            className={`cursor-pointer rounded-[3px] px-3 py-1.5 transition-colors ${
              activeTab === 'USER_SUMMARY'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            User State Summary ({userStatuses.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search name, email, userId..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[3px] border border-zinc-700 bg-zinc-950 py-1.5 pr-3 pl-8 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-[3px] border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-xs text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
          <span>Loading normalized consent audit records...</span>
        </div>
      ) : activeTab === 'USER_SUMMARY' ? (
        /* User Status Summary Table */
        <div className="overflow-hidden rounded-[4px] border border-zinc-800 bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Citizen / User</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Last Updated (IST)</th>
                  <th className="px-4 py-3">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredUserStatuses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No citizen records found matching current query.
                    </td>
                  </tr>
                ) : (
                  filteredUserStatuses.map((u) => (
                    <tr key={u.userId} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {u.userName || 'Unnamed Citizen'}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{u.userEmail}</td>
                      <td className="px-4 py-3">
                        {u.currentStatus === 'ACCEPTED' ? (
                          <span className="inline-flex items-center gap-1 rounded-[2px] border border-emerald-500/40 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            ● Active Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[2px] border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                            ○ Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{u.formattedDateIST}</td>
                      <td className="px-4 py-3 text-[11px] text-zinc-500">{u.userId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Event Stream View */
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/30 p-8 text-center text-xs text-zinc-500">
              No consent audit events recorded yet. New user registrations and settings changes will appear here automatically.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isAccepted = log.action === 'ACCEPTED';
              const isRawExpanded = expandedRawIds.has(log.id);

              return (
                <div
                  key={log.id}
                  className="rounded-[4px] border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      {/* Badge and Human Narrative */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 rounded-[2px] border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                            ● ACCEPTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[2px] border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                            ○ REVOKED
                          </span>
                        )}
                        <span className="rounded border border-zinc-700/60 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                          {log.source}
                        </span>
                        <span className="rounded border border-zinc-700/60 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-400">
                          {log.policyVersion}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed text-zinc-200">
                        {log.humanReadable}
                      </p>
                    </div>

                    {/* Timestamp and Raw Toggle */}
                    <div className="flex shrink-0 items-center gap-2 self-start text-xs sm:self-auto">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{log.formattedDateIST}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleRaw(log.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-zinc-700/80 bg-zinc-800/80 px-2 py-1 text-[10px] text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-400"
                      >
                        <Code2 className="h-3 w-3" />
                        <span>Raw JSON</span>
                        {isRawExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Raw Normalized Record */}
                  {isRawExpanded && (
                    <div className="mt-3 overflow-x-auto rounded-[3px] border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-cyan-300/90">
                      <div className="mb-1 text-[10px] text-zinc-500 uppercase">
                        Normalized Server Record (JSON)
                      </div>
                      <pre className="font-mono whitespace-pre-wrap">
                        {JSON.stringify(
                          {
                            id: log.id,
                            userId: log.userId,
                            userEmail: log.userEmail,
                            userName: log.userName,
                            consentType: log.consentType,
                            action: log.action,
                            policyVersion: log.policyVersion,
                            source: log.source,
                            userAgent: log.userAgent,
                            createdAt: log.createdAt,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
