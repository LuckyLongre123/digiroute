'use client';

import { PhoneCall, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * (emergency)/sos: Error Boundary (ROUTE-08, FOUND-04)
 *
 * Guaranteed fail-safe emergency view: raw Dial 112 CTA remains accessible
 * even if subcomponents crash or throw runtime errors.
 */
export default function SosError({ error, reset }: ErrorProps) {
  return (
    <div className="animate-in fade-in flex min-h-screen flex-col justify-between py-6 duration-150">
      <div className="border-b border-red-500/40 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white">
          EMERGENCY DISPATCH: 112
        </h1>
        <p className="mt-1 text-sm text-red-200">
          Interface encountered an issue, but emergency dispatch link is active.
        </p>

        {error?.message && (
          <div className="mt-3 max-h-32 w-full overflow-y-auto rounded border border-red-500/40 bg-red-950/60 p-3 text-left font-mono text-xs break-words text-red-200">
            <span className="mb-1 block font-sans text-[11px] font-semibold tracking-wider text-red-400 uppercase">
              Error Details
            </span>
            <code>{error.message}</code>
          </div>
        )}
      </div>

      {/* Primary Emergency Fallback Button */}
      <div className="my-auto space-y-4 py-8">
        <a
          href="tel:112"
          className="flex h-[72px] w-full items-center justify-center gap-3 rounded-sm text-xl font-bold tracking-wide shadow-lg transition-transform active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--sos-dial-btn, #FBBF24)',
            color: 'var(--sos-dial-text, #0F172A)',
          }}
        >
          <PhoneCall className="h-7 w-7 fill-current" />
          <span>DIAL 112 NOW</span>
        </a>

        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/10 px-4 py-3 font-mono text-xs tracking-wider text-white uppercase transition-all hover:bg-white/20 active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Interface</span>
          </button>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/10 px-4 py-3 font-mono text-xs tracking-wider text-white uppercase transition-all hover:bg-white/20 active:scale-[0.98]"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Exit to Home</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-red-500/40 pt-4 text-center font-mono text-xs text-red-200/80">
        Direct telephone dispatch operates independently of browser state
      </div>
    </div>
  );
}
