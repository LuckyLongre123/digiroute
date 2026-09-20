'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const RecipientMapplsMap = dynamic(
  () => import('@/components/ui/RecipientMapplsMap'),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-full w-full animate-pulse items-center justify-center bg-slate-200 dark:bg-zinc-800">
        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-zinc-500">
          <div className="border-accent mb-3 h-8 w-8 animate-spin rounded-full border-3 border-t-transparent shadow-sm" />
          <span className="font-mono text-[11px] tracking-wider uppercase opacity-60">
            Initializing Map &amp; GPS
          </span>
        </div>
      </div>
    ),
  }
);
import { useAddressStore } from '@/store/useAddressStore';
import {
  Building2,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Lock,
  LockOpen,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { cleanDigipin, isValid, decode, formatDigipin } from '@/lib/digipin';
import { verifyAddressPasscode } from '@/app/actions/verifyPasscode';

interface MapplsRouteData {
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Safely parses raw distance into meters.
 * Handles numbers (meters), formatted strings ("21.2 km", "500 m"),
 * and unitless floats in km.
 */
function parseDistanceMeters(raw: unknown): number {
  if (raw === undefined || raw === null) return 0;

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (s.includes('km')) {
      const num = parseFloat(s.replace(/,/g, ''));
      return isNaN(num) ? 0 : Math.round(num * 1000);
    }
    if (s.includes('m')) {
      const num = parseFloat(s.replace(/,/g, ''));
      return isNaN(num) ? 0 : Math.round(num);
    }
    const num = parseFloat(s.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }

  if (typeof raw === 'number') {
    return raw;
  }

  return 0;
}

/**
 * Deep search helper for route duration across various Mappls / MapmyIndia payload shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findDurationInObject(obj: any): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  const direct =
    obj.duration ??
    obj.duration_text ??
    obj.durationText ??
    obj.time ??
    obj.time_text ??
    obj.timeText ??
    obj.travel_time ??
    obj.travelTime ??
    obj.eta;
  if (
    direct !== undefined &&
    direct !== null &&
    direct !== 0 &&
    direct !== ''
  ) {
    return direct;
  }

  if (obj.summary && typeof obj.summary === 'object') {
    const s =
      obj.summary.duration ??
      obj.summary.duration_text ??
      obj.summary.durationText ??
      obj.summary.time ??
      obj.summary.time_text ??
      obj.summary.timeText;
    if (s !== undefined && s !== null && s !== 0 && s !== '') {
      return s;
    }
  }

  if (Array.isArray(obj.legs) && obj.legs.length > 0) {
    for (const leg of obj.legs) {
      const legDur =
        leg.duration ??
        leg.duration_text ??
        leg.durationText ??
        leg.time ??
        leg.time_text ??
        leg.timeText;
      if (
        legDur !== undefined &&
        legDur !== null &&
        legDur !== 0 &&
        legDur !== ''
      ) {
        return legDur;
      }
    }
  }

  return undefined;
}

/**
 * Deep search helper for route distance across various Mappls / MapmyIndia payload shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findDistanceInObject(obj: any): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  const direct =
    obj.distance ??
    obj.distance_text ??
    obj.distanceText ??
    obj.length ??
    obj.length_text ??
    obj.lengthText;
  if (
    direct !== undefined &&
    direct !== null &&
    direct !== 0 &&
    direct !== ''
  ) {
    return direct;
  }

  if (obj.summary && typeof obj.summary === 'object') {
    const s =
      obj.summary.distance ??
      obj.summary.distance_text ??
      obj.summary.distanceText ??
      obj.summary.length ??
      obj.summary.length_text;
    if (s !== undefined && s !== null && s !== 0 && s !== '') {
      return s;
    }
  }

  if (Array.isArray(obj.legs) && obj.legs.length > 0) {
    for (const leg of obj.legs) {
      const legDist =
        leg.distance ??
        leg.distance_text ??
        leg.distanceText ??
        leg.length ??
        leg.length_text;
      if (
        legDist !== undefined &&
        legDist !== null &&
        legDist !== 0 &&
        legDist !== ''
      ) {
        return legDist;
      }
    }
  }

  return undefined;
}

/**
 * Safely parses raw duration into seconds.
 * Handles numbers (seconds or minutes), formatted strings ("31 min", "1 hr 15 min", "45 sec").
 * If duration is missing or <= 60 for driving distance (>= 500m), calculates realistic duration.
 */
function parseDurationSeconds(raw: unknown, distanceMeters?: number): number {
  if (raw !== undefined && raw !== null) {
    if (typeof raw === 'string') {
      const s = raw.trim().toLowerCase();
      const hrMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours|h)/);
      const minMatch = s.match(
        /(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|m)(?!.*(?:hr|hrs|hour|hours|h))/
      );
      const secMatch = s.match(
        /(\d+(?:\.\d+)?)\s*(?:sec|secs|second|seconds|s)/
      );

      if (hrMatch || minMatch || secMatch) {
        const hours = hrMatch ? parseFloat(hrMatch[1]) : 0;
        const mins = minMatch ? parseFloat(minMatch[1]) : 0;
        const secs = secMatch ? parseFloat(secMatch[1]) : 0;
        const calculated = Math.round(hours * 3600 + mins * 60 + secs);
        if (calculated > 0) return calculated;
      }

      const num = parseFloat(s.replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        raw = num;
      }
    }

    if (typeof raw === 'number' && raw > 0) {
      // If duration is <= 180 and distance is >= 500m, duration was reported in minutes (e.g. 31 min as 31)
      if (distanceMeters && distanceMeters >= 500 && raw <= 180) {
        return Math.round(raw * 60);
      }
      return Math.round(raw);
    }
  }

  // Fallback: If duration is missing or invalid, calculate realistic duration from distance
  if (distanceMeters && distanceMeters > 0) {
    const isWalk = distanceMeters < 500;
    // Walking: 1.3 m/s (~4.7 km/h), Driving: 11.1 m/s (~40 km/h)
    return Math.round(distanceMeters / (isWalk ? 1.3 : 11.1));
  }

  return 0;
}

