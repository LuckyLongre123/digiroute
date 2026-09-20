'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAddressStore } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { claimAddress } from '@/app/actions/claimAddress';
import { updateAddressExpiry } from '@/app/actions/updateAddressExpiry';
import { getSessionAction } from '@/app/actions/auth';
import { toast } from 'sonner';
import {
  ArrowRight,
  BookmarkCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Lock,
  MapPin,
  Plus,
  QrCode,
  Radio,
  Share2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const EXPIRY_OPTIONS = [
  { label: '1 Hour', desc: 'Short-term delivery window' },
  { label: '12 Hours', desc: 'Half-day guest/courier window' },
  { label: '24 Hours', desc: 'Full-day event or visitor access' },
  { label: '7 Days', desc: 'Weekly temporary window' },
  { label: 'Never (Permanent)', desc: 'Permanent sovereign address (never expires)' },
] as const;

function formatExpiryDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function CreateSuccessSkeleton() {
  return (
    <div
      className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 pt-2 space-y-4 font-sans text-foreground animate-pulse"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 space-y-2">
        <div className="w-12 h-12 rounded-full bg-muted border border-border" />
        <div className="space-y-1 flex flex-col items-center">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-3 w-64 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-[4px] p-4 space-y-3">
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="h-10 bg-muted/60 rounded-[4px]" />
        <div className="h-4 w-40 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-muted rounded-[4px]" />
          <div className="h-11 bg-muted rounded-[4px]" />
        </div>
        <div className="h-12 bg-muted rounded-[4px]" />
      </div>
    </div>
  );
}

function CreateSuccessContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUnsavedCreateModalOpen, setIsUnsavedCreateModalOpen] = useState(false);
  const [isChangeExpiryModalOpen, setIsChangeExpiryModalOpen] = useState(false);

  // Expiry state
  const [selectedExpiry, setSelectedExpiry] = useState<string>('24 Hours');
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false);

  // Save to account states (Fix 2: strict local state locks)
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Track if login toast has already fired in this session
  const loginToastFiredRef = useRef(false);

  // Fix 1: Single authoritative login toast & param cleanup with server refresh
  useEffect(() => {
    if (searchParams.get('login') === 'success' && !loginToastFiredRef.current) {
      loginToastFiredRef.current = true;
      toast.success('Successfully logged in!');

      const params = new URLSearchParams(searchParams.toString());
      params.delete('login');
      const cleanUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

      router.replace(cleanUrl);
      router.refresh();
    }
  }, [searchParams, pathname, router]);

  // Real-time server session synchronization
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>(
    storeIsAuthenticated ? 'authenticated' : 'loading'
  );

  useEffect(() => {
    getSessionAction()
      .then((res) => {
        if (res?.user) {
          useAuthStore.getState().setUser(res.user);
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      })
      .catch(() => {
        setAuthStatus('unauthenticated');
      });
  }, []);

  const isAuthenticated = authStatus === 'authenticated' || storeIsAuthenticated;
  const isLiveTracking = useAddressStore((state) => state.isLiveTracking);
  const canAccessLiveRadar = Boolean(isAuthenticated && isLiveTracking);
  const digipin = useAddressStore((state) => state.digipin);
  const storeSlug = useAddressStore((state) => state.slug);
  const storeExpiresAt = useAddressStore((state) => state.expiresAt);
  const isSaved = useAddressStore((state) => state.isSaved);
  const setIsCompleted = useAddressStore((state) => state.setIsCompleted);

  const addressId = storeSlug || '';
  const slug =
    storeSlug ||
    `dg-${(digipin || 'address').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || '7x9k2m4p1q8z'}`;
  const code = digipin?.trim() || '4M8K-9P2L-1X';

  const [expiresAt, setExpiresAt] = useState<string | null>(() => storeExpiresAt || null);
  const [addressUserId, setAddressUserId] = useState<string | null>(null);
  const [isExpiredOrInvalid, setIsExpiredOrInvalid] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setIsExpiredOrInvalid(false);
      return;
    }
    const target = new Date(expiresAt).getTime();
    setIsExpiredOrInvalid(isNaN(target) || target <= Date.now());
  }, [expiresAt]);

  useEffect(() => {
    if (!slug) return;
    import('@/app/actions/getAddress').then(({ getAddressAction }) => {
      getAddressAction(slug)
        .then((res) => {
          if (res.success && res.address) {
            if (res.address.expiresAt !== undefined) {
              setExpiresAt(res.address.expiresAt);
              useAddressStore.getState().setExpiresAt(res.address.expiresAt);
            }
            if (res.address.isEphemeral !== undefined) {
              useAddressStore.getState().setIsEphemeral(res.address.isEphemeral);
            }
            if (res.address.userId) {
              setAddressUserId(res.address.userId);
              useAddressStore.getState().setIsSaved(true);
              setHasSaved(true);
            }
          }
        })
        .catch(() => {});
    });
  }, [slug]);

  // Expiration check: valid future date
  const hasExpiration = Boolean(expiresAt && !isExpiredOrInvalid);

  // Address is considered saved to account if hasSaved, isSaved, or address has assigned userId
  const isAlreadySavedToAccount = Boolean(hasSaved || isSaved || addressUserId);
  const isAlreadySaved = isAlreadySavedToAccount;

  // Mark draft as successfully generated
  useEffect(() => {
    setIsCompleted(true);
  }, [setIsCompleted]);

  // Fix 2: "Save to Account" click handler with real-time auth verification
  const handleSaveToAccount = async () => {
    if (isSaving || isAlreadySavedToAccount) return;

    // Verify real-time auth before deciding to prompt login modal
    let userAuthed = authStatus === 'authenticated' || useAuthStore.getState().isAuthenticated;
    if (!userAuthed) {
      try {
        const sessionRes = await getSessionAction();
        if (sessionRes?.user) {
          useAuthStore.getState().setUser(sessionRes.user);
          setAuthStatus('authenticated');
          userAuthed = true;
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch {
        setAuthStatus('unauthenticated');
      }
    }

    if (!userAuthed) {
      setIsAuthModalOpen(true);
      return;
    }

    const targetId = addressId || slug;
    if (!targetId) return;

    setIsSaving(true);
    try {
      const result = await claimAddress(targetId);
      if (result.success) {
        setHasSaved(true);
        setAddressUserId(result.address?.userId || 'saved');
        if (result.address?.expiresAt !== undefined) {
          setExpiresAt(result.address.expiresAt);
          useAddressStore.getState().setExpiresAt(result.address.expiresAt);
          useAddressStore.getState().setIsEphemeral(Boolean(result.address.expiresAt));
        }
        useAddressStore.getState().setSaveToAccount(true);
        useAddressStore.getState().setIsSaved(true);
        toast.success('Successfully saved to your account!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save address.');
      }
    } catch (err) {
      console.error('[handleSaveToAccount] Error:', err);
      toast.error('Network connection issue. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fix 4: "Change Expiry" handler with single toast, modal close, and revalidatePath
  const handleSelectExpiry = async (optionValue: string) => {
    if (isUpdatingExpiry) return;
    setIsUpdatingExpiry(true);

    try {
      const targetId = addressId || slug;
      const result = await updateAddressExpiry(targetId, optionValue);
      if (result.success) {
        setSelectedExpiry(optionValue);
        const newExpiresAt = result.expiresAt || null;
        setExpiresAt(newExpiresAt);
        useAddressStore.getState().setExpiresAt(newExpiresAt);
        useAddressStore.getState().setIsEphemeral(Boolean(newExpiresAt));
        if (!newExpiresAt) {
          useAddressStore.getState().setIsSaved(true);
          setHasSaved(true);
        }
        toast.success(`Expiry updated to ${optionValue}`);
        setIsChangeExpiryModalOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update expiry.');
      }
    } catch (err) {
      console.error('[handleSelectExpiry] Error:', err);
      toast.error('Network connection issue. Please retry.');
    } finally {
      setIsUpdatingExpiry(false);
    }
  };

  // Dynamic URL construction: safely evaluate origin after mount
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'http://localhost:3000');
  const shareUrl = `${baseUrl}/a/${slug}`;

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

  const handleCreateAnotherClick = () => {
    if (isSaving || isUpdatingExpiry) return;
    if (isAuthenticated && isAlreadySaved) {
      useAddressStore.getState().resetDraft();
      router.push('/create');
    } else {
      setIsUnsavedCreateModalOpen(true);
    }
  };

  const handleDiscardAndCreateAnother = () => {
    setIsUnsavedCreateModalOpen(false);
    useAddressStore.getState().resetDraft();
    router.push('/create');
  };

  const handleSaveToAccountFromCreateAnother = async () => {
    if (isSaving || isAlreadySavedToAccount) return;

    let userAuthed = authStatus === 'authenticated' || useAuthStore.getState().isAuthenticated;
    if (!userAuthed) {
      try {
        const sessionRes = await getSessionAction();
        if (sessionRes?.user) {
          useAuthStore.getState().setUser(sessionRes.user);
          setAuthStatus('authenticated');
          userAuthed = true;
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch {
        setAuthStatus('unauthenticated');
      }
    }

    if (!userAuthed) {
      setIsUnsavedCreateModalOpen(false);
      router.push('/login?callbackUrl=/create/success?login=success');
      return;
    }

    setIsSaving(true);
    try {
      const targetId = addressId || slug;
      const result = await claimAddress(targetId);
      if (result.success) {
        setHasSaved(true);
        if (result.address?.expiresAt !== undefined) {
          setExpiresAt(result.address.expiresAt);
          useAddressStore.getState().setExpiresAt(result.address.expiresAt);
          useAddressStore.getState().setIsEphemeral(Boolean(result.address.expiresAt));
        }
        useAddressStore.getState().setSaveToAccount(true);
        useAddressStore.getState().setIsSaved(true);
        toast.success('Address permanently saved to your account.');
        setIsUnsavedCreateModalOpen(false);
        useAddressStore.getState().resetDraft();
        router.push('/create');
      } else {
        toast.error(result.error || 'Failed to save address.');
      }
    } catch {
      toast.error('Network connection issue. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return <CreateSuccessSkeleton />;
  }

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 animate-in fade-in duration-150 pt-2 space-y-4 font-sans text-foreground"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* 1. Success Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 space-y-2 font-sans">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="space-y-0.5 font-sans">
          <h1 className="text-xl md:text-2xl font-bold font-sans text-foreground tracking-tight">
            Micro-Address Live
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-sans">
            Your sovereign doorstep link is generated and ready to share.
          </p>
        </div>
      </div>

      {/* Expiry Banner: Dynamic based on expiresAt state */}
      {hasExpiration ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-[4px] text-amber-950 dark:text-amber-200 font-sans shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Ephemeral link:</strong> Expires on {formatExpiryDate(expiresAt!)}.
            </span>
          </div>
          <button
            type="button"
            id="success-change-expiry-btn"
            onClick={() => setIsChangeExpiryModalOpen(true)}
            disabled={isSaving || isUpdatingExpiry}
            className="text-xs font-bold text-amber-900 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 underline underline-offset-2 shrink-0 cursor-pointer self-start sm:self-auto hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [Change Expiry]
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2.5 p-3 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-[4px] text-emerald-950 dark:text-emerald-200 font-sans shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Permanent sovereign link:</strong> Never expires.
            </span>
          </div>
          <button
            type="button"
            id="success-change-expiry-btn"
            onClick={() => setIsChangeExpiryModalOpen(true)}
            disabled={isSaving || isUpdatingExpiry}
            className="text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-100 underline underline-offset-2 shrink-0 cursor-pointer self-start sm:self-auto hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [Change Expiry]
          </button>
        </div>
      )}

      {/* 2. Prominent Short-Link Display Box */}
      <div className="bg-card border border-border rounded-[4px] p-4 shadow-xs space-y-3 font-sans">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>Sovereign Link</span>
          </span>
        </div>

        <div className="flex items-center justify-between bg-muted/60 border border-border rounded-[4px] px-3.5 py-3 font-mono text-xs md:text-sm text-foreground select-all break-all shadow-2xs">
          <span className="font-semibold text-primary">{shareUrl}</span>
        </div>

        {/* Fix 2: Strict "Save to Account" UI State Lock */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground font-sans">
            {hasExpiration ? 'Ephemeral micro-address' : 'Permanent sovereign address'}
          </span>

          {isSaving ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-border bg-muted text-xs font-semibold text-muted-foreground cursor-not-allowed shadow-2xs font-sans opacity-75"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </button>
          ) : isAlreadySavedToAccount ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-not-allowed shadow-2xs font-sans select-none opacity-95"
            >
              <span>✅ Saved to Account</span>
            </button>
          ) : (
            <button
              type="button"
              id="success-save-permanently-btn"
              onClick={handleSaveToAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground active:scale-[0.98] transition-[transform,opacity] duration-150 shadow-2xs cursor-pointer font-sans"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-accent" />
              <span>Save to Account</span>
              {authStatus === 'unauthenticated' && <Lock className="text-zinc-400 shrink-0 ml-0.5" size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* 3. Sharing Action Grid */}
      <div className="space-y-3 font-sans">
        <div className="grid grid-cols-2 gap-3 font-sans">
          <button
            type="button"
            id="success-copy-link-btn"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-[4px] bg-card border border-border text-foreground font-semibold text-xs md:text-sm hover:border-primary/50 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer font-sans"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="success-share-btn"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-[4px] bg-primary text-primary-foreground font-semibold text-xs md:text-sm hover:opacity-95 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer font-sans"
          >
            {shared ? (
              <>
                <Check className="w-4 h-4 text-accent" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>

        {/* Full-Width Generate QR Badge Button */}
        <Link
          href={`/create/qr?slug=${slug}`}
          id="success-generate-qr-badge-btn"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-[4px] bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 font-semibold text-sm active:scale-[0.98] transition-all shadow-sm cursor-pointer font-sans"
        >
          <QrCode className="w-4 h-4 text-accent" />
          <span>Generate QR Badge</span>
        </Link>
      </div>

      {/* Discrete Dev Backdoor Footer Link */}
      <Link
        href={`/track/${slug}`}
        id="dev-force-open-radar-btn"
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 text-center mt-8 w-full block transition-colors font-mono cursor-pointer"
      >
        Dev: Force Open Radar &rarr;
      </Link>

      {/* 4. Bottom Thumb-Zone Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 items-start font-sans">
          <button
            type="button"
            id="success-create-another-btn"
            onClick={handleCreateAnotherClick}
            disabled={isSaving || isUpdatingExpiry}
            className="flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-[4px] border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs md:text-sm active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span>Create Another</span>
          </button>

          {/* Live Radar CTA Section */}
          <div className="flex-1 w-full flex flex-col items-center">
            {canAccessLiveRadar ? (
              <Link
                href={`/track/${slug}`}
                id="success-open-radar-btn"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[4px] border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-semibold text-xs md:text-sm active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer font-sans"
              >
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Open Live Radar</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled={true}
                id="success-open-radar-btn"
                aria-disabled="true"
                title="Available for logged-in users with active tracking."
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[4px] border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 font-semibold text-xs md:text-sm opacity-50 cursor-not-allowed shadow-none font-sans"
              >
                <Radio className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span>Open Live Radar</span>
              </button>
            )}

            {!canAccessLiveRadar && (
              <span className="text-[10px] text-muted-foreground font-sans tracking-tight text-center mt-1">
                Available for logged-in users with active tracking.
              </span>
            )}
          </div>

          <Link
            href={`/a/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            id="success-test-public-link-btn"
            className="flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-[4px] bg-accent text-accent-foreground font-semibold text-xs md:text-sm hover:opacity-95 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer font-sans"
          >
            <span>View Live Address</span>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>

      {/* 5. Interstitial Login Modal for "Save to Account" */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[4px] bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-accent" />
              </div>
              <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
                Unlock this feature
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              Sign in to save this address permanently to your account. Your current link will be claimed immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2 font-sans">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="px-3.5 py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="button"
              id="success-proceed-login-btn"
              onClick={() => {
                setIsAuthModalOpen(false);
                router.push('/login?callbackUrl=/create/success?login=success');
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[4px] bg-accent text-accent-foreground text-xs md:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer font-sans"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Unsaved State Warning Modal for "Create Another" */}
      <Dialog open={isUnsavedCreateModalOpen} onOpenChange={setIsUnsavedCreateModalOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
              Create new without saving?
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              Your current micro-address hasn&apos;t been saved to an account. Starting a new one will discard this link permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2 font-sans">
            <button
              type="button"
              onClick={() => setIsUnsavedCreateModalOpen(false)}
              className="px-3.5 py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="button"
              id="discard-and-start-fresh-btn"
              onClick={handleDiscardAndCreateAnother}
              className="px-3.5 py-2 rounded-[4px] border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs md:text-sm font-medium active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans"
            >
              Discard &amp; Start Fresh
            </button>
            <button
              type="button"
              id="save-to-account-from-create-another-btn"
              onClick={handleSaveToAccountFromCreateAnother}
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[4px] bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save to Account</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. Change Expiry Modal (Fix 4: Clean radio list with 5 options) */}
      <Dialog open={isChangeExpiryModalOpen} onOpenChange={setIsChangeExpiryModalOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Change Link Expiry</span>
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              Choose how long this sovereign doorstep link remains active before expiring.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            {EXPIRY_OPTIONS.map((opt) => {
              const isSelected = selectedExpiry === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  disabled={isUpdatingExpiry}
                  onClick={() => handleSelectExpiry(opt.label)}
                  className={`w-full flex items-center justify-between p-3 rounded-[4px] border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 font-semibold text-foreground'
                      : 'border-border bg-background hover:bg-muted text-foreground/80'
                  } ${isUpdatingExpiry ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-accent bg-accent' : 'border-border bg-background'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">{opt.label}</span>
                      <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                    </div>
                  </div>
                  {isUpdatingExpiry && isSelected ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  ) : isSelected ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2 font-sans">
            <button
              type="button"
              disabled={isUpdatingExpiry}
              onClick={() => setIsChangeExpiryModalOpen(false)}
              className="px-3.5 py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-all cursor-pointer font-sans disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreateSuccessPage() {
  return (
    <Suspense fallback={<CreateSuccessSkeleton />}>
      <CreateSuccessContent />
    </Suspense>
  );
}
