'use client';

import { bulkDeleteAddressesAction } from '@/app/actions/bulkDeleteAddresses';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import {
  ManageAddressModal,
  type ManageAddressItem,
} from '@/components/shared/ManageAddressModal';
import {
  ArrowUpRight,
  Check,
  Clock,
  Eye,
  QrCode,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface AddressBookItem {
  id: string;
  label: string;
  digipin: string;
  unit: string;
  landmark: string;
  slug: string;
  isPermanent: boolean;
  expiresAt?: string | null;
  isEphemeral?: boolean;
  baseLat?: number;
  baseLng?: number;
  floor?: string | null;
  flat?: string | null;
  routingNotes?: string | null;
  createdAt?: string;
}

interface AddressBookListProps {
  addresses: AddressBookItem[];
}

function isAddressExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const target = new Date(expiresAt).getTime();
  if (isNaN(target)) return false;
  return target <= Date.now();
}

function renderExpiryBadge(expiresAt?: string | null) {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Permanent
      </span>
    );
  }

  const target = new Date(expiresAt).getTime();
  if (isNaN(target)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Permanent
      </span>
    );
  }

  const diff = target - Date.now();
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Expired
      </span>
    );
  }

  const mins = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  let timeText = '';
  if (days >= 1) {
    timeText = `Expires in ${days}d`;
  } else if (hours >= 1) {
    timeText = `Expires in ${hours}h`;
  } else {
    timeText = `Expires in ${Math.max(1, mins)}m`;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      {timeText}
    </span>
  );
}

