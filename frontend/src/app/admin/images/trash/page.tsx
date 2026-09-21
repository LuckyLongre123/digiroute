'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  RefreshCw,
  Camera,
  Search,
  X,
  ExternalLink,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getOrphanedImages,
  type OrphanedImage,
} from '@/actions/getOrphanedImages';
import { deleteImagesFromCloudinary } from '@/actions/deleteImagesFromCloudinary';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Unknown date';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function TrashImagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orphanedList, setOrphanedList] = useState<OrphanedImage[]>([]);
  const [totalCloudinary, setTotalCloudinary] = useState(0);
  const [totalDb, setTotalDb] = useState(0);

  // Selection state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<OrphanedImage | null>(null);

  // User-initiated scan/refresh
  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrphanedImages();
      if (!result.success) {
        if (result.error?.includes('Unauthorized')) {
          router.push('/admin/login');
          return;
        }
        setError(result.error || 'Failed to reconcile orphaned images.');
      } else {
        setOrphanedList(result.orphanedImages);
        setTotalCloudinary(result.totalCloudinaryImages);
        setTotalDb(result.totalDbImages);
        setSelectedImages([]);
      }
    } catch (err) {
      console.error('Error fetching orphaned images:', err);
      setError('Network error while reconciling orphaned images.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial mount load
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      try {
        const result = await getOrphanedImages();
        if (!isMounted) return;

        if (!result.success) {
          if (result.error?.includes('Unauthorized')) {
            router.push('/admin/login');
            return;
          }
          setError(result.error || 'Failed to reconcile orphaned images.');
        } else {
          setOrphanedList(result.orphanedImages);
          setTotalCloudinary(result.totalCloudinaryImages);
          setTotalDb(result.totalDbImages);
          setSelectedImages([]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching orphaned images:', err);
        setError('Network error while reconciling orphaned images.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Filter list
  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return orphanedList;
    return orphanedList.filter(
      (img) =>
        img.public_id.toLowerCase().includes(q) ||
        (img.format && img.format.toLowerCase().includes(q))
    );
  }, [orphanedList, searchTerm]);

  // Selection handlers
  const isAllSelected =
    filteredList.length > 0 &&
    filteredList.every((img) => selectedImages.includes(img.public_id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all current filtered
      const filteredIds = new Set(filteredList.map((img) => img.public_id));
      setSelectedImages((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Add all filtered to selection
      const newSelected = new Set([
        ...selectedImages,
        ...filteredList.map((img) => img.public_id),
      ]);
      setSelectedImages(Array.from(newSelected));
    }
  };

  const handleToggleSelect = (publicId: string) => {
    setSelectedImages((prev) =>
      prev.includes(publicId)
        ? prev.filter((id) => id !== publicId)
        : [...prev, publicId]
    );
  };

  // Single deletion
  const handleDeleteSingle = async (img: OrphanedImage) => {
    const confirmed = window.confirm(
      `Permanently delete this orphaned image from Cloudinary?\n\nID: ${img.public_id}\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(img.public_id);
    try {
      const res = await deleteImagesFromCloudinary([img.public_id]);
      if (res.success) {
        toast.success(`Deleted orphaned image: ${img.public_id}`);
        setOrphanedList((prev) =>
          prev.filter((item) => item.public_id !== img.public_id)
        );
        setSelectedImages((prev) => prev.filter((id) => id !== img.public_id));
        if (previewImage?.public_id === img.public_id) {
          setPreviewImage(null);
        }
      } else {
        toast.error(res.error || 'Failed to delete image from Cloudinary.');
      }
    } catch {
      toast.error('Network error during deletion.');
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk deletion
  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0 || isDeleting) return;

    const count = selectedImages.length;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${count} selected orphaned image${count > 1 ? 's' : ''} from Cloudinary?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteImagesFromCloudinary(selectedImages);
      if (res.success) {
        toast.success(
          `Successfully deleted ${res.deletedCount} orphaned image${res.deletedCount > 1 ? 's' : ''}.`
        );
        const deletedSet = new Set(selectedImages);
        setOrphanedList((prev) =>
          prev.filter((item) => !deletedSet.has(item.public_id))
        );
        setSelectedImages([]);
        if (previewImage && deletedSet.has(previewImage.public_id)) {
          setPreviewImage(null);
        }
      } else {
        toast.error(res.error || 'Failed to delete selected images.');
      }
    } catch {
      toast.error('Network error during bulk deletion.');
    } finally {
      setIsDeleting(false);
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
      {/* ─── Top Bar & Navigation Controls ─────────────────────────────────── */}
      <header className="z-10 flex shrink-0 flex-col gap-3 border-b border-zinc-800 bg-[#09090b] px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-2.5">
        <div className="flex w-full items-center justify-between gap-2 sm:gap-3 md:w-auto md:justify-start">
          {/* Sub-nav switch */}
          <div className="grid w-full grid-cols-2 items-center gap-1 rounded-[3px] border border-zinc-800 bg-zinc-950 p-1 font-mono text-xs sm:flex sm:w-auto md:p-0.5 md:text-[11px]">
            <Link
              href="/admin/images"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[2px] px-3 py-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-cyan-400 md:min-h-0 md:px-2.5 md:py-1"
              title="Return to Active Media Node Graph"
            >
              <Camera className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span>Active Graph</span>
            </Link>
            <span className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[2px] bg-rose-500/10 px-3 py-2 font-semibold text-rose-400 md:min-h-0 md:px-2.5 md:py-1">
              <Trash2 className="h-4 w-4 text-rose-400 md:h-3.5 md:w-3.5" />
              <span>Trash Images</span>
            </span>
          </div>
          <span className="hidden text-zinc-600 sm:inline">|</span>
          <span className="hidden font-mono text-xs text-zinc-400 lg:inline">
            Reconciling Cloudinary storage against active DB records
          </span>
        </div>

        {/* Global Action Tools */}
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-3 md:w-auto">
          {/* Search Input */}
          <div className="relative flex w-full items-center md:w-auto">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 md:left-2.5 md:h-3.5 md:w-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter trash by ID..."
              className="h-11 min-h-[44px] w-full rounded-[3px] border border-zinc-800 bg-zinc-900 px-3 py-2 pr-9 pl-9 font-mono text-sm text-zinc-100 transition-colors placeholder:text-zinc-500 focus:border-rose-400 focus:outline-none md:h-8 md:min-h-0 md:w-56 md:text-[11px] lg:w-60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute top-1/2 right-2 flex min-h-[44px] min-w-[36px] -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200"
                title="Clear filter"
              >
                <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchTrash}
            disabled={loading || isDeleting}
            title="Re-run reconciliation between Cloudinary and Database"
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-zinc-800 px-3.5 py-2.5 font-mono text-sm whitespace-nowrap text-zinc-400 transition-colors hover:border-rose-400 hover:text-rose-400 disabled:opacity-50 sm:w-auto md:min-h-0 md:gap-1.5 md:px-2.5 md:py-1.5 md:text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>$ re-scan</span>
          </button>
        </div>
      </header>

      {/* ─── Administrative Action Bar (Select All & Bulk Delete) ─────────── */}
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:py-2">
        <div className="flex items-center justify-between gap-4 text-sm sm:justify-start md:text-xs">
          {/* Select All Toggle */}
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={filteredList.length === 0 || loading || isDeleting}
            className="flex min-h-[44px] cursor-pointer items-center gap-2 text-zinc-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0"
          >
            {isAllSelected ? (
              <CheckSquare className="h-5 w-5 text-rose-400 md:h-4 md:w-4" />
            ) : (
              <Square className="h-5 w-5 text-zinc-500 md:h-4 md:w-4" />
            )}
            <span className="font-mono text-sm md:text-xs">
              Select All ({filteredList.length})
            </span>
          </button>

          {selectedImages.length > 0 && (
            <span className="rounded-[2px] border border-rose-900/50 bg-rose-950/40 px-2.5 py-1 font-mono text-xs font-semibold text-rose-300 md:py-0.5 md:text-[11px]">
              {selectedImages.length} selected
            </span>
          )}
        </div>

        {/* Bulk Action Controls */}
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex items-center justify-between gap-3 font-mono text-xs text-zinc-400 sm:justify-start md:text-[11px]">
            <span>
              Cloudinary:{' '}
              <strong className="text-zinc-200">{totalCloudinary}</strong>
            </span>
            <span>
              Linked DB: <strong className="text-emerald-400">{totalDb}</strong>
            </span>
            <span>
              Orphaned:{' '}
              <strong className="text-rose-400">{orphanedList.length}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedImages.length === 0 || isDeleting || loading}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-rose-900/70 bg-rose-950/30 px-4 py-2.5 font-mono text-sm font-semibold text-rose-400 transition-all hover:border-rose-500 hover:bg-rose-900/50 hover:text-rose-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900/50 disabled:text-zinc-600 disabled:opacity-50 sm:w-auto md:min-h-0 md:gap-1.5 md:px-3 md:py-1 md:text-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-rose-400 md:h-3.5 md:w-3.5" />
                <span>Deleting ({selectedImages.length})...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                <span>Delete Selected ({selectedImages.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main Content Body ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
            <p className="mt-4 font-mono text-base text-zinc-300 md:text-sm">
              Reconciling Cloudinary storage against Prisma database...
            </p>
            <p className="mt-1 font-mono text-sm text-zinc-500 md:text-xs">
              Comparing asset IDs and active address doorway references
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-sm border border-rose-900/60 bg-rose-950/20 p-5 text-zinc-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
              <div>
                <h3 className="font-mono text-base font-bold text-rose-300 md:text-sm">
                  Reconciliation Failed
                </h3>
                <p className="mt-1 font-mono text-sm leading-relaxed text-zinc-400 md:text-xs">
                  {error}
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={fetchTrash}
                    className="flex min-h-[44px] cursor-pointer items-center rounded-[3px] border border-rose-800 bg-rose-950/40 px-3.5 py-2 font-mono text-sm text-rose-300 hover:bg-rose-900/50 md:min-h-0 md:px-3 md:py-1 md:text-xs"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty Clean State */}
        {!loading && !error && orphanedList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-emerald-800/60 bg-emerald-950/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-mono text-base font-bold text-zinc-200 md:text-sm">
              Zero Orphaned Images Found
            </h3>
            <p className="mt-1.5 max-w-md font-mono text-sm leading-relaxed text-zinc-500 md:text-xs">
              Storage is clean. All {totalCloudinary} Cloudinary assets
              correspond to active database addresses.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/images"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[3px] border border-zinc-800 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-zinc-300 hover:border-cyan-400 hover:text-cyan-400 md:min-h-0 md:px-3.5 md:py-1.5 md:text-xs"
              >
                <Camera className="h-4 w-4 md:h-3.5 md:w-3.5" />
                <span>Return to Media Graph</span>
              </Link>
            </div>
          </div>
        )}

        {/* Search Empty State */}
        {!loading &&
          !error &&
          orphanedList.length > 0 &&
          filteredList.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-mono text-sm text-zinc-400 md:text-xs">
                No orphaned images match filter: &quot;{searchTerm}&quot;
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mx-auto mt-3 flex min-h-[44px] cursor-pointer items-center justify-center font-mono text-sm text-rose-400 hover:underline md:min-h-0 md:text-xs"
              >
                Clear filter
              </button>
            </div>
          )}

        {/* ─── Milestone 2 & Rule 3: Responsive CSS Grid Layout (Smooth Degradation) ─── */}
        {!loading && !error && filteredList.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {filteredList.map((img) => {
              const isSelected = selectedImages.includes(img.public_id);
              const isCardDeleting = deletingId === img.public_id;

              return (
                <div
                  key={img.public_id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-sm border bg-zinc-900/90 font-mono text-sm transition-all md:text-xs ${
                    isSelected
                      ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Top Checkbox Overlay with 44px mobile touch target */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(img.public_id);
                      }}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[2px] bg-black/70 text-zinc-300 backdrop-blur-xs transition-colors hover:text-white md:h-6 md:w-6"
                      title={isSelected ? 'Deselect image' : 'Select image'}
                      aria-label={
                        isSelected ? 'Deselect image' : 'Select image'
                      }
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-rose-400 md:h-4 md:w-4" />
                      ) : (
                        <Square className="h-5 w-5 text-zinc-400 md:h-4 md:w-4" />
                      )}
                    </button>
                  </div>

                  {/* Thumbnail Image */}
                  <div
                    onClick={() => setPreviewImage(img)}
                    className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-zinc-950"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.secure_url}
                      alt={img.public_id}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback on broken remote asset
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60" />
                    <span className="absolute right-2 bottom-2 rounded-[2px] bg-black/80 px-2 py-0.5 font-mono text-xs text-zinc-400 backdrop-blur-xs md:text-[9px]">
                      {img.format?.toUpperCase() || 'IMG'}
                    </span>
                  </div>

                  {/* Card Metadata Body */}
                  <div className="flex flex-1 flex-col justify-between p-3.5 md:p-2.5">
                    <div className="space-y-1.5 md:space-y-1">
                      {/* Truncated Public ID */}
                      <p
                        className="truncate font-mono text-sm leading-relaxed font-semibold text-zinc-200 md:text-[11px]"
                        title={img.public_id}
                      >
                        {img.public_id}
                      </p>

                      {/* File Details */}
                      <div className="flex items-center justify-between text-xs text-zinc-500 md:text-[10px]">
                        <span>{formatBytes(img.bytes)}</span>
                        <span>{formatDate(img.created_at)}</span>
                      </div>
                    </div>

                    {/* Bottom Individual Card Action */}
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 md:pt-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="flex min-h-[44px] cursor-pointer items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 transition-colors hover:text-cyan-400 md:min-h-0 md:text-[10px]"
                      >
                        <ExternalLink size={13} className="shrink-0" />
                        <span>Inspect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(img)}
                        disabled={isCardDeleting || isDeleting}
                        title="Permanently delete from Cloudinary"
                        className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-950/60 hover:text-rose-300 disabled:opacity-50 md:min-h-0 md:text-[10px]"
                      >
                        {isCardDeleting ? (
                          <Loader2
                            size={13}
                            className="shrink-0 animate-spin"
                          />
                        ) : (
                          <Trash2 size={13} className="shrink-0" />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Inspect / Preview Modal ───────────────────────────────────────── */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono backdrop-blur-xs sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2 truncate">
                <Trash2 className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="truncate text-sm font-bold md:text-xs">
                  {previewImage.public_id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center p-2 text-zinc-400 hover:text-white"
                aria-label="Close preview"
              >
                <X className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative flex max-h-[60vh] items-center justify-center overflow-hidden bg-black p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.secure_url}
                alt={previewImage.public_id}
                className="max-h-[55vh] w-auto max-w-full rounded-sm object-contain"
              />
            </div>

            {/* Modal Footer Details & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/60 p-4 text-xs md:text-[11px]">
              <div className="space-y-0.5 text-xs text-zinc-400 md:text-[11px]">
                <p>
                  Size:{' '}
                  <strong className="text-zinc-200">
                    {formatBytes(previewImage.bytes)}
                  </strong>{' '}
                  | Format:{' '}
                  <strong className="text-zinc-200">
                    {previewImage.format || 'unknown'}
                  </strong>
                </p>
                <p>
                  Uploaded:{' '}
                  <strong className="text-zinc-200">
                    {formatDate(previewImage.created_at)}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewImage.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] items-center gap-1.5 rounded-[3px] border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:text-white md:min-h-0 md:px-2.5 md:py-1.5 md:text-xs"
                >
                  <ExternalLink size={14} />
                  <span>Open CDN URL</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleDeleteSingle(previewImage);
                  }}
                  disabled={deletingId === previewImage.public_id}
                  className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[3px] border border-rose-800 bg-rose-950/50 px-3.5 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-900/60 md:min-h-0 md:px-3 md:py-1.5 md:text-xs"
                >
                  {deletingId === previewImage.public_id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
