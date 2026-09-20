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
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Camera,
  User as UserIcon,
  Sparkles,
  Search,
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

interface UserNodeData {
  record: UserRecord;
  photoCount: number;
}

interface ImageNodeData {
  record: AddressRecord;
  onSelectImage: (record: AddressRecord) => void;
}

function UserNode({ data }: { data: UserNodeData }) {
  const u = data.record;
  return (
    <div
      className="relative min-w-[170px] cursor-pointer rounded-md px-3.5 py-3 font-mono text-xs"
      style={{
        backgroundColor: '#0c1a2e',
        border: '1px solid #1d4ed8',
        color: '#93c5fd',
        boxShadow: '0 0 12px rgba(59,130,246,0.3)',
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
          <UserIcon className="h-3 w-3" />
          <span>User</span>
        </span>
        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[10px] text-blue-300">
          {data.photoCount} {data.photoCount === 1 ? 'photo' : 'photos'}
        </span>
      </div>
      <div
        className="max-w-[150px] truncate text-sm font-semibold"
        title={u.name || u.email}
      >
        {u.name || u.email?.split('@')[0] || 'Anonymous'}
      </div>
      <div
        className="mt-0.5 max-w-[150px] truncate text-[10px] opacity-60"
        title={u.email}
      >
        {u.email || 'no email'}
      </div>
      {/* ReactFlow Source Handle for connecting edges to Photos */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-none !bg-cyan-400"
      />
    </div>
  );
}

function ImageNode({ data }: { data: ImageNodeData }) {
  const a = data.record;
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => data.onSelectImage(a)}
      className="group relative min-w-[210px] cursor-pointer rounded-md p-2.5 font-mono text-xs transition-all hover:scale-[1.02] hover:border-cyan-500"
      style={{
        backgroundColor: '#18181b',
        border: imageError
          ? '1px solid #ef4444'
          : a.isEphemeral
            ? '1px solid #f59e0b'
            : '1px solid #27272a',
        color: '#e4e4e7',
        boxShadow: imageError
          ? '0 4px 14px rgba(239,68,68,0.25)'
          : '0 4px 14px rgba(0,0,0,0.5)',
      }}
    >
      {/* ReactFlow Target Handle for incoming edges from User */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-none !bg-cyan-400"
      />
      <div className="flex items-center gap-3">
        {imageError ? (
          <div className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded border border-red-500/50 bg-red-950/40 p-1 text-center text-red-400">
            <span className="text-base leading-none">⚠️</span>
            <span className="mt-0.5 text-[8px] font-bold tracking-tight">
              404
            </span>
          </div>
        ) : (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-zinc-700 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.doorwayPhotoUrl!}
              alt={`Doorway for ${a.digipin}`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {imageError ? (
            <div className="mb-1 inline-block rounded border border-red-500/50 bg-red-950/80 px-1.5 py-0.5 text-[9px] leading-tight font-bold text-red-300">
              ⚠️ Media Missing (Deleted from CDN)
            </div>
          ) : (
            <div
              className="mb-0.5 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: a.isEphemeral ? '#f59e0b' : '#22d3ee' }}
            >
              {a.isEphemeral ? 'Guest Photo' : 'Doorway Photo'}
            </div>
          )}
          <div className="font-mono text-sm font-bold tracking-wider text-zinc-100">
            {a.digipin}
          </div>
          {a.label && (
            <div className="mt-0.5 truncate text-[11px] text-zinc-400">
              {a.label}
            </div>
          )}
          <div className="mt-1 text-[10px] font-medium text-cyan-400 group-hover:underline">
            View / manage →
          </div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  userNode: UserNode,
  imageNode: ImageNode,
  'user-node': UserNode,
  'image-node': ImageNode,
};

export default function AdminImagesPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<AddressRecord | null>(
    null
  );
  const [modalImageError, setModalImageError] = useState(false);

  const handleSelectImage = useCallback((img: AddressRecord | null) => {
    setSelectedImage(img);
    setModalImageError(false);
  }, []);

  const [deleting, setDeleting] = useState(false);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [allPhotos, setAllPhotos] = useState<AddressRecord[]>([]);
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(mediaSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [mediaSearchTerm]);

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
        return;
      }
      const data = await res.json();
      const rawUsers: UserRecord[] = data.users || [];
      const rawAddresses: AddressRecord[] = (data.addresses || []).filter(
        (a: AddressRecord) => Boolean(a.doorwayPhotoUrl)
      );

      setAllUsers(rawUsers);
      setAllPhotos(rawAddresses);
    } catch {
      setError('Failed to load media node graph.');
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
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const rawUsers: UserRecord[] = data.users || [];
          const rawAddresses: AddressRecord[] = (data.addresses || []).filter(
            (a: AddressRecord) => Boolean(a.doorwayPhotoUrl)
          );
          setAllUsers(rawUsers);
          setAllPhotos(rawAddresses);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load media node graph.');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredPhotos = useMemo(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, '');

    if (!q) return allPhotos;
    return allPhotos.filter((photo) => {
      const digipin = (photo.digipin || '').toLowerCase();
      const cleanDigipin = digipin.replace(/[^a-z0-9]/g, '');
      if (digipin.includes(q) || (cleanQ && cleanDigipin.includes(cleanQ)))
        return true;

      const uid = (photo.userId || '').toLowerCase();
      if (uid.includes(q)) return true;

      const id = (photo.id || '').toLowerCase();
      const slug = (photo.slug || '').toLowerCase();
      if (id.includes(q) || slug.includes(q)) return true;

      return false;
    });
  }, [allPhotos, debouncedSearchTerm]);

  const { photosByUser, guestPhotos, usersWithPhotos } = useMemo(() => {
    const byUser: Record<string, AddressRecord[]> = {};
    const guests: AddressRecord[] = [];

    for (const a of filteredPhotos) {
      if (a.userId) {
        byUser[a.userId] = byUser[a.userId] || [];
        byUser[a.userId].push(a);
      } else {
        guests.push(a);
      }
    }

    const matchedUsers = allUsers.filter(
      (u) => (byUser[u.id] || []).length > 0
    );
    return {
      photosByUser: byUser,
      guestPhotos: guests,
      usersWithPhotos: matchedUsers,
    };
  }, [allUsers, filteredPhotos]);

  const stats = useMemo(
    () => ({
      photoCount: filteredPhotos.length,
      userCount: usersWithPhotos.length,
    }),
    [filteredPhotos.length, usersWithPhotos.length]
  );

  // Rebuild graph when photos, users, or media search query changes
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const ROW_H = 100;
    const PHOTO_COL_X = 360;
    let userY = 40;

    // Users and their photos
    usersWithPhotos.forEach((u) => {
      const userPhotos = photosByUser[u.id] || [];

      // User Node
      newNodes.push({
        id: u.id,
        type: 'userNode',
        position: { x: 40, y: userY },
        data: {
          record: u,
          photoCount: userPhotos.length,
        } as unknown as Record<string, unknown>,
      });

      // Photo Nodes for this user
      userPhotos.forEach((photo, pi) => {
        const photoNodeId = `photo-${photo.id || photo.slug}`;
        newNodes.push({
          id: photoNodeId,
          type: 'imageNode',
          position: { x: PHOTO_COL_X, y: userY + pi * ROW_H },
          data: {
            record: photo,
            onSelectImage: (rec: AddressRecord) => handleSelectImage(rec),
          } as unknown as Record<string, unknown>,
        });

        // Edge from user to photo
        newEdges.push({
          id: `edge-${u.id}-${photoNodeId}`,
          source: u.id,
          target: photoNodeId,
          animated: true,
          style: { stroke: '#22d3ee', strokeWidth: 1.5 },
          type: 'smoothstep',
        });
      });

      userY += Math.max(1, userPhotos.length) * ROW_H + 40;
    });

    // Guest photos column
    if (guestPhotos.length > 0) {
      const GUEST_X = PHOTO_COL_X + 320;
      guestPhotos.forEach((photo, gi) => {
        const photoNodeId = `guest-photo-${photo.id || photo.slug}`;
        newNodes.push({
          id: photoNodeId,
          type: 'imageNode',
          position: { x: GUEST_X, y: 40 + gi * ROW_H },
          data: {
            record: photo,
            onSelectImage: (rec: AddressRecord) => handleSelectImage(rec),
          } as unknown as Record<string, unknown>,
        });
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [allUsers, allPhotos, debouncedSearchTerm, setNodes, setEdges]);

  const [syncing, setSyncing] = useState(false);

  const handleSyncMedia = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/sync-media', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        if (data.cleanedCount > 0) {
          toast.success(
            `Cleaned ${data.cleanedCount} broken photo reference${data.cleanedCount > 1 ? 's' : ''} from database.`
          );
        } else {
          toast.success(
            `All ${data.verifiedOk} media references verified active on CDN.`
          );
        }
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to sync media references.');
      }
    } catch {
      toast.error('Network error during media sync.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedImage) return;
    if (
      !confirm(
        `Delete doorway photo for DIGIPIN ${selectedImage.digipin}? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/delete-address', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedImage.slug,
          deletePhotoOnly: true,
        }),
        credentials: 'include',
      });
      if (res.ok) {
        handleSelectImage(null);
        fetchData();
      } else {
        alert('Failed to delete photo.');
      }
    } catch {
      alert('Error occurred while deleting photo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{
        backgroundColor: '#09090b',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      {/* Top Bar */}
      <header
        className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-6 sm:py-3"
        style={{ borderColor: '#27272a', backgroundColor: '#09090b' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-zinc-100 uppercase">
            <Camera className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Media Node Graph</span>
          </span>
          <span className="hidden text-zinc-600 sm:inline">|</span>
          <span className="hidden font-mono text-xs text-zinc-400 sm:inline">
            Connecting doorway imagery to owner nodes
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Media Search Input */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={mediaSearchTerm}
              onChange={(e) => setMediaSearchTerm(e.target.value)}
              placeholder="Filter media (DIGIPIN, userId, addressId)..."
              className="w-56 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 pr-7 pl-7 font-mono text-[11px] text-zinc-100 transition-colors placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none sm:w-64"
            />
            {mediaSearchTerm && (
              <button
                type="button"
                onClick={() => setMediaSearchTerm('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-200"
                title="Clear media filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="hidden items-center gap-3 font-mono text-xs text-zinc-400 md:flex">
            <span>
              Photos:{' '}
              <strong className="text-cyan-400">{stats.photoCount}</strong>
            </span>
            <span>
              Owners:{' '}
              <strong className="text-blue-400">{stats.userCount}</strong>
            </span>
          </div>

          <button
            onClick={handleSyncMedia}
            disabled={syncing || loading}
            title="Verify Cloudinary media URLs and clean 404s from database"
            className="flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-amber-900/60 bg-amber-950/20 px-2 py-1 font-mono text-xs whitespace-nowrap text-amber-400 transition-colors hover:border-amber-400 hover:text-amber-300 disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            <Sparkles
              size={12}
              className={
                syncing ? 'animate-spin text-amber-400' : 'text-amber-400'
              }
            />
            <span>{syncing ? 'syncing...' : '$ sync/clean db'}</span>
          </button>

          <button
            onClick={fetchData}
            className="flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-zinc-800 px-2 py-1 font-mono text-xs whitespace-nowrap text-zinc-400 transition-colors hover:border-cyan-400 hover:text-cyan-400 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>$ refresh</span>
          </button>
        </div>
      </header>

      {/* Graph Container — Mobile & Desktop responsive */}
      <div className="relative h-[calc(100vh-120px)] min-h-[500px] w-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80">
            <div className="flex animate-pulse items-center gap-2 font-mono text-xs text-cyan-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>loading media node graph...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && nodes.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center">
            <Search className="mb-2 h-8 w-8 text-zinc-600" />
            <p className="font-mono text-sm text-zinc-400">
              {debouncedSearchTerm
                ? `No media found matching "${debouncedSearchTerm}"`
                : 'No doorway photos found in database'}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-600">
              {debouncedSearchTerm
                ? 'Try filtering by a different DIGIPIN, user ID, or address ID.'
                : 'Addresses created with doorway imagery will appear here connected to their owners.'}
            </p>
            {debouncedSearchTerm && (
              <button
                type="button"
                onClick={() => setMediaSearchTerm('')}
                className="mt-3 cursor-pointer rounded border border-cyan-400/40 px-3 py-1 font-mono text-xs text-cyan-400 transition-colors hover:bg-cyan-400/10"
              >
                $ clear filter
              </button>
            )}
          </div>
        )}

        {!loading && !error && nodes.length > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            style={{ width: '100%', height: '100%' }}
            className="bg-zinc-950"
          >
            <Background
              color="#27272a"
              gap={20}
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Controls className="!border-zinc-700 !bg-zinc-900 !text-zinc-300" />
            <MiniMap
              nodeColor={(node) =>
                node.type === 'userNode' ? '#1d4ed8' : '#0e7490'
              }
              maskColor="rgba(9,9,11,0.8)"
              className="!border-zinc-700 !bg-zinc-900"
            />
          </ReactFlow>
        )}
      </div>

      {/* Detail / Preview Modal for Selected Image Node */}
      {selectedImage && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-150">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-xs text-zinc-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-3">
              <span className="font-semibold tracking-wider text-cyan-400">
                {`${selectedImage.digipin} // Doorway Photo`}
              </span>
              <button
                onClick={() => handleSelectImage(null)}
                className="cursor-pointer rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                {modalImageError ? (
                  <div className="flex flex-col items-center justify-center space-y-1.5 p-6 text-center">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-xs font-bold text-red-400">
                      Media Missing (Deleted from CDN)
                    </span>
                    <span className="max-w-xs text-[11px] text-zinc-500">
                      The file returned 404 on Cloudinary. Click &ldquo;Delete
                      Photo&rdquo; below to clean this broken reference from the
                      database.
                    </span>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedImage.doorwayPhotoUrl!}
                    alt={`Doorway for ${selectedImage.digipin}`}
                    className="h-full w-full object-contain"
                    onError={() => setModalImageError(true)}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-2">
                  <span className="block text-zinc-500">DIGIPIN</span>
                  <span className="font-bold text-zinc-100">
                    {selectedImage.digipin}
                  </span>
                </div>
                <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-2">
                  <span className="block text-zinc-500">Label</span>
                  <span className="block truncate font-medium text-zinc-100">
                    {selectedImage.label || 'No label'}
                  </span>
                </div>
                <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-2">
                  <span className="block text-zinc-500">Type</span>
                  <span className="text-cyan-400">
                    {selectedImage.isEphemeral
                      ? 'Guest (Ephemeral)'
                      : 'Permanent Micro-Address'}
                  </span>
                </div>
                <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-2">
                  <span className="block text-zinc-500">Owner ID</span>
                  <span className="block truncate text-zinc-300">
                    {selectedImage.userId || 'Guest (Unregistered)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-2">
                <a
                  href={`/a/${selectedImage.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1.5 text-cyan-400 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Public View</span>
                </a>

                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={deleting}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-red-800/80 bg-red-950/60 px-3 py-1.5 text-red-300 transition-colors hover:bg-red-900/80 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{deleting ? 'Deleting...' : 'Delete Photo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
