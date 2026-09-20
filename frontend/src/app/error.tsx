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
    <div className="bg-background text-foreground selection:bg-accent/20 flex min-h-screen flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="bg-card border-border w-full max-w-md space-y-5 rounded-2xl border p-6 text-center shadow-xl sm:p-8">
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
              className="h-auto w-36 object-contain sm:w-40 dark:brightness-200 dark:invert"
            />
          </Link>
        </div>

        {/* Error Details */}
        <div className="space-y-2 pt-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed sm:text-sm">
            An unexpected error occurred while loading this page.
          </p>

          {error?.message && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive my-3 max-h-36 w-full overflow-y-auto rounded border p-3 text-left font-mono text-xs break-words dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <span className="text-destructive/80 mb-1 block font-sans text-[11px] font-semibold tracking-wider uppercase dark:text-red-400/80">
                Error Details
              </span>
              <code>{error.message}</code>
              {error.digest && (
                <div className="text-muted-foreground mt-1 text-[10px]">
                  Digest: {error.digest}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Try Again and Return to Home */}
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-accent text-accent-foreground inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 font-sans text-sm font-semibold shadow-sm transition-all hover:opacity-95 active:scale-[0.98] sm:flex-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1A3A6B] px-4 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#152e55] active:scale-[0.98] sm:flex-1 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
