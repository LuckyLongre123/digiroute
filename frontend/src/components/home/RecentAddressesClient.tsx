'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight, Eye } from 'lucide-react';
import {
  ManageAddressModal,
  type ManageAddressItem,
} from '@/components/shared/ManageAddressModal';
import { type RecentAddressItem } from '@/app/actions/getRecentAddresses';

interface RecentAddressesClientProps {
  addresses: RecentAddressItem[];
}

export function RecentAddressesClient({
  addresses,
}: RecentAddressesClientProps) {
  const [selectedAddress, setSelectedAddress] =
    useState<ManageAddressItem | null>(null);

  if (!addresses || addresses.length === 0) {
    return null;
  }

  return (
    <>
      <section className="bg-card space-y-3 rounded-sm border border-zinc-200 p-5 font-sans shadow-xs sm:p-6 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-accent h-4 w-4" />
            <h2 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
              Recent Addresses
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="hover:text-foreground flex items-center gap-1 text-xs font-semibold text-zinc-600 transition-colors dark:text-zinc-400"
          >
            <span>View all in Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
          {addresses.map((addr) => (
            <div
              key={addr.id || addr.slug}
              onClick={() => setSelectedAddress(addr)}
              className="group bg-background hover:border-accent/60 flex cursor-pointer flex-col justify-between rounded-sm border border-zinc-200 p-3.5 text-left transition-all hover:shadow-xs dark:border-zinc-800"
            >
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-foreground truncate text-xs font-semibold">
                    {addr.label || addr.flat || 'Micro-Address'}
                  </span>
                  <span className="text-muted-foreground group-hover:text-accent ml-1 shrink-0 text-[11px] font-medium transition-colors">
                    Manage &rarr;
                  </span>
                </div>
                <p className="text-accent font-mono text-xs font-semibold tracking-wider">
                  {addr.digipin}
                </p>
              </div>
              {(addr.floor || addr.landmark) && (
                <p className="text-muted-foreground mt-1.5 truncate text-[11px]">
                  {[addr.floor, addr.landmark].filter(Boolean).join(' • ')}
                </p>
              )}

              <div
                className="border-border/80 mt-2 flex items-center justify-between border-t pt-2.5 text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/a/${addr.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
                  title="Open public view"
                >
                  <Eye className="h-3 w-3" />
                  <span>👁️ Public View</span>
                </Link>

                <span className="text-muted-foreground text-[10px]">
                  Click to Manage
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ManageAddressModal
        isOpen={Boolean(selectedAddress)}
        onClose={() => setSelectedAddress(null)}
        address={selectedAddress}
      />
    </>
  );
}
