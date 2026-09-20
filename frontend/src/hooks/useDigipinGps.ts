'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  encode,
  formatDigipin,
  isWithinIndiaBounds,
} from '@/lib/digipin';
import { useAddressStore } from '@/store/useAddressStore';

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export interface UseDigipinGpsOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoDetectOnMount?: boolean;
  jitterThresholdMeters?: number; // Distance in meters required to trigger state update (default 2.5m)
}

export interface UseDigipinGpsReturn {
  coords: GpsCoordinates | null;
  digipin: string | null;
  formattedDigipin: string | null;
  accuracy: number | null;
  isAcquiring: boolean;
  error: string | null;
  isOutOfBounds: boolean;
  isTimedOut: boolean;
  refreshLocation: () => void;
}

/**
 * Calculates great-circle distance between two points in meters (Haversine formula).
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook for satellite GPS auto-detection with jitter stabilization and out-of-bounds protection.
 *
 * Prevents 10-character code flickering:
 * - Employs a 2.5m jitter dampener so small GPS satellite noise doesn't shift the code.
 * - Prioritizes updates when signal accuracy improves by ≥ 5 meters.
 * - Gracefully flags out-of-bounds coordinates without throwing uncaught errors.
 */
export function useDigipinGps({
  enableHighAccuracy = true,
  timeout = 12000,
  maximumAge = 2000,
  autoDetectOnMount = false,
  jitterThresholdMeters = 2.5,
}: UseDigipinGpsOptions = {}): UseDigipinGpsReturn {
  const [coords, setCoords] = useState<GpsCoordinates | null>(null);
  const [digipin, setDigipin] = useState<string | null>(null);
  const [formattedDigipin, setFormattedDigipin] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isAcquiring, setIsAcquiring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOutOfBounds, setIsOutOfBounds] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  const lastFixRef = useRef<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);

  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutTimer = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const processPosition = useCallback(
    (position: GeolocationPosition) => {
      clearTimeoutTimer();
      setIsTimedOut(false);

      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;
      const newAccuracy = position.coords.accuracy;

      // Jitter Stabilization Filter:
      // If we already have a fix, only update if the user physically moved > threshold OR accuracy improved
      if (lastFixRef.current) {
        const deltaMeters = calculateDistanceMeters(
          lastFixRef.current.lat,
          lastFixRef.current.lng,
          newLat,
          newLng
        );

        const accuracyImproved = newAccuracy < lastFixRef.current.accuracy - 5;
        const physicallyMoved = deltaMeters >= jitterThresholdMeters;

        if (!physicallyMoved && !accuracyImproved) {
          // GPS satellite jitter detected: dampening update to preserve UI stability
          setIsAcquiring(false);
          return;
        }
      }

      // Record stabilized fix
      lastFixRef.current = {
        lat: newLat,
        lng: newLng,
        accuracy: newAccuracy,
      };

      setCoords({ lat: newLat, lng: newLng });
      setAccuracy(newAccuracy);

      // Validate regional bounds (India Post spatial boundaries)
      if (!isWithinIndiaBounds(newLat, newLng)) {
        setIsOutOfBounds(true);
        setError('Location outside supported region (India only)');
        setIsAcquiring(false);
        return;
      }

      // Compute 10-character DIGIPIN via pure math engine
      try {
        const code = encode(newLat, newLng);
        const formatted = formatDigipin(code);

        setDigipin(code);
        setFormattedDigipin(formatted);
        setIsOutOfBounds(false);
        setError(null);

        // Sync to address store via proper actions — ensures baseLat/baseLng mirror fields are updated
        const store = useAddressStore.getState();
        store.setCoordinates(newLat, newLng);
        store.setDigipin(formatted);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to encode DIGIPIN');
      } finally {
        setIsAcquiring(false);
      }
    },
    [jitterThresholdMeters, clearTimeoutTimer]
  );

  const timeoutSeconds = Math.round(timeout / 1000);

  const handlePositionError = useCallback(
    (geoError: GeolocationPositionError) => {
      clearTimeoutTimer();
      setIsAcquiring(false);

      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setIsTimedOut(false);
          setError('Location permission denied. Please allow GPS access in browser settings or enter DIGIPIN manually.');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setIsTimedOut(false);
          setError('Location information is unavailable from device satellites. Stand in an open area or enter DIGIPIN manually.');
          break;
        case geoError.TIMEOUT:
          setIsTimedOut(true);
          setError(`GPS satellite lock timed out (${timeoutSeconds} seconds). Satellite signals may be weak indoors. Stand near a window or enter DIGIPIN manually.`);
          break;
        default:
          setIsTimedOut(false);
          setError('An unexpected error occurred while detecting location. You can enter DIGIPIN manually.');
          break;
      }
    },
    [clearTimeoutTimer, timeoutSeconds]
  );

  const refreshLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    clearTimeoutTimer();
    setIsAcquiring(true);
    setError(null);
    setIsTimedOut(false);

    // Strict JavaScript safety timeout: guarantees UI never hangs indefinitely even if browser API blocks
    timeoutTimerRef.current = setTimeout(() => {
      setIsAcquiring(false);
      setIsTimedOut(true);
      setError(`GPS satellite lock timed out (${timeoutSeconds} seconds). Satellite signals may be weak indoors. Stand near a window or enter DIGIPIN manually.`);
    }, timeout + 300);

    navigator.geolocation.getCurrentPosition(processPosition, handlePositionError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, processPosition, handlePositionError, clearTimeoutTimer, timeoutSeconds]);

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (autoDetectOnMount) {
      timerId = setTimeout(() => {
        refreshLocation();
      }, 0);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      clearTimeoutTimer();
    };
  }, [autoDetectOnMount, refreshLocation, clearTimeoutTimer]);

  return {
    coords,
    digipin,
    formattedDigipin,
    accuracy,
    isAcquiring,
    error,
    isOutOfBounds,
    isTimedOut,
    refreshLocation,
  };
}
