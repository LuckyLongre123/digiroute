'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, MapPin } from 'lucide-react';

/**
 * (create)/create/error.tsx — Wizard-Scoped Error Boundary
 *
 * Catches any unhandled client-side render errors within the 5-step address
 * creation wizard (Steps 1-5 and the Success page).
 *
 * Recovery options:
 * - "Try Again": resets the component tree so the user can retry from the same step.
 * - "Return Home": returns the user to the landing page (draft state is preserved in Zustand).
 */
export default function CreateWizardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CreateWizard] Unhandled render error:', error);
  }, [error]);

  return (
    <div
      className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4 py-12 font-sans"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      <div className="bg-card border-border w-full max-w-sm space-y-5 rounded-[4px] border p-6 text-center shadow-xl sm:p-8">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <MapPin className="text-accent h-4 w-4" />
          <span className="text-foreground font-sans text-lg font-black tracking-tight">
            DigiRoute
          </span>
        </div>

        {/* Error Details */}
        <div className="space-y-2 pt-1">
          <h1 className="text-foreground font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Wizard encountered an error
          </h1>
          <p className="text-muted-foreground font-sans text-xs leading-relaxed sm:text-sm">
            Something went wrong in the address creation wizard. Your progress
            is saved and you can try again or return home.
          </p>

          {error?.message && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive my-3 max-h-28 w-full overflow-y-auto rounded border p-3 text-left font-mono text-xs break-words">
              <span className="text-destructive/80 mb-1 block font-sans text-[11px] font-semibold tracking-wider uppercase">
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-accent text-accent-foreground inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] px-4 py-3 font-sans text-sm font-semibold shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="bg-card border-border hover:bg-muted text-foreground inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] border px-4 py-3 font-sans text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
