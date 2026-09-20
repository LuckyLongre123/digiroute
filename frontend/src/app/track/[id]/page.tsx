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
    const names = ['Amit K. (Courier)', 'Vikram (Zomato)', 'Neha S. (Visitor)', 'Karan (Porter)'];
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
  const maxRangeMeters = radarZoom === 'close' ? 120 : radarZoom === 'mid' ? 350 : 700;

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
      const angle = (arrivedIndex * (2 * Math.PI / totalArrived)) - (Math.PI / 2);
      const radiusPercent = totalArrived === 1 ? 5.5 : 7.5;

      const x = 50 + radiusPercent * Math.cos(angle);
      const y = 50 + radiusPercent * Math.sin(angle);
      return { x, y, isStaggered: true, badgePosition: y < 50 ? 'top' : 'bottom' };
    }

    // Normal en-route coordinate projection
    const dLat = viewer.lat - destLat;
    const dLng = viewer.lng - destLng;
    const bearing = Math.atan2(dLng, dLat); // angle in radians from North

    const normalizedDistance = Math.min(viewer.distanceMeters / maxRangeMeters, 1.15);
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
    <div className="relative flex-1 flex flex-col w-full h-full bg-zinc-50 text-zinc-900 overflow-hidden font-sans select-none">
      {/* ─── 1. LIGHT-MODE UTILITARIAN HEADER ───────────────────────────────── */}
      <header className="relative z-30 h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 -ml-1 text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-100 active:scale-[0.98] transition-[transform,colors] cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-zinc-900">
                {code}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 tracking-wide uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Radar Live
              </span>
            </div>
            {/* Real Z-Axis data ONLY (Empty if not set in store) */}
            {zAxisSummary && (
              <p className="text-[11px] text-zinc-500 font-sans hidden sm:block">
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
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-[4px] border border-zinc-200 active:scale-[0.98] transition-[transform,colors] shadow-2xs"
          >
            <span>Open Recipient Link</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </Link>

          {/* Copy Link Button */}
          <button
            type="button"
            id="copy-track-link-btn"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-[4px] hover:opacity-95 active:scale-[0.98] transition-[transform,opacity] shadow-xs cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN WORKSPACE: DAYTIME RADAR CANVAS + SIDEBAR ───────────────── */}
      <div className="relative flex-1 w-full h-[calc(100%-3.5rem)] flex overflow-hidden">
        {/* DAYTIME LIGHT VECTOR MAP CANVAS */}
        <div className="relative flex-1 h-full w-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {/* Daytime Architectural Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-35" />

          {/* Subtle Daytime Radar Sweep */}
          <div className="absolute w-[600px] h-[600px] sm:w-[750px] sm:h-[750px] rounded-full pointer-events-none opacity-30 overflow-hidden">
            <div className="w-full h-full rounded-full border border-zinc-300/80 [background:conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,107,0,0.12)_360deg)] animate-spin-slow origin-center" />
          </div>

          {/* Concentric Range Rings Centered on Destination Pin */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer Ring */}
            <div className="relative w-[84%] max-w-[560px] aspect-square rounded-full border border-zinc-300/80 flex items-center justify-center">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-600 bg-white/95 px-1.5 py-0.5 rounded border border-zinc-200 shadow-2xs">
                {maxRangeMeters}m
              </span>

              {/* Mid Ring */}
              <div className="relative w-[65%] aspect-square rounded-full border border-zinc-300 flex items-center justify-center">
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-600 bg-white/95 px-1.5 py-0.5 rounded border border-zinc-200 shadow-2xs">
                  {Math.round(maxRangeMeters * 0.65)}m
                </span>

                {/* Inner Proximity Ring (Visual Lock Zone: 50m) */}
                <div className="relative w-[45%] aspect-square rounded-full border border-dashed border-accent/60 flex items-center justify-center bg-accent/[0.04]">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-semibold text-accent bg-white px-1.5 py-0.5 rounded border border-accent/40 shadow-2xs">
                    50m Visual Lock
                  </span>
                </div>
              </div>
            </div>

            {/* Radar Crosshairs */}
            <div className="absolute inset-x-0 h-px bg-zinc-300/80" />
            <div className="absolute inset-y-0 w-px bg-zinc-300/80" />

            {/* Cardinal Direction Marks */}
            <span className="absolute top-3 text-[10px] font-mono font-semibold text-zinc-600">N 000°</span>
            <span className="absolute bottom-3 text-[10px] font-mono font-semibold text-zinc-600">S 180°</span>
            <span className="absolute right-3 text-[10px] font-mono font-semibold text-zinc-600">E 090°</span>
            <span className="absolute left-3 text-[10px] font-mono font-semibold text-zinc-600">W 270°</span>
          </div>

          {/* Bearing Vectors & Lines Connecting Viewers to Destination Pin */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {viewers.map((viewer, idx) => {
              const arrivedIdx = arrivedViewers.findIndex((av) => av.id === viewer.id);
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-auto cursor-pointer group">
            {/* Clustered Badge if Viewers have Arrived */}
            {arrivedViewers.length > 0 && (
              <span className="mb-1.5 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold shadow-xs whitespace-nowrap">
                {arrivedViewers.length} {arrivedViewers.length === 1 ? 'Recipient Arrived' : 'Recipients Arrived'}
              </span>
            )}

            {/* Pulsing Saffron Beacon Waves */}
            <div className="absolute w-20 h-20 rounded-full bg-accent/20 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute w-12 h-12 rounded-full bg-accent/30 animate-pulse pointer-events-none" />

            {/* Destination Pin Icon */}
            <div className="relative w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md border-2 border-white transition-transform duration-200 group-hover:scale-110">
              <MapPin className="w-5 h-5 fill-current" />
            </div>

            {/* Entrance Pin Label */}
            <div className="mt-1 px-2 py-0.5 bg-white border border-zinc-200 text-zinc-900 rounded text-[10px] font-bold font-mono tracking-wide shadow-xs whitespace-nowrap">
              ENTRANCE PIN
            </div>
          </div>

          {/* REAL-TIME VIEWER MARKERS (WITH ANTI-COLLISION STAGGERING) */}
          {viewers.map((viewer, idx) => {
            const arrivedIdx = arrivedViewers.findIndex((av) => av.id === viewer.id);
            const coords = getRadarCoordinates(viewer, idx, arrivedIdx);
            const isSelected = selectedViewerId === viewer.id;
            const isArrived = viewer.status === 'arrived';

            return (
              <button
                type="button"
                key={viewer.id}
                onClick={() => setSelectedViewerId(viewer.id)}
                style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25 flex flex-col items-center cursor-pointer group focus:outline-none"
                aria-label={`Viewer ${viewer.name}, ${viewer.distanceMeters}m away`}
              >
                {/* Floating Badge (Rendered ABOVE if badgePosition is 'top') */}
                {coords.badgePosition === 'top' && (
                  <div
                    className={`mb-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight shadow-xs whitespace-nowrap transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent text-accent-foreground font-bold scale-105 shadow-sm'
                        : isArrived
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-white text-zinc-800 border border-zinc-200'
                    }`}
                  >
                    <span>{viewer.name.split(' ')[0]}</span>
                    <span className="ml-1 opacity-75 font-mono">
                      {isArrived ? 'Arrived' : `${viewer.distanceMeters}m`}
                    </span>
                  </div>
                )}

                {/* Marker Avatar/Dot */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute w-9 h-9 rounded-full animate-ping opacity-75 ${
                      isArrived ? 'bg-emerald-500/25' : isSelected ? 'bg-accent/35' : 'bg-blue-500/25'
                    }`}
                  />
                  <div
                    className={`relative w-7 h-7 rounded-full flex items-center justify-center text-white border-2 shadow-md transition-transform duration-150 group-hover:scale-110 ${
                      isArrived
                        ? 'bg-emerald-600 border-white'
                        : isSelected
                        ? 'bg-accent border-white ring-2 ring-accent/60'
                        : 'bg-blue-600 border-white'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 fill-current transform -rotate-45" />
                  </div>
                </div>

                {/* Floating Badge (Rendered BELOW if badgePosition is 'bottom') */}
                {coords.badgePosition === 'bottom' && (
                  <div
                    className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight shadow-xs whitespace-nowrap transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent text-accent-foreground font-bold scale-105 shadow-sm'
                        : isArrived
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-white text-zinc-800 border border-zinc-200'
                    }`}
                  >
                    <span>{viewer.name.split(' ')[0]}</span>
                    <span className="ml-1 opacity-75 font-mono">
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
              className="p-2.5 bg-white hover:bg-zinc-50 text-zinc-700 rounded-[4px] border border-zinc-200 shadow-xs active:scale-[0.98] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Center on Destination Pin"
            >
              <Crosshair className="w-4 h-4 text-accent" />
              <span className="hidden sm:inline">Center Pin</span>
            </button>

            {/* Radar Scale Buttons */}
            <div className="bg-white border border-zinc-200 rounded-[4px] p-1 flex items-center gap-1 shadow-xs">
              {(['close', 'mid', 'far'] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setRadarZoom(z)}
                  className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                    radarZoom === z
                      ? 'bg-accent text-accent-foreground'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 rounded-[4px] border border-zinc-200 shadow-xs active:scale-[0.98] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulate Viewer</span>
            </button>
          </div>
        </div>

        {/* ─── 3. DESKTOP LIGHT DOCKED SIDEBAR ───────────────────────────────── */}
        <aside className="hidden lg:flex w-88 h-full bg-white border-l border-zinc-200 flex-col shrink-0 z-30 font-sans shadow-xs">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-accent animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                Active Viewers ({viewers.length})
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Sync 3s</span>
          </div>

          {/* Viewer Card List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {viewers.length === 0 ? (
              <div className="text-center py-10 px-4 text-zinc-500 text-xs">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                <p className="font-semibold text-zinc-800">No active recipients</p>
                <p className="text-[11px] text-zinc-500 mt-1">
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
                    className={`p-3 rounded-[4px] border transition-[transform,colors] cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50/60 border-accent text-zinc-900 shadow-xs ring-1 ring-accent/30'
                        : 'bg-zinc-50/80 hover:bg-zinc-100/80 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isArrived
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {viewer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 leading-tight">
                            {viewer.name}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-sans">
                            {viewer.status === 'arrived' ? 'At Doorstep' : 'Approaching entrance'}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                          isArrived
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isArrived ? 'Arrived' : 'En route'}
                      </span>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-200/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Navigation className="w-3 h-3 text-accent" />
                        <span className="text-zinc-900 font-semibold font-sans">
                          {viewer.distanceMeters} m
                        </span>
                        <span className="text-zinc-500 text-[11px]">distance</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-sans">
                        {isArrived ? 'Arrived at Pin' : '~2 min walk'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clean Utilitarian Footer (Zero Cyber-Hacker Slop) */}
          <div className="p-3 border-t border-zinc-200 bg-zinc-50 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500 text-[11px]">
              <span>Passcode protection</span>
              <span className="font-medium text-zinc-800">
                {metadata.passcode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-500 text-[11px]">
              <span>Active sessions</span>
              <span className="font-mono font-medium text-emerald-700">
                {viewers.length} tracking
              </span>
            </div>
          </div>
        </aside>

        {/* ─── 4. MOBILE DRAWER (LIGHT-MODE ZINC THEME) ──────────────────────── */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 transition-all duration-300 rounded-t-lg shadow-lg">
          {/* Drawer Handle & Summary Header */}
          <div
            onClick={() => setIsMobileDrawerExpanded(!isMobileDrawerExpanded)}
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                Live Viewers ({viewers.length})
              </span>
              {selectedViewer && (
                <span className="text-[11px] text-accent font-semibold ml-2">
                  • {selectedViewer.name.split(' ')[0]}: {selectedViewer.distanceMeters}m
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={isMobileDrawerExpanded ? 'Collapse viewer drawer' : 'Expand viewer drawer'}
              className="p-1 text-zinc-500 hover:text-zinc-800"
            >
              {isMobileDrawerExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Expanded Drawer Viewer List */}
          {isMobileDrawerExpanded && (
            <div className="max-h-[45vh] overflow-y-auto p-3 pt-0 space-y-2 border-t border-zinc-200">
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
                    className={`p-2.5 rounded border flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 border-accent text-zinc-900'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700">
                        {viewer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{viewer.name}</p>
                        <span className="text-[10px] text-zinc-500">
                          {isArrived ? 'At Doorstep' : `${viewer.distanceMeters}m away`}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
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
