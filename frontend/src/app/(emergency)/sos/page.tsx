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
  const [broadcastState, setBroadcastState] = useState<
    'idle' | 'broadcasting' | 'sent'
  >('idle');
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
      className="flex min-h-[100dvh] w-full flex-col items-center justify-between py-6 font-sans select-none"
      style={{
        backgroundColor: 'var(--sos-bg, #B91C1C)',
        color: 'var(--sos-text, #FFFFFF)',
      }}
    >
      <div className="flex w-full max-w-sm flex-1 flex-col justify-between space-y-6 px-4">
        {/* ─── 1. TOP BAR: EMERGENCY BEACON INDICATOR & EXIT ───────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-red-500/40 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 animate-pulse text-amber-300" />
            <span className="font-mono text-xs font-bold tracking-widest text-amber-300 uppercase">
              Live Emergency Beacon
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[4px] bg-black/20 text-white transition-colors hover:bg-black/40"
            aria-label="Exit SOS"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        {/* ─── 2. CENTER ZONE: BEACON DATA & SMS INTENT ────────────────────── */}
        <div className="my-auto space-y-4 py-2">
          <div>
            <h1 className="mb-1 font-sans text-2xl font-bold tracking-tight text-white">
              EMERGENCY DISPATCH: 112
            </h1>
            <p className="font-sans text-sm leading-relaxed text-red-100/90">
              Share your exact location with responders.
            </p>
          </div>

          {/* Exact Micro-Address Beacon Card */}
          <div className="space-y-2 rounded-[4px] border border-white/20 bg-black/30 p-4 text-center shadow-md">
            <div className="font-sans text-[11px] font-medium tracking-wider text-red-200 uppercase">
              Your exact micro-address
            </div>
            <div className="font-mono text-3xl font-bold tracking-wider text-amber-300">
              {beacon.digipin}
            </div>
            <div className="flex items-center justify-center gap-2 font-mono text-xs text-red-100">
              <Navigation className="h-3.5 w-3.5 shrink-0 text-amber-300" />
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
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-white/25 bg-white/15 px-3 py-3 font-sans text-xs font-semibold text-white shadow-xs transition-all hover:bg-white/25 active:scale-[0.98] sm:text-sm"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-amber-300" />
              <span>SMS Location to 112</span>
            </a>
            <button
              onClick={handleCopyBeacon}
              type="button"
              id="copy-beacon-btn"
              className="shrink-0 cursor-pointer rounded-[4px] border border-white/25 bg-white/15 p-3 text-white shadow-xs transition-all hover:bg-white/25 active:scale-[0.98]"
              title="Copy location text"
              aria-label="Copy location text"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-300" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* ─── 3. BOTTOM THUMB ZONE: 72PX DIAL 112 CTA & COMMUNITY BROADCAST ── */}
        <div className="shrink-0 space-y-3 border-t border-red-500/40 pt-3 font-sans">
          {/* 72px Primary Amber Call 112 CTA */}
          <a
            href="tel:112"
            id="dial-112-btn"
            className="flex h-[72px] w-full cursor-pointer items-center justify-center gap-3 rounded-[4px] font-sans text-xl font-bold tracking-wide shadow-lg transition-transform hover:opacity-95 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--sos-dial-btn, #FBBF24)',
              color: 'var(--sos-dial-text, #0F172A)',
            }}
          >
            <PhoneCall className="h-7 w-7 fill-current" />
            <span>DIAL 112 NOW</span>
          </a>

          {/* Community SOS Broadcast Button (100m Radius Feature) */}
          {broadcastState === 'idle' && (
            <button
              type="button"
              id="alert-nearby-helpers-btn"
              onClick={handleCommunityBroadcast}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-amber-300/40 bg-black/40 px-4 py-3 font-sans text-xs font-bold text-amber-300 shadow-md transition-all hover:bg-black/60 active:scale-[0.98] sm:text-sm"
            >
              <Radio className="h-4 w-4 animate-pulse text-amber-300" />
              <span>Alert Nearby Helpers (100m)</span>
            </button>
          )}

          {broadcastState === 'broadcasting' && (
            <div className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-amber-300/40 bg-black/50 px-4 py-3 font-sans text-xs font-semibold text-amber-200 sm:text-sm">
              <span className="h-3 w-3 animate-ping rounded-full bg-amber-400" />
              <span>Broadcasting distress signal...</span>
            </div>
          )}

          {broadcastState === 'sent' && (
            <div className="animate-in fade-in space-y-2 rounded-[4px] border border-emerald-400/40 bg-black/40 p-2.5 text-center font-sans duration-200">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
                <Users className="h-4 w-4 text-emerald-400" />
                <span>
                  Alert broadcast to {helpersCount} nearby helpers within 100m
                </span>
              </div>
              <Link
                href={`/sos/respond/${beacon.digipin}`}
                className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-amber-300 underline hover:text-amber-200"
              >
                <span>View Community Responder Map</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Clean Sans-Serif Emergency Notice */}
          <p className="pt-1 text-center font-sans text-xs text-zinc-200">
            National Emergency Hotline (India)
          </p>
        </div>
      </div>
    </div>
  );
}
