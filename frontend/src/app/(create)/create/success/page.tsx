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
import {
  useEffect,
  useState,
  useRef,
  Suspense,
  useSyncExternalStore,
} from 'react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const EXPIRY_OPTIONS = [
  { label: '1 Hour', desc: 'Short-term delivery window' },
  { label: '12 Hours', desc: 'Half-day guest/courier window' },
  { label: '24 Hours', desc: 'Full-day event or visitor access' },
  { label: '7 Days', desc: 'Weekly temporary window' },
  {
    label: 'Never (Permanent)',
    desc: 'Permanent sovereign address (never expires)',
  },
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
      className="text-foreground flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-4 pt-2 pb-28 font-sans"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      <div className="flex flex-col items-center justify-center space-y-2 pt-2 pb-1 text-center">
        <div className="bg-muted border-border h-12 w-12 rounded-full border" />
        <div className="flex flex-col items-center space-y-1">
          <div className="bg-muted h-6 w-48 rounded" />
          <div className="bg-muted/60 h-3 w-64 rounded" />
        </div>
      </div>
      <div className="bg-card border-border space-y-3 rounded-[4px] border p-4">
        <div className="bg-muted h-3 w-28 rounded" />
        <div className="bg-muted/60 h-10 rounded-[4px]" />
        <div className="bg-muted h-4 w-40 rounded" />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted h-11 rounded-[4px]" />
          <div className="bg-muted h-11 rounded-[4px]" />
        </div>
        <div className="bg-muted h-12 rounded-[4px]" />
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
  const [isUnsavedCreateModalOpen, setIsUnsavedCreateModalOpen] =
    useState(false);
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
    if (
      searchParams.get('login') === 'success' &&
      !loginToastFiredRef.current
    ) {
      loginToastFiredRef.current = true;
      toast.success('Successfully logged in!');

      const params = new URLSearchParams(searchParams.toString());
      params.delete('login');
      const cleanUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      router.replace(cleanUrl);
      router.refresh();
    }
  }, [searchParams, pathname, router]);

  // Real-time server session synchronization
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [authStatus, setAuthStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated'
  >(storeIsAuthenticated ? 'authenticated' : 'loading');

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

  const isAuthenticated =
    authStatus === 'authenticated' || storeIsAuthenticated;
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
    `dg-${
      (digipin || 'address')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 12) || '7x9k2m4p1q8z'
    }`;
  const code = digipin?.trim() || '4M8K-9P2L-1X';

  const [expiresAt, setExpiresAt] = useState<string | null>(
    () => storeExpiresAt || null
  );
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
              useAddressStore
                .getState()
                .setIsEphemeral(res.address.isEphemeral);
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
    let userAuthed =
      authStatus === 'authenticated' || useAuthStore.getState().isAuthenticated;
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
          useAddressStore
            .getState()
            .setIsEphemeral(Boolean(result.address.expiresAt));
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

    let userAuthed =
      authStatus === 'authenticated' || useAuthStore.getState().isAuthenticated;
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
          useAddressStore
            .getState()
            .setIsEphemeral(Boolean(result.address.expiresAt));
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
      className="animate-in fade-in text-foreground flex min-h-[calc(100vh-8rem)] flex-col space-y-4 pt-2 pb-28 font-sans duration-150"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* 1. Success Header */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-2 pb-1 text-center font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xs">
          <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div className="space-y-0.5 font-sans">
          <h1 className="text-foreground font-sans text-xl font-bold tracking-tight md:text-2xl">
            Micro-Address Live
          </h1>
          <p className="text-muted-foreground font-sans text-xs md:text-sm">
            Your sovereign doorstep link is generated and ready to share.
          </p>
        </div>
      </div>

      {/* Expiry Banner: Dynamic based on expiresAt state */}
      {hasExpiration ? (
        <div className="flex flex-col justify-between gap-2.5 rounded-[4px] border border-amber-200/90 bg-amber-50/90 p-3 font-sans text-xs text-amber-950 shadow-xs sm:flex-row sm:items-center dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
            <span>
              <strong>Ephemeral link:</strong> Expires on{' '}
              {formatExpiryDate(expiresAt!)}.
            </span>
          </div>
          <button
            type="button"
            id="success-change-expiry-btn"
            onClick={() => setIsChangeExpiryModalOpen(true)}
            disabled={isSaving || isUpdatingExpiry}
            className="shrink-0 cursor-pointer self-start text-xs font-bold text-amber-900 underline underline-offset-2 hover:text-amber-950 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto dark:text-amber-300 dark:hover:text-amber-100"
          >
            [Change Expiry]
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2.5 rounded-[4px] border border-emerald-200/90 bg-emerald-50/90 p-3 font-sans text-xs text-emerald-950 shadow-xs dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>
              <strong>Permanent sovereign link:</strong> Never expires.
            </span>
          </div>
          <button
            type="button"
            id="success-change-expiry-btn"
            onClick={() => setIsChangeExpiryModalOpen(true)}
            disabled={isSaving || isUpdatingExpiry}
            className="shrink-0 cursor-pointer self-start text-xs font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto dark:text-emerald-300 dark:hover:text-emerald-100"
          >
            [Change Expiry]
          </button>
        </div>
      )}

      {/* 2. Prominent Short-Link Display Box */}
      <div className="bg-card border-border space-y-3 rounded-[4px] border p-4 font-sans shadow-xs">
        <div className="text-muted-foreground flex items-center justify-between font-sans text-[11px] font-semibold tracking-wider uppercase">
          <span className="flex items-center gap-1">
            <MapPin className="text-accent h-3.5 w-3.5" />
            <span>Sovereign Link</span>
          </span>
        </div>

        <div className="bg-muted/60 border-border text-foreground flex items-center justify-between rounded-[4px] border px-3.5 py-3 font-mono text-xs break-all shadow-2xs select-all md:text-sm">
          <span className="text-primary font-semibold">{shareUrl}</span>
        </div>

        {/* Fix 2: Strict "Save to Account" UI State Lock */}
        <div className="border-border/60 flex items-center justify-between border-t pt-1">
          <span className="text-muted-foreground font-sans text-[11px]">
            {hasExpiration
              ? 'Ephemeral micro-address'
              : 'Permanent sovereign address'}
          </span>

          {isSaving ? (
            <button
              type="button"
              disabled
              className="border-border bg-muted text-muted-foreground inline-flex cursor-not-allowed items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-sans text-xs font-semibold opacity-75 shadow-2xs"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </button>
          ) : isAlreadySavedToAccount ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[4px] border border-emerald-300/80 bg-emerald-50 px-3 py-1.5 font-sans text-xs font-semibold text-emerald-700 opacity-95 shadow-2xs select-none dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              <span>✅ Saved to Account</span>
            </button>
          ) : (
            <button
              type="button"
              id="success-save-permanently-btn"
              onClick={handleSaveToAccount}
              className="border-border bg-card hover:bg-muted text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-sans text-xs font-semibold shadow-2xs transition-[transform,opacity] duration-150 active:scale-[0.98]"
            >
              <BookmarkCheck className="text-accent h-3.5 w-3.5" />
              <span>Save to Account</span>
              {authStatus === 'unauthenticated' && (
                <Lock className="ml-0.5 shrink-0 text-zinc-400" size={13} />
              )}
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
            className="bg-card border-border text-foreground hover:border-primary/50 flex cursor-pointer items-center justify-center gap-2 rounded-[4px] border px-3 py-3 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] md:text-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="success-share-btn"
            onClick={handleShare}
            className="bg-primary text-primary-foreground flex cursor-pointer items-center justify-center gap-2 rounded-[4px] px-3 py-3 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out hover:opacity-95 active:scale-[0.98] md:text-sm"
          >
            {shared ? (
              <>
                <Check className="text-accent h-4 w-4" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>

        {/* Full-Width Generate QR Badge Button */}
        <Link
          href={`/create/qr?slug=${slug}`}
          id="success-generate-qr-badge-btn"
          className="hover:bg-zinc-850 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-zinc-900 px-4 py-3.5 font-sans text-sm font-semibold text-zinc-100 shadow-sm transition-all active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <QrCode className="text-accent h-4 w-4" />
          <span>Generate QR Badge</span>
        </Link>
      </div>

      {/* Discrete Dev Backdoor Footer Link */}
      <Link
        href={`/track/${slug}`}
        id="dev-force-open-radar-btn"
        className="mt-8 block w-full cursor-pointer text-center font-mono text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        Dev: Force Open Radar &rarr;
      </Link>

      {/* 4. Bottom Thumb-Zone Actions */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans">
        <div className="mx-auto flex max-w-md flex-col items-start gap-2.5 font-sans sm:flex-row md:max-w-xl lg:max-w-2xl">
          <button
            type="button"
            id="success-create-another-btn"
            onClick={handleCreateAnotherClick}
            disabled={isSaving || isUpdatingExpiry}
            className="border-border bg-card hover:bg-muted text-foreground flex w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-[4px] border py-3 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <Plus className="text-muted-foreground h-4 w-4" />
            <span>Create Another</span>
          </button>

          {/* Live Radar CTA Section */}
          <div className="flex w-full flex-1 flex-col items-center">
            {canAccessLiveRadar ? (
              <Link
                href={`/track/${slug}`}
                id="success-open-radar-btn"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-zinc-700 bg-zinc-900 py-3 font-sans text-xs font-semibold text-zinc-100 shadow-xs transition-[transform,opacity] duration-150 ease-out hover:bg-zinc-800 active:scale-[0.98] md:text-sm"
              >
                <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                <span>Open Live Radar</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled={true}
                id="success-open-radar-btn"
                aria-disabled="true"
                title="Available for logged-in users with active tracking."
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[4px] border border-zinc-300 bg-zinc-100 py-3 font-sans text-xs font-semibold text-zinc-400 opacity-50 shadow-none md:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
              >
                <Radio className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <span>Open Live Radar</span>
              </button>
            )}

            {!canAccessLiveRadar && (
              <span className="text-muted-foreground mt-1 text-center font-sans text-[10px] tracking-tight">
                Available for logged-in users with active tracking.
              </span>
            )}
          </div>

          <Link
            href={`/a/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            id="success-test-public-link-btn"
            className="bg-accent text-accent-foreground flex w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-[4px] py-3 font-sans text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-95 active:scale-[0.98] md:text-sm"
          >
            <span>View Live Address</span>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>

      {/* 5. Interstitial Login Modal for "Save to Account" */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <div className="flex items-center gap-2">
              <div className="bg-accent/10 border-accent/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border">
                <Lock className="text-accent h-4 w-4" />
              </div>
              <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
                Unlock this feature
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              Sign in to save this address permanently to your account. Your
              current link will be claimed immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border mt-2 flex items-center justify-end gap-2.5 border-t pt-4 font-sans">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted cursor-pointer rounded-[4px] border px-3.5 py-2 font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] md:text-sm"
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
              className="bg-accent text-accent-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 font-sans text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] md:text-sm"
            >
              <span>Continue to Login</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Unsaved State Warning Modal for "Create Another" */}
      <Dialog
        open={isUnsavedCreateModalOpen}
        onOpenChange={setIsUnsavedCreateModalOpen}
      >
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
              Create new without saving?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              Your current micro-address hasn&apos;t been saved to an account.
              Starting a new one will discard this link permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border mt-2 flex items-center justify-end gap-2.5 border-t pt-4 font-sans">
            <button
              type="button"
              onClick={() => setIsUnsavedCreateModalOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted cursor-pointer rounded-[4px] border px-3.5 py-2 font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] md:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              id="discard-and-start-fresh-btn"
              onClick={handleDiscardAndCreateAnother}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 cursor-pointer rounded-[4px] border px-3.5 py-2 font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] md:text-sm"
            >
              Discard &amp; Start Fresh
            </button>
            <button
              type="button"
              id="save-to-account-from-create-another-btn"
              onClick={handleSaveToAccountFromCreateAnother}
              disabled={isSaving}
              className="bg-primary text-primary-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 font-sans text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
      <Dialog
        open={isChangeExpiryModalOpen}
        onOpenChange={setIsChangeExpiryModalOpen}
      >
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-foreground flex items-center gap-2 font-sans text-base font-bold tracking-tight md:text-lg">
              <Clock className="text-accent h-4 w-4" />
              <span>Change Link Expiry</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              Choose how long this sovereign doorstep link remains active before
              expiring.
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
                  className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground font-semibold'
                      : 'border-border bg-background hover:bg-muted text-foreground/80'
                  } ${isUpdatingExpiry ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-accent bg-accent'
                          : 'border-border bg-background'
                      }`}
                    >
                      {isSelected && (
                        <div className="bg-accent-foreground h-1.5 w-1.5 rounded-full" />
                      )}
                    </div>
                    <div>
                      <span className="text-foreground block text-xs font-semibold">
                        {opt.label}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {opt.desc}
                      </span>
                    </div>
                  </div>
                  {isUpdatingExpiry && isSelected ? (
                    <Loader2 className="text-accent h-4 w-4 animate-spin" />
                  ) : isSelected ? (
                    <Check className="text-accent h-4 w-4" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="border-border mt-2 flex items-center justify-end gap-2.5 border-t pt-4 font-sans">
            <button
              type="button"
              disabled={isUpdatingExpiry}
              onClick={() => setIsChangeExpiryModalOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted cursor-pointer rounded-[4px] border px-3.5 py-2 font-sans text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50 md:text-sm"
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
