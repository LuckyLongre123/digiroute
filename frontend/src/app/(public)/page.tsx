'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Flag,
  Search,
  ChevronRight,
  X,
  Navigation,
  Plus,
  ArrowRight,
  MapPin,
  Eye,
} from 'lucide-react';
import { useAddressStore } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/app/actions/auth';
import {
  getRecentAddressesAction,
  type RecentAddressItem,
} from '@/app/actions/getRecentAddresses';
import { formatDigipin, cleanDigipin, isValid } from '@/lib/digipin';
import { clearDraftAndReset } from '@/lib/draft';
import {
  ManageAddressModal,
  type ManageAddressItem,
} from '@/components/shared/ManageAddressModal';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';

/**
 * Home Page (/)
 *
 * Premium SaaS Landing & Address Resolution Portal:
 * 1. Hero Section with massive Saffron primary CTA: "Create Micro-Address"
 * 2. Dedicated Address Resolver: "Already have a DIGIPIN? Enter it to navigate" with inline Navigate button
 * 3. Recent Addresses: Replaces guest Login prompt when authenticated with 3 recent addresses (hidden if 0)
 * 4. Quick Action Cards: Disabled for coming soon release
 * 5. Resume Progress Toast: Retained for active drafts (7-second timer)
 * 6. Strict Geist typography, zero drop-shadow AI slop, zero em-dashes
 */
