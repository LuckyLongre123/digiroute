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
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 font-sans"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      <div className="max-w-sm w-full bg-card border border-border rounded-[4px] p-6 sm:p-8 shadow-xl text-center space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-lg font-black tracking-tight text-foreground font-sans">
            DigiRoute
          </span>
        </div>

        {/* Error Details */}
        <div className="space-y-2 pt-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
            Wizard encountered an error
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
            Something went wrong in the address creation wizard. Your progress is saved and you can try again or return home.
          </p>

          {error?.message && (
            <div className="w-full text-left bg-destructive/10 border border-destructive/20 rounded p-3 text-xs font-mono text-destructive break-words max-h-28 overflow-y-auto my-3">
              <span className="font-sans font-semibold text-[11px] uppercase tracking-wider block text-destructive/80 mb-1">
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

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground text-sm font-semibold py-3 px-4 rounded-[4px] shadow-sm hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-card border border-border hover:bg-muted text-foreground text-sm font-semibold py-3 px-4 rounded-[4px] shadow-sm transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
