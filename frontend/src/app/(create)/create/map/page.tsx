'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Crosshair, ArrowRight, RotateCcw } from 'lucide-react';
import { useAddressStore, useHasHydrated } from '@/store/useAddressStore';
import { MapplsMap } from '@/components/ui/MapplsMap';
import { encode, formatDigipin } from '@/lib/digipin';

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
 * /create/map: Step 3 - Entrance Pin Placement
 *
 * Implements the official India Post DIGIPIN portal UX:
 * 1. Clean Map Initialization: Centered on Step 1 GPS base coordinates.
 * 2. Accuracy Circle: Semi-transparent blue circle (mappls.Circle) representing GPS accuracy zone.
 * 3. Interactive Saffron Entrance Pin: Draggable marker with dragend and click-to-snap map event.
 * 4. Real-Time Recalculation: Immediate 3-3-4 DIGIPIN and Haversine distance offset readout.
 * 5. Confirm & Save: Updates useAddressStore with entrance coordinates and routes to Step 4.
 */
export default function CreateMapPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();

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

  // Initial pin coordinates: use saved entrance pin or center of accuracy circle
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

  // 2. Real-Time DIGIPIN Recalculation on pin movement (Click or Drag)
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

  // Handle position change from either dragging marker or clicking anywhere on map
  const handlePinChange = useCallback(
    (coords: { lat: number; lng: number }) => {
      setPinLat(Number(coords.lat.toFixed(6)));
      setPinLng(Number(coords.lng.toFixed(6)));
    },
    []
  );

  // Quick reset pin back to initial GPS accuracy circle center
  const handleResetToCenter = useCallback(() => {
    if (baseLat !== null && baseLng !== null) {
      setPinLat(baseLat);
      setPinLng(baseLng);
    }
  }, [baseLat, baseLng]);

  // 4. Confirm Pin & Continue to Step 4: Metadata & Security
  const handleConfirmPin = () => {
    // Preserve Base GPS coordinates independently and save entrance pin coordinates
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

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col gap-2.5 overflow-hidden font-sans select-none">
      {/* ─── 1. FULL-BLEED DYNAMICALLY STRETCHED MAP WRAPPER ───────────────── */}
      <div className="border-border relative min-h-0 w-full flex-1 overflow-hidden rounded-xl border bg-zinc-100 shadow-xs dark:bg-zinc-900">
        <MapplsMap
          center={[baseLat, baseLng]}
          zoom={16}
          interactive={true}
          onMapClick={handlePinChange}
          accuracyCircle={{
            center: [baseLat, baseLng],
            radius: 25,
            fillColor: '#3b82f6',
            fillOpacity: 0.18,
            strokeColor: '#2563eb',
          }}
          draggableMarker={{
            position: [pinLat, pinLng],
            onPositionChange: handlePinChange,
            title: 'ENTRANCE PIN',
          }}
          className="h-full w-full"
        />

        {/* Floating Instruction Pill at Top */}
        <div className="pointer-events-none absolute top-3 right-0 left-0 z-20 flex justify-center px-4">
          <div className="bg-card/95 border-border text-foreground pointer-events-auto flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md">
            <Crosshair className="text-accent h-3.5 w-3.5" />
            <span className="font-sans">
              Tap anywhere or drag pin to your entrance
            </span>
          </div>
        </div>

        {/* Quick Reset to GPS Circle Center Button */}
        {distanceOffset > 0 && (
          <button
            type="button"
            onClick={handleResetToCenter}
            className="bg-card/90 border-border text-muted-foreground hover:text-foreground absolute top-3 right-3 z-20 flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 font-sans text-[11px] font-semibold shadow-xs backdrop-blur-xs transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset to Center</span>
          </button>
        )}
      </div>

      {/* ─── 2. FLOATING BOTTOM-SHEET METRIC CARD (FIXED HEIGHT, ZERO GAP) ──── */}
      <div className="z-30 shrink-0 space-y-3 rounded-xl border border-zinc-200 bg-white/95 p-3.5 font-sans shadow-xl backdrop-blur-md sm:p-4 dark:border-zinc-800 dark:bg-zinc-950/95">
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
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
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
          id="confirm-entrance-pin-btn"
          className="bg-accent text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-sans text-sm font-bold shadow-xs transition-all hover:opacity-95 active:scale-[0.98] sm:h-12 sm:text-base"
        >
          <MapPin className="h-4 w-4 fill-current" />
          <span>Confirm Entrance Pin</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
