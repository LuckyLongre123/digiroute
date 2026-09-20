'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
          {/* Brand Header */}
          <div className="text-xl font-black tracking-tight text-[#1A3A6B] sm:text-2xl">
            DigiRoute
          </div>

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Critical System Failure
            </h1>
            <p className="text-sm text-slate-600">
              A root application error occurred. The navigation context has been
              reset to protect system integrity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#EA580C] px-4 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#c2410c] sm:flex-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1A3A6B] px-4 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#152e55] sm:flex-1"
            >
              <Home className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
