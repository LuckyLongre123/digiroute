'use client';

import { getSessionAction } from '@/app/actions/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertTriangle, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Unified Top Navigation Bar
 *
 * Consistent across public home pages and authenticated dashboard areas:
 * - Brand Logo (Left)
 * - "How it works" editorial link
 * - Contextual PWA "Download App" link (desktop) and compact Download Icon (mobile), strictly hidden in standalone mode
 * - Compact User Avatar / Dashboard trigger (4px rounded-sm)
 * - 1-tap Emergency SOS pill (for guests; hidden on mobile for authenticated users who have it in bottom nav)
 */
export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true
    );
  });
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Listen to store updates
    const unsubscribe = useAuthStore.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
    });

    // Check server-side session strictly on mount and window focus
    async function syncSession() {
      try {
        const res = await getSessionAction();
        if (res?.user?.id) {
          useAuthStore.getState().setUser(res.user);
          setIsAuthenticated(true);
        } else {
          useAuthStore.getState().clearUser();
          setIsAuthenticated(false);
        }
      } catch {
        useAuthStore.getState().clearUser();
        setIsAuthenticated(false);
      }
    }

    syncSession();
    window.addEventListener('focus', syncSession);

    const checkStandalone = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).standalone === true
      );
    };
    window.addEventListener('appinstalled', checkStandalone);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', syncSession);
      window.removeEventListener('appinstalled', checkStandalone);
    };
  }, []);

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'D';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 font-sans backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-15 max-w-4xl items-center justify-between px-4">
        {/* Left: DigiRoute Logo */}
        <Link
          href="/"
          className="group flex cursor-pointer items-center"
          aria-label="DigiRoute Home"
        >
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="h-auto w-32 object-contain md:w-36 dark:brightness-200 dark:invert"
          />
        </Link>

        {/* Right: Navigation Links, Auth State & SOS */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <Link
            href="/about"
            className="font-sans text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:text-sm dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            How it works
          </Link>

          {/* Join / Why Register: strictly hidden when authenticated */}
          {!isAuthenticated && (
            <Link
              href="/why-join"
              id="navbar-why-join-link"
              className="hidden font-sans text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:inline sm:text-sm dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Why register
            </Link>
          )}

          {isAuthenticated ? (
            <>
              {/* Desktop Download App Link (hidden in standalone PWA) */}
              {!isStandalone && (
                <Link
                  href="/download-app"
                  id="navbar-download-app-link"
                  className="hidden items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-sans text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <span>📱 Download App</span>
                </Link>
              )}

              {/* Mobile Download App Icon (hidden in standalone PWA) */}
              {!isStandalone && (
                <Link
                  href="/download-app"
                  id="navbar-download-app-mobile-btn"
                  aria-label="Download App"
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <Download className="h-4 w-4" />
                </Link>
              )}

              {/* Desktop Dashboard Button (subtle outline user menu trigger, 4px rounded-sm) */}
              <Link
                href="/dashboard"
                id="navbar-dashboard-btn"
                className="hidden items-center gap-2 rounded-sm border border-zinc-200 bg-white/60 px-3 py-1.5 font-sans text-xs font-medium text-zinc-800 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-100/80 active:scale-[0.98] sm:text-sm md:inline-flex dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-zinc-100 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {userInitial}
                </span>
                <span>Dashboard</span>
              </Link>

              {/* Mobile Dashboard Compact Avatar Trigger (4px rounded-sm) */}
              <Link
                href="/dashboard"
                id="navbar-dashboard-mobile-btn"
                aria-label="Go to Dashboard"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-200 bg-white text-xs font-bold text-zinc-800 shadow-2xs transition-colors hover:bg-zinc-100 md:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span>{userInitial}</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              id="navbar-login-btn"
              className="inline-flex items-center justify-center rounded-sm border border-zinc-300 bg-transparent px-3.5 py-1.5 font-sans text-xs font-semibold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-[0.98] sm:text-sm dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Login
            </Link>
          )}

          {/* SOS Emergency - hidden on mobile when authenticated to prevent top header clutter */}
          <Link
            href="/sos"
            aria-label="Emergency SOS - Dial 112"
            className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-xs font-semibold shadow-xs transition-all active:scale-[0.98] sm:px-3 ${
              isAuthenticated ? 'hidden md:inline-flex' : 'inline-flex'
            }`}
          >
            <AlertTriangle
              className="h-3.5 w-3.5 fill-current"
              aria-hidden="true"
            />
            <span>SOS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
