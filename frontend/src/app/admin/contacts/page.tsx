'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  Trash2,
  CheckCircle2,
  Eye,
  AlertOctagon,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { formatToIST } from '@/lib/contact-types';
import type { ContactMessageRecord } from '@/lib/contact-types';

type StatusFilter = 'ALL' | 'NEW' | 'REVIEWED' | 'RESOLVED';

export default function AdminContactsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/contacts', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        throw new Error(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('[AdminContacts] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusUpdate = async (
    id: string,
    newStatus: 'NEW' | 'REVIEWED' | 'RESOLVED'
  ) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('[AdminContacts] Update status error:', err);
      alert('Network error while updating status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this message?')) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/contacts?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(data.error || 'Failed to delete message');
      }
    } catch (err) {
      console.error('[AdminContacts] Delete error:', err);
      alert('Network error while deleting message');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = messages.length;
    const newCount = messages.filter((m) => m.status === 'NEW').length;
    const takedowns = messages.filter(
      (m) => m.category === 'Doorway Photo Takedown'
    ).length;
    const resolved = messages.filter((m) => m.status === 'RESOLVED').length;
    return { total, newCount, takedowns, resolved };
  }, [messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q) ||
        msg.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== 'ALL' && msg.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== 'ALL' && msg.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [messages, searchQuery, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
              Contact Transmissions
            </h1>
            <span className="rounded-[3px] border border-cyan-800/60 bg-cyan-950/80 px-2 py-0.5 font-mono text-xs text-cyan-400">
              {messages.length} total
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Inbox for general inquiries, feedback, bug reports, and doorway photo takedown requests.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Total Messages</span>
            <MessageSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-100">
            {metrics.total}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">All recorded transmissions</p>
        </div>

        <div className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">New / Unread</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-400">
            {metrics.newCount}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Awaiting initial review</p>
        </div>

        <div className="rounded-[4px] border border-orange-500/30 bg-orange-950/10 p-4">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-xs font-medium">Photo Takedowns</span>
            <AlertOctagon className="h-4 w-4 text-orange-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-orange-400">
            {metrics.takedowns}
          </p>
          <p className="mt-0.5 text-[11px] text-orange-300/80">24-hour SLA priority queue</p>
        </div>

        <div className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
            {metrics.resolved}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Closed transmissions</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'NEW', 'REVIEWED', 'RESOLVED'] as StatusFilter[]).map((tab) => {
              const active = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-[3px] px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                    active
                      ? 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 font-semibold'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All Statuses' : tab}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="cat-filter" className="text-xs text-zinc-400 font-mono">
              Category:
            </label>
            <select
              id="cat-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-[3px] border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 font-mono transition-colors focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Doorway Photo Takedown">Doorway Photo Takedown</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Bug / Technical Issue">Bug / Technical Issue</option>
              <option value="Feedback">Feedback</option>
            </select>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender name, email, category, or message text..."
            className="w-full rounded-[4px] border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Message List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-[4px] border border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            <span>Loading contact queue...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[4px] border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-400 font-mono">
          <p className="font-bold">Error loading messages:</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-500 text-xs font-mono">
          No contact messages match your current filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const isTakedown = msg.category === 'Doorway Photo Takedown';
            const isActionLoading = actionLoadingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`rounded-[4px] border p-4 sm:p-5 transition-colors ${
                  isTakedown
                    ? 'border-orange-500/30 bg-orange-950/5'
                    : 'border-zinc-800 bg-zinc-950'
                }`}
              >
                {/* Top Info Bar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-100 text-sm">
                      {msg.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyEmail(msg.email, msg.id)}
                      title="Copy email to clipboard"
                      className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      <span>{msg.email}</span>
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-zinc-500" />
                      )}
                    </button>

                    {/* Category Pill */}
                    <span
                      className={`rounded-[3px] px-2 py-0.5 font-mono text-[11px] font-semibold ${
                        isTakedown
                          ? 'border border-orange-500/40 bg-orange-950/40 text-orange-400'
                          : msg.category === 'Bug / Technical Issue'
                          ? 'border border-red-500/30 bg-red-950/30 text-red-400'
                          : 'border border-zinc-700 bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      {msg.category}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`rounded-[3px] px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        msg.status === 'NEW'
                          ? 'border border-amber-500/40 bg-amber-950/40 text-amber-400'
                          : msg.status === 'REVIEWED'
                          ? 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-400'
                          : 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="text-[11px] font-mono text-zinc-500">
                    {formatToIST(msg.createdAt)}
                  </div>
                </div>

                {/* Message Body */}
                <div className="my-3 rounded-[3px] border border-zinc-800/60 bg-zinc-900/60 p-3.5 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans">
                  {msg.message}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    {msg.status !== 'REVIEWED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(msg.id, 'REVIEWED')}
                        disabled={isActionLoading}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-cyan-800/60 bg-cyan-950/30 px-2.5 py-1 text-cyan-300 transition-colors hover:bg-cyan-900/40 disabled:opacity-50"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Mark Reviewed</span>
                      </button>
                    )}

                    {msg.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(msg.id, 'RESOLVED')}
                        disabled={isActionLoading}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-emerald-800/60 bg-emerald-950/30 px-2.5 py-1 text-emerald-300 transition-colors hover:bg-emerald-900/40 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Mark Resolved</span>
                      </button>
                    )}

                    {msg.status === 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(msg.id, 'NEW')}
                        disabled={isActionLoading}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Clock className="h-3 w-3" />
                        <span>Reopen as New</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Regarding your DigiRoute inquiry (${msg.category})`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <Send className="h-3 w-3 text-cyan-400" />
                      <span>Reply via Email Client</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(msg.id)}
                      disabled={isActionLoading}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-red-800/60 bg-red-950/30 px-2.5 py-1 text-red-300 transition-colors hover:bg-red-900/40 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
