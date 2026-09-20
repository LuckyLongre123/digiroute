'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, ArrowUpRight, Eye, SlidersHorizontal, Search, X } from 'lucide-react';
import { ManageAddressModal, type ManageAddressItem } from '@/components/shared/ManageAddressModal';

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
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Permanent
      </span>
    );
  }

  const target = new Date(expiresAt).getTime();
  if (isNaN(target)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Permanent
      </span>
    );
  }

  const diff = target - Date.now();
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
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
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {timeText}
    </span>
  );
}

export function AddressBookList({ addresses }: AddressBookListProps) {
  const [selectedAddress, setSelectedAddress] = useState<ManageAddressItem | null>(null);
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
      if (digipin.includes(query) || (cleanQuery && cleanDigipin.includes(cleanQuery))) {
        return true;
      }

      // 2. Label / Tags match
      const label = (item.label || '').toLowerCase();
      if (label.includes(query)) return true;

      // Guest / Ephemeral / Permanent tag filters
      if (item.isEphemeral && (query === 'guest' || query === 'ephemeral' || query === 'temp')) {
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
      if (item.baseLat !== undefined && String(item.baseLat).toLowerCase().includes(query)) {
        return true;
      }
      if (item.baseLng !== undefined && String(item.baseLng).toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [addresses, debouncedQuery]);

  return (
    <div className="space-y-4">
      {/* Enhanced Real-Time Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by DIGIPIN, label, landmark, doorway text, coordinates..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {debouncedQuery.trim() && (
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-muted-foreground shrink-0 px-1">
            <span>
              Showing <strong className="text-foreground">{filteredAddresses.length}</strong> of{' '}
              <strong>{addresses.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-accent hover:underline text-xs font-semibold cursor-pointer ml-1"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Address Cards Grid or Empty Search Results */}
      {filteredAddresses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-3 font-sans shadow-xs">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-muted-foreground">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              No addresses found matching &ldquo;{debouncedQuery}&rdquo;
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Check for typos or try searching with a partial DIGIPIN (e.g. 39J), label, landmark, or GPS coordinate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-foreground text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Search</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 font-sans">
          {filteredAddresses.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAddress(item)}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:border-accent/60 hover:shadow-md transition-all space-y-4 cursor-pointer text-left"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                      {item.label}
                    </span>
                    {renderExpiryBadge(item.expiresAt)}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                    <span>Click to Manage</span>
                  </span>
                </div>

                <div className="font-mono text-lg font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
                  {item.digipin}
                </div>

                <p className="text-xs text-foreground font-medium tracking-tight">
                  {item.unit}
                </p>
                {item.landmark ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.landmark}
                  </p>
                ) : null}
              </div>

              {/* Action Bar */}
              <div
                className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Explicit Public View Button */}
                <Link
                  href={`/a/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Open public turn-by-turn navigation view"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">Public View</span>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/create/qr?slug=${item.slug}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="QR Badge Generator"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Badge</span>
                  </Link>
                  <Link
                    href={`/dashboard/address/${item.id}`}
                    className="inline-flex items-center gap-1 text-accent font-semibold px-2 py-1 hover:underline cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
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
