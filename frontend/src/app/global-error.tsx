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
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
          {/* Brand Header */}
          <div className="text-xl sm:text-2xl font-black tracking-tight text-[#1A3A6B]">
            DigiRoute
          </div>

          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-2xl">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Critical System Failure
            </h1>
            <p className="text-sm text-slate-600">
              A root application error occurred. The navigation context has been reset to protect system integrity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-[#EA580C] text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-[#c2410c] transition-all cursor-pointer font-sans"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-[#1A3A6B] hover:bg-[#152e55] text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
