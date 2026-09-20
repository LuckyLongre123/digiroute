'use client';

import { Home, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * /a/[slug] - Error Boundary (ROUTE-08, FOUND-04)
 *
 * Standalone recipient error boundary with clean recovery options.
 */
export default function RecipientError({ error, reset }: ErrorProps) {
  return (
    <div className="bg-card border border-border rounded p-6 shadow-sm text-center space-y-4 animate-in fade-in duration-150">
      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div>
        <h2 className="text-base font-bold text-foreground">
          Failed to load address card
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          The micro-address could not be resolved. It may have expired or been removed.
        </p>
      </div>

      {error?.message && (
        <div className="w-full text-left bg-destructive/10 dark:bg-red-950/30 border border-destructive/20 dark:border-red-900/50 rounded p-3 text-xs font-mono text-destructive dark:text-red-400 break-words max-h-36 overflow-y-auto my-2">
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

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={reset}
          id="recipient-error-retry-btn"
          type="button"
          className="w-full h-11 bg-accent text-accent-foreground font-semibold text-sm rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-75 ease-out shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          id="recipient-error-home-btn"
          className="w-full h-11 bg-secondary text-secondary-foreground font-medium text-sm rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-75 ease-out cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  );
}
