'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Crosshair,
  ArrowRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useAddressStore, useHasHydrated } from '@/store/useAddressStore';
import { encode, formatDigipin } from '@/lib/digipin';

// Milestone 1: Lazy-load heavy Mappls SDK on-demand with SSR disabled
const DynamicMapplsMap = dynamic(
  () => import('@/components/ui/MapplsMap').then((mod) => mod.MapplsMap),
  {
    ssr: false,
    loading: () => (
      <div className="border-border flex h-full min-h-[340px] w-full flex-col items-center justify-center gap-3 rounded-xl border bg-zinc-100 font-sans dark:bg-zinc-900">
        <Loader2 className="text-accent h-7 w-7 animate-spin" />
        <span className="text-muted-foreground font-sans text-xs font-medium">
          Loading interactive map...
        </span>
      </div>
    ),
  }
);

/**
 * Calculates great-circle distance between two geodetic points in meters (Haversine formula).
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * /create/map: Step 3 - Entrance Pin Placement (High Performance Architecture)
 *
 * 1. Milestone 1: Opt-In, Lazy-Loaded Map UI
 *    - Defaults to a clean, minimal preview showing base location from Step 1.
 *    - Prevents downloading/initializing heavy Mappls Web SDK unless requested.
 * 2. Milestone 2: Fixed Center Pin (Zero-Lag Mobile Dragging)
 *    - Zero GL marker overhead during pan.
 *    - Pin is an absolute HTML/SVG overlay centered over the map.
 *    - Updates React state ONLY on moveend event (map.getCenter()), ensuring 60fps dragging.
 * 3. Milestone 3: Map Interaction Optimizations
 *    - Disables pitch gestures, drag rotation, and touch pitch for lightweight 2D panning.
 *    - Bounded minZoom (12) and maxZoom (19).
 */
