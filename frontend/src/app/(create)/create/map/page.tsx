'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Crosshair,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
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

  const setEntranceCoordinates = useAddressStore((state) => state.setEntranceCoordinates);
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
    (prevSourceCoords.lat !== currentSourceLat || prevSourceCoords.lng !== currentSourceLng)
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
  const handlePinChange = useCallback((coords: { lat: number; lng: number }) => {
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground font-sans">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs font-medium text-muted-foreground font-sans">Restoring address draft...</span>
      </div>
    );
  }

  if (baseLat === null || baseLng === null) {
    return null;
  }

  return (
    <div className="relative flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden font-sans select-none gap-2.5">
      {/* ─── 1. FULL-BLEED DYNAMICALLY STRETCHED MAP WRAPPER ───────────────── */}
      <div className="relative flex-1 w-full min-h-0 rounded-xl overflow-hidden border border-border shadow-xs bg-zinc-100 dark:bg-zinc-900">
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
          className="w-full h-full"
        />

        {/* Floating Instruction Pill at Top */}
        <div className="absolute top-3 left-0 right-0 flex justify-center z-20 px-4 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-md border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-foreground shadow-sm flex items-center gap-2 pointer-events-auto">
            <Crosshair className="w-3.5 h-3.5 text-accent" />
            <span className="font-sans">Tap anywhere or drag pin to your entrance</span>
          </div>
        </div>

        {/* Quick Reset to GPS Circle Center Button */}
        {distanceOffset > 0 && (
          <button
            type="button"
            onClick={handleResetToCenter}
            className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-card/90 backdrop-blur-xs border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground rounded-md shadow-xs transition-colors cursor-pointer font-sans flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Center</span>
          </button>
        )}
      </div>

      {/* ─── 2. FLOATING BOTTOM-SHEET METRIC CARD (FIXED HEIGHT, ZERO GAP) ──── */}
      <div className="shrink-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-3 font-sans">
        {/* Card Header & Distance Offset Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider font-sans">
              Doorway DIGIPIN Refinement
            </span>
          </div>

          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full font-sans transition-colors ${
              distanceOffset === 0
                ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                : 'bg-accent/10 text-accent border border-accent/25'
            }`}
          >
            {distanceOffset === 0 ? 'Accuracy Center (0m)' : `Refined by ${distanceOffset}m`}
          </span>
        </div>

        {/* Live DIGIPIN & Coordinates Readout */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-medium">
              Refined DIGIPIN
            </span>
            <p className="font-mono text-xl sm:text-2xl font-black text-foreground tracking-widest leading-none pt-0.5">
              {refinedDigipin}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block">
              {pinLat.toFixed(6)}° N
            </span>
            <span className="text-[10px] font-mono text-muted-foreground block">
              {pinLng.toFixed(6)}° E
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={handleConfirmPin}
          id="confirm-entrance-pin-btn"
          className="w-full h-11 sm:h-12 bg-accent text-accent-foreground font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-xs hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer font-sans"
        >
          <MapPin className="w-4 h-4 fill-current" />
          <span>Confirm Entrance Pin</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
