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
import { getRecentAddressesAction, type RecentAddressItem } from '@/app/actions/getRecentAddresses';
import { formatDigipin, cleanDigipin, isValid } from '@/lib/digipin';
import { clearDraftAndReset } from '@/lib/draft';
import { ManageAddressModal, type ManageAddressItem } from '@/components/shared/ManageAddressModal';
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
  const [recentAddresses, setRecentAddresses] = useState<RecentAddressItem[]>([]);
  const [selectedAddressForManage, setSelectedAddressForManage] = useState<ManageAddressItem | null>(null);

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
      setResolveError(`DIGIPIN must be exactly 10 characters. Entered: ${clean.length}/10`);
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
      className={`flex flex-col min-h-[calc(100vh-4rem)] space-y-8 animate-in fade-in duration-150 font-sans ${
        isAuthenticated ? 'pb-24 md:pb-12' : 'pb-12'
      }`}
    >
      {/* ─── 1. HERO SECTION & PRIMARY CTAS ──────────────────────────────── */}
      <section className="pt-2 md:pt-6 space-y-4">
        {/* Hero Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-[1.15]">
            Precision Micro-Addressing for Every Doorstep.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-normal leading-relaxed">
            Eliminate the last 50 meters of delivery confusion. Combine verified 10-character DIGIPIN
            spatial coordinates, doorway visual locks, and entrance routing into a single permanent badge.
          </p>
        </div>

        {/* Primary CTA Action Group */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleStartNewCreation}
            id="hero-create-address-btn"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-accent text-accent-foreground font-bold text-base sm:text-lg rounded-xl shadow-xs hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer font-sans"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Create Micro-Address</span>
            <ArrowRight className="w-5 h-5 ml-0.5" />
          </button>

          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-card text-foreground font-semibold text-sm hover:bg-muted active:scale-[0.98] transition-colors"
          >
            <span>How it works</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Guest Login button: strictly hidden if authenticated */}
          {!isAuthenticated && (
            <Link
              href="/login"
              id="hero-login-btn"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-card text-foreground font-semibold text-sm hover:bg-muted active:scale-[0.98] transition-colors"
            >
              <span>Login</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </section>

      {/* ─── RECENT ADDRESSES SECTION (LOGGED IN USERS WITH ≥ 1 ADDRESS) ─── */}
      {isAuthenticated && recentAddresses.length > 0 && (
        <section className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xs font-sans space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Recent Addresses
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>View all in Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {recentAddresses.map((addr) => (
              <div
                key={addr.id || addr.slug}
                onClick={() => setSelectedAddressForManage(addr)}
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background hover:border-accent/60 hover:shadow-xs transition-all text-left cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {addr.label || addr.flat || 'Micro-Address'}
                    </span>
                    <span className="text-[11px] text-muted-foreground group-hover:text-accent font-medium transition-colors shrink-0 ml-1">
                      Manage &rarr;
                    </span>
                  </div>
                  <p className="font-mono text-xs font-semibold text-accent tracking-wider">
                    {addr.digipin}
                  </p>
                </div>
                {(addr.floor || addr.landmark) && (
                  <p className="text-[11px] text-muted-foreground truncate mt-1.5">
                    {[addr.floor, addr.landmark].filter(Boolean).join(' • ')}
                  </p>
                )}

                <div
                  className="pt-2.5 mt-2 border-t border-border/80 flex items-center justify-between text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/a/${addr.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium transition-colors"
                    title="Open public view"
                  >
                    <Eye className="w-3 h-3" />
                    <span>👁️ Public View</span>
                  </Link>

                  <span className="text-[10px] text-muted-foreground">Click to Manage</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 2. DIGIPIN RESOLVER (PROGRESSIVE DISCLOSURE) ─────────────────── */}
      <section className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xs font-sans">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
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
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close resolver input"
            >
              <X className="w-4 h-4" />
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-foreground text-sm font-semibold hover:bg-muted/70 active:scale-[0.98] transition-all cursor-pointer font-sans"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span>Enter existing DIGIPIN</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleResolveDigipin} className="mt-4 flex flex-col sm:flex-row gap-2.5 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                className="w-full rounded-lg pl-10 pr-3 py-3 text-sm font-mono tracking-wider text-foreground placeholder:text-muted-foreground border border-zinc-300 dark:border-zinc-700 focus:border-primary focus:ring-[3px] focus:ring-primary/20 focus:outline-none transition-colors duration-200 ease-out bg-background"
                aria-label="Enter DIGIPIN code to navigate"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-sm rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all cursor-pointer shadow-xs shrink-0 font-sans"
            >
              <span>Navigate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {resolveError && (
          <p className="text-xs text-destructive mt-2.5 font-medium">{resolveError}</p>
        )}
      </section>

      {/* ─── 3. QUICK UTILITY SHORTCUTS (DISABLED FOR RELEASE) ──────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <button
          type="button"
          disabled
          aria-disabled="true"
          id="quick-scan-link"
          className="flex items-center justify-between bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl p-4.5 opacity-50 cursor-not-allowed shadow-2xs w-full text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Scan QR Badge</p>
              <p className="text-xs text-muted-foreground mt-0.5">Resolve a physical doorway plate instantly</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          id="quick-report-link"
          className="flex items-center justify-between bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl p-4.5 opacity-50 cursor-not-allowed shadow-2xs w-full text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Report Civic Defect</p>
              <p className="text-xs text-muted-foreground mt-0.5">Potholes, broken lights and access blockers</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </section>

      {/* ─── 4. RESUME PROGRESS TOAST (ACTIVE FOR 7 SECONDS) ──────────────── */}
      {showResumeToast && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-card border border-border rounded-lg p-3.5 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 font-sans">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
            <p className="text-xs font-medium truncate font-sans text-foreground">
              Address creation in progress
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="home-resume-draft-btn"
              onClick={() => router.push(resumeStep)}
              className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-sans"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => setShowResumeToast(false)}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
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
