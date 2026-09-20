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
    <div className="flex flex-col min-h-screen justify-between py-6 animate-in fade-in duration-150">
      <div className="pb-4 border-b border-red-500/40">
        <h1 className="text-xl font-bold text-white tracking-tight">
          EMERGENCY DISPATCH: 112
        </h1>
        <p className="text-sm text-red-200 mt-1">
          Interface encountered an issue, but emergency dispatch link is active.
        </p>

        {error?.message && (
          <div className="w-full text-left bg-red-950/60 border border-red-500/40 rounded p-3 text-xs font-mono text-red-200 break-words max-h-32 overflow-y-auto mt-3">
            <span className="font-sans font-semibold text-[11px] uppercase tracking-wider block text-red-400 mb-1">
              Error Details
            </span>
            <code>{error.message}</code>
          </div>
        )}
      </div>

      {/* Primary Emergency Fallback Button */}
      <div className="my-auto py-8 space-y-4">
        <a
          href="tel:112"
          className="w-full h-[72px] rounded-sm flex items-center justify-center gap-3 font-bold text-xl tracking-wide shadow-lg active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: 'var(--sos-dial-btn, #FBBF24)',
            color: 'var(--sos-dial-text, #0F172A)',
          }}
        >
          <PhoneCall className="w-7 h-7 fill-current" />
          <span>DIAL 112 NOW</span>
        </a>

        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider border border-white/20 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Interface</span>
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider border border-white/20 active:scale-[0.98] transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Exit to Home</span>
          </Link>
        </div>
      </div>

      <div className="pt-4 border-t border-red-500/40 text-center text-xs text-red-200/80 font-mono">
        Direct telephone dispatch operates independently of browser state
      </div>
    </div>
  );
}
