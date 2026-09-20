'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  Navigation,
  ShieldAlert,
  PhoneCall,
  ArrowLeft,
  Compass,
  Radio,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { MapplsMap, MapMarkerItem } from '@/components/ui/MapplsMap';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * /sos/respond/[id]: Community Helper / Responder Navigation View
 *
 * Emergency Navigation Architecture:
 * 1. Reusable Mappls Map Canvas with real daytime vector styling and Mappls SDK.
 * 2. Visual Center Offset: Markers offset upward to prevent collision with bottom card.
 * 3. Clean Floating Bottom Sheet: bg-white/95 backdrop-blur-md shadow-xl with subtle red accent border-t.
 * 4. Primary "Navigate to Victim" turn-by-turn GPS action.
 * 5. Strict Anti-Slop: Geist sans-serif, title-case labels, zero em-dashes.
 */
export default function CommunityResponderPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams.id;
  const digipin = rawId ? rawId.toUpperCase() : '4M8K-9P2L-1X';

  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // Victim's emergency coordinates
  const victimLat = 28.6139;
  const victimLng = 77.209;

  // Helper's current coordinates (~80m away)
  const helperLat = victimLat - 0.0007;
  const helperLng = victimLng - 0.0005;
  const distanceMeters = 80;

  // Midpoint center between helper and victim
  const mapCenter: [number, number] = [
    (victimLat + helperLat) / 2,
    (victimLng + helperLng) / 2,
  ];

  const mapMarkers: MapMarkerItem[] = [
    {
      id: 'victim-pin',
      lat: victimLat,
      lng: victimLng,
      title: `SOS VICTIM (${distanceMeters}m)`,
      type: 'victim',
      pulse: true,
    },
    {
      id: 'helper-pin',
      lat: helperLat,
      lng: helperLng,
      title: 'You (Helper)',
      type: 'helper',
      pulse: true,
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] font-sans bg-background text-foreground overflow-hidden select-none">
      {/* ─── 1. FLOATING URGENT DISPATCH HEADER ────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-30 h-12 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 flex items-center justify-between shadow-2xs font-sans">
        <div className="flex items-center gap-2.5">
          <Link
            href="/sos"
            className="p-1 -ml-1 text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-100 active:scale-[0.98] transition-colors"
            aria-label="Back to SOS"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold text-xs sm:text-sm tracking-wide text-zinc-900 uppercase font-sans">
              Community SOS Dispatch
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-mono text-red-700 font-semibold uppercase">
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span>Active Signal</span>
        </div>
      </header>

      {/* ─── 2. REUSABLE MAPPLS MAP (OFFSET UPWARD TO AVOID CARD COLLISION) ─── */}
      <div className="absolute inset-0 z-0">
        <MapplsMap
          center={mapCenter}
          zoom={17}
          markers={mapMarkers}
          start={[helperLat, helperLng]}
          end={[victimLat, victimLng]}
          profile="walking"
          routePath={[[helperLat, helperLng], [victimLat, victimLng]]}
          centerOffsetPercent={{ x: 0, y: -16 }} // Offsets center upward so markers sit in top ~55%
          className="w-full h-full"
        />

        {/* Top-Right Compass / Heading Chip */}
        <div className="absolute top-14 right-3 z-20">
          <div className="bg-white/90 backdrop-blur-sm border border-zinc-200 px-2.5 py-1.5 rounded-[4px] text-[11px] font-semibold text-zinc-800 flex items-center gap-1.5 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-red-600 animate-spin-slow" />
            <span>Facing North</span>
          </div>
        </div>
      </div>

      {/* ─── 3. CLEAN FLOATING BOTTOM SHEET CARD (HOVERING AT BOTTOM EDGE) ───── */}
      <div className="absolute bottom-3 left-3 right-3 z-30 max-w-md mx-auto font-sans">
        <div className="bg-white/95 backdrop-blur-md border border-zinc-200/90 border-t-2 border-t-red-500 rounded-[4px] p-3.5 sm:p-4 shadow-xl space-y-3 font-sans">
          {/* Urgent Alert Banner */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 fill-current" />
              <span>Community SOS Alert</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 font-sans tracking-tight leading-tight">
              Someone needs help 80 meters away.
            </h2>
          </div>

          {/* Telemetry Summary */}
          <div className="bg-zinc-50 p-2.5 rounded-[4px] border border-zinc-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] font-medium block">
                Distance to victim
              </span>
              <div className="text-sm font-bold text-red-600 mt-0.5 flex items-center gap-1">
                <span>{distanceMeters} meters</span>
                <span className="text-zinc-500 font-normal text-xs">• ~1 min run</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-primary block">
                {digipin}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {victimLat.toFixed(4)}° N, {victimLng.toFixed(4)}° E
              </span>
            </div>
          </div>

          {/* Primary Navigation Action CTA */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${victimLat},${victimLng}`}
            target="_blank"
            rel="noopener noreferrer"
            id="navigate-to-victim-btn"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent text-accent-foreground font-bold text-sm rounded-[4px] shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer font-sans"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Navigate to Victim</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </a>

          {/* Secondary Action Row: Call 112 & Acknowledge Assistance */}
          <div className="grid grid-cols-2 gap-2 pt-0.5 font-sans">
            <a
              href="tel:112"
              id="call-112-from-responder-btn"
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-semibold rounded-[4px] border border-zinc-200 active:scale-[0.98] transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Call 112 Hotline</span>
            </a>

            <button
              type="button"
              onClick={() => setHasAcknowledged(!hasAcknowledged)}
              id="acknowledge-assisting-btn"
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-[4px] border active:scale-[0.98] transition-all cursor-pointer ${
                hasAcknowledged
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasAcknowledged ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>{hasAcknowledged ? 'Assisting Active' : 'I am Assisting'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
