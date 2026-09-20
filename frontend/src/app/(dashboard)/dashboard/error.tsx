'use client';

import { RefreshCw, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * (dashboard) Error Boundary (ROUTE-08, FOUND-04)
 *
 * Client error state with retry and dashboard navigation options.
 */
export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="bg-card border border-border rounded p-8 text-center space-y-4 max-w-md mx-auto my-8 animate-in fade-in duration-150">
      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div>
        <h2 className="text-base font-bold text-foreground">
          Failed to load address book
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          An unexpected error occurred while loading your addresses.
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

      <div className="flex gap-2 justify-center pt-2">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-semibold px-4 py-2 rounded active:scale-[0.98] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-semibold px-4 py-2 rounded active:scale-[0.98] transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
