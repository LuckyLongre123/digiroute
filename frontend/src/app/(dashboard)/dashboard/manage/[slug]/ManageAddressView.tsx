'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  QrCode,
  Share2,
} from 'lucide-react';
import type { ManageAddressItem } from '@/components/shared/ManageAddressModal';

export function ManageAddressView({ address }: { address: ManageAddressItem }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/a/${address.slug}`;
  const code = address.digipin || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `DigiRoute Address: ${code}`,
          text: `Here is my verified doorway micro-address for seamless navigation:`,
          url: shareUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const unitOrDetails =
    address.unit ||
    [address.floor, address.flat].filter(Boolean).join(', ') ||
    '';

  return (
    <div className="border-border bg-card space-y-5 rounded-[6px] border p-6 font-sans shadow-sm">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-foreground font-sans text-xl font-bold tracking-tight">
            {address.label || 'Sovereign Micro-Address'}
          </h1>
          <p className="text-muted-foreground mt-0.5 font-sans text-xs">
            Creator Management &amp; Distribution Portal
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1 font-sans">
        {/* DIGIPIN + Unit info chip */}
        <div className="bg-muted/40 border-border flex items-center justify-between rounded-[4px] border p-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] font-bold uppercase">
              DIGIPIN
            </span>
            <span className="text-foreground font-mono text-sm font-bold tracking-wider">
              {code}
            </span>
          </div>
          {unitOrDetails && (
            <div className="max-w-[50%] text-right">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                Details
              </span>
              <span className="text-foreground block truncate text-xs">
                {unitOrDetails}
              </span>
            </div>
          )}
        </div>

        {/* 1. Sovereign Link Box */}
        <div className="bg-card border-border space-y-2 rounded-[4px] border p-4 shadow-2xs">
          <div className="text-muted-foreground flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <MapPin className="text-accent h-3.5 w-3.5" />
              <span>Sovereign Link</span>
            </span>
            <span
              className={`font-sans text-[11px] font-medium normal-case ${
                address.expiresAt
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {address.expiresAt
                ? '⏳ Ephemeral link'
                : '✅ Verified Permanent'}
            </span>
          </div>

          <div className="bg-muted/60 border-border text-foreground rounded-[4px] border px-3 py-2.5 font-mono text-xs break-all shadow-2xs select-all">
            <span className="text-primary font-semibold">{shareUrl}</span>
          </div>
        </div>

        {/* 2. Sharing Action Grid (Copy & Share) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            id="manage-page-copy-btn"
            onClick={handleCopy}
            className="bg-card border-border text-foreground hover:border-primary/50 flex cursor-pointer items-center justify-center gap-2 rounded-[4px] border px-3 py-2.5 font-sans text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="manage-page-share-btn"
            onClick={handleShare}
            className="bg-primary text-primary-foreground flex cursor-pointer items-center justify-center gap-2 rounded-[4px] px-3 py-2.5 font-sans text-xs font-semibold shadow-xs transition-all hover:opacity-95 active:scale-[0.98]"
          >
            {shared ? (
              <>
                <Check className="text-accent h-3.5 w-3.5" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>

        {/* 3. Physical Distribution (QR Badge) */}
        <Link
          href={`/qr?slug=${address.slug}`}
          className="border-border bg-card hover:bg-muted/30 hover:border-primary/40 group flex cursor-pointer items-center justify-between rounded-[4px] border p-3 shadow-2xs transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-muted/60 text-foreground group-hover:text-primary rounded-[4px] p-2 transition-colors">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <p className="text-foreground text-xs font-semibold">
                Generate QR Badge
              </p>
              <p className="text-muted-foreground text-[11px]">
                Printable physical delivery badge
              </p>
            </div>
          </div>
          <span className="text-accent text-xs font-bold transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </Link>

        {/* 4. Public View Action */}
        <div className="border-border/80 flex items-center justify-between border-t pt-2">
          <span className="text-muted-foreground text-xs">
            Preview external courier screen
          </span>
          <Link
            href={`/a/${address.slug}`}
            target="_blank"
            className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
          >
            <span>Open Public View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
