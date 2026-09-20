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
    <div className="bg-background text-foreground relative h-[100dvh] w-full overflow-hidden font-sans select-none">
      {/* ─── 1. FLOATING URGENT DISPATCH HEADER ────────────────────────────── */}
      <header className="absolute top-0 right-0 left-0 z-30 flex h-12 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 font-sans shadow-2xs backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/sos"
            className="-ml-1 rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
            aria-label="Back to SOS"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
            <span className="font-sans text-xs font-bold tracking-wide text-zinc-900 uppercase sm:text-sm">
              Community SOS Dispatch
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-700 uppercase">
          <Radio className="h-3 w-3 animate-pulse text-red-500" />
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
          routePath={[
            [helperLat, helperLng],
            [victimLat, victimLng],
          ]}
          centerOffsetPercent={{ x: 0, y: -16 }} // Offsets center upward so markers sit in top ~55%
          className="h-full w-full"
        />

        {/* Top-Right Compass / Heading Chip */}
        <div className="absolute top-14 right-3 z-20">
          <div className="flex items-center gap-1.5 rounded-[4px] border border-zinc-200 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 shadow-2xs backdrop-blur-sm">
            <Compass className="animate-spin-slow h-3.5 w-3.5 text-red-600" />
            <span>Facing North</span>
          </div>
        </div>
      </div>

      {/* ─── 3. CLEAN FLOATING BOTTOM SHEET CARD (HOVERING AT BOTTOM EDGE) ───── */}
      <div className="absolute right-3 bottom-3 left-3 z-30 mx-auto max-w-md font-sans">
        <div className="space-y-3 rounded-[4px] border border-t-2 border-zinc-200/90 border-t-red-500 bg-white/95 p-3.5 font-sans shadow-xl backdrop-blur-md sm:p-4">
          {/* Urgent Alert Banner */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-red-600 uppercase">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 fill-current" />
              <span>Community SOS Alert</span>
            </div>
            <h2 className="font-sans text-sm leading-tight font-bold tracking-tight text-zinc-900 sm:text-base">
              Someone needs help 80 meters away.
            </h2>
          </div>

          {/* Telemetry Summary */}
          <div className="flex items-center justify-between rounded-[4px] border border-zinc-200/80 bg-zinc-50 p-2.5 text-xs">
            <div>
              <span className="block text-[10px] font-medium text-zinc-500">
                Distance to victim
              </span>
              <div className="mt-0.5 flex items-center gap-1 text-sm font-bold text-red-600">
                <span>{distanceMeters} meters</span>
                <span className="text-xs font-normal text-zinc-500">
                  • ~1 min run
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-primary block font-mono text-xs font-bold">
                {digipin}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
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
            className="bg-accent text-accent-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] px-4 py-3 font-sans text-sm font-bold shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4 fill-current" />
            <span>Navigate to Victim</span>
            <ExternalLink className="ml-0.5 h-3.5 w-3.5 opacity-80" />
          </a>

          {/* Secondary Action Row: Call 112 & Acknowledge Assistance */}
          <div className="grid grid-cols-2 gap-2 pt-0.5 font-sans">
            <a
              href="tel:112"
              id="call-112-from-responder-btn"
              className="flex items-center justify-center gap-1.5 rounded-[4px] border border-zinc-200 bg-zinc-100 px-2 py-2 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-200/80 active:scale-[0.98]"
            >
              <PhoneCall className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>Call 112 Hotline</span>
            </a>

            <button
              type="button"
              onClick={() => setHasAcknowledged(!hasAcknowledged)}
              id="acknowledge-assisting-btn"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border px-2 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                hasAcknowledged
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              <CheckCircle2
                className={`h-3.5 w-3.5 ${hasAcknowledged ? 'text-emerald-600' : 'text-zinc-400'}`}
              />
              <span>
                {hasAcknowledged ? 'Assisting Active' : 'I am Assisting'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
