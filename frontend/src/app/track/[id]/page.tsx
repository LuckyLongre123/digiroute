'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Radio,
  Navigation,
  User,
  Copy,
  Check,
  ArrowLeft,
  Crosshair,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useAddressStore, LiveViewer } from '@/store/useAddressStore';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * /track/[id]: Creator Live Radar
 *
 * Light-Mode Zinc Utilitarian Dashboard:
 * 1. Clean Daytime Map Canvas: High-contrast light vector styling with range rings.
 * 2. Real Store Data Only: Zero fake filler Z-axis text.
 * 3. Anti-Collision Marker Layout: Staggered offsets and cluster badges for arrived recipients.
 * 4. Professional Utility: Clean title-case headers and zero cyber-hacker jargon.
 */
export default function CreatorRadarPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Zustand Store
  const {
    digipin,
    latitude,
    longitude,
    slug,
    metadata,
    activeViewers: storeViewers,
    addOrUpdateViewer,
  } = useAddressStore();

  const code = digipin || resolvedParams.id.toUpperCase() || '4M8K-9P2L-1X';
  const activeSlug = slug || resolvedParams.id;
  const destLat = latitude || 12.9716;
  const destLng = longitude || 77.5946;

  // Real Z-Axis data from store (Zero fake filler data)
  const cleanFloor = metadata?.floor?.trim();
  const cleanFlat = metadata?.flat?.trim();
  const zAxisSummary = [
    cleanFloor ? `Floor ${cleanFloor}` : null,
    cleanFlat ? `Unit ${cleanFlat}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  // Local state for interactive radar and viewers
  const [selectedViewerId, setSelectedViewerId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isMobileDrawerExpanded, setIsMobileDrawerExpanded] = useState(false);
  const [radarZoom, setRadarZoom] = useState<'close' | 'mid' | 'far'>('mid'); // 120m, 350m, 700m scale

  // Local simulation viewers merged with store
  const [viewers, setViewers] = useState<LiveViewer[]>(() => {
    if (storeViewers && storeViewers.length > 0) {
      return storeViewers;
    }
    // Seed realistic active viewers for demonstration
    return [
      {
        id: 'viewer-delivery-1',
        name: 'Rahul (Dunzo Partner)',
        lat: destLat + 0.0018,
        lng: destLng - 0.0012,
        distanceMeters: 240,
        status: 'en_route',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'viewer-guest-2',
        name: 'Priya M. (Guest)',
        lat: destLat - 0.0006,
        lng: destLng + 0.0009,
        distanceMeters: 85,
        status: 'en_route',
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    if (storeViewers && storeViewers.length > 0) {
      queueMicrotask(() => {
        setViewers((prev) => {
          const merged = [...prev];
          storeViewers.forEach((sv) => {
            const idx = merged.findIndex((m) => m.id === sv.id);
            if (idx >= 0) {
              merged[idx] = sv;
            } else {
              merged.push(sv);
            }
          });
          return merged;
        });
      });
    }
  }, [storeViewers]);

  // Real-time viewer movement simulation toward Destination Pin
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((prevViewers) =>
        prevViewers.map((viewer) => {
          if (viewer.status === 'arrived' || viewer.distanceMeters <= 12) {
            return {
              ...viewer,
              status: 'arrived',
              distanceMeters: 8,
              updatedAt: new Date().toISOString(),
            };
          }

          // Move 8 to 15 meters closer to destination
          const stepReduction = Math.floor(Math.random() * 8) + 8;
          const nextDist = Math.max(8, viewer.distanceMeters - stepReduction);
          const ratio = nextDist / viewer.distanceMeters;

          // Interpolate coordinate closer to destLat, destLng
          const nextLat = destLat + (viewer.lat - destLat) * ratio;
          const nextLng = destLng + (viewer.lng - destLng) * ratio;

          const updatedViewer: LiveViewer = {
            ...viewer,
            lat: nextLat,
            lng: nextLng,
            distanceMeters: nextDist,
            status: nextDist <= 15 ? 'arrived' : 'en_route',
            updatedAt: new Date().toISOString(),
          };

          return updatedViewer;
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [destLat, destLng]);

  // Copy link handler
  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/a/${activeSlug}`;
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Add a new mock viewer for instant demo
  const handleAddMockViewer = () => {
    const names = [
      'Amit K. (Courier)',
      'Vikram (Zomato)',
      'Neha S. (Visitor)',
      'Karan (Porter)',
    ];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.floor(Math.random() * 250) + 150;
    // approx 0.00001 deg per meter
    const offsetLat = Math.sin(angle) * (distance * 0.000009);
    const offsetLng = Math.cos(angle) * (distance * 0.000009);

    const newViewer: LiveViewer = {
      id: `viewer-${Date.now()}`,
      name: `${randomName} #${viewers.length + 1}`,
      lat: destLat + offsetLat,
      lng: destLng + offsetLng,
      distanceMeters: distance,
      status: 'en_route',
      updatedAt: new Date().toISOString(),
    };

    setViewers((prev) => [...prev, newViewer]);
    addOrUpdateViewer(newViewer);
    setSelectedViewerId(newViewer.id);
  };

  // Scale distance settings
  const maxRangeMeters =
    radarZoom === 'close' ? 120 : radarZoom === 'mid' ? 350 : 700;

  // Group arrived viewers for anti-collision clustering
  const arrivedViewers = useMemo(
    () => viewers.filter((v) => v.status === 'arrived'),
    [viewers]
  );

  // Compute 2D radar screen coordinates with anti-collision offsets
  const getRadarCoordinates = (
    viewer: LiveViewer,
    viewerIndex: number,
    arrivedIndex: number
  ) => {
    if (viewer.status === 'arrived') {
      // Stagger arrived viewers in a circular halo around the Destination Pin (radius 7%)
      const totalArrived = Math.max(1, arrivedViewers.length);
      const angle = arrivedIndex * ((2 * Math.PI) / totalArrived) - Math.PI / 2;
      const radiusPercent = totalArrived === 1 ? 5.5 : 7.5;

      const x = 50 + radiusPercent * Math.cos(angle);
      const y = 50 + radiusPercent * Math.sin(angle);
      return {
        x,
        y,
        isStaggered: true,
        badgePosition: y < 50 ? 'top' : 'bottom',
      };
    }

    // Normal en-route coordinate projection
    const dLat = viewer.lat - destLat;
    const dLng = viewer.lng - destLng;
    const bearing = Math.atan2(dLng, dLat); // angle in radians from North

    const normalizedDistance = Math.min(
      viewer.distanceMeters / maxRangeMeters,
      1.15
    );
    const radiusPercent = normalizedDistance * 42; // percent from center

    const x = 50 + radiusPercent * Math.sin(bearing);
    const y = 50 - radiusPercent * Math.cos(bearing);

    // Alternate label position to prevent accidental overlaps between nearby markers
    const badgePosition = viewerIndex % 2 === 0 ? 'bottom' : 'top';

    return { x, y, isStaggered: false, badgePosition };
  };

  const selectedViewer = useMemo(
    () => viewers.find((v) => v.id === selectedViewerId),
    [viewers, selectedViewerId]
  );

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 select-none">
      {/* ─── 1. LIGHT-MODE UTILITARIAN HEADER ───────────────────────────────── */}
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-1 cursor-pointer rounded p-1.5 text-zinc-600 transition-[transform,colors] hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-zinc-900 sm:text-sm">
                {code}
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-emerald-700 uppercase">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                Radar Live
              </span>
            </div>
            {/* Real Z-Axis data ONLY (Empty if not set in store) */}
            {zAxisSummary && (
              <p className="hidden font-sans text-[11px] text-zinc-500 sm:block">
                {zAxisSummary}
              </p>
            )}
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center gap-2">
          {/* Test Recipient View Link */}
          <Link
            href={`/a/${activeSlug}`}
            target="_blank"
            className="hidden items-center gap-1.5 rounded-[4px] border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-[transform,colors] hover:bg-zinc-50 active:scale-[0.98] md:flex"
          >
            <span>Open Recipient Link</span>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
          </Link>

          {/* Copy Link Button */}
          <button
            type="button"
            id="copy-track-link-btn"
            onClick={handleCopyLink}
            className="bg-accent text-accent-foreground flex cursor-pointer items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-semibold shadow-xs transition-[transform,opacity] hover:opacity-95 active:scale-[0.98]"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{isCopied ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN WORKSPACE: DAYTIME RADAR CANVAS + SIDEBAR ───────────────── */}
      <div className="relative flex h-[calc(100%-3.5rem)] w-full flex-1 overflow-hidden">
        {/* DAYTIME LIGHT VECTOR MAP CANVAS */}
        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-100">
          {/* Daytime Architectural Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-35" />

          {/* Subtle Daytime Radar Sweep */}
          <div className="pointer-events-none absolute h-[600px] w-[600px] overflow-hidden rounded-full opacity-30 sm:h-[750px] sm:w-[750px]">
            <div className="animate-spin-slow h-full w-full origin-center rounded-full border border-zinc-300/80 [background:conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,107,0,0.12)_360deg)]" />
          </div>

          {/* Concentric Range Rings Centered on Destination Pin */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="relative flex aspect-square w-[84%] max-w-[560px] items-center justify-center rounded-full border border-zinc-300/80">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded border border-zinc-200 bg-white/95 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 shadow-2xs">
                {maxRangeMeters}m
              </span>

              {/* Mid Ring */}
              <div className="relative flex aspect-square w-[65%] items-center justify-center rounded-full border border-zinc-300">
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded border border-zinc-200 bg-white/95 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 shadow-2xs">
                  {Math.round(maxRangeMeters * 0.65)}m
                </span>

                {/* Inner Proximity Ring (Visual Lock Zone: 50m) */}
                <div className="border-accent/60 bg-accent/[0.04] relative flex aspect-square w-[45%] items-center justify-center rounded-full border border-dashed">
                  <span className="text-accent border-accent/40 absolute -top-3 left-1/2 -translate-x-1/2 rounded border bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold shadow-2xs">
                    50m Visual Lock
                  </span>
                </div>
              </div>
            </div>

            {/* Radar Crosshairs */}
            <div className="absolute inset-x-0 h-px bg-zinc-300/80" />
            <div className="absolute inset-y-0 w-px bg-zinc-300/80" />

            {/* Cardinal Direction Marks */}
            <span className="absolute top-3 font-mono text-[10px] font-semibold text-zinc-600">
              N 000°
            </span>
            <span className="absolute bottom-3 font-mono text-[10px] font-semibold text-zinc-600">
              S 180°
            </span>
            <span className="absolute right-3 font-mono text-[10px] font-semibold text-zinc-600">
              E 090°
            </span>
            <span className="absolute left-3 font-mono text-[10px] font-semibold text-zinc-600">
              W 270°
            </span>
          </div>

          {/* Bearing Vectors & Lines Connecting Viewers to Destination Pin */}
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
            {viewers.map((viewer, idx) => {
              const arrivedIdx = arrivedViewers.findIndex(
                (av) => av.id === viewer.id
              );
              const coords = getRadarCoordinates(viewer, idx, arrivedIdx);
              const isSelected = selectedViewerId === viewer.id;

              return (
                <line
                  key={`line-${viewer.id}`}
                  x1={`${coords.x}%`}
                  y1={`${coords.y}%`}
                  x2="50%"
                  y2="50%"
                  stroke={isSelected ? '#FF6B00' : '#2563eb'}
                  strokeWidth={isSelected ? '2' : '1.2'}
                  strokeDasharray={isSelected ? '4 4' : '3 3'}
                  opacity={isSelected ? '0.9' : '0.45'}
                />
              );
            })}
          </svg>

          {/* DESTINATION ENTRANCE PIN (CENTERED WITH PULSING SAFFRON BEACON) */}
          <div className="group pointer-events-auto absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center">
            {/* Clustered Badge if Viewers have Arrived */}
            {arrivedViewers.length > 0 && (
              <span className="mb-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-emerald-800 shadow-xs">
                {arrivedViewers.length}{' '}
                {arrivedViewers.length === 1
                  ? 'Recipient Arrived'
                  : 'Recipients Arrived'}
              </span>
            )}

            {/* Pulsing Saffron Beacon Waves */}
            <div className="bg-accent/20 pointer-events-none absolute h-20 w-20 animate-ping rounded-full opacity-60" />
            <div className="bg-accent/30 pointer-events-none absolute h-12 w-12 animate-pulse rounded-full" />

            {/* Destination Pin Icon */}
            <div className="bg-accent text-accent-foreground relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-110">
              <MapPin className="h-5 w-5 fill-current" />
            </div>

            {/* Entrance Pin Label */}
            <div className="mt-1 rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide whitespace-nowrap text-zinc-900 shadow-xs">
              ENTRANCE PIN
            </div>
          </div>

          {/* REAL-TIME VIEWER MARKERS (WITH ANTI-COLLISION STAGGERING) */}
          {viewers.map((viewer, idx) => {
            const arrivedIdx = arrivedViewers.findIndex(
              (av) => av.id === viewer.id
            );
            const coords = getRadarCoordinates(viewer, idx, arrivedIdx);
            const isSelected = selectedViewerId === viewer.id;
            const isArrived = viewer.status === 'arrived';

            return (
              <button
                type="button"
                key={viewer.id}
                onClick={() => setSelectedViewerId(viewer.id)}
                style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                className="group absolute z-25 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center focus:outline-none"
                aria-label={`Viewer ${viewer.name}, ${viewer.distanceMeters}m away`}
              >
                {/* Floating Badge (Rendered ABOVE if badgePosition is 'top') */}
                {coords.badgePosition === 'top' && (
                  <div
                    className={`mb-1 rounded px-2 py-0.5 text-[10px] font-medium tracking-tight whitespace-nowrap shadow-xs transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent text-accent-foreground scale-105 font-bold shadow-sm'
                        : isArrived
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border border-zinc-200 bg-white text-zinc-800'
                    }`}
                  >
                    <span>{viewer.name.split(' ')[0]}</span>
                    <span className="ml-1 font-mono opacity-75">
                      {isArrived ? 'Arrived' : `${viewer.distanceMeters}m`}
                    </span>
                  </div>
                )}

                {/* Marker Avatar/Dot */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute h-9 w-9 animate-ping rounded-full opacity-75 ${
                      isArrived
                        ? 'bg-emerald-500/25'
                        : isSelected
                          ? 'bg-accent/35'
                          : 'bg-blue-500/25'
                    }`}
                  />
                  <div
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-white shadow-md transition-transform duration-150 group-hover:scale-110 ${
                      isArrived
                        ? 'border-white bg-emerald-600'
                        : isSelected
                          ? 'bg-accent ring-accent/60 border-white ring-2'
                          : 'border-white bg-blue-600'
                    }`}
                  >
                    <Navigation className="h-3.5 w-3.5 -rotate-45 transform fill-current" />
                  </div>
                </div>

                {/* Floating Badge (Rendered BELOW if badgePosition is 'bottom') */}
                {coords.badgePosition === 'bottom' && (
                  <div
                    className={`mt-1 rounded px-2 py-0.5 text-[10px] font-medium tracking-tight whitespace-nowrap shadow-xs transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent text-accent-foreground scale-105 font-bold shadow-sm'
                        : isArrived
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border border-zinc-200 bg-white text-zinc-800'
                    }`}
                  >
                    <span>{viewer.name.split(' ')[0]}</span>
                    <span className="ml-1 font-mono opacity-75">
                      {isArrived ? 'Arrived' : `${viewer.distanceMeters}m`}
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {/* BOTTOM-LEFT RADAR CONTROLS */}
          <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2">
            {/* Center on Pin Button */}
            <button
              type="button"
              onClick={() => setSelectedViewerId(null)}
              className="flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-zinc-200 bg-white p-2.5 text-xs font-semibold text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 active:scale-[0.98]"
              title="Center on Destination Pin"
            >
              <Crosshair className="text-accent h-4 w-4" />
              <span className="hidden sm:inline">Center Pin</span>
            </button>

            {/* Radar Scale Buttons */}
            <div className="flex items-center gap-1 rounded-[4px] border border-zinc-200 bg-white p-1 shadow-xs">
              {(['close', 'mid', 'far'] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setRadarZoom(z)}
                  className={`rounded px-2 py-1 font-mono text-[10px] font-bold ${
                    radarZoom === z
                      ? 'bg-accent text-accent-foreground'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {z === 'close' ? '120m' : z === 'mid' ? '350m' : '700m'}
                </button>
              ))}
            </div>

            {/* Mock Recipient Button for Instant Demo */}
            <button
              type="button"
              id="add-mock-viewer-btn"
              onClick={handleAddMockViewer}
              className="flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Simulate Viewer</span>
            </button>
          </div>
        </div>

        {/* ─── 3. DESKTOP LIGHT DOCKED SIDEBAR ───────────────────────────────── */}
        <aside className="z-30 hidden h-full w-88 shrink-0 flex-col border-l border-zinc-200 bg-white font-sans shadow-xs lg:flex">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 p-4">
            <div className="flex items-center gap-2">
              <Radio className="text-accent h-4 w-4 animate-pulse" />
              <h2 className="text-xs font-bold tracking-wider text-zinc-800 uppercase">
                Active Viewers ({viewers.length})
              </h2>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">Sync 3s</span>
          </div>

          {/* Viewer Card List */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {viewers.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-zinc-500">
                <User className="mx-auto mb-2 h-8 w-8 text-zinc-400 opacity-40" />
                <p className="font-semibold text-zinc-800">
                  No active recipients
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Share your link to monitor live arrival telemetry.
                </p>
              </div>
            ) : (
              viewers.map((viewer) => {
                const isSelected = selectedViewerId === viewer.id;
                const isArrived = viewer.status === 'arrived';

                return (
                  <div
                    key={viewer.id}
                    onClick={() => setSelectedViewerId(viewer.id)}
                    className={`cursor-pointer rounded-[4px] border p-3 transition-[transform,colors] ${
                      isSelected
                        ? 'border-accent ring-accent/30 bg-orange-50/60 text-zinc-900 shadow-xs ring-1'
                        : 'border-zinc-200 bg-zinc-50/80 text-zinc-800 hover:bg-zinc-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            isArrived
                              ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                              : 'border border-blue-300 bg-blue-100 text-blue-800'
                          }`}
                        >
                          {viewer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs leading-tight font-semibold text-zinc-900">
                            {viewer.name}
                          </p>
                          <span className="font-sans text-[10px] text-zinc-500">
                            {viewer.status === 'arrived'
                              ? 'At Doorstep'
                              : 'Approaching entrance'}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-semibold ${
                          isArrived
                            ? 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border border-blue-200 bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isArrived ? 'Arrived' : 'En route'}
                      </span>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-zinc-200/80 pt-2 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Navigation className="text-accent h-3 w-3" />
                        <span className="font-sans font-semibold text-zinc-900">
                          {viewer.distanceMeters} m
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          distance
                        </span>
                      </div>
                      <span className="font-sans text-[11px] text-zinc-500">
                        {isArrived ? 'Arrived at Pin' : '~2 min walk'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clean Utilitarian Footer (Zero Cyber-Hacker Slop) */}
          <div className="space-y-1.5 border-t border-zinc-200 bg-zinc-50 p-3 text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Passcode protection</span>
              <span className="font-medium text-zinc-800">
                {metadata.passcode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Active sessions</span>
              <span className="font-mono font-medium text-emerald-700">
                {viewers.length} tracking
              </span>
            </div>
          </div>
        </aside>

        {/* ─── 4. MOBILE DRAWER (LIGHT-MODE ZINC THEME) ──────────────────────── */}
        <div className="absolute right-0 bottom-0 left-0 z-40 rounded-t-lg border-t border-zinc-200 bg-white/95 shadow-lg backdrop-blur-md transition-all duration-300 lg:hidden">
          {/* Drawer Handle & Summary Header */}
          <div
            onClick={() => setIsMobileDrawerExpanded(!isMobileDrawerExpanded)}
            className="flex cursor-pointer items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
              <span className="text-xs font-bold tracking-wide text-zinc-800 uppercase">
                Live Viewers ({viewers.length})
              </span>
              {selectedViewer && (
                <span className="text-accent ml-2 text-[11px] font-semibold">
                  • {selectedViewer.name.split(' ')[0]}:{' '}
                  {selectedViewer.distanceMeters}m
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={
                isMobileDrawerExpanded
                  ? 'Collapse viewer drawer'
                  : 'Expand viewer drawer'
              }
              className="p-1 text-zinc-500 hover:text-zinc-800"
            >
              {isMobileDrawerExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Expanded Drawer Viewer List */}
          {isMobileDrawerExpanded && (
            <div className="max-h-[45vh] space-y-2 overflow-y-auto border-t border-zinc-200 p-3 pt-0">
              {viewers.map((viewer) => {
                const isSelected = selectedViewerId === viewer.id;
                const isArrived = viewer.status === 'arrived';

                return (
                  <div
                    key={viewer.id}
                    onClick={() => {
                      setSelectedViewerId(viewer.id);
                      setIsMobileDrawerExpanded(false);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded border p-2.5 text-xs ${
                      isSelected
                        ? 'border-accent bg-orange-50 text-zinc-900'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">
                        {viewer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {viewer.name}
                        </p>
                        <span className="text-[10px] text-zinc-500">
                          {isArrived
                            ? 'At Doorstep'
                            : `${viewer.distanceMeters}m away`}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-semibold ${
                        isArrived
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {viewer.status === 'arrived' ? 'Arrived' : 'En route'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