export default function HomePage() {
  const router = useRouter();
  const [isResolverOpen, setIsResolverOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [resumeStep, setResumeStep] = useState<string>('/create');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recentAddresses, setRecentAddresses] = useState<RecentAddressItem[]>(
    []
  );
  const [selectedAddressForManage, setSelectedAddressForManage] =
    useState<ManageAddressItem | null>(null);

  // Sync active authentication session and fetch recent addresses
  useEffect(() => {
    // Listen to store updates
    const unsubscribe = useAuthStore.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
    });

    async function syncAuthAndRecents() {
      try {
        const res = await getSessionAction();
        if (res?.user?.id) {
          useAuthStore.getState().setUser(res.user);
          setIsAuthenticated(true);
          try {
            const recentsRes = await getRecentAddressesAction();
            setRecentAddresses(recentsRes.addresses || []);
          } catch {
            setRecentAddresses([]);
          }
        } else {
          useAuthStore.getState().clearUser();
          setIsAuthenticated(false);
          setRecentAddresses([]);
        }
      } catch {
        useAuthStore.getState().clearUser();
        setIsAuthenticated(false);
        setRecentAddresses([]);
      }
    }

    syncAuthAndRecents();
    window.addEventListener('focus', syncAuthAndRecents);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', syncAuthAndRecents);
    };
  }, []);

  // Check for unfinished address creation state
  useEffect(() => {
    const state = useAddressStore.getState();
    const hasUnfinishedDraft =
      !state.isCompleted &&
      Boolean(
        (state.digipin && state.digipin.trim().length > 0) ||
        state.latitude !== null ||
        state.metadata.floor ||
        state.metadata.flat ||
        state.metadata.landmark
      );

    if (hasUnfinishedDraft) {
      const stepMap: Record<number, string> = {
        1: '/create',
        2: '/create/camera',
        3: '/create/map',
        4: '/create/metadata',
        5: '/create/share',
      };
      const resolvedStep = stepMap[state.step] || '/create';
      const showTimer = setTimeout(() => {
        setResumeStep(resolvedStep);
        setShowResumeToast(true);
      }, 100);

      const hideTimer = setTimeout(() => {
        setShowResumeToast(false);
      }, 7100);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  const handleStartNewCreation = () => {
    // Clear state and hard reload to Step 1
    clearDraftAndReset({ showToast: false });
  };

  const handleResolveDigipin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanDigipin(searchCode);
    if (!clean) {
      setResolveError('Please enter a DIGIPIN code (e.g. 39J-M99-P923)');
      return;
    }

    if (clean.length !== 10) {
      setResolveError(
        `DIGIPIN must be exactly 10 characters. Entered: ${clean.length}/10`
      );
      return;
    }

    if (!isValid(clean)) {
      setResolveError('Invalid characters. DIGIPIN charset: 23456789CJKLMPFT');
      return;
    }

    setResolveError('');
    router.push(`/a/${encodeURIComponent(clean)}`);
  };

  return (
    <div
      className={`animate-in fade-in flex min-h-[calc(100vh-4rem)] flex-col space-y-8 font-sans duration-150 ${
        isAuthenticated ? 'pb-24 md:pb-12' : 'pb-12'
      }`}
    >
      {/* ─── 1. HERO SECTION & PRIMARY CTAS ──────────────────────────────── */}
      <section className="space-y-4 pt-2 md:pt-6">
        {/* Hero Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl leading-[1.15] font-black tracking-tight md:text-5xl">
            Precision Micro-Addressing for Every Doorstep.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-normal md:text-base">
            Eliminate the last 50 meters of delivery confusion. Combine verified
            10-character DIGIPIN spatial coordinates, doorway visual locks, and
            entrance routing into a single permanent badge.
          </p>
        </div>

        {/* Primary CTA Action Group */}
        <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleStartNewCreation}
            id="hero-create-address-btn"
            className="bg-accent text-accent-foreground inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-xl px-8 py-4 font-sans text-base font-bold shadow-xs transition-all hover:opacity-95 active:scale-[0.98] sm:text-lg"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            <span>Create Micro-Address</span>
            <ArrowRight className="ml-0.5 h-5 w-5" />
          </button>

          <Link
            href="/about"
            className="bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-5 py-3.5 text-sm font-semibold transition-colors active:scale-[0.98] dark:border-zinc-700"
          >
            <span>How it works</span>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          </Link>

          {/* Guest Login button: strictly hidden if authenticated */}
          {!isAuthenticated && (
            <Link
              href="/login"
              id="hero-login-btn"
              className="bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-5 py-3.5 text-sm font-semibold transition-colors active:scale-[0.98] dark:border-zinc-700"
            >
              <span>Login</span>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ─── RECENT ADDRESSES SECTION (LOGGED IN USERS WITH ≥ 1 ADDRESS) ─── */}
      {isAuthenticated && recentAddresses.length > 0 && (
        <section className="bg-card space-y-3 rounded-xl border border-zinc-200 p-5 font-sans shadow-xs sm:p-6 dark:border-zinc-800">
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
            {recentAddresses.map((addr) => (
              <div
                key={addr.id || addr.slug}
                onClick={() => setSelectedAddressForManage(addr)}
                className="group bg-background hover:border-accent/60 flex cursor-pointer flex-col justify-between rounded-lg border border-zinc-200 p-3.5 text-left transition-all hover:shadow-xs dark:border-zinc-800"
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
      )}

      {/* ─── 2. DIGIPIN RESOLVER (PROGRESSIVE DISCLOSURE) ─────────────────── */}
      <section className="bg-card rounded-xl border border-zinc-200 p-5 font-sans shadow-xs sm:p-6 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-accent/10 text-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
              <Navigation className="h-4 w-4 fill-current" />
            </div>
            <h2 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
              Navigate to a DIGIPIN
            </h2>
          </div>

          {/* Close toggle when input is revealed */}
          {isResolverOpen && (
            <button
              type="button"
              onClick={() => {
                setIsResolverOpen(false);
                setSearchCode('');
                setResolveError('');
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-md p-1 transition-colors"
              aria-label="Close resolver input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progressive Disclosure: Toggle between initial button and revealed input */}
        {!isResolverOpen ? (
          <div className="mt-4 pt-1">
            <button
              type="button"
              id="reveal-digipin-input-btn"
              onClick={() => setIsResolverOpen(true)}
              className="text-foreground hover:bg-muted/70 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 font-sans text-sm font-semibold transition-all active:scale-[0.98] dark:border-zinc-700"
            >
              <Search className="text-muted-foreground h-4 w-4" />
              <span>Enter existing DIGIPIN</span>
              <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleResolveDigipin}
            className="animate-in fade-in mt-4 flex flex-col gap-2.5 duration-150 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="digipin-search"
                type="text"
                autoFocus
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(formatDigipin(e.target.value));
                  if (resolveError) setResolveError('');
                }}
                placeholder="e.g. 39J-M99-P923"
                maxLength={14}
                className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 bg-background w-full rounded-lg border border-zinc-300 py-3 pr-3 pl-10 font-mono text-sm tracking-wider transition-colors duration-200 ease-out focus:ring-[3px] focus:outline-none dark:border-zinc-700"
                aria-label="Enter DIGIPIN code to navigate"
              />
            </div>

            <button
              type="submit"
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-sans text-sm font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <span>Navigate</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {resolveError && (
          <p className="text-destructive mt-2.5 text-xs font-medium">
            {resolveError}
          </p>
        )}
      </section>

      {/* ─── 3. QUICK UTILITY SHORTCUTS (DISABLED FOR RELEASE) ──────────────── */}
      <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          id="quick-scan-link"
          className="bg-card flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-zinc-200 p-4.5 text-left opacity-50 shadow-2xs dark:border-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">
                Scan QR Badge
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Resolve a physical doorway plate instantly
              </p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          id="quick-report-link"
          className="bg-card flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-zinc-200 p-4.5 text-left opacity-50 shadow-2xs dark:border-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">
                Report Civic Defect
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Potholes, broken lights and access blockers
              </p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>
      </section>

      {/* ─── 4. RESUME PROGRESS TOAST (ACTIVE FOR 7 SECONDS) ──────────────── */}
      {showResumeToast && (
        <div className="bg-card border-border animate-in fade-in slide-in-from-bottom-3 fixed right-4 bottom-6 left-4 z-50 flex items-center justify-between gap-3 rounded-lg border p-3.5 font-sans shadow-lg duration-200 md:right-6 md:left-auto md:w-96">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="bg-accent h-2.5 w-2.5 shrink-0 animate-pulse rounded-full" />
            <p className="text-foreground truncate font-sans text-xs font-medium">
              Address creation in progress
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              id="home-resume-draft-btn"
              onClick={() => router.push(resumeStep)}
              className="bg-accent text-accent-foreground cursor-pointer rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => setShowResumeToast(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── 5. CREATOR PREVIEW MANAGE ADDRESS MODAL ─────────────────────── */}
      <ManageAddressModal
        isOpen={Boolean(selectedAddressForManage)}
        onClose={() => setSelectedAddressForManage(null)}
        address={selectedAddressForManage}
      />

      {/* ─── 6. MOBILE BOTTOM NAVIGATION (LOGGED-IN USERS ONLY) ───────────── */}
      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
}
