'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-accent/20">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        {/* Brand Header */}
        <div className="flex justify-center">
          <Link href="/" className="inline-block cursor-pointer">
            <Image
              src="/logo-transparent.png"
              alt="DigiRoute Logo"
              width={150}
              height={40}
              priority={true}
              quality={75}
              className="w-36 sm:w-40 h-auto object-contain dark:invert dark:brightness-200"
            />
          </Link>
        </div>

        {/* Error Details */}
        <div className="space-y-2 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while loading this page.
          </p>

          {error?.message && (
            <div className="w-full text-left bg-destructive/10 dark:bg-red-950/30 border border-destructive/20 dark:border-red-900/50 rounded p-3 text-xs font-mono text-destructive dark:text-red-400 break-words max-h-36 overflow-y-auto my-3">
              <span className="font-sans font-semibold text-[11px] uppercase tracking-wider block text-destructive/80 dark:text-red-400/80 mb-1">
                Error Details
              </span>
              <code>{error.message}</code>
              {error.digest && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Digest: {error.digest}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Try Again and Return to Home */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground text-sm font-semibold py-3 px-4 rounded-lg shadow-sm hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-[#1A3A6B] hover:bg-[#152e55] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
