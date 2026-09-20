'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Search, X } from 'lucide-react';

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
};

function UserNode({ data }: { data: NodeData }) {
  const u = data.record as UserRecord;
  return (
    <div
      className="relative px-3 py-2.5 rounded-[4px] text-xs font-mono min-w-[150px] cursor-pointer"
      style={{
        backgroundColor: '#0c1a2e',
        border: '1px solid #1d4ed8',
        color: '#93c5fd',
        boxShadow: '0 0 12px rgba(59,130,246,0.3)',
      }}
    >
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#3b82f6' }}>
        User
      </div>
      <div className="font-semibold truncate max-w-[130px]" title={u.email}>
        {u.name || u.email?.split('@')[0] || 'Anonymous'}
      </div>
      <div className="truncate max-w-[130px] mt-0.5 opacity-60 text-[10px]" title={u.email}>
        {u.email || 'no email'}
      </div>
      {/* ReactFlow Source Handle for connecting edges to Addresses */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-cyan-400 !border-none"
      />
    </div>
  );
}

function AddressNode({ data }: { data: NodeData }) {
  const a = data.record as AddressRecord;
  return (
    <div
      className="relative px-3 py-2.5 rounded-[4px] text-xs font-mono min-w-[150px] cursor-pointer"
      style={{
        backgroundColor: '#0a1a1a',
        border: a.isEphemeral ? '1px solid #f59e0b' : '1px solid #0e7490',
        color: a.isEphemeral ? '#fcd34d' : '#67e8f9',
        boxShadow: a.isEphemeral
          ? '0 0 10px rgba(245,158,11,0.2)'
          : '0 0 12px rgba(6,182,212,0.25)',
      }}
    >
      {/* ReactFlow Target Handle for incoming edges from Users */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-cyan-400 !border-none"
      />
      <div
        className="text-[10px] uppercase tracking-wider mb-1"
        style={{ color: a.isEphemeral ? '#f59e0b' : '#22d3ee' }}
      >
        {a.isEphemeral ? 'Guest Addr' : 'Address'}
      </div>
      <div className="font-mono font-bold">{a.digipin}</div>
      {a.label && (
        <div className="mt-0.5 opacity-60 text-[10px] truncate max-w-[130px]">{a.label}</div>
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
        data: { type: 'address', record: a } as NodeData,
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
      data: { type: 'address', record: a } as NodeData,
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
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [stats, setStats] = useState({ users: 0, addresses: 0, guests: 0 });
  const [selected, setSelected] = useState<{ type: 'user' | 'address'; record: UserRecord | AddressRecord } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(userSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearchTerm]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/data', { credentials: 'include', cache: 'no-store' });
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
        const res = await fetch('/api/admin/data', { credentials: 'include', cache: 'no-store' });
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

  // Rebuild graph when data or user search query changes
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
      displayAddresses = allAddresses.filter((a) => a.userId && matchedUserIds.has(a.userId));
    }

    const { nodes: n, edges: e } = buildGraph(displayUsers, displayAddresses);
    setNodes(n);
    setEdges(e);
  }, [allUsers, allAddresses, debouncedSearchTerm, setNodes, setEdges]);

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

  const handleUpdate = async (slug: string, updates: Record<string, unknown>) => {
    await fetch('/api/admin/update-address', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, updates }),
    });
    fetchData();
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { name?: string | null; email?: string | null; phone?: string | null }
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
    <div className="flex-1 h-full w-full flex flex-col min-h-0 overflow-hidden">
      {/* Top bar */}
      <header
        className="flex flex-wrap items-center gap-3 sm:gap-5 px-4 sm:px-5 py-2.5 sm:py-3 border-b shrink-0"
        style={{ backgroundColor: '#09090b', borderColor: '#27272a' }}
      >
        <span className="text-xs font-mono" style={{ color: '#22d3ee' }}>
          /overview
        </span>

        {/* User Search Filter Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            placeholder="Search users (name, email, ID)..."
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 font-mono text-[11px] px-2.5 py-1 pl-7 pr-7 rounded focus:border-cyan-400 focus:outline-none w-52 sm:w-64 transition-colors"
          />
          {userSearchTerm && (
            <button
              type="button"
              onClick={() => setUserSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Clear user search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5 ml-auto flex-wrap">
          <StatPill label="Users" value={stats.users} color="#3b82f6" />
          <StatPill label="Addresses" value={stats.addresses} color="#22d3ee" />
          <StatPill label="Guests" value={stats.guests} color="#f59e0b" />
          <button
            onClick={fetchData}
            className="px-2.5 py-1 text-[10px] font-mono rounded-[3px] transition-colors cursor-pointer"
            style={{ color: '#71717a', border: '1px solid #27272a' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.color = '#22d3ee';
              el.style.borderColor = '#22d3ee';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.color = '#71717a';
              el.style.borderColor = '#27272a';
            }}
          >
            $ refresh
          </button>
        </div>
      </header>

      {/* Graph */}
      <div className="w-full h-[calc(100vh-120px)] min-h-[500px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ backgroundColor: '#09090b' }}>
            <div className="text-xs font-mono" style={{ color: '#22d3ee' }}>
              <span className="animate-pulse">loading graph...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ backgroundColor: '#09090b' }}>
            <p className="text-xs font-mono" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}
        {!loading && !error && nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-4"
            style={{ backgroundColor: '#09090b' }}>
            <Search className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-sm font-mono text-zinc-400">
              No users found matching &ldquo;{debouncedSearchTerm}&rdquo;
            </p>
            <p className="text-xs font-mono text-zinc-600 mt-1">
              Try searching by name, email, or user ID.
            </p>
            <button
              type="button"
              onClick={() => setUserSearchTerm('')}
              className="mt-3 px-3 py-1 text-xs font-mono text-cyan-400 border border-cyan-400/40 hover:bg-cyan-400/10 rounded cursor-pointer transition-colors"
            >
              $ clear filter
            </button>
          </div>
        )}
        {!loading && !error && nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ backgroundColor: '#09090b', width: '100%', height: '100%' }}
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
              style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
              nodeColor={(n) =>
                (n.data as NodeData).type === 'user' ? '#1d4ed8' : '#0e7490'
              }
              maskColor="rgba(9,9,11,0.8)"
            />
          </ReactFlow>
        )}

        {/* Detail panel */}
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
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-mono" style={{ color: '#71717a' }}>
        {label}
      </span>
      <span className="text-xs font-mono font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
