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
    <div className="bg-card border-border animate-in fade-in space-y-4 rounded border p-6 text-center shadow-sm duration-150">
      <div className="bg-destructive/10 text-destructive mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div>
        <h2 className="text-foreground text-base font-bold">
          Failed to load address card
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          The micro-address could not be resolved. It may have expired or been
          removed.
        </p>
      </div>

      {error?.message && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive my-2 max-h-36 w-full overflow-y-auto rounded border p-3 text-left font-mono text-xs break-words dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
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

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={reset}
          id="recipient-error-retry-btn"
          type="button"
          className="bg-accent text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded text-sm font-semibold shadow-sm transition-transform duration-75 ease-out active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          id="recipient-error-home-btn"
          className="bg-secondary text-secondary-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded text-sm font-medium transition-transform duration-75 ease-out active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  );
}
