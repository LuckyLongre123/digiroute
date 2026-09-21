'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AdminDetailPanel } from '@/components/admin/AdminDetailPanel';
import {
  Search,
  X,
  Share2,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface AddressRecord {
  id?: string;
  slug: string;
  digipin: string;
  baseLat: number;
  baseLng: number;
  entranceLat: number;
  entranceLng: number;
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  label?: string | null;
  routingNotes?: string | null;
  doorwayPhotoUrl?: string | null;
  isEphemeral: boolean;
  expiresAt?: string | null;
  userId?: string | null;
  createdAt: string;
}

type NodeData = {
  type: 'user' | 'address';
  record: UserRecord | AddressRecord;
  isBrokenMedia?: boolean;
};

function UserNode({ data }: { data: NodeData }) {
  const u = data.record as UserRecord;
  return (
    <div
      className="relative min-w-[160px] cursor-pointer rounded-sm px-3.5 py-3 font-mono text-sm md:px-3 md:py-2.5 md:text-xs"
      style={{
        backgroundColor: '#0c1a2e',
        border: '1px solid #1d4ed8',
        color: '#93c5fd',
        boxShadow: '0 0 12px rgba(59,130,246,0.3)',
      }}
    >
      <div
        className="mb-1 text-xs font-semibold tracking-wider uppercase md:text-[10px]"
        style={{ color: '#3b82f6' }}
      >
        User
      </div>
      <div className="max-w-[140px] truncate font-semibold" title={u.email}>
        {u.name || u.email?.split('@')[0] || 'Anonymous'}
      </div>
      <div
        className="mt-0.5 max-w-[140px] truncate text-xs opacity-60 md:text-[10px]"
        title={u.email}
      >
        {u.email || 'no email'}
      </div>
      {/* ReactFlow Source Handle for connecting edges to Addresses */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-none !bg-cyan-400"
      />
    </div>
  );
}

function AddressNode({ data }: { data: NodeData }) {
  const a = data.record as AddressRecord;
  const isMissingMedia =
    !a.doorwayPhotoUrl ||
    a.doorwayPhotoUrl.trim().length === 0 ||
    data.isBrokenMedia;

  return (
    <div
      className="relative min-w-[170px] cursor-pointer rounded-sm px-3.5 py-3 font-mono text-sm md:px-3 md:py-2.5 md:text-xs"
      style={{
        backgroundColor: '#0a1a1a',
        border: isMissingMedia
          ? '1px solid #f59e0b'
          : a.isEphemeral
            ? '1px solid #f59e0b'
            : '1px solid #0e7490',
        color: a.isEphemeral ? '#fcd34d' : '#67e8f9',
        boxShadow: isMissingMedia
          ? '0 0 12px rgba(245,158,11,0.25)'
          : a.isEphemeral
            ? '0 0 10px rgba(245,158,11,0.2)'
            : '0 0 12px rgba(6,182,212,0.25)',
      }}
    >
      {/* ReactFlow Target Handle for incoming edges from Users */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-none !bg-cyan-400"
      />
      <div className="mb-1 flex items-center justify-between gap-1">
        <div
          className="text-xs font-semibold tracking-wider uppercase md:text-[10px]"
          style={{ color: a.isEphemeral ? '#f59e0b' : '#22d3ee' }}
        >
          {a.isEphemeral ? 'Guest Addr' : 'Address'}
        </div>
        {isMissingMedia && (
          <span
            className="flex items-center gap-0.5 rounded-[2px] border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 md:text-[8px]"
            title="Doorway photo is missing or broken"
          >
            ⚠️ Missing
          </span>
        )}
      </div>
      <div className="font-mono font-bold tracking-wider">{a.digipin}</div>
      {a.label && (
        <div className="mt-0.5 max-w-[150px] truncate text-xs opacity-60 md:text-[10px]">
          {a.label}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  userNode: UserNode,
  addressNode: AddressNode,
};

function buildGraph(
  users: UserRecord[],
  addresses: AddressRecord[],
  brokenSlugs?: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];

  const COL_W = 240;
  const ROW_H = 110;
  const ADDR_COL_X = 380;
  let userY = 40;
  const guestY = 40;

  // Map userId → addresses
  const byUser: Record<string, AddressRecord[]> = {};
  const guestAddresses: AddressRecord[] = [];
  for (const a of addresses) {
    if (a.userId) {
      byUser[a.userId] = byUser[a.userId] || [];
      byUser[a.userId].push(a);
    } else {
      guestAddresses.push(a);
    }
  }

  // User nodes
  users.forEach((u) => {
    nodes.push({
      id: u.id,
      type: 'userNode',
      position: { x: 40, y: userY },
      data: { type: 'user', record: u } as NodeData,
    });

    const userAddresses = byUser[u.id] || [];
    userAddresses.forEach((a, ai) => {
      const addrId = a.id || a.slug;
      nodes.push({
        id: addrId,
        type: 'addressNode',
        position: { x: ADDR_COL_X, y: userY + ai * ROW_H },
        data: {
          type: 'address',
          record: a,
          isBrokenMedia: brokenSlugs?.has(a.slug),
        } as NodeData,
      });
    });

    userY += Math.max(1, userAddresses.length) * ROW_H + 40;
  });

  // Guest addresses (no user)
  const GUEST_X = ADDR_COL_X + COL_W + 80;
  guestAddresses.forEach((a, gi) => {
    const addrId = a.id || a.slug;
    nodes.push({
      id: addrId,
      type: 'addressNode',
      position: { x: GUEST_X, y: guestY + gi * ROW_H },
      data: {
        type: 'address',
        record: a,
        isBrokenMedia: brokenSlugs?.has(a.slug),
      } as NodeData,
    });
  });

  // Filter addresses that have a userId and map them to create connecting edges
  const edges: Edge[] = addresses
    .filter((a) => Boolean(a.userId))
    .map((a) => {
      const addrId = a.id || a.slug;
      return {
        id: `e-${a.userId}-${addrId}`,
        source: a.userId!,
        target: addrId,
        animated: true,
        style: { stroke: '#22d3ee', strokeWidth: 1.5 },
        type: 'smoothstep',
      };
    });

  return { nodes, edges };
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [allAddresses, setAllAddresses] = useState<AddressRecord[]>([]);

  // Search and view mode state
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [addressSearchTerm, setAddressSearchTerm] = useState('');
  const [addressFilter, setAddressFilter] = useState<
    'all' | 'missing' | 'guest' | 'saved'
  >('all');

  // Audit and integrity state
  const [isAuditing, setIsAuditing] = useState(false);
  const [brokenSlugs, setBrokenSlugs] = useState<Set<string>>(new Set());

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(userSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearchTerm]);

  const [selected, setSelected] = useState<{
    type: 'user' | 'address';
    record: UserRecord | AddressRecord;
  } | null>(null);

  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    addresses: 0,
    guests: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/admin/login');
        router.refresh();
        return;
      }
      const data = await res.json();
      const users: UserRecord[] = data.users || [];
      const addresses: AddressRecord[] = data.addresses || [];
      setAllUsers(users);
      setAllAddresses(addresses);
      setStats({
        users: users.length,
        addresses: addresses.length,
        guests: addresses.filter((a) => !a.userId).length,
      });
    } catch {
      setError('Failed to load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/data', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.status === 401) {
          router.push('/admin/login');
          router.refresh();
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const users: UserRecord[] = data.users || [];
          const addresses: AddressRecord[] = data.addresses || [];
          setAllUsers(users);
          setAllAddresses(addresses);
          setStats({
            users: users.length,
            addresses: addresses.length,
            guests: addresses.filter((a) => !a.userId).length,
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load data. Check your connection.');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Milestone 1: Database Integrity Audit & Sync
  const handleAuditSync = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    try {
      const res = await fetch('/api/admin/sync-media', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        const cleaned: string[] = data.cleanedSlugs || [];
        setBrokenSlugs(new Set(cleaned));
        if (cleaned.length > 0) {
          toast.warning(
            `Audit identified & cleaned ${cleaned.length} broken photo reference${cleaned.length > 1 ? 's' : ''} from database.`
          );
        } else {
          toast.success(
            `Database Integrity Sync complete: verified ${data.verifiedOk} active media references.`
          );
        }
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to complete integrity audit.');
      }
    } catch {
      toast.error('Network error during database audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Missing media count
  const missingMediaCount = useMemo(() => {
    return allAddresses.filter(
      (a) =>
        !a.doorwayPhotoUrl ||
        a.doorwayPhotoUrl.trim().length === 0 ||
        brokenSlugs.has(a.slug)
    ).length;
  }, [allAddresses, brokenSlugs]);

  // Rebuild graph when data, search query, or broken media state changes
  useEffect(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    let displayUsers = allUsers;
    let displayAddresses = allAddresses;

    if (q) {
      displayUsers = allUsers.filter((u) => {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const id = (u.id || '').toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q);
      });

      const matchedUserIds = new Set(displayUsers.map((u) => u.id));
      displayAddresses = allAddresses.filter(
        (a) => a.userId && matchedUserIds.has(a.userId)
      );
    }

    const { nodes: n, edges: e } = buildGraph(
      displayUsers,
      displayAddresses,
      brokenSlugs
    );
    setNodes(n);
    setEdges(e);
  }, [
    allUsers,
    allAddresses,
    debouncedSearchTerm,
    brokenSlugs,
    setNodes,
    setEdges,
  ]);

  // Filter addresses for table view
  const filteredAddresses = useMemo(() => {
    let list = allAddresses;
    if (addressFilter === 'missing') {
      list = list.filter(
        (a) =>
          !a.doorwayPhotoUrl ||
          a.doorwayPhotoUrl.trim().length === 0 ||
          brokenSlugs.has(a.slug)
      );
    } else if (addressFilter === 'guest') {
      list = list.filter((a) => !a.userId);
    } else if (addressFilter === 'saved') {
      list = list.filter((a) => Boolean(a.userId));
    }

    const q = addressSearchTerm.trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) => {
      const digipin = (a.digipin || '').toLowerCase();
      const label = (a.label || '').toLowerCase();
      const slug = (a.slug || '').toLowerCase();
      const flat = (a.flat || '').toLowerCase();
      const landmark = (a.landmark || '').toLowerCase();
      const uid = (a.userId || '').toLowerCase();
      return (
        digipin.includes(q) ||
        label.includes(q) ||
        slug.includes(q) ||
        flat.includes(q) ||
        landmark.includes(q) ||
        uid.includes(q)
      );
    });
  }, [allAddresses, addressFilter, addressSearchTerm, brokenSlugs]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const d = node.data as NodeData;
    setIsDetailLoading(true);
    setSelected({ type: d.type, record: d.record });
    setTimeout(() => {
      setIsDetailLoading(false);
    }, 150);
  }, []);

  const handleDelete = async (type: 'user' | 'address', id: string) => {
    if (type === 'user') {
      await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
    } else {
      await fetch('/api/admin/delete-address', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: id }),
      });
    }
    setSelected(null);
    fetchData();
  };

  const handleUpdate = async (
    slug: string,
    updates: Record<string, unknown>
  ) => {
    await fetch('/api/admin/update-address', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, updates }),
    });
    fetchData();
  };

  const handleUpdateUser = async (
    userId: string,
    updates: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    }
  ) => {
    const res = await fetch('/api/admin/update-user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update user');
    }
    fetchData();
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden font-mono select-none">
      {/* ─── Top Bar & Navigation Controls ─────────────────────────────────── */}
      <header
        className="flex shrink-0 flex-col gap-3 border-b px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-2.5"
        style={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
      >
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
          {/* View Mode Switch */}
          <div className="grid w-full grid-cols-2 items-center gap-1 rounded-[3px] border border-zinc-800 bg-zinc-950 p-1 font-mono text-xs sm:flex sm:w-auto md:p-0.5 md:text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[2px] px-3.5 py-2.5 transition-colors md:min-h-0 md:px-2.5 md:py-1 ${
                viewMode === 'graph'
                  ? 'bg-cyan-400/10 font-semibold text-cyan-400'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Share2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[2px] px-3.5 py-2.5 transition-colors md:min-h-0 md:px-2.5 md:py-1 ${
                viewMode === 'table'
                  ? 'bg-cyan-400/10 font-semibold text-cyan-400'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <TableIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span>Address Table</span>
            </button>
          </div>

          {/* Context Search Filter */}
          {viewMode === 'graph' ? (
            <div className="relative flex w-full items-center md:w-auto">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 md:left-2.5 md:h-3.5 md:w-3.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="h-11 min-h-[44px] w-full rounded-[3px] border border-zinc-800 bg-zinc-900 px-3 py-2 pr-9 pl-9 font-mono text-sm text-zinc-100 transition-colors placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none md:h-8 md:min-h-0 md:w-56 md:text-[11px] lg:w-60"
              />
              {userSearchTerm && (
                <button
                  type="button"
                  onClick={() => setUserSearchTerm('')}
                  className="absolute top-1/2 right-2 flex min-h-[44px] min-w-[36px] -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200"
                  title="Clear search"
                >
                  <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative flex w-full items-center md:w-auto">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 md:left-2.5 md:h-3.5 md:w-3.5" />
              <input
                type="text"
                value={addressSearchTerm}
                onChange={(e) => setAddressSearchTerm(e.target.value)}
                placeholder="Filter addresses (DIGIPIN, label)..."
                className="h-11 min-h-[44px] w-full rounded-[3px] border border-zinc-800 bg-zinc-900 px-3 py-2 pr-9 pl-9 font-mono text-sm text-zinc-100 transition-colors placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none md:h-8 md:min-h-0 md:w-60 md:text-[11px] lg:w-64"
              />
              {addressSearchTerm && (
                <button
                  type="button"
                  onClick={() => setAddressSearchTerm('')}
                  className="absolute top-1/2 right-2 flex min-h-[44px] min-w-[36px] -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200"
                  title="Clear filter"
                >
                  <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Action Tools & Stat Pills */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5 sm:justify-end sm:gap-3 md:w-auto">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <StatPill label="Users" value={stats.users} color="#3b82f6" />
            <StatPill
              label="Addresses"
              value={stats.addresses}
              color="#22d3ee"
            />
            <StatPill
              label="Missing Media"
              value={missingMediaCount}
              color="#f59e0b"
            />
          </div>

          <div className="flex w-full items-center gap-2.5 sm:w-auto">
            {/* Audit DB / Sync Button */}
            <button
              type="button"
              onClick={handleAuditSync}
              disabled={isAuditing || loading}
              title="Scan database and CDN to detect broken/missing doorway photos"
              className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-amber-900/60 bg-amber-950/20 px-3.5 py-2.5 font-mono text-sm whitespace-nowrap text-amber-400 transition-colors hover:border-amber-400 hover:bg-amber-950/40 hover:text-amber-300 disabled:opacity-50 sm:flex-initial md:min-h-0 md:gap-1.5 md:px-2.5 md:py-1 md:text-xs"
            >
              <Sparkles
                size={14}
                className={
                  isAuditing ? 'animate-spin text-amber-400' : 'text-amber-400'
                }
              />
              <span>{isAuditing ? 'auditing...' : '$ audit db / sync'}</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              title="Refresh database records"
              className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-zinc-800 px-3.5 py-2.5 font-mono text-sm whitespace-nowrap text-zinc-400 transition-colors hover:border-cyan-400 hover:text-cyan-400 sm:flex-initial md:min-h-0 md:gap-1.5 md:px-2.5 md:py-1 md:text-xs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>$ refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main View Switcher ────────────────────────────────────────────── */}
      <div className="relative min-h-[500px] w-full flex-1 overflow-hidden md:min-h-0">
        {loading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ backgroundColor: '#09090b' }}
          >
            <div className="font-mono text-xs text-cyan-400">
              <span className="animate-pulse">loading data...</span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-4"
            style={{ backgroundColor: '#09090b' }}
          >
            <p className="font-mono text-xs text-rose-400">{error}</p>
          </div>
        )}

        {/* ─── VIEW 1: REACT FLOW GRAPH VIEW ───────────────────────────────── */}
        {viewMode === 'graph' && !loading && !error && (
          <div className="relative h-[65vh] min-h-[500px] w-full md:h-full">
            {nodes.length === 0 ? (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center"
                style={{ backgroundColor: '#09090b' }}
              >
                <Search className="mb-2 h-8 w-8 text-zinc-600" />
                <p className="font-mono text-sm text-zinc-400">
                  No users found matching &ldquo;{debouncedSearchTerm}&rdquo;
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-600">
                  Try searching by name, email, or user ID.
                </p>
                <button
                  type="button"
                  onClick={() => setUserSearchTerm('')}
                  className="mt-3 cursor-pointer rounded border border-cyan-400/40 px-3 py-1 font-mono text-xs text-cyan-400 transition-colors hover:bg-cyan-400/10"
                >
                  $ clear filter
                </button>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                style={{
                  backgroundColor: '#09090b',
                  width: '100%',
                  height: '100%',
                  minHeight: '500px',
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1}
                  color="#27272a"
                />
                <Controls
                  style={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    color: '#71717a',
                  }}
                />
                <MiniMap
                  style={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                  }}
                  nodeColor={(n) =>
                    (n.data as NodeData).type === 'user' ? '#1d4ed8' : '#0e7490'
                  }
                  maskColor="rgba(9,9,11,0.8)"
                />
              </ReactFlow>
            )}
          </div>
        )}

        {/* ─── VIEW 2: MILESTONE 1 ADDRESS TABLE VIEW ───────────────────────── */}
        {viewMode === 'table' && !loading && !error && (
          <div className="flex h-full flex-col overflow-hidden bg-zinc-950 p-4 sm:p-5 md:p-6">
            {/* Filter Pills Bar */}
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs md:gap-1.5 md:text-[11px]">
                <button
                  type="button"
                  onClick={() => setAddressFilter('all')}
                  className={`flex min-h-[44px] cursor-pointer items-center rounded-sm border px-3.5 py-2 transition-colors md:min-h-0 md:px-2.5 md:py-1 ${
                    addressFilter === 'all'
                      ? 'border-cyan-500/60 bg-cyan-950/40 font-semibold text-cyan-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({allAddresses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAddressFilter('missing')}
                  className={`flex min-h-[44px] cursor-pointer items-center rounded-sm border px-3.5 py-2 transition-colors md:min-h-0 md:px-2.5 md:py-1 ${
                    addressFilter === 'missing'
                      ? 'border-amber-500/60 bg-amber-950/40 font-semibold text-amber-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-amber-300'
                  }`}
                >
                  ⚠️ Missing Media ({missingMediaCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAddressFilter('saved')}
                  className={`flex min-h-[44px] cursor-pointer items-center rounded-sm border px-3.5 py-2 transition-colors md:min-h-0 md:px-2.5 md:py-1 ${
                    addressFilter === 'saved'
                      ? 'border-cyan-500/60 bg-cyan-950/40 font-semibold text-cyan-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Permanent (
                  {allAddresses.filter((a) => Boolean(a.userId)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAddressFilter('guest')}
                  className={`flex min-h-[44px] cursor-pointer items-center rounded-sm border px-3.5 py-2 transition-colors md:min-h-0 md:px-2.5 md:py-1 ${
                    addressFilter === 'guest'
                      ? 'border-cyan-500/60 bg-cyan-950/40 font-semibold text-cyan-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Guest ({allAddresses.filter((a) => !a.userId).length})
                </button>
              </div>

              <span className="font-mono text-xs text-zinc-500 md:text-[11px]">
                Showing {filteredAddresses.length} of {allAddresses.length}{' '}
                records
              </span>
            </div>

            {/* Table Container with Horizontal Scroll Reflow */}
            <div className="w-full flex-1 overflow-x-auto rounded-sm border border-zinc-800 bg-zinc-900/50 whitespace-nowrap shadow-inner">
              {filteredAddresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center font-mono">
                  <p className="text-sm text-zinc-400 md:text-xs">
                    No address records match your criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressSearchTerm('');
                      setAddressFilter('all');
                    }}
                    className="mt-3 flex min-h-[44px] cursor-pointer items-center text-sm text-cyan-400 hover:underline md:min-h-0 md:text-xs"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <table className="w-full min-w-[850px] text-left font-mono text-sm md:text-xs">
                  <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900 text-xs font-semibold tracking-wider text-zinc-400 uppercase md:text-[10px]">
                    <tr>
                      <th className="p-4 sm:px-4 sm:py-3.5">DIGIPIN</th>
                      <th className="p-4 sm:px-4 sm:py-3.5">Label / Details</th>
                      <th className="p-4 sm:px-4 sm:py-3.5">Type</th>
                      <th className="p-4 sm:px-4 sm:py-3.5">
                        Doorway Photo Status
                      </th>
                      <th className="p-4 sm:px-4 sm:py-3.5">Owner / User</th>
                      <th className="p-4 sm:px-4 sm:py-3.5">Created</th>
                      <th className="p-4 text-right sm:px-4 sm:py-3.5">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredAddresses.map((addr) => {
                      const hasPhoto = Boolean(
                        addr.doorwayPhotoUrl &&
                        addr.doorwayPhotoUrl.trim().length > 0
                      );
                      const isBroken = brokenSlugs.has(addr.slug);
                      const isMissing = !hasPhoto || isBroken;

                      return (
                        <tr
                          key={addr.slug}
                          onClick={() =>
                            setSelected({ type: 'address', record: addr })
                          }
                          className="cursor-pointer transition-colors hover:bg-zinc-800/40"
                        >
                          {/* DIGIPIN & Slug */}
                          <td className="p-4 whitespace-nowrap sm:px-4 sm:py-3.5">
                            <span className="text-sm font-bold text-cyan-300 md:text-xs">
                              {addr.digipin}
                            </span>
                            <span className="block text-xs text-zinc-500 md:text-[10px]">
                              {addr.slug}
                            </span>
                          </td>

                          {/* Label / Details */}
                          <td className="max-w-[200px] p-4 sm:px-4 sm:py-3.5">
                            <span className="block truncate font-medium text-zinc-200">
                              {addr.label || '—'}
                            </span>
                            {(addr.flat || addr.floor) && (
                              <span className="block truncate text-xs text-zinc-500 md:text-[10px]">
                                {[addr.flat, addr.floor]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="p-4 whitespace-nowrap sm:px-4 sm:py-3.5">
                            <span
                              className={`rounded-sm px-2.5 py-1 text-xs font-semibold md:px-2 md:py-0.5 md:text-[10px] ${
                                addr.isEphemeral
                                  ? 'border border-amber-800/50 bg-amber-950/40 text-amber-400'
                                  : 'border border-cyan-800/50 bg-cyan-950/40 text-cyan-400'
                              }`}
                            >
                              {addr.isEphemeral ? 'Guest' : 'Permanent'}
                            </span>
                          </td>

                          {/* Milestone 1: Warning Badge for Missing/Broken Media */}
                          <td className="p-4 whitespace-nowrap sm:px-4 sm:py-3.5">
                            {isMissing ? (
                              <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-500/50 bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-300 md:py-0.5 md:text-[10px]">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                <span>
                                  {isBroken ? 'Broken Link' : 'Missing Media'}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1 text-xs text-emerald-400 md:py-0.5 md:text-[10px]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          {/* Owner / User */}
                          <td className="p-4 whitespace-nowrap text-zinc-400 sm:px-4 sm:py-3.5">
                            {addr.userId ? (
                              <span
                                className="block max-w-[120px] truncate"
                                title={addr.userId}
                              >
                                {addr.userId.slice(0, 10)}...
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-600 md:text-[10px]">
                                Guest
                              </span>
                            )}
                          </td>

                          {/* Created */}
                          <td className="p-4 text-xs whitespace-nowrap text-zinc-500 sm:px-4 sm:py-3.5 md:text-[10px]">
                            {addr.createdAt
                              ? new Date(addr.createdAt).toLocaleDateString()
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right whitespace-nowrap sm:px-4 sm:py-3.5">
                            <div
                              className="inline-flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelected({ type: 'address', record: addr })
                                }
                                className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[2px] border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs text-zinc-300 transition-colors hover:border-cyan-400 hover:text-cyan-300 md:min-h-0 md:px-2.5 md:py-1 md:text-[11px]"
                              >
                                <Edit3 size={13} />
                                <span>Inspect</span>
                              </button>
                              <a
                                href={`/a/${addr.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[2px] p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-cyan-400 md:min-h-0 md:min-w-0 md:p-1"
                                title="Open public view"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── Detail Panel Modal ─────────────────────────────────────────── */}
        {selected && (
          <AdminDetailPanel
            type={selected.type}
            record={selected.record}
            isLoading={isDetailLoading}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onUpdateUser={handleUpdateUser}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2 w-2 rounded-full md:h-1.5 md:w-1.5"
        style={{ backgroundColor: color }}
      />
      <span
        className="font-mono text-xs md:text-[10px]"
        style={{ color: '#71717a' }}
      >
        {label}
      </span>
      <span
        className="font-mono text-sm font-bold md:text-xs"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
