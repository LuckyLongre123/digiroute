'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import {
  ManageAddressModal,
  type ManageAddressItem,
} from '@/components/shared/ManageAddressModal';

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
  const [selectedAddress, setSelectedAddress] =
    useState<ManageAddressItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 300ms debounce for smooth filtering without UI frame drops
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Multi-field case-insensitive filtering
  const filteredAddresses = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return addresses;

    const cleanQuery = query.replace(/[^a-z0-9]/g, '');

    return addresses.filter((item) => {
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
  }, [addresses, debouncedQuery]);

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
              of <strong>{addresses.length}</strong>
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
          {filteredAddresses.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAddress(item)}
              className="group hover:border-accent/60 flex cursor-pointer flex-col justify-between space-y-4 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
                      {item.label}
                    </span>
                    {renderExpiryBadge(item.expiresAt)}
                  </div>
                  <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 font-mono text-[11px]">
                    <SlidersHorizontal className="text-muted-foreground group-hover:text-accent h-3.5 w-3.5 transition-colors" />
                    <span>Click to Manage</span>
                  </span>
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
                  <Link
                    href={`/create/qr?slug=${item.slug}`}
                    className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="QR Badge Generator"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>QR Badge</span>
                  </Link>
                  <Link
                    href={`/dashboard/address/${item.id}`}
                    className="text-accent inline-flex cursor-pointer items-center gap-1 px-2 py-1 font-semibold hover:underline"
                  >
                    <span>Edit</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ManageAddressModal
        isOpen={Boolean(selectedAddress)}
        onClose={() => setSelectedAddress(null)}
        address={selectedAddress}
      />
    </div>
  );
}
