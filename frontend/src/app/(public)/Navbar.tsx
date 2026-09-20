'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/app/actions/auth';

/**
 * Public Navigation Bar
 *
 * Sticky glassmorphic top header (bg-white/80, backdrop-blur-md, border-b border-zinc-200)
 * - Brand wordmark with pulsing Saffron dot
 * - "How it works" editorial link
 * - Dynamic Auth state: "Login" outline button for guests, "Dashboard" for authenticated citizens
 * - 1-tap Emergency SOS pill
 */
export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    return () => {
      unsubscribe();
      window.removeEventListener('focus', syncSession);
    };
  }, []);

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
            <Link
              href="/dashboard"
              id="navbar-dashboard-btn"
              className="hidden items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98] sm:text-sm md:inline-flex dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <span className="bg-accent/20 text-accent flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : user?.email
                    ? user.email.charAt(0).toUpperCase()
                    : 'D'}
              </span>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              id="navbar-login-btn"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-transparent px-3.5 py-1.5 font-sans text-xs font-semibold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-[0.98] sm:text-sm dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
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
