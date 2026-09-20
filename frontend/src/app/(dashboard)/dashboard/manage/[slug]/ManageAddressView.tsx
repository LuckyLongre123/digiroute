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
    address.unit || [address.floor, address.flat].filter(Boolean).join(', ') || '';

  return (
    <div className="rounded-[6px] border border-border bg-card p-6 shadow-sm font-sans space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-sans text-foreground tracking-tight">
            {address.label || 'Sovereign Micro-Address'}
          </h1>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            Creator Management &amp; Distribution Portal
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1 font-sans">
        {/* DIGIPIN + Unit info chip */}
        <div className="flex items-center justify-between p-3 rounded-[4px] bg-muted/40 border border-border text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              DIGIPIN
            </span>
            <span className="font-mono font-bold text-sm text-foreground tracking-wider">
              {code}
            </span>
          </div>
          {unitOrDetails && (
            <div className="text-right max-w-[50%]">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Details
              </span>
              <span className="text-xs text-foreground truncate block">{unitOrDetails}</span>
            </div>
          )}
        </div>

        {/* 1. Sovereign Link Box */}
        <div className="bg-card border border-border rounded-[4px] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>Sovereign Link</span>
            </span>
            <span
              className={`font-sans normal-case text-[11px] font-medium ${
                address.expiresAt
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {address.expiresAt ? '⏳ Ephemeral link' : '✅ Verified Permanent'}
            </span>
          </div>

          <div className="bg-muted/60 border border-border rounded-[4px] px-3 py-2.5 font-mono text-xs text-foreground select-all break-all shadow-2xs">
            <span className="font-semibold text-primary">{shareUrl}</span>
          </div>
        </div>

        {/* 2. Sharing Action Grid (Copy & Share) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            id="manage-page-copy-btn"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[4px] bg-card border border-border text-foreground font-semibold text-xs hover:border-primary/50 active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="manage-page-share-btn"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[4px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-95 active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
          >
            {shared ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>

        {/* 3. Physical Distribution (QR Badge) */}
        <Link
          href={`/qr?slug=${address.slug}`}
          className="flex items-center justify-between p-3 rounded-[4px] border border-border bg-card hover:bg-muted/30 hover:border-primary/40 transition-colors shadow-2xs cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[4px] bg-muted/60 text-foreground group-hover:text-primary transition-colors">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Generate QR Badge</p>
              <p className="text-[11px] text-muted-foreground">Printable physical delivery badge</p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </Link>

        {/* 4. Public View Action */}
        <div className="pt-2 border-t border-border/80 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Preview external courier screen</span>
          <Link
            href={`/a/${address.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>Open Public View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
