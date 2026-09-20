'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  QrCode,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

export interface ManageAddressItem {
  id?: string;
  slug: string;
  digipin: string;
  label?: string | null;
  unit?: string | null;
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  isPermanent?: boolean;
  expiresAt?: string | null;
}

interface ManageAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: ManageAddressItem | null;
}

/**
 * ManageAddressModal
 *
 * Reuses the exact Step 5 Success screen components for the creator view:
 * 1. Sovereign Link display box
 * 2. Copy Link action
 * 3. Share Link action (native share + copy fallback)
 * 4. Generate QR Badge action
 * 5. Explicit opt-in "👁️ Open Public View" link
 */
export function ManageAddressModal({
  isOpen,
  onClose,
  address,
}: ManageAddressModalProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [fetchedExpiresAt, setFetchedExpiresAt] = useState<
    string | null | undefined
  >(undefined);
  const [prevSlug, setPrevSlug] = useState(address?.slug);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  if (address?.slug !== prevSlug) {
    setPrevSlug(address?.slug);
    setFetchedExpiresAt(undefined);
  }

  useEffect(() => {
    if (!isOpen) return;
    setCurrentTime(Date.now());
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Sync fresh expiresAt if not present on the passed address object
  useEffect(() => {
    let isCancelled = false;
    if (address?.slug && address.expiresAt === undefined) {
      fetch(`/api/address/${address.slug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isCancelled && data?.address?.expiresAt !== undefined) {
            setFetchedExpiresAt(data.address.expiresAt);
          }
        })
        .catch(() => {});
    }
    return () => {
      isCancelled = true;
    };
  }, [address?.slug, address?.expiresAt]);

  if (!address) return null;

  const effectiveExpiresAt =
    address.expiresAt !== undefined ? address.expiresAt : fetchedExpiresAt;

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

  const renderLinkStatusBadge = () => {
    const isExpiring = Boolean(effectiveExpiresAt);

    if (!isExpiring) {
      return (
        <span className="font-sans text-[11px] font-medium text-emerald-600 normal-case dark:text-emerald-400">
          ✅ Verified Permanent
        </span>
      );
    }

    const target = new Date(effectiveExpiresAt!).getTime();
    if (!isNaN(target)) {
      if (currentTime === null) {
        return (
          <span className="font-sans text-[11px] font-medium text-amber-600 normal-case dark:text-amber-400">
            ⏳ Guest Link: Expiring
          </span>
        );
      }
      const diff = target - currentTime;
      if (diff <= 0) {
        return (
          <span className="font-sans text-[11px] font-medium text-red-600 normal-case dark:text-red-400">
            ⚠️ Link Expired
          </span>
        );
      }

      const mins = Math.floor(diff / (60 * 1000));
      const hours = Math.floor(diff / (60 * 60 * 1000));
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));

      let timeText = '';
      if (days >= 1) {
        timeText = `${days}d left`;
      } else if (hours >= 1) {
        timeText = `${hours}h left`;
      } else {
        timeText = `${Math.max(1, mins)}m left`;
      }

      return (
        <span className="font-sans text-[11px] font-medium text-amber-600 normal-case dark:text-amber-400">
          ⏳ Guest Link: Expires in {timeText}
        </span>
      );
    }

    return (
      <span className="font-sans text-[11px] font-medium text-amber-600 normal-case dark:text-amber-400">
        ⏳ Guest Link: Expiring
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="border-border bg-card rounded-[6px] border p-5 font-sans shadow-2xl sm:max-w-md sm:p-6"
        showCloseButton={true}
      >
        <DialogHeader className="items-center gap-2 pb-1 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-xs ${
              effectiveExpiresAt
                ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/40'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-foreground font-sans text-lg font-bold tracking-tight sm:text-xl">
              {address.label || 'Sovereign Micro-Address'}
            </DialogTitle>
            <p className="text-muted-foreground mt-0.5 font-sans text-xs">
              Creator Management &amp; Distribution Portal
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 font-sans">
          {/* DIGIPIN + Unit info chip */}
          <div className="bg-muted/40 border-border flex items-center justify-between rounded-[4px] border p-2.5 text-xs">
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

          {/* 1. Sovereign Link Box (exact match to Step 5) */}
          <div className="bg-card border-border space-y-2 rounded-[4px] border p-3.5 shadow-2xs">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase">
              <span className="flex items-center gap-1">
                <MapPin className="text-accent h-3.5 w-3.5" />
                <span>Sovereign Link</span>
              </span>
              {renderLinkStatusBadge()}
            </div>

            <div className="bg-muted/60 border-border text-foreground rounded-[4px] border px-3 py-2.5 font-mono text-xs break-all shadow-2xs select-all">
              <span className="text-primary font-semibold">{shareUrl}</span>
            </div>
          </div>

          {/* 2. Sharing Action Grid (Copy & Share) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              id="manage-copy-link-btn"
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
              id="manage-share-btn"
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

          {/* 3. Full-Width Generate QR Badge Button */}
          <Link
            href={`/dashboard/manage/${address.slug}/qr`}
            id="manage-generate-qr-badge-btn"
            onClick={onClose}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-zinc-900 px-4 py-2.5 font-sans text-xs font-semibold text-zinc-100 shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <QrCode className="text-accent h-3.5 w-3.5" />
            <span>Generate QR Badge</span>
          </Link>

          {/* 4. Public View Button (explicit opt-in to view public view) */}
          <div className="border-border flex items-center justify-between gap-2 border-t pt-2">
            <Link
              href={`/a/${address.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              id="manage-public-view-link"
              className="text-accent inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <span>👁️ Open Public View</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="border-border text-foreground bg-background hover:bg-muted cursor-pointer rounded-[4px] border px-3 py-1.5 font-sans text-xs font-medium transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
