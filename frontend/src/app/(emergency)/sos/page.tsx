'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PhoneCall,
  Copy,
  Check,
  X,
  ShieldAlert,
  Navigation,
  MessageSquare,
  Radio,
  ExternalLink,
  Users,
} from 'lucide-react';

/**
 * /sos: Emergency Dispatch Mode (ROUTE-05)
 *
 * Full-screen crimson canvas designed for extreme panic / high sunlight outdoor conditions:
 * 1. Immediate 112 Emergency Dialer (72px amber thumb-zone CTA).
 * 2. Direct SMS Location Intent (sms:112 pre-filled with DIGIPIN & coordinates).
 * 3. Community SOS Broadcast: 100m radius alert notifying nearby community responders.
 * 4. Strict Anti-Slop: Geist sans-serif, title-case labels, zero em-dashes.
 */
export default function SosPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [broadcastState, setBroadcastState] = useState<'idle' | 'broadcasting' | 'sent'>('idle');
  const [helpersCount, setHelpersCount] = useState(4);

  // Admin easter egg: 7 clicks within 3 seconds on the Copy button
  const copyClickCountRef = useRef(0);
  const copyClickTimestampRef = useRef(0);

  // Current emergency beacon state
  const beacon = {
    digipin: '4M8K-9P2L-1X',
    coordinates: '28.6139° N, 77.2090° E',
    accuracy: '±4m (High Precision)',
  };

  const beaconSmsText = `EMERGENCY SOS: Location at DIGIPIN ${beacon.digipin} (${beacon.coordinates}, accuracy ${beacon.accuracy}). Need immediate assistance!`;

  const handleCopyBeacon = async () => {
    // Easter egg: 7 clicks within 3 seconds → /admin/login
    const now = Date.now();
    if (now - copyClickTimestampRef.current > 3000) {
      copyClickCountRef.current = 0;
    }
    if (copyClickTimestampRef.current === 0) {
      copyClickTimestampRef.current = now;
    }
    copyClickCountRef.current += 1;

    if (copyClickCountRef.current >= 7) {
      copyClickCountRef.current = 0;
      copyClickTimestampRef.current = 0;
      router.push('/admin/login');
      return;
    }

    try {
      await navigator.clipboard.writeText(beaconSmsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Simulate Community SOS broadcast over 100m radius
  const handleCommunityBroadcast = () => {
    if (broadcastState !== 'idle') return;
    setBroadcastState('broadcasting');

    setTimeout(() => {
      setBroadcastState('sent');
      setHelpersCount(Math.floor(Math.random() * 3) + 3); // 3 to 5 nearby helpers
    }, 1200);
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-between py-6 font-sans select-none"
      style={{ backgroundColor: 'var(--sos-bg, #B91C1C)', color: 'var(--sos-text, #FFFFFF)' }}
    >
      <div className="w-full max-w-sm px-4 flex-1 flex flex-col justify-between space-y-6">
        {/* ─── 1. TOP BAR: EMERGENCY BEACON INDICATOR & EXIT ───────────────── */}
        <div className="flex items-center justify-between pb-3 border-b border-red-500/40 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
              Live Emergency Beacon
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-8 h-8 rounded-[4px] bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            aria-label="Exit SOS"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>

        {/* ─── 2. CENTER ZONE: BEACON DATA & SMS INTENT ────────────────────── */}
        <div className="my-auto py-2 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 font-sans">
              EMERGENCY DISPATCH: 112
            </h1>
            <p className="text-sm text-red-100/90 leading-relaxed font-sans">
              Share your exact location with responders.
            </p>
          </div>

          {/* Exact Micro-Address Beacon Card */}
          <div className="bg-black/30 border border-white/20 rounded-[4px] p-4 text-center space-y-2 shadow-md">
            <div className="text-[11px] uppercase tracking-wider text-red-200 font-medium font-sans">
              Your exact micro-address
            </div>
            <div className="font-mono text-3xl font-bold text-amber-300 tracking-wider">
              {beacon.digipin}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-red-100">
              <Navigation className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{beacon.coordinates}</span>
              <span>•</span>
              <span>{beacon.accuracy}</span>
            </div>
          </div>

          {/* Direct SMS Intent & Copy Dual Action */}
          <div className="flex items-center gap-2 pt-1 font-sans">
            <a
              href={`sms:112?body=${encodeURIComponent(beaconSmsText)}`}
              id="sms-location-btn"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-[4px] bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold border border-white/25 active:scale-[0.98] transition-all cursor-pointer font-sans shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-amber-300 shrink-0" />
              <span>SMS Location to 112</span>
            </a>
            <button
              onClick={handleCopyBeacon}
              type="button"
              id="copy-beacon-btn"
              className="p-3 rounded-[4px] bg-white/15 hover:bg-white/25 text-white border border-white/25 active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-xs"
              title="Copy location text"
              aria-label="Copy location text"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* ─── 3. BOTTOM THUMB ZONE: 72PX DIAL 112 CTA & COMMUNITY BROADCAST ── */}
        <div className="space-y-3 pt-3 border-t border-red-500/40 shrink-0 font-sans">
          {/* 72px Primary Amber Call 112 CTA */}
          <a
            href="tel:112"
            id="dial-112-btn"
            className="w-full h-[72px] rounded-[4px] flex items-center justify-center gap-3 font-bold text-xl tracking-wide shadow-lg active:scale-[0.98] transition-transform font-sans cursor-pointer hover:opacity-95"
            style={{
              backgroundColor: 'var(--sos-dial-btn, #FBBF24)',
              color: 'var(--sos-dial-text, #0F172A)',
            }}
          >
            <PhoneCall className="w-7 h-7 fill-current" />
            <span>DIAL 112 NOW</span>
          </a>

          {/* Community SOS Broadcast Button (100m Radius Feature) */}
          {broadcastState === 'idle' && (
            <button
              type="button"
              id="alert-nearby-helpers-btn"
              onClick={handleCommunityBroadcast}
              className="w-full py-3 px-4 rounded-[4px] bg-black/40 hover:bg-black/60 text-amber-300 border border-amber-300/40 text-xs sm:text-sm font-bold active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 font-sans cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse text-amber-300" />
              <span>Alert Nearby Helpers (100m)</span>
            </button>
          )}

          {broadcastState === 'broadcasting' && (
            <div className="w-full py-3 px-4 rounded-[4px] bg-black/50 border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 font-sans">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span>Broadcasting distress signal...</span>
            </div>
          )}

          {broadcastState === 'sent' && (
            <div className="space-y-2 bg-black/40 border border-emerald-400/40 rounded-[4px] p-2.5 text-center font-sans animate-in fade-in duration-200">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Alert broadcast to {helpersCount} nearby helpers within 100m</span>
              </div>
              <Link
                href={`/sos/respond/${beacon.digipin}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline font-sans"
              >
                <span>View Community Responder Map</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Clean Sans-Serif Emergency Notice */}
          <p className="text-center text-xs text-zinc-200 font-sans pt-1">
            National Emergency Hotline (India)
          </p>
        </div>
      </div>
    </div>
  );
}
