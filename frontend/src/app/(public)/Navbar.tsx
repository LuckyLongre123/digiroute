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
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 font-sans">
      <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
        {/* Left: DigiRoute Logo */}
        <Link href="/" className="flex items-center group cursor-pointer" aria-label="DigiRoute Home">
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="w-32 md:w-36 h-auto object-contain dark:invert dark:brightness-200"
          />
        </Link>

        {/* Right: Navigation Links, Auth State & SOS */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <Link
            href="/about"
            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-sans"
          >
            How it works
          </Link>

          {/* Join / Why Register: strictly hidden when authenticated */}
          {!isAuthenticated && (
            <Link
              href="/why-join"
              id="navbar-why-join-link"
              className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-sans hidden sm:inline"
            >
              Why register
            </Link>
          )}

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              id="navbar-dashboard-btn"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs sm:text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all font-sans shadow-2xs"
            >
              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-[10px] shrink-0">
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
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-[0.98] transition-all font-sans"
            >
              Login
            </Link>
          )}

          {/* SOS Emergency - hidden on mobile when authenticated to prevent top header clutter */}
          <Link
            href="/sos"
            aria-label="Emergency SOS - Dial 112"
            className={`items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-destructive/90 active:scale-[0.98] transition-all font-sans shadow-xs ${
              isAuthenticated ? 'hidden md:inline-flex' : 'inline-flex'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>SOS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
