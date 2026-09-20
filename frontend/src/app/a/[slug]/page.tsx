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
      <div className="w-full h-full bg-slate-200 dark:bg-zinc-800 animate-pulse relative flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-zinc-500">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mb-3 shadow-sm" />
          <span className="text-[11px] font-mono tracking-wider uppercase opacity-60">
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
  X
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
  if (direct !== undefined && direct !== null && direct !== 0 && direct !== '') {
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
      if (legDur !== undefined && legDur !== null && legDur !== 0 && legDur !== '') {
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
  if (direct !== undefined && direct !== null && direct !== 0 && direct !== '') {
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
      if (legDist !== undefined && legDist !== null && legDist !== 0 && legDist !== '') {
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
      const minMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|m)(?!.*(?:hr|hrs|hour|hours|h))/);
      const secMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:sec|secs|second|seconds|s)/);

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
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
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
  const [viewerLocation, setViewerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Mappls Dynamic Route Data
  const [mapplsRouteData, setMapplsRouteData] = useState<MapplsRouteData | null>(null);

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
        console.error('[Recipient] Failed to load address record, testing raw DIGIPIN fallback:', err);
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
        console.warn('[Geolocation] Viewer location access error:', err.code, err.message);
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
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background font-sans text-foreground">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 shadow-xs">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">Micro-Address Expired</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          This temporary guest address has expired. Please contact the resident for an updated link.
        </p>
        <Link
          href="/create"
          className="px-4 py-2.5 rounded-[4px] bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer"
        >
          Create New Micro-Address
        </Link>
      </div>
    );
  }

  // Early Return: Strict 404 Not Found (only evaluated once fetch completes)
  if (!isLoading && (isNotFound || !addressData)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background font-sans text-foreground">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border flex items-center justify-center text-zinc-600 dark:text-zinc-300 mb-3 shadow-xs">
          <MapPin className="w-6 h-6 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">Micro-Address Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          The sovereign micro-address link you requested does not exist or may have been typed incorrectly.
        </p>
        <Link
          href="/"
          className="px-4 py-2.5 rounded-[4px] bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  // Strictly Resolved Database Attributes (Safe during progressive load)
  const code = addressData?.digipin ?? '';
  const destLat = addressData?.location?.lat ?? addressData?.entranceLat ?? addressData?.baseLat ?? 0;
  const destLng = addressData?.location?.lng ?? addressData?.entranceLng ?? addressData?.baseLng ?? 0;
  const floor = addressData?.floor?.trim() || '';
  const flat = addressData?.flat?.trim() || '';
  const hints = addressData?.routingNotes?.trim() || addressData?.landmark?.trim() || '';
  const hasZAxisData = Boolean(!addressData?.isRawDigipin && (floor || flat || hints));

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

  const isWalkingDistance = effectiveDistance !== null && effectiveDistance < 500;
  const travelModeLabel = isWalkingDistance ? 'walk' : 'drive';

  // Determine realistic duration in seconds
  let effectiveDurationSeconds: number | null = null;
  if (effectiveMapplsRouteData !== null && effectiveMapplsRouteData.durationSeconds > 60) {
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
          setAuthError(verifyRes.error || 'Incorrect passcode. Please try again.');
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
      const effectiveDist = mapplsRouteData !== null ? Math.round(mapplsRouteData.distanceMeters) : (distanceMeters ?? 0);
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
    <div className="relative w-full h-[100dvh] font-sans bg-background text-foreground overflow-hidden select-none">
      {/* 1. Header */}
      <header className="absolute top-0 left-0 right-0 z-40 h-12 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 flex items-center justify-between shadow-xs font-sans">
        <Link href="/" className="flex items-center group cursor-pointer" aria-label="DigiRoute Home">
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="w-24 sm:w-28 h-auto object-contain dark:invert dark:brightness-200"
          />
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-sans"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors font-sans"
          >
            About
          </Link>
        </nav>
      </header>

      {/* 2. Security Interstitial Modal if Passcode Protected */}
      {!isLoading && !isUnlocked && Boolean(addressData?.hasPasscode || addressData?.passcode) && (
        <div
          className={`fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 transition-[transform,opacity] duration-300 ease-out ${
            isExitingInterstitial
              ? 'opacity-0 -translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-sm p-6 shadow-xl space-y-4 font-sans">
            <div className="text-center space-y-1.5">
              <Lock className="w-6 h-6 text-[#FF6B00] dark:text-orange-400 mx-auto mb-2 shrink-0" strokeWidth={2} />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                Secure Micro-Address
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                This micro-address is protected by a resident passcode.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3.5 pt-1">
              <div>
                <label
                  htmlFor="passcode-input"
                  className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1 font-sans"
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
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-sm text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] transition-colors duration-150 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 font-sans pt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}

              <button
                type="submit"
                id="unlock-address-btn"
                disabled={isVerifyingPasscode}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-[#FF6B00] text-white text-sm font-semibold hover:bg-[#e05e00] active:scale-[0.98] transition-all duration-100 ease-out shadow-xs cursor-pointer font-sans disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isVerifyingPasscode ? 'Verifying...' : 'Unlock Address'}</span>
                <LockOpen className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Hero Map Layer with Directions Plugin, Permission Denied UI, or Progressive Map Skeleton */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isPermissionDenied ? (
          <div className="w-full h-full flex items-center justify-center p-4 bg-slate-100 dark:bg-zinc-950 pb-28">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-sm p-6 shadow-sm font-sans space-y-4 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#FF6B00] shrink-0" strokeWidth={2} />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                    Location Access Required
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                  We need your location to show distance and directions to this micro-address.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-sm p-3.5 bg-slate-50 dark:bg-zinc-950 space-y-2">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider font-sans">
                  Instructions
                </p>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-sans list-none">
                  <li>1. Click the 🔒 lock icon in your browser&apos;s address bar.</li>
                  <li>2. Go to Site Settings / Permissions.</li>
                  <li>3. Set Location to &apos;Allow&apos;.</li>
                  <li>4. Reload the page.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => window.location.reload()}
                id="reload-page-permission-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-[#FF6B00] text-white text-xs sm:text-sm font-semibold hover:bg-[#e05e00] active:scale-[0.98] transition-colors duration-150 shadow-xs cursor-pointer font-sans"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        ) : (isLoading || isLocating) ? (
          <div className="w-full h-full bg-slate-200 dark:bg-zinc-800 animate-pulse relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-zinc-500">
              <MapPin className="w-8 h-8 opacity-40" />
              <span className="text-[11px] font-mono tracking-wider uppercase opacity-60">
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
            className="w-full h-full"
            onRouteCalculated={handleRouteCalculated}
            onRouteError={handleRouteError}
          />
        )}
      </div>

      {/* 4. Floating Top Status Banner & Fullscreen Toggle */}
      <div className="absolute top-14 right-3 z-20 flex flex-col items-end gap-2">
        <div className="bg-card/90 backdrop-blur-sm border border-border px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-xs">
          <Compass className="w-3.5 h-3.5 text-accent" />
          <span>Facing North</span>
        </div>

        {/* Floating Fullscreen / Expand Map Button */}
        <button
          type="button"
          onClick={() => setIsMapFullscreen((prev) => !prev)}
          id="expand-recipient-map-btn"
          aria-label={isMapFullscreen ? 'Exit fullscreen map' : 'Expand map fullscreen'}
          title={isMapFullscreen ? 'Restore address details' : 'Expand map to fullscreen'}
          className="bg-card/95 hover:bg-card active:scale-95 transition-all backdrop-blur-md border border-border p-2.5 rounded-lg text-foreground shadow-md flex items-center justify-center cursor-pointer"
        >
          {isMapFullscreen ? (
            <Minimize2 className="w-4 h-4 text-accent" />
          ) : (
            <Maximize2 className="w-4 h-4 text-accent" />
          )}
        </button>
      </div>

      {/* 5. Collapsible Bottom Sheet UI */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`absolute bottom-[70px] left-3 right-3 z-30 transition-all duration-300 ease-in-out ${
          isMapFullscreen
            ? 'translate-y-[150%] opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 pointer-events-auto'
        }`}
      >
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl font-sans overflow-hidden">
          {/* Drag Handle Bar & Summary Header */}
          <div
            role="button"
            tabIndex={0}
            aria-label={isSheetCollapsed ? 'Expand address details' : 'Collapse address details'}
            onClick={() => setIsSheetCollapsed((prev) => !prev)}
            className="w-full px-3.5 pt-1.5 pb-2.5 cursor-pointer select-none hover:bg-muted/40 transition-colors"
          >
            {/* Horizontal Pill Handle */}
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-2" />

            {/* Compact Summary Header Row */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-[11px] font-medium text-muted-foreground block font-sans">
                  Doorstep distance
                </span>
                <div className="text-base sm:text-lg font-bold text-foreground font-sans flex items-center gap-1.5">
                  {isPermissionDenied ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Location access required
                    </span>
                  ) : isLoading || isLocating ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-700 rounded-sm animate-pulse" />
                      <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-700 rounded-sm animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <span className="text-accent">{distanceText}</span>
                      <span className="text-xs text-muted-foreground font-normal">{etaText}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  {isLoading ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-zinc-700 rounded-sm animate-pulse" />
                      <div className="h-3 w-24 bg-slate-200 dark:bg-zinc-700 rounded-sm animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <span className="font-mono text-xs font-bold text-primary block">
                        {code}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {destLat && destLng ? `${destLat.toFixed(4)}° N, ${destLng.toFixed(4)}° E` : ''}
                      </span>
                    </>
                  )}
                </div>
                {!isLoading && (hasZAxisData || photoUrl || !addressData?.isRawDigipin) && (
                  <div className="p-1 rounded text-muted-foreground hover:text-foreground">
                    {isSheetCollapsed ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expandable / Collapsible Details Body (only rendered if details exist) */}
          {!isLoading && (hasZAxisData || photoUrl || !addressData?.isRawDigipin) && (
            <div
              className={`transition-[max-height,opacity] duration-300 ease-in-out px-3.5 pb-3 ${
                isSheetCollapsed ? 'max-h-0 opacity-0 overflow-hidden !py-0' : 'max-h-[60vh] opacity-100 overflow-y-auto space-y-2.5 pt-1 border-t border-border/60'
              }`}
            >
              {/* Z-Axis Details (Floor, Unit, Routing Notes) */}
              {hasZAxisData ? (
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 p-2.5 rounded space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Floor &amp; unit navigation</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] font-medium text-muted-foreground block">
                        Floor
                      </span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                        {floor || 'Ground'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-[10px] font-medium text-muted-foreground block">
                        Unit
                      </span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                        {flat || 'Main Door'}
                      </span>
                    </div>
                  </div>

                  {hints && (
                    <div className="bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-200/60 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-0.5">
                        <Info className="w-3 h-3 text-accent shrink-0" />
                        <span>Routing notes</span>
                      </div>
                      <p className="text-xs text-foreground leading-snug font-sans">
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[4px] bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-[transform,opacity] duration-150 shadow-xs cursor-pointer font-sans"
                >
                  <Camera className="w-4 h-4 text-accent" />
                  <span>View Doorway Photo</span>
                </button>
              ) : !addressData?.isRawDigipin ? (
                <button
                  type="button"
                  id="view-doorway-photo-btn"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[4px] bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-[transform,opacity] duration-150 shadow-xs cursor-pointer font-sans"
                >
                  <Camera className="w-4 h-4 text-accent" />
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
          className="rounded-[4px] border border-border bg-card p-4 sm:p-5 sm:max-w-md shadow-xl font-sans"
          showCloseButton={true}
        >
          <DialogHeader className="gap-1 text-left font-sans">
            <DialogTitle className="text-base font-bold text-foreground font-sans tracking-tight">
              Doorway Photo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Visual reference for entrance confirmation at doorstep.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 relative w-full aspect-[4/3] bg-zinc-950 rounded-[4px] overflow-hidden border border-zinc-800 flex items-center justify-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Doorway visual reference"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-4 text-center">
                <Building2 className="w-8 h-8 mb-1.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-200">
                  {flat ? `Entrance ${flat}` : 'Entrance Confirmation'}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5">
                  No doorway photo was attached to this micro-address.
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. Fixed Bottom Thumb-Zone CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 font-sans shadow-lg transition-transform duration-300 ${
          isMapFullscreen
            ? 'translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 pointer-events-auto'
        }`}
      >
        <div className="max-w-md md:max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen(true)}
            id="start-navigation-btn"
            className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-semibold text-sm py-3.5 rounded-[4px] hover:opacity-95 active:scale-[0.98] transition-[transform,opacity] duration-150 shadow-sm cursor-pointer font-sans"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Start Navigation</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Bar in Fullscreen Mode */}
      {isMapFullscreen && (
        <div className="fixed bottom-5 left-0 right-0 z-40 px-4 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-border px-3.5 py-2 rounded-full shadow-lg pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsMapFullscreen(false)}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Restore Details</span>
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              type="button"
              onClick={() => setIsNavDrawerOpen(true)}
              className="text-xs font-bold text-foreground hover:text-accent cursor-pointer flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Navigate</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. High-Visibility Navigation App Picker Modal (Performant bg-black/40 & Clean UI) */}
      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
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
            className="relative z-[101] w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl font-sans space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <h3
                id="nav-modal-title"
                className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight"
              >
                Start Navigation
              </h3>
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label="Close navigation options"
              >
                <X className="w-5 h-5" />
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
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground transition-all active:scale-[0.99] cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    Open in Google Maps
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
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
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground transition-all active:scale-[0.99] cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    Open in Mappls
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(false)}
                className="w-full py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300 active:scale-[0.98] transition-all cursor-pointer"
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