export function AddressBookList({ addresses }: AddressBookListProps) {
  const router = useRouter();
  const [addressList, setAddressList] = useState<AddressBookItem[]>(addresses);
  const [selectedAddress, setSelectedAddress] =
    useState<ManageAddressItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Synchronize state when server addresses update (e.g. from revalidatePath / router.refresh)
  useEffect(() => {
    setAddressList(addresses);
  }, [addresses]);

  // 300ms debounce for smooth filtering without UI frame drops
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Clean up selected IDs if backing addresses change
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => addressList.some((a) => a.id === id))
    );
  }, [addressList]);

  // Multi-field case-insensitive filtering
  const filteredAddresses = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return addressList;

    const cleanQuery = query.replace(/[^a-z0-9]/g, '');

    return addressList.filter((item) => {
      // 1. DIGIPIN match (formatted or clean alphanumeric)
      const digipin = (item.digipin || '').toLowerCase();
      const cleanDigipin = digipin.replace(/[^a-z0-9]/g, '');
      if (
        digipin.includes(query) ||
        (cleanQuery && cleanDigipin.includes(cleanQuery))
      ) {
        return true;
      }

      // 2. Label / Tags match
      const label = (item.label || '').toLowerCase();
      if (label.includes(query)) return true;

      // Guest / Ephemeral / Permanent tag filters
      if (
        item.isEphemeral &&
        (query === 'guest' || query === 'ephemeral' || query === 'temp')
      ) {
        return true;
      }
      if (item.isPermanent && query === 'permanent') {
        return true;
      }

      // 3. Optional info / Landmark / Doorway text
      const landmark = (item.landmark || '').toLowerCase();
      const unit = (item.unit || '').toLowerCase();
      const routingNotes = (item.routingNotes || '').toLowerCase();
      const floor = (item.floor || '').toLowerCase();
      const flat = (item.flat || '').toLowerCase();
      if (
        landmark.includes(query) ||
        unit.includes(query) ||
        routingNotes.includes(query) ||
        floor.includes(query) ||
        flat.includes(query)
      ) {
        return true;
      }

      // 4. Coordinates (partial lat/lng)
      if (
        item.baseLat !== undefined &&
        String(item.baseLat).toLowerCase().includes(query)
      ) {
        return true;
      }
      if (
        item.baseLng !== undefined &&
        String(item.baseLng).toLowerCase().includes(query)
      ) {
        return true;
      }

      return false;
    });
  }, [addressList, debouncedQuery]);

  const isAllSelected =
    filteredAddresses.length > 0 &&
    filteredAddresses.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAddresses.map((item) => item.id));
    }
  };

  const handleSelectExpired = () => {
    const expiredIds = filteredAddresses
      .filter((item) => isAddressExpired(item.expiresAt))
      .map((item) => item.id);

    if (expiredIds.length === 0) {
      toast.info('No expired addresses found in current list.');
      return;
    }

    setSelectedIds(expiredIds);
    toast.success(
      `Selected ${expiredIds.length} expired address${expiredIds.length > 1 ? 'es' : ''}.`
    );
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingToastIdRef = useRef<string | number | null>(null);
  const pendingPayloadRef = useRef<{
    ids: string[];
    previousAddresses: AddressBookItem[];
  } | null>(null);

  // Commit any pending deletion if unmounting before 3s window expires
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        if (pendingPayloadRef.current) {
          bulkDeleteAddressesAction(pendingPayloadRef.current.ids).catch(
            () => { }
          );
        }
      }
    };
  }, []);

  const executePendingDelete = async () => {
    if (!pendingPayloadRef.current) return;
    const { ids, previousAddresses } = pendingPayloadRef.current;
    pendingPayloadRef.current = null;
    pendingTimerRef.current = null;

    if (pendingToastIdRef.current) {
      toast.dismiss(pendingToastIdRef.current);
      pendingToastIdRef.current = null;
    }

    // 3. The Execution & Optimistic Success (Proceed):
    // Remove the Undo toast and immediately show a success toast: "Successfully deleted".
    toast.success('Successfully deleted');

    // Fire the bulkDeleteAddresses.ts server action in the background.
    try {
      const res = await bulkDeleteAddressesAction(ids);
      if (!res || !res.success) {
        // 4. The Error Fallback:
        // Revert the local state to show the deleted addresses again.
        setAddressList(previousAddresses);
        // Show an error toast: "Sorry, failed to delete addresses".
        toast.error('Sorry, failed to delete addresses');
        return;
      }
      router.refresh();
    } catch {
      // Revert the local state to show the deleted addresses again.
      setAddressList(previousAddresses);
      // Show an error toast: "Sorry, failed to delete addresses".
      toast.error('Sorry, failed to delete addresses');
    }
  };

  const handleUndo = () => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    if (pendingToastIdRef.current) {
      toast.dismiss(pendingToastIdRef.current);
      pendingToastIdRef.current = null;
    }

    if (pendingPayloadRef.current) {
      // 2. The "Undo" Action (Abort):
      // Restore the optimistic local state (make the hidden addresses reappear)
      setAddressList(pendingPayloadRef.current.previousAddresses);
      pendingPayloadRef.current = null;
    }
    // Do NOT fire the server action.
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsConfirmModalOpen(false);

    // If an existing deletion is currently pending, commit it immediately before starting the next
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      executePendingDelete();
    }

    const idsToDelete = [...selectedIds];
    const previousAddresses = [...addressList];

    // 2. 5-Second Undo Flow:
    // Only when user clicks "Confirm" in modal: optimistically hide selected addresses
    pendingPayloadRef.current = {
      ids: idsToDelete,
      previousAddresses,
    };

    setAddressList((prev) =>
      prev.filter((item) => !idsToDelete.includes(item.id))
    );

    // Clear selectedIds state so action bar hides instantly
    setSelectedIds([]);

    // 3. Fix Toast Ghosting/Layering UI Bug:
    // Override toast library's default styling with unstyled: true, background: transparent, zero padding, border, and shadow
    const toastId = toast.custom(
      () => (
        <div className="relative w-80 overflow-hidden rounded-sm border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 font-mono text-xs">
          <style>{`
            @keyframes shrinkWidth5s {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="font-sans text-xs font-medium text-zinc-900 dark:text-zinc-100">
                Deleting addresses...
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="cursor-pointer rounded-sm border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Undo
            </button>
          </div>

          {/* Shrinking Red Progress Bar (5 seconds duration) */}
          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-xs bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-red-600 dark:bg-red-500"
              style={{
                animation: 'shrinkWidth5s 5000ms linear forwards',
              }}
            />
          </div>
        </div>
      ),
      {
        duration: 5200,
        unstyled: true,
        className:
          '!bg-transparent !border-0 !p-0 !shadow-none !rounded-none',
        style: {
          background: 'transparent',
          border: 'none',
          padding: 0,
          boxShadow: 'none',
        },
      }
    );

    pendingToastIdRef.current = toastId;

    // Use setTimeout to wait exactly 5000ms. Do NOT call the database yet.
    pendingTimerRef.current = setTimeout(() => {
      executePendingDelete();
    }, 5000);
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Real-Time Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by DIGIPIN, label, landmark, doorway text, coordinates..."
            className="text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent w-full rounded-lg border border-zinc-200 bg-white py-2.5 pr-10 pl-10 text-sm shadow-xs focus:ring-1 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {debouncedQuery.trim() && (
          <div className="text-muted-foreground flex shrink-0 items-center justify-between gap-2 px-1 text-xs sm:justify-end">
            <span>
              Showing{' '}
              <strong className="text-foreground">
                {filteredAddresses.length}
              </strong>{' '}
              of <strong>{addressList.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-accent ml-1 cursor-pointer text-xs font-semibold hover:underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Milestone 1: Clean Action Bar for Bulk Selection (Refined Utilitarian rounded-sm) */}
      {filteredAddresses.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-sm border border-zinc-200/80 bg-zinc-50/70 px-3.5 py-2 text-xs font-mono dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            {/* Select All Checkbox */}
            <label className="flex cursor-pointer items-center gap-2 select-none text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded-sm border-zinc-300 text-zinc-900 focus:ring-0 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <span className="font-sans text-xs font-medium">Select All</span>
            </label>

            <span className="text-zinc-300 dark:text-zinc-700">|</span>

            {/* Select Expired Button */}
            <button
              type="button"
              onClick={handleSelectExpired}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-zinc-300/80 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Select all expired temporary addresses"
            >
              <Clock className="h-3 w-3 text-amber-500" />
              <span>Select Expired</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-muted-foreground hidden text-[11px] sm:inline">
                ({selectedIds.length} of {filteredAddresses.length} selected)
              </span>
            )}
          </div>

          {/* Right side: Delete Selected Button or Deselect */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px] hover:underline"
              >
                Deselect
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteClick}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-red-200 bg-red-50/80 px-2.5 py-1 text-xs font-semibold text-red-600 shadow-2xs transition-all hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Address Cards Grid or Empty Search Results */}
      {filteredAddresses.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-8 text-center font-sans shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-muted-foreground mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              No addresses found matching &ldquo;{debouncedQuery}&rdquo;
            </h3>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              Check for typos or try searching with a partial DIGIPIN (e.g.
              39J), label, landmark, or GPS coordinate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear Search</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 font-sans sm:grid-cols-2">
          {filteredAddresses.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (selectedIds.length > 0) {
                    toggleSelect(item.id);
                  } else {
                    setSelectedAddress(item);
                  }
                }}
                className={`group relative flex cursor-pointer flex-col justify-between space-y-4 rounded-xl border p-4 text-left shadow-sm transition-all sm:p-5 ${isSelected
                  ? 'border-accent/90 bg-accent/5 ring-1 ring-accent/30 dark:bg-accent/10'
                  : 'border-zinc-200 bg-white hover:border-accent/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900'
                  }`}
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Minimal Card Checkbox (Refined Utilitarian 4px rounded-sm) */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(item.id, e)}
                        className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors ${isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                          : 'border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'
                          }`}
                        title={
                          isSelected ? 'Deselect address' : 'Select address'
                        }
                        aria-label={
                          isSelected ? 'Deselect address' : 'Select address'
                        }
                        aria-checked={isSelected}
                        role="checkbox"
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 stroke-[3]" />
                        )}
                      </button>

                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
                        {item.label}
                      </span>
                      {renderExpiryBadge(item.expiresAt)}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAddress(item);
                      }}
                      className="text-muted-foreground hover:text-accent flex shrink-0 cursor-pointer items-center gap-1 font-mono text-[11px] transition-colors"
                      title="Manage address details"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Manage</span>
                    </button>
                  </div>

                  <div className="text-foreground group-hover:text-primary mb-1 font-mono text-lg font-bold tracking-wider transition-colors">
                    {item.digipin}
                  </div>

                  <p className="text-foreground text-xs font-medium tracking-tight">
                    {item.unit}
                  </p>
                  {item.landmark ? (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {item.landmark}
                    </p>
                  ) : null}
                </div>

                {/* Action Bar */}
                <div
                  className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Explicit Public View Button */}
                  <Link
                    href={`/a/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 transition-colors"
                    title="Open public turn-by-turn navigation view"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-medium">Public View</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <TransitionLink
                      href={`/create/qr?slug=${item.slug}`}
                      className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="QR Badge Generator"
                      spinnerPlacement="start"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>QR Badge</span>
                    </TransitionLink>
                    <TransitionLink
                      href={`/dashboard/address/${item.id}`}
                      className="text-accent inline-flex cursor-pointer items-center gap-1 px-2 py-1 font-semibold hover:underline"
                      spinnerPlacement="end"
                    >
                      <span>Edit</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </TransitionLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ManageAddressModal
        isOpen={Boolean(selectedAddress)}
        onClose={() => setSelectedAddress(null)}
        address={selectedAddress}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Addresses"
        description="Are you sure you want to delete these selected addresses?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
