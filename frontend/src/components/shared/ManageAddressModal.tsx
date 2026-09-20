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
export function ManageAddressModal({ isOpen, onClose, address }: ManageAddressModalProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [fetchedExpiresAt, setFetchedExpiresAt] = useState<string | null | undefined>(undefined);
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
    address.unit || [address.floor, address.flat].filter(Boolean).join(', ') || '';

  const renderLinkStatusBadge = () => {
    const isExpiring = Boolean(effectiveExpiresAt);

    if (!isExpiring) {
      return (
        <span className="font-sans normal-case text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          ✅ Verified Permanent
        </span>
      );
    }

    const target = new Date(effectiveExpiresAt!).getTime();
    if (!isNaN(target)) {
      if (currentTime === null) {
        return (
          <span className="font-sans normal-case text-[11px] font-medium text-amber-600 dark:text-amber-400">
            ⏳ Guest Link: Expiring
          </span>
        );
      }
      const diff = target - currentTime;
      if (diff <= 0) {
        return (
          <span className="font-sans normal-case text-[11px] font-medium text-red-600 dark:text-red-400">
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
        <span className="font-sans normal-case text-[11px] font-medium text-amber-600 dark:text-amber-400">
          ⏳ Guest Link: Expires in {timeText}
        </span>
      );
    }

    return (
      <span className="font-sans normal-case text-[11px] font-medium text-amber-600 dark:text-amber-400">
        ⏳ Guest Link: Expiring
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="rounded-[6px] border border-border bg-card p-5 sm:p-6 sm:max-w-md shadow-2xl font-sans"
        showCloseButton={true}
      >
        <DialogHeader className="gap-2 text-center items-center pb-1">
          <div
            className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-xs ${
              effectiveExpiresAt
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-lg sm:text-xl font-bold font-sans text-foreground tracking-tight">
              {address.label || 'Sovereign Micro-Address'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Creator Management &amp; Distribution Portal
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 font-sans">
          {/* DIGIPIN + Unit info chip */}
          <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-muted/40 border border-border text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">DIGIPIN</span>
              <span className="font-mono font-bold text-sm text-foreground tracking-wider">{code}</span>
            </div>
            {unitOrDetails && (
              <div className="text-right max-w-[50%]">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Details</span>
                <span className="text-xs text-foreground truncate block">{unitOrDetails}</span>
              </div>
            )}
          </div>

          {/* 1. Sovereign Link Box (exact match to Step 5) */}
          <div className="bg-card border border-border rounded-[4px] p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>Sovereign Link</span>
              </span>
              {renderLinkStatusBadge()}
            </div>

            <div className="bg-muted/60 border border-border rounded-[4px] px-3 py-2.5 font-mono text-xs text-foreground select-all break-all shadow-2xs">
              <span className="font-semibold text-primary">{shareUrl}</span>
            </div>
          </div>

          {/* 2. Sharing Action Grid (Copy & Share) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              id="manage-copy-link-btn"
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
              id="manage-share-btn"
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

          {/* 3. Full-Width Generate QR Badge Button */}
          <Link
            href={`/dashboard/manage/${address.slug}/qr`}
            id="manage-generate-qr-badge-btn"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[4px] bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 font-semibold text-xs active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
          >
            <QrCode className="w-3.5 h-3.5 text-accent" />
            <span>Generate QR Badge</span>
          </Link>

          {/* 4. Public View Button (explicit opt-in to view public view) */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <Link
              href={`/a/${address.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              id="manage-public-view-link"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              <span>👁️ Open Public View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[4px] border border-border text-xs font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-all cursor-pointer font-sans"
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
