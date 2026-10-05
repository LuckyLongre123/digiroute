'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, Download } from 'lucide-react';

interface NavbarClientProps {
  isLikelyAuthenticated: boolean;
  userSection: React.ReactNode;
}

export function NavbarClient({
  isLikelyAuthenticated,
  userSection,
}: NavbarClientProps) {
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true
    );
  });

  useEffect(() => {
    const checkStandalone = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).standalone === true
      );
    };
    window.addEventListener('appinstalled', checkStandalone);
    return () => {
      window.removeEventListener('appinstalled', checkStandalone);
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

          {/* Join / Why Register: strictly hidden when likely authenticated */}
          {!isLikelyAuthenticated && (
            <Link
              href="/why-join"
              id="navbar-why-join-link"
              className="hidden font-sans text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:inline sm:text-sm dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Why register
            </Link>
          )}

          {/* Download App Link for authenticated desktop/mobile (hidden in standalone PWA) */}
          {isLikelyAuthenticated && !isStandalone && (
            <>
              <Link
                href="/download-app"
                id="navbar-download-app-link"
                className="hidden items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-sans text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <span>📱 Download App</span>
              </Link>
              <Link
                href="/download-app"
                id="navbar-download-app-mobile-btn"
                aria-label="Download App"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Download className="h-4 w-4" />
              </Link>
            </>
          )}

          {/* Auth Section: Suspense wrapped if likely authenticated, else instant guest login */}
          {userSection}

          {/* SOS Emergency - hidden on mobile when authenticated to prevent top header clutter */}
          <Link
            href="/sos"
            aria-label="Emergency SOS - Dial 112"
            className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-xs font-semibold shadow-xs transition-all active:scale-[0.98] sm:px-3 ${
              isLikelyAuthenticated ? 'hidden md:inline-flex' : 'inline-flex'
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