export default function CreateMapPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const baseLat = useAddressStore((state) => state.latitude);
  const baseLng = useAddressStore((state) => state.longitude);
  const storedEntranceLat = useAddressStore((state) => state.entranceLat);
  const storedEntranceLng = useAddressStore((state) => state.entranceLng);
  const storeDigipin = useAddressStore((state) => state.digipin);

  const setEntranceCoordinates = useAddressStore(
    (state) => state.setEntranceCoordinates
  );
  const setDigipin = useAddressStore((state) => state.setDigipin);
  const setStep = useAddressStore((state) => state.setStep);

  // 1. State Hydration & Fallback: Wait for Zustand hydration before checking coordinates
  useEffect(() => {
    if (!hasHydrated) return;
    if (baseLat === null || baseLng === null) {
      router.replace('/create');
    }
  }, [hasHydrated, baseLat, baseLng, router]);

  // Initial pin coordinates: use saved entrance pin or base GPS coordinates
  const initialLat = storedEntranceLat ?? baseLat ?? 28.6139;
  const initialLng = storedEntranceLng ?? baseLng ?? 77.209;

  const [pinLat, setPinLat] = useState<number>(initialLat);
  const [pinLng, setPinLng] = useState<number>(initialLng);

  const [prevSourceCoords, setPrevSourceCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: storedEntranceLat ?? baseLat,
    lng: storedEntranceLng ?? baseLng,
  });

  const currentSourceLat = storedEntranceLat ?? baseLat;
  const currentSourceLng = storedEntranceLng ?? baseLng;

  if (
    currentSourceLat !== null &&
    currentSourceLng !== null &&
    (prevSourceCoords.lat !== currentSourceLat ||
      prevSourceCoords.lng !== currentSourceLng)
  ) {
    setPrevSourceCoords({ lat: currentSourceLat, lng: currentSourceLng });
    setPinLat(currentSourceLat);
    setPinLng(currentSourceLng);
  }

  // 2. DIGIPIN Calculation based on refined pin location
  const refinedDigipin = useMemo(() => {
    try {
      return encode(pinLat, pinLng, true);
    } catch {
      return storeDigipin || formatDigipin('23456789CJ');
    }
  }, [pinLat, pinLng, storeDigipin]);

  // 3. Haversine distance offset calculation from center of accuracy circle
  const distanceOffset = useMemo(() => {
    if (baseLat === null || baseLng === null) return 0;
    return calculateDistanceMeters(baseLat, baseLng, pinLat, pinLng);
  }, [baseLat, baseLng, pinLat, pinLng]);

  // Zero-Lag MoveEnd handler: Updates React state strictly after pan/drag finishes
  const handleMoveEnd = useCallback((coords: { lat: number; lng: number }) => {
    setPinLat(Number(coords.lat.toFixed(6)));
    setPinLng(Number(coords.lng.toFixed(6)));
  }, []);

  // Quick reset pin back to initial GPS accuracy circle center
  const handleResetToCenter = useCallback(() => {
    if (baseLat !== null && baseLng !== null) {
      setPinLat(baseLat);
      setPinLng(baseLng);
    }
  }, [baseLat, baseLng]);

  // Confirm Pin & Continue to Step 4: Metadata & Security
  const handleConfirmPin = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setEntranceCoordinates(pinLat, pinLng);
    setDigipin(refinedDigipin);
    useAddressStore.getState().setCurrentStep(4);
    setStep(4);
    router.push('/create/metadata');
  };

  // Wait momentarily for Zustand storage rehydration to finish
  if (!hasHydrated) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] flex-1 flex-col items-center justify-center font-sans">
        <div className="border-accent mb-2 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-muted-foreground font-sans text-xs font-medium">
          Restoring address draft...
        </span>
      </div>
    );
  }

  if (baseLat === null || baseLng === null) {
    return null;
  }

  // ─── MILESTONE 1: OPT-IN MINIMAL PREVIEW UI (WHEN MAP IS NOT EXPANDED) ────
  if (!showMap) {
    return (
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col justify-between overflow-y-auto font-sans sm:max-w-lg">
        {/* Top Content Card */}
        <div className="space-y-4 pt-1">
          {/* Header prompt banner */}
          <div className="bg-card rounded-sm border border-zinc-200 p-4 shadow-2xs sm:p-5 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="border-accent/20 bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border">
                <MapPin className="h-5 w-5 fill-current" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                  Base Location Captured
                </h3>
                <p className="font-sans text-xs text-slate-600 dark:text-zinc-400">
                  Your micro-address is currently locked to your GPS fix.
                </p>
              </div>
            </div>

            {/* Readout Pill */}
            <div className="mt-4 rounded-sm border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="block font-sans text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                Active DIGIPIN
              </span>
              <p className="pt-0.5 font-mono text-xl font-black tracking-widest text-zinc-900 sm:text-2xl dark:text-zinc-100">
                {refinedDigipin}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-zinc-200/60 pt-2 font-mono text-[11px] text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                <span>
                  {pinLat.toFixed(6)}° N, {pinLng.toFixed(6)}° E
                </span>
                <span className="rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {distanceOffset === 0
                    ? 'Accuracy Center'
                    : `Offset: ${distanceOffset}m`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Map Opt-In Prompt */}
          <div className="bg-card rounded-sm border border-zinc-200 p-4 shadow-2xs sm:p-5 dark:border-zinc-800">
            <h4 className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Need exact doorway precision?
            </h4>
            <p className="mt-1 font-sans text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              Adjust the pin manually to help couriers find your exact entrance.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowMap(true)}
                id="open-interactive-map-btn"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-zinc-300 bg-white py-3 font-sans text-xs font-semibold text-zinc-900 shadow-2xs transition-all hover:bg-zinc-50 active:scale-[0.98] sm:text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <Crosshair className="text-accent h-4 w-4" />
                <span>Adjust on Interactive Map (Optional)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Group */}
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={handleConfirmPin}
            disabled={isNavigating}
            id="confirm-entrance-pin-btn"
            className="bg-accent text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm font-sans text-sm font-bold shadow-xs transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
          >
            {isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 fill-current" />
                <span>Confirm Entrance Pin</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── MILESTONE 2: FULL-BLEED ZERO-LAG MAP WITH FIXED CENTER PIN ───────────
  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col gap-2.5 overflow-hidden font-sans select-none">
      {/* ─── 1. FULL-BLEED MAP WRAPPER WITH FIXED CENTER PIN ───────────────── */}
      <div className="border-border relative min-h-0 w-full flex-1 overflow-hidden rounded-sm border bg-zinc-100 shadow-xs dark:bg-zinc-900">
        <DynamicMapplsMap
          center={[pinLat, pinLng]}
          zoom={17}
          minZoom={12}
          maxZoom={19}
          interactive={true}
          pitchWithGestures={false}
          dragRotate={false}
          touchPitch={false}
          onMoveEnd={handleMoveEnd}
          accuracyCircle={{
            center: [baseLat, baseLng],
            radius: 25,
            fillColor: 'rgba(59, 130, 246, 0.2)',
            fillOpacity: 0.2,
            strokeColor: '#2563eb',
          }}
          className="h-full w-full"
        />

        {/* Zero-Lag Fixed Center Pin Overlay */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex -translate-y-1/2 flex-col items-center">
            {/* Entrance Pin Head & Tip */}
            <div className="relative flex items-center justify-center">
              <div className="bg-accent text-accent-foreground flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-4 ring-white/95 dark:ring-zinc-900/95">
                <MapPin className="h-5 w-5 fill-current" />
              </div>
              <div className="bg-accent absolute -bottom-1 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900" />
            </div>
            {/* Label */}
            <span className="mt-1.5 rounded-sm bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
              ENTRANCE PIN
            </span>
          </div>
        </div>

        {/* Floating Instruction Pill at Top */}
        <div className="pointer-events-none absolute top-3 right-0 left-0 z-20 flex justify-center px-4">
          <div className="bg-card/95 border-border text-foreground pointer-events-auto flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md">
            <Crosshair className="text-accent h-3.5 w-3.5" />
            <span className="font-sans">
              Pan map to align your doorway with center pin
            </span>
          </div>
        </div>

        {/* Top-Right Action Controls (Reset & Back to Overview) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {distanceOffset > 0 && (
            <button
              type="button"
              onClick={handleResetToCenter}
              title="Reset entrance pin to base GPS location"
              className="bg-card/90 border-border text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded-sm border px-2.5 py-1 font-sans text-[11px] font-semibold shadow-xs backdrop-blur-xs transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMap(false)}
            title="Return to base overview"
            className="bg-card/90 border-border text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded-sm border px-2.5 py-1 font-sans text-[11px] font-semibold shadow-xs backdrop-blur-xs transition-colors"
          >
            <span>Overview</span>
          </button>
        </div>
      </div>

      {/* ─── 2. FLOATING BOTTOM-SHEET METRIC CARD ──────────────────────────── */}
      <div className="z-30 shrink-0 space-y-3 rounded-sm border border-zinc-200 bg-white/95 p-3.5 font-sans shadow-xl backdrop-blur-md sm:p-4 dark:border-zinc-800 dark:bg-zinc-950/95">
        {/* Card Header & Distance Offset Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-accent h-2.5 w-2.5 animate-pulse rounded-full" />
            <span className="text-foreground font-sans text-xs font-bold tracking-wider uppercase">
              Doorway DIGIPIN Refinement
            </span>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold transition-colors ${
              distanceOffset === 0
                ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                : 'bg-accent/10 text-accent border-accent/25 border'
            }`}
          >
            {distanceOffset === 0
              ? 'Accuracy Center (0m)'
              : `Refined by ${distanceOffset}m`}
          </span>
        </div>

        {/* Live DIGIPIN & Coordinates Readout */}
        <div className="flex items-center justify-between rounded-sm border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-0.5">
            <span className="text-muted-foreground font-sans text-[10px] font-medium tracking-wider uppercase">
              Refined DIGIPIN
            </span>
            <p className="text-foreground pt-0.5 font-mono text-xl leading-none font-black tracking-widest sm:text-2xl">
              {refinedDigipin}
            </p>
          </div>

          <div className="text-right">
            <span className="text-muted-foreground block font-mono text-[10px] uppercase">
              {pinLat.toFixed(6)}° N
            </span>
            <span className="text-muted-foreground block font-mono text-[10px]">
              {pinLng.toFixed(6)}° E
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={handleConfirmPin}
          disabled={isNavigating}
          id="confirm-entrance-pin-btn"
          className="bg-accent text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm font-sans text-sm font-bold shadow-xs transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
        >
          {isNavigating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 fill-current" />
              <span>Confirm Entrance Pin</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
