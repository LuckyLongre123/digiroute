'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useAddressStore } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDigipin, cleanDigipin, isValid } from '@/lib/digipin';
import { clearDraftAndReset } from '@/lib/draft';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { AppPromoModal } from '@/components/shared/AppPromoModal';

interface HomePageClientProps {
  isLikelyAuthenticated: boolean;
  children?: React.ReactNode;
}

/**
 * HomePageClient - Interactive Home Page Shell
 *
 * Implements Refined Utilitarian design system (4px rounded-sm, zinc palette):
 * 1. Hero with TransitionLink CTA displaying Loader2 spinner immediately on click.
 * 2. Auth-aware slots for zero skeleton flash on unauthenticated visitors.
 * 3. Progressive disclosure DIGIPIN resolver.
 * 4. Active draft detection with 7-second resume prompt.
 */
export function HomePageClient({
  isLikelyAuthenticated,
  children,
}: HomePageClientProps) {
  const router = useRouter();
  const [isResolverOpen, setIsResolverOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [resumeStep, setResumeStep] = useState<string>('/create');
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(isLikelyAuthenticated);

  // Sync client-side auth store if it updates
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
    });
    return () => unsubscribe();
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
    // Clear state and hard reset to Step 1
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
          <TransitionLink
            href="/create"
            onClick={handleStartNewCreation}
            id="hero-create-address-btn"
            spinnerClassName="h-5 w-5 stroke-[2.5] animate-spin text-accent-foreground"
            className="bg-accent text-accent-foreground inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-sm px-8 py-4 font-sans text-base font-bold shadow-xs transition-all hover:opacity-95 active:scale-[0.98] sm:text-lg"
          >
            {({ isPending }) => (
              <>
                {isPending ? (
                  <Loader2 className="h-5 w-5 stroke-[2.5] animate-spin text-accent-foreground" />
                ) : (
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                )}
                <span>Create Micro-Address</span>
                <ArrowRight className="ml-0.5 h-5 w-5" />
              </>
            )}
          </TransitionLink>

          <TransitionLink
            href="/about"
            showSpinner={false}
            className="bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-sm border border-zinc-300 px-5 py-3.5 text-sm font-semibold transition-colors active:scale-[0.98] dark:border-zinc-700"
          >
            <span>How it works</span>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          </TransitionLink>

          {/* Guest Login button: strictly hidden if authenticated */}
          {!isAuthenticated && (
            <TransitionLink
              href="/login"
              id="hero-login-btn"
              className="bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-sm border border-zinc-300 px-5 py-3.5 text-sm font-semibold transition-colors active:scale-[0.98] dark:border-zinc-700"
            >
              <span>Login</span>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </TransitionLink>
          )}
        </div>
      </section>

      {/* ─── RECENT ADDRESSES SECTION (SERVER SUSPENSE SLOT) ─────────────── */}
      {children}

      {/* ─── 2. DIGIPIN RESOLVER (PROGRESSIVE DISCLOSURE) ─────────────────── */}
      <section className="bg-card rounded-sm border border-zinc-200 p-5 font-sans shadow-xs sm:p-6 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-accent/10 text-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-sm">
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
              className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-sm p-1 transition-colors"
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
              className="text-foreground hover:bg-muted/70 inline-flex cursor-pointer items-center gap-2 rounded-sm border border-zinc-300 bg-transparent px-4 py-2.5 font-sans text-sm font-semibold transition-all active:scale-[0.98] dark:border-zinc-700"
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
                className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 bg-background w-full rounded-sm border border-zinc-300 py-3 pr-3 pl-10 font-mono text-sm tracking-wider transition-colors duration-200 ease-out focus:ring-[3px] focus:outline-none dark:border-zinc-700"
                aria-label="Enter DIGIPIN code to navigate"
              />
            </div>

            <button
              type="submit"
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm bg-zinc-900 px-6 py-3 font-sans text-sm font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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

      {/* ─── 3. QUICK UTILITY SHORTCUTS (ACTIVE - PROMOTES ANDROID APP) ───── */}
      <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <button
          type="button"
          id="quick-scan-link"
          onClick={() => setIsPromoOpen(true)}
          className="bg-card hover:bg-muted/70 group flex w-full cursor-pointer items-center justify-between rounded-sm border border-zinc-200 p-4.5 text-left shadow-2xs transition-all active:scale-[0.99] dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-zinc-100 text-zinc-900 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:group-hover:bg-zinc-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-foreground text-sm font-semibold">
                  Scan QR Badge
                </p>
                <span className="rounded-xs border border-emerald-300/80 bg-emerald-50 px-1.5 py-0.2 font-mono text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Android App
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Resolve a physical doorway plate instantly
              </p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          id="quick-report-link"
          onClick={() => setIsPromoOpen(true)}
          className="bg-card hover:bg-muted/70 group flex w-full cursor-pointer items-center justify-between rounded-sm border border-zinc-200 p-4.5 text-left shadow-2xs transition-all active:scale-[0.99] dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-zinc-100 text-zinc-900 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:group-hover:bg-zinc-700">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-foreground text-sm font-semibold">
                  Report Civic Defect
                </p>
                <span className="rounded-xs border border-emerald-300/80 bg-emerald-50 px-1.5 py-0.2 font-mono text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Android App
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Potholes, broken lights and access blockers
              </p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* ─── 4. RESUME PROGRESS TOAST (ACTIVE FOR 7 SECONDS) ──────────────── */}
      {showResumeToast && (
        <div className="bg-card border-border animate-in fade-in slide-in-from-bottom-3 fixed right-4 bottom-6 left-4 z-50 flex items-center justify-between gap-3 rounded-sm border p-3.5 font-sans shadow-lg duration-200 md:right-6 md:left-auto md:w-96">
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
              className="bg-accent text-accent-foreground cursor-pointer rounded-sm px-3 py-1.5 font-sans text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
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

      {/* ─── 5. MOBILE BOTTOM NAVIGATION (LOGGED-IN USERS ONLY) ───────────── */}
      {isAuthenticated && <MobileBottomNav />}

      {/* ─── 6. APP PROMO MODAL ───────────────────────────────────────────── */}
      <AppPromoModal
        isOpen={isPromoOpen}
        onClose={() => setIsPromoOpen(false)}
      />
    </div>
  );
}