/**
 * Dynamic Distance Formatting:
 * If >= 1000 meters: Convert to kilometers (distance / 1000).toFixed(1) and append "km".
 * If < 1000 meters: Round to nearest whole number and append "m".
 */
function formatRoutingDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Dynamic Duration / ETA Formatting:
 * If < 60 seconds: "1 min"
 * If < 3600 seconds (1 hour): Math.round(duration / 60) + " min"
 * If >= 3600 seconds: Format into hours and minutes (e.g., "1 hr 15 min" or "1 hr")
 */
function formatRoutingDuration(seconds: number): string {
  if (seconds < 60) {
    return '1 min';
  }
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    if (mins < 60) {
      return `${mins} min`;
    }
    return '1 hr';
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Safely extracts route distance (meters) and duration (seconds) from Mappls Direction callback data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMapplsRouteData(data: any): MapplsRouteData | null {
  if (!data) return null;

  const route =
    data.routes?.[0] ||
    data.data?.routes?.[0] ||
    data.response?.routes?.[0] ||
    data.results?.routes?.[0] ||
    data.rtn?.routes?.[0] ||
    data.trips?.[0] ||
    data.data?.trips?.[0] ||
    (Array.isArray(data) ? data[0] : null) ||
    (Array.isArray(data?.data) ? data.data[0] : null) ||
    data;

  // Search across multiple candidate containers
  const rawDist =
    findDistanceInObject(route) ??
    findDistanceInObject(data) ??
    findDistanceInObject(data?.results) ??
    findDistanceInObject(data?.data);

  const rawDur =
    findDurationInObject(route) ??
    findDurationInObject(data) ??
    findDurationInObject(data?.results) ??
    findDurationInObject(data?.data);

  if (rawDist === undefined || rawDist === null) return null;

  let distanceMeters = parseDistanceMeters(rawDist);
  if (isNaN(distanceMeters) || distanceMeters <= 0) return null;

  // If distance was parsed as a small number (< 100) while raw duration indicates a trip > 3 mins,
  // rawDist was a unitless float representing kilometers (e.g. 21.2)
  const rawDurSeconds = parseDurationSeconds(rawDur);
  if (distanceMeters < 100 && rawDurSeconds > 180) {
    distanceMeters = Math.round(distanceMeters * 1000);
  }

  let durationSeconds = parseDurationSeconds(rawDur, distanceMeters);

  // Guard against impossible speeds: A trip >= 500m cannot take <= 60s
  if (distanceMeters >= 500 && durationSeconds <= 60) {
    durationSeconds = Math.round(distanceMeters / 11.1);
  }

  return {
    distanceMeters,
    durationSeconds,
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface AddressData {
  id?: string;
  slug: string;
  digipin: string;
  baseLat: number;
  baseLng: number;
  entranceLat: number;
  entranceLng: number;
  location?: { lat: number; lng: number };
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  label?: string | null;
  routingNotes?: string | null;
  doorwayPhotoUrl?: string | null;
  passcode?: string | null;
  hasPasscode?: boolean;
  isLocked?: boolean;
  isEphemeral?: boolean;
  expiresAt?: string | null;
  isRawDigipin?: boolean;
}

/**
 * Haversine formula to calculate aerial distance in meters between two coordinates.
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * /a/[slug]: Recipient View (ROUTE-09)
 *
 * Architecture:
 * 1. Strict Database 404: If slug does not exist, immediately renders 404 Not Found.
 *    Zero mock or random fallback data generators.
 * 2. Live GPS Viewer Location: Requests viewer's actual coordinates via navigator.geolocation.
 *    Plots route from real viewer GPS to doorway entrance pin.
 *    If access is denied, centers strictly on destination pin with no route.
 * 3. Collapsible Bottom Sheet UI: Drag handle pill to toggle between expanded details
 *    and a compact summary bar, freeing up full map visibility.
 * 4. Isolated Mappls Map & Directions Plugin integration.
 */
export default function RecipientPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const addOrUpdateViewer = useAddressStore((state) => state.addOrUpdateViewer);

  // Address Loading State
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Viewer Real-Time GPS Location & Permission State
  const [viewerLocation, setViewerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Mappls Dynamic Route Data
  const [mapplsRouteData, setMapplsRouteData] =
    useState<MapplsRouteData | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRouteCalculated = useCallback((data: any) => {
    const extracted = extractMapplsRouteData(data);
    if (extracted) {
      setMapplsRouteData(extracted);
    }
  }, []);

  const handleRouteError = useCallback(() => {
    setMapplsRouteData(null);
  }, []);

  // Collapsible Bottom Sheet & Fullscreen Map State
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Proximity & Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Security Interstitial State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isExitingInterstitial, setIsExitingInterstitial] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);

  // 1. Dual Lookup Strategy: Fetch slug from database with raw DIGIPIN fallback
  useEffect(() => {
    async function loadAddress() {
      setIsLoading(true);
      setIsNotFound(false);
      setIsExpired(false);

      // On-the-Fly Decoding: Fallback to raw DIGIPIN if slug matches standard 10-char format
      const tryRawDigipinFallback = (): boolean => {
        try {
          const clean = cleanDigipin(slug);
          if (clean.length === 10 && isValid(clean)) {
            const decoded = decode(clean);
            const formatted = formatDigipin(clean);
            const rawAddr: AddressData = {
              id: slug,
              slug: slug,
              digipin: formatted,
              baseLat: decoded.center.lat,
              baseLng: decoded.center.lng,
              entranceLat: decoded.center.lat,
              entranceLng: decoded.center.lng,
              location: {
                lat: decoded.center.lat,
                lng: decoded.center.lng,
              },
              floor: null,
              flat: null,
              landmark: null,
              label: null,
              routingNotes: null,
              doorwayPhotoUrl: null,
              passcode: null,
              isEphemeral: false,
              expiresAt: null,
              isRawDigipin: true,
            };
            setAddressData(rawAddr);
            setPhotoUrl(null);
            setIsUnlocked(true);
            setIsLoading(false);
            return true;
          }
        } catch (e) {
          console.warn('[Recipient] Raw DIGIPIN decode attempt failed:', e);
        }
        return false;
      };

      try {
        const res = await fetch(`/api/address/${slug}`);

        if (res.status === 410) {
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        if (res.status === 404 || !res.ok) {
          if (tryRawDigipinFallback()) return;
          setIsNotFound(true);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        if (!data?.address) {
          if (tryRawDigipinFallback()) return;
          setIsNotFound(true);
          setIsLoading(false);
          return;
        }

        const addr: AddressData = data.address;
        setAddressData(addr);
        if (addr.doorwayPhotoUrl) {
          setPhotoUrl(addr.doorwayPhotoUrl);
        }

        // Check if passcode is required
        if (!addr.hasPasscode && !addr.passcode && !addr.isLocked) {
          setIsUnlocked(true);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(
          '[Recipient] Failed to load address record, testing raw DIGIPIN fallback:',
          err
        );
        if (tryRawDigipinFallback()) return;
        setIsNotFound(true);
        setIsLoading(false);
      }
    }

    loadAddress();
  }, [slug]);

  // 2. Request Viewer's Actual GPS Location with Strict Permission Handling
  const gpsRequestedRef = useRef(false);

  const requestGeolocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setViewerLocation(null);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsPermissionDenied(false);
        setViewerLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn(
          '[Geolocation] Viewer location access error:',
          err.code,
          err.message
        );
        if (err.code === 1 || err.code === err.PERMISSION_DENIED) {
          setIsPermissionDenied(true);
        }
        setViewerLocation(null);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (gpsRequestedRef.current) return;
    gpsRequestedRef.current = true;

    // Direct permission status inspection if Permissions API is available
    if (
      typeof navigator !== 'undefined' &&
      'permissions' in navigator &&
      navigator.permissions?.query
    ) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setIsPermissionDenied(true);
            setIsLocating(false);
            setViewerLocation(null);
          } else {
            setTimeout(requestGeolocation, 0);
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'denied') {
              setIsPermissionDenied(true);
              setIsLocating(false);
              setViewerLocation(null);
            } else if (permissionStatus.state === 'granted') {
              setIsPermissionDenied(false);
              setIsLocating(true);
              requestGeolocation();
            }
          };
        })
        .catch(() => {
          setTimeout(requestGeolocation, 0);
        });
    } else {
      setTimeout(requestGeolocation, 0);
    }
  }, [requestGeolocation]);

  // Early Return: 410 Expired (only evaluated once fetch completes)
  if (!isLoading && isExpired) {
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4 text-center font-sans">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-xs">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="text-foreground mb-1 text-xl font-bold">
          Micro-Address Expired
        </h1>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
          This temporary guest address has expired. Please contact the resident
          for an updated link.
        </p>
        <Link
          href="/create"
          className="bg-primary text-primary-foreground cursor-pointer rounded-[4px] px-4 py-2.5 text-sm font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Create New Micro-Address
        </Link>
      </div>
    );
  }

  // Early Return: Strict 404 Not Found (only evaluated once fetch completes)
  if (!isLoading && (isNotFound || !addressData)) {
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4 text-center font-sans">
        <div className="border-border mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-zinc-100 text-zinc-600 shadow-xs dark:bg-zinc-800 dark:text-zinc-300">
          <MapPin className="h-6 w-6 text-zinc-500" />
        </div>
        <h1 className="text-foreground mb-1 text-xl font-bold">
          Micro-Address Not Found
        </h1>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
          The sovereign micro-address link you requested does not exist or may
          have been typed incorrectly.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground cursor-pointer rounded-[4px] px-4 py-2.5 text-sm font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  // Strictly Resolved Database Attributes (Safe during progressive load)
  const code = addressData?.digipin ?? '';
  const destLat =
    addressData?.location?.lat ??
    addressData?.entranceLat ??
    addressData?.baseLat ??
    0;
  const destLng =
    addressData?.location?.lng ??
    addressData?.entranceLng ??
    addressData?.baseLng ??
    0;
  const floor = addressData?.floor?.trim() || '';
  const flat = addressData?.flat?.trim() || '';
  const hints =
    addressData?.routingNotes?.trim() || addressData?.landmark?.trim() || '';
  const hasZAxisData = Boolean(
    !addressData?.isRawDigipin && (floor || flat || hints)
  );

  // Distance computation from real viewer GPS (straight-line Haversine fallback)
  let distanceMeters: number | null = null;
  if (viewerLocation && destLat && destLng) {
    distanceMeters = calculateDistanceMeters(
      viewerLocation.lat,
      viewerLocation.lng,
      destLat,
      destLng
    );
  }

  const effectiveMapplsRouteData = viewerLocation ? mapplsRouteData : null;

  // Priority to Mappls routing engine, fallback to straight-line Haversine
  const distanceText =
    effectiveMapplsRouteData !== null
      ? formatRoutingDistance(effectiveMapplsRouteData.distanceMeters)
      : distanceMeters !== null
        ? formatRoutingDistance(distanceMeters)
        : 'Destination Pin Locked';

  const effectiveDistance =
    effectiveMapplsRouteData !== null
      ? effectiveMapplsRouteData.distanceMeters
      : distanceMeters;

  const isWalkingDistance =
    effectiveDistance !== null && effectiveDistance < 500;
  const travelModeLabel = isWalkingDistance ? 'walk' : 'drive';

  // Determine realistic duration in seconds
  let effectiveDurationSeconds: number | null = null;
  if (
    effectiveMapplsRouteData !== null &&
    effectiveMapplsRouteData.durationSeconds > 60
  ) {
    effectiveDurationSeconds = effectiveMapplsRouteData.durationSeconds;
  } else if (effectiveDistance !== null && effectiveDistance > 0) {
    // Realistic travel duration: Walking: 1.3 m/s (~4.7 km/h), Driving: 11.1 m/s (~40 km/h)
    effectiveDurationSeconds = Math.round(
      effectiveDistance / (isWalkingDistance ? 1.3 : 11.1)
    );
  }

  const etaText =
    effectiveDurationSeconds !== null
      ? `• ~${formatRoutingDuration(effectiveDurationSeconds)} ${travelModeLabel}`
      : '• Viewer GPS not shared';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addressData?.hasPasscode || addressData?.passcode) {
      if (!passcode.trim()) {
        setAuthError('Please enter the resident passcode.');
        return;
      }

      setIsVerifyingPasscode(true);
      try {
        const verifyRes = await verifyAddressPasscode(slug, passcode);
        if (!verifyRes.success) {
          if (verifyRes.isExpired) {
            setIsExpired(true);
            setIsVerifyingPasscode(false);
            return;
          }
          setAuthError(
            verifyRes.error || 'Incorrect passcode. Please try again.'
          );
          setIsVerifyingPasscode(false);
          return;
        }

        // Successfully authorized: merge decrypted doorway and entrance details
        if (verifyRes.address) {
          setAddressData((prev) => ({
            ...prev!,
            ...verifyRes.address,
            isLocked: false,
          }));
          if (verifyRes.address.doorwayPhotoUrl) {
            setPhotoUrl(verifyRes.address.doorwayPhotoUrl);
          }
        }
      } catch {
        setAuthError('Failed to verify passcode. Please try again.');
        setIsVerifyingPasscode(false);
        return;
      }
      setIsVerifyingPasscode(false);
    }

    setAuthError('');

    if (viewerLocation) {
      const effectiveDist =
        mapplsRouteData !== null
          ? Math.round(mapplsRouteData.distanceMeters)
          : (distanceMeters ?? 0);
      addOrUpdateViewer({
        id: `viewer-${Date.now()}`,
        name: 'Recipient',
        lat: viewerLocation.lat,
        lng: viewerLocation.lng,
        distanceMeters: effectiveDist,
        status: effectiveDist <= 15 ? 'arrived' : 'en_route',
        updatedAt: new Date().toISOString(),
      });
    }

    setIsExitingInterstitial(true);
    setTimeout(() => {
      setIsUnlocked(true);
    }, 250);
  };

  // Touch handlers for swipe collapse/expand on bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 35) {
      // Swiped down -> collapse
      setIsSheetCollapsed(true);
    } else if (deltaY < -35) {
      // Swiped up -> expand
      setIsSheetCollapsed(false);
    }
    touchStartY.current = null;
  };

  return (
    <div className="bg-background text-foreground relative h-[100dvh] w-full overflow-hidden font-sans select-none">
      {/* 1. Header */}
      <header className="absolute top-0 right-0 left-0 z-40 flex h-12 items-center justify-between border-b border-zinc-200/60 bg-white/85 px-4 font-sans shadow-xs backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/85">
        <Link
          href="/"
          className="group flex cursor-pointer items-center"
          aria-label="DigiRoute Home"
        >
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="h-auto w-24 object-contain sm:w-28 dark:brightness-200 dark:invert"
          />
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="font-sans text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:text-sm dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="font-sans text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:text-sm dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            About
          </Link>
        </nav>
      </header>

      {/* 2. Security Interstitial Modal if Passcode Protected */}
      {!isLoading &&
        !isUnlocked &&
        Boolean(addressData?.hasPasscode || addressData?.passcode) && (
          <div
            className={`bg-background fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-[transform,opacity] duration-300 ease-out ${
              isExitingInterstitial
                ? 'pointer-events-none -translate-y-4 opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="w-full max-w-sm space-y-4 rounded-sm border border-slate-200 bg-white p-6 font-sans shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
              <div className="space-y-1.5 text-center">
                <Lock
                  className="mx-auto mb-2 h-6 w-6 shrink-0 text-[#FF6B00] dark:text-orange-400"
                  strokeWidth={2}
                />
                <h1 className="font-sans text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Secure Micro-Address
                </h1>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-400">
                  This micro-address is protected by a resident passcode.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3.5 pt-1">
                <div>
                  <label
                    htmlFor="passcode-input"
                    className="mb-1 block font-sans text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Enter Passcode
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="passcode-input"
                      type={showPasscode ? 'text' : 'password'}
                      required
                      value={passcode}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      placeholder="******"
                      className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 font-sans text-sm text-slate-900 transition-colors duration-150 placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 cursor-pointer rounded-sm p-1 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={
                        showPasscode ? 'Hide passcode' : 'Show passcode'
                      }
                    >
                      {showPasscode ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="flex items-center gap-1.5 pt-0.5 font-sans text-xs font-medium text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  id="unlock-address-btn"
                  disabled={isVerifyingPasscode}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-[#FF6B00] px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-xs transition-all duration-100 ease-out hover:bg-[#e05e00] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {isVerifyingPasscode ? 'Verifying...' : 'Unlock Address'}
                  </span>
                  <LockOpen className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}

      {/* 3. Hero Map Layer with Directions Plugin, Permission Denied UI, or Progressive Map Skeleton */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isPermissionDenied ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 p-4 pb-28 dark:bg-zinc-950">
            <div className="w-full max-w-sm space-y-4 rounded-sm border border-slate-300 bg-white p-6 text-left font-sans shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock
                    className="h-5 w-5 shrink-0 text-[#FF6B00]"
                    strokeWidth={2}
                  />
                  <h2 className="font-sans text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Location Access Required
                  </h2>
                </div>
                <p className="font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  We need your location to show distance and directions to this
                  micro-address.
                </p>
              </div>

              <div className="space-y-2 rounded-sm border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="font-sans text-[11px] font-semibold tracking-wider text-slate-900 uppercase dark:text-slate-200">
                  Instructions
                </p>
                <ol className="list-none space-y-1.5 font-sans text-xs text-slate-600 dark:text-slate-400">
                  <li>
                    1. Click the 🔒 lock icon in your browser&apos;s address
                    bar.
                  </li>
                  <li>2. Go to Site Settings / Permissions.</li>
                  <li>3. Set Location to &apos;Allow&apos;.</li>
                  <li>4. Reload the page.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => window.location.reload()}
                id="reload-page-permission-btn"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-[#FF6B00] px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#e05e00] active:scale-[0.98] sm:text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        ) : isLoading || isLocating ? (
          <div className="relative flex h-full w-full animate-pulse items-center justify-center bg-slate-200 dark:bg-zinc-800">
            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-zinc-500">
              <MapPin className="h-8 w-8 opacity-40" />
              <span className="font-mono text-[11px] tracking-wider uppercase opacity-60">
                Initializing Map &amp; GPS
              </span>
            </div>
          </div>
        ) : (
          <RecipientMapplsMap
            destination={{
              lat: destLat,
              lng: destLng,
              digipin: code,
              title: code,
            }}
            viewerLocation={viewerLocation}
            isLocating={isLocating}
            className="h-full w-full"
            onRouteCalculated={handleRouteCalculated}
            onRouteError={handleRouteError}
          />
        )}
      </div>

      {/* 4. Floating Top Status Banner & Fullscreen Toggle */}
      <div className="absolute top-14 right-3 z-20 flex flex-col items-end gap-2">
        <div className="bg-card/90 border-border text-foreground flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-semibold shadow-xs backdrop-blur-sm">
          <Compass className="text-accent h-3.5 w-3.5" />
          <span>Facing North</span>
        </div>

        {/* Floating Fullscreen / Expand Map Button */}
        <button
          type="button"
          onClick={() => setIsMapFullscreen((prev) => !prev)}
          id="expand-recipient-map-btn"
          aria-label={
            isMapFullscreen ? 'Exit fullscreen map' : 'Expand map fullscreen'
          }
          title={
            isMapFullscreen
              ? 'Restore address details'
              : 'Expand map to fullscreen'
          }
          className="bg-card/95 hover:bg-card border-border text-foreground flex cursor-pointer items-center justify-center rounded-lg border p-2.5 shadow-md backdrop-blur-md transition-all active:scale-95"
        >
          {isMapFullscreen ? (
            <Minimize2 className="text-accent h-4 w-4" />
          ) : (
            <Maximize2 className="text-accent h-4 w-4" />
          )}
        </button>
      </div>

      {/* 5. Collapsible Bottom Sheet UI */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`absolute right-3 bottom-[70px] left-3 z-30 transition-all duration-300 ease-in-out ${
          isMapFullscreen
            ? 'pointer-events-none translate-y-[150%] opacity-0'
            : 'pointer-events-auto translate-y-0 opacity-100'
        }`}
      >
        <div className="bg-card/95 border-border overflow-hidden rounded-lg border font-sans shadow-xl backdrop-blur-md">
          {/* Drag Handle Bar & Summary Header */}
          <div
            role="button"
            tabIndex={0}
            aria-label={
              isSheetCollapsed
                ? 'Expand address details'
                : 'Collapse address details'
            }
            onClick={() => setIsSheetCollapsed((prev) => !prev)}
            className="hover:bg-muted/40 w-full cursor-pointer px-3.5 pt-1.5 pb-2.5 transition-colors select-none"
          >
            {/* Horizontal Pill Handle */}
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />

            {/* Compact Summary Header Row */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-muted-foreground block font-sans text-[11px] font-medium">
                  Doorstep distance
                </span>
                <div className="text-foreground flex items-center gap-1.5 font-sans text-base font-bold sm:text-lg">
                  {isPermissionDenied ? (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Location access required
                    </span>
                  ) : isLoading || isLocating ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <div className="h-5 w-20 animate-pulse rounded-sm bg-slate-200 dark:bg-zinc-700" />
                      <div className="h-4 w-16 animate-pulse rounded-sm bg-slate-200 dark:bg-zinc-700" />
                    </div>
                  ) : (
                    <>
                      <span className="text-accent">{distanceText}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {etaText}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  {isLoading ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="h-4 w-20 animate-pulse rounded-sm bg-slate-200 dark:bg-zinc-700" />
                      <div className="h-3 w-24 animate-pulse rounded-sm bg-slate-200 dark:bg-zinc-700" />
                    </div>
                  ) : (
                    <>
                      <span className="text-primary block font-mono text-xs font-bold">
                        {code}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {destLat && destLng
                          ? `${destLat.toFixed(4)}° N, ${destLng.toFixed(4)}° E`
                          : ''}
                      </span>
                    </>
                  )}
                </div>
                {!isLoading &&
                  (hasZAxisData || photoUrl || !addressData?.isRawDigipin) && (
                    <div className="text-muted-foreground hover:text-foreground rounded p-1">
                      {isSheetCollapsed ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Expandable / Collapsible Details Body (only rendered if details exist) */}
          {!isLoading &&
            (hasZAxisData || photoUrl || !addressData?.isRawDigipin) && (
              <div
                className={`px-3.5 pb-3 transition-[max-height,opacity] duration-300 ease-in-out ${
                  isSheetCollapsed
                    ? 'max-h-0 overflow-hidden !py-0 opacity-0'
                    : 'border-border/60 max-h-[60vh] space-y-2.5 overflow-y-auto border-t pt-1 opacity-100'
                }`}
              >
                {/* Z-Axis Details (Floor, Unit, Routing Notes) */}
                {hasZAxisData ? (
                  <div className="space-y-2 rounded border border-zinc-200/80 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                      <Building2 className="text-accent h-3.5 w-3.5 shrink-0" />
                      <span>Floor &amp; unit navigation</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded border border-zinc-200/60 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <span className="text-muted-foreground block text-[10px] font-medium">
                          Floor
                        </span>
                        <span className="text-foreground mt-0.5 block truncate text-xs font-semibold sm:text-sm">
                          {floor || 'Ground'}
                        </span>
                      </div>
                      <div className="rounded border border-zinc-200/60 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <span className="text-muted-foreground block text-[10px] font-medium">
                          Unit
                        </span>
                        <span className="text-foreground mt-0.5 block truncate text-xs font-semibold sm:text-sm">
                          {flat || 'Main Door'}
                        </span>
                      </div>
                    </div>

                    {hints && (
                      <div className="rounded border border-zinc-200/60 bg-white p-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="text-muted-foreground mb-0.5 flex items-center gap-1 text-[10px] font-medium">
                          <Info className="text-accent h-3 w-3 shrink-0" />
                          <span>Routing notes</span>
                        </div>
                        <p className="text-foreground font-sans text-xs leading-snug">
                          {hints}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* View Doorway Photo Button (only if photo exists or registered address) */}
                {photoUrl ? (
                  <button
                    type="button"
                    id="view-doorway-photo-btn"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] px-3 py-2.5 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 hover:opacity-95 active:scale-[0.98] md:text-sm"
                  >
                    <Camera className="text-accent h-4 w-4" />
                    <span>View Doorway Photo</span>
                  </button>
                ) : !addressData?.isRawDigipin ? (
                  <button
                    type="button"
                    id="view-doorway-photo-btn"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] px-3 py-2.5 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 hover:opacity-95 active:scale-[0.98] md:text-sm"
                  >
                    <Camera className="text-accent h-4 w-4" />
                    <span>Doorway Visual Lock</span>
                  </button>
                ) : null}
              </div>
            )}
        </div>
      </div>

      {/* 6. Doorway Photo Lightbox Dialog */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent
          className="border-border bg-card rounded-[4px] border p-4 font-sans shadow-xl sm:max-w-md sm:p-5"
          showCloseButton={true}
        >
          <DialogHeader className="gap-1 text-left font-sans">
            <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight">
              Doorway Photo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-sans text-xs">
              Visual reference for entrance confirmation at doorstep.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-3 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[4px] border border-zinc-800 bg-zinc-950">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Doorway visual reference"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 p-4 text-center text-zinc-400">
                <Building2 className="mb-1.5 h-8 w-8 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-200">
                  {flat ? `Entrance ${flat}` : 'Entrance Confirmation'}
                </span>
                <span className="mt-0.5 text-[11px] text-zinc-400">
                  No doorway photo was attached to this micro-address.
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. Fixed Bottom Thumb-Zone CTA */}
      <div
        className={`bg-card border-border fixed right-0 bottom-0 left-0 z-40 border-t px-4 py-3 font-sans shadow-lg transition-transform duration-300 ${
          isMapFullscreen
            ? 'pointer-events-none translate-y-full opacity-0'
            : 'pointer-events-auto translate-y-0 opacity-100'
        }`}
      >
        <div className="mx-auto max-w-md md:max-w-lg">
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen(true)}
            id="start-navigation-btn"
            className="bg-accent text-accent-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] py-3.5 font-sans text-sm font-semibold shadow-sm transition-[transform,opacity] duration-150 hover:opacity-95 active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4 fill-current" />
            <span>Start Navigation</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Bar in Fullscreen Mode */}
      {isMapFullscreen && (
        <div className="pointer-events-none fixed right-0 bottom-5 left-0 z-40 flex items-center justify-center px-4">
          <div className="bg-card/95 border-border pointer-events-auto flex items-center gap-2 rounded-full border px-3.5 py-2 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsMapFullscreen(false)}
              className="text-accent flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Restore Details</span>
            </button>
            <div className="bg-border h-4 w-px" />
            <button
              type="button"
              onClick={() => setIsNavDrawerOpen(true)}
              className="text-foreground hover:text-accent flex cursor-pointer items-center gap-1.5 text-xs font-bold"
            >
              <Navigation className="h-3.5 w-3.5 fill-current" />
              <span>Navigate</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. High-Visibility Navigation App Picker Modal (Performant bg-black/40 & Clean UI) */}
      {isNavDrawerOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-end justify-center p-0 duration-150 sm:items-center sm:p-4">
          {/* Simple performant backdrop without laggy blur */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsNavDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Solid Modal Container with high z-index */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nav-modal-title"
            className="relative z-[101] max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 font-sans shadow-2xl sm:rounded-2xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
              <h3
                id="nav-modal-title"
                className="text-base font-bold tracking-tight text-zinc-950 sm:text-lg dark:text-zinc-50"
              >
                Start Navigation
              </h3>
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(false)}
                className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Close navigation options"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stacked Clean Navigation Action Buttons */}
            <div className="space-y-3 pt-1">
              {/* Button 1: Google Maps */}
              <button
                type="button"
                id="nav-open-google-maps-btn"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`,
                    '_blank'
                  );
                  setIsNavDrawerOpen(false);
                }}
                className="border-border bg-card hover:bg-muted/80 text-foreground group flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 shadow-xs transition-all active:scale-[0.99] sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-foreground group-hover:text-primary text-sm font-bold transition-colors sm:text-base">
                    Open in Google Maps
                  </span>
                </div>
                <ExternalLink className="text-muted-foreground group-hover:text-foreground ml-2 h-4 w-4 shrink-0 transition-colors" />
              </button>

              {/* Button 2: Mappls */}
              <button
                type="button"
                id="nav-open-mappls-btn"
                onClick={() => {
                  window.open(
                    `https://www.mappls.com/@${destLat},${destLng}`,
                    '_blank'
                  );
                  setIsNavDrawerOpen(false);
                }}
                className="border-border bg-card hover:bg-muted/80 text-foreground group flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 shadow-xs transition-all active:scale-[0.99] sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Compass className="h-5 w-5" />
                  </div>
                  <span className="text-foreground group-hover:text-primary text-sm font-bold transition-colors sm:text-base">
                    Open in Mappls
                  </span>
                </div>
                <ExternalLink className="text-muted-foreground group-hover:text-foreground ml-2 h-4 w-4 shrink-0 transition-colors" />
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(false)}
                className="dark:hover:bg-zinc-850 w-full cursor-pointer rounded-lg border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-200 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
