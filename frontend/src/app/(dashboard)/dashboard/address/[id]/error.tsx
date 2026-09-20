'use client';

import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * (dashboard)/address/[id] - Error Boundary (ROUTE-08, FOUND-04)
 *
 * Client error state with retry and return to addresses book.
 */
export default function AddressDetailError({ error, reset }: ErrorProps) {
  return (
    <div className="bg-card border-border animate-in fade-in mx-auto my-8 max-w-md space-y-4 rounded border p-8 text-center duration-150">
      <div className="bg-destructive/10 text-destructive mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div>
        <h2 className="text-foreground text-base font-bold">
          Failed to load address details
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          The requested micro-address record could not be loaded.
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

      <div className="flex justify-center gap-2 pt-2">
        <button
          onClick={() => reset()}
          type="button"
          className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/dashboard"
          className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Addresses</span>
        </Link>
      </div>
    </div>
  );
}
