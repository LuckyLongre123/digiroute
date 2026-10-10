'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { AndroidIcon } from '@/components/icons/AndroidIcon';

interface NavbarClientProps {
  isLikelyAuthenticated: boolean;
  userSection: React.ReactNode;
}

export function NavbarClient({
  isLikelyAuthenticated,
  userSection,
}: NavbarClientProps) {
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

        {/* Right: Download App Link, Auth State & SOS */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Download App Route Link (Internal /download Landing Page) */}
          <Link
            href="/download"
            id="navbar-download-app-link"
            title="Download DigiRoutes Android App"
            className="hidden items-center gap-1.5 rounded-sm border border-zinc-200/90 bg-zinc-50/80 px-2.5 py-1.5 font-sans text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 sm:inline-flex dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <AndroidIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download App</span>
          </Link>
          <Link
            href="/download"
            id="navbar-download-app-mobile-btn"
            aria-label="Download App"
            title="Download App"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:hidden dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <AndroidIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </Link>

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
