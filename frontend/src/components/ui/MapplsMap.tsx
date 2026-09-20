'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { AlertTriangle } from 'lucide-react';

export type DirectionProfile = 'driving' | 'biking' | 'walking' | 'trucking';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  type?: 'destination' | 'user' | 'victim' | 'helper' | 'entrance' | 'custom';
  color?: string;
  pulse?: boolean;
}

export type LocationPoint =
  string | [number, number] | { lat: number; lng: number };

export interface AccuracyCircleProps {
  center: [number, number] | { lat: number; lng: number };
  radius?: number; // Radius in meters
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
}

export interface DraggableMarkerProps {
  position: [number, number] | { lat: number; lng: number };
  onPositionChange: (coords: { lat: number; lng: number }) => void;
  title?: string;
}

export interface MapplsMapProps {
  center?: [number, number] | { lat: number; lng: number };
  zoom?: number;
  className?: string;
  interactive?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  centerOffsetPercent?: { x: number; y: number };
  markers?: MapMarkerItem[];
  accuracyCircle?: AccuracyCircleProps;
  draggableMarker?: DraggableMarkerProps;
  start?: LocationPoint;
  end?: LocationPoint;
  profile?: DirectionProfile;
  fitbounds?: boolean;
  routePath?: [number, number][];
  onRouteCalculated?: (data: unknown) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mappls?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Mappls?: any;
  }
}

/**
 * Official Mappls Vector Web Map Component
 *
 * Enforces real-world vector tile rendering via the official Mappls Web Maps SDK.
 * Dynamically loads: https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${apiKey}
 * Uses:
 * 1. new window.mappls.Map(containerId, options)
 * 2. new window.mappls.Circle(options)
 * 3. new window.mappls.Marker(options)
 */
export function MapplsMap({
  center = [28.6139, 77.209],
  zoom = 16,
  className = '',
  interactive = true,
  onMapClick,
  markers = [],
  accuracyCircle,
  draggableMarker,
  routePath = [],
}: MapplsMapProps) {
  const rawId = useId();
  const containerId = `mappls_map_${rawId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const draggableMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const standardMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);

  const [isSdkLoaded, setIsSdkLoaded] = useState(() => {
    if (typeof window !== 'undefined' && window.mappls?.Map) return true;
    return false;
  });
  const [loadError, setLoadError] = useState(false);

  // Normalize center coordinates
  const centerLat = Array.isArray(center) ? center[0] : center.lat;
  const centerLng = Array.isArray(center) ? center[1] : center.lng;

  // Read environment API key
  const apiKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY || '';

  // Callback refs to avoid recreation of listeners
  const onMapClickRef = useRef(onMapClick);
  const draggableCallbackRef = useRef(draggableMarker?.onPositionChange);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    draggableCallbackRef.current = draggableMarker?.onPositionChange;
  });

  // 1. Force Real SDK Loading via official SDK Web Maps endpoint
  useEffect(() => {
    if (!apiKey) return;

    if (window.mappls?.Map) {
      queueMicrotask(() => setIsSdkLoaded(true));
      return;
    }

    const scriptId = 'mappls-sdk-web-v3';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;

    const checkSdkReady = () => {
      interval = setInterval(() => {
        attempts++;
        if (window.mappls?.Map) {
          setIsSdkLoaded(true);
          if (interval) clearInterval(interval);
        } else if (attempts > 50) {
          if (interval) clearInterval(interval);
          setLoadError(true);
        }
      }, 100);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${apiKey}`;
      script.async = true;
      script.onload = checkSdkReady;
      script.onerror = () => {
        if (interval) clearInterval(interval);
        setLoadError(true);
      };
      document.head.appendChild(script);
    } else {
      if (window.mappls?.Map) {
        queueMicrotask(() => setIsSdkLoaded(true));
      } else {
        script.addEventListener('load', checkSdkReady);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (script) {
        script.removeEventListener('load', checkSdkReady);
      }
    };
  }, [apiKey]);

  // 2. Real Map Instantiation using official syntax
  useEffect(() => {
    if (!isSdkLoaded || !window.mappls?.Map) return;
    if (mapRef.current) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const map = new window.mappls.Map(containerId, {
        center: { lat: centerLat, lng: centerLng },
        zoom: zoom ?? 16,
        geolocation: false,
        zoomControl: interactive,
      });

      mapRef.current = map;

      // Click event listener on map instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addListener('click', (e: any) => {
        const coords =
          e?.lngLat || e?.latlng || e?.latLng || (e?.lng && e?.lat ? e : null);
        if (coords) {
          const lat = Number((coords.lat ?? coords[1]).toFixed(6));
          const lng = Number(
            (coords.lng ?? coords.lon ?? coords[0]).toFixed(6)
          );

          if (!isNaN(lat) && !isNaN(lng)) {
            if (draggableMarkerRef.current) {
              if (
                typeof draggableMarkerRef.current.setPosition === 'function'
              ) {
                draggableMarkerRef.current.setPosition({ lat, lng });
              } else if (
                typeof draggableMarkerRef.current.setLngLat === 'function'
              ) {
                draggableMarkerRef.current.setLngLat([lng, lat]);
              }
            }

            if (draggableCallbackRef.current) {
              draggableCallbackRef.current({ lat, lng });
            }

            if (onMapClickRef.current) {
              onMapClickRef.current({ lat, lng });
            }
          }
        }
      });
    } catch (err) {
      console.error('Error initializing Mappls Map:', err);
      queueMicrotask(() => setLoadError(true));
    }

    return () => {
      if (mapRef.current) {
        try {
          if (typeof mapRef.current.remove === 'function') {
            mapRef.current.remove();
          }
        } catch {}
        mapRef.current = null;
      }
    };
    // Map is instantiated once upon SDK load; center/zoom dynamic changes are handled by separate effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSdkLoaded, containerId]);

  // Handle container resizing and prevent layout shift during maximize/minimize
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current && typeof mapRef.current.resize === 'function') {
        mapRef.current.resize();
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerId, isSdkLoaded]);

  // Center update without destroying map
  useEffect(() => {
    if (!mapRef.current) return;
    try {
      if (typeof mapRef.current.setCenter === 'function') {
        mapRef.current.setCenter({ lat: centerLat, lng: centerLng });
      }
    } catch {}
  }, [centerLat, centerLng]);

  const circleRadius = accuracyCircle?.radius;
  const circleCenterLat = accuracyCircle
    ? Array.isArray(accuracyCircle.center)
      ? accuracyCircle.center[0]
      : accuracyCircle.center.lat
    : null;
  const circleCenterLng = accuracyCircle
    ? Array.isArray(accuracyCircle.center)
      ? accuracyCircle.center[1]
      : accuracyCircle.center.lng
    : null;

  // 3. Real window.mappls.Circle for Accuracy Boundary
  useEffect(() => {
    if (!mapRef.current || !window.mappls?.Circle || !accuracyCircle) return;

    const cLat = Array.isArray(accuracyCircle.center)
      ? accuracyCircle.center[0]
      : accuracyCircle.center.lat;
    const cLng = Array.isArray(accuracyCircle.center)
      ? accuracyCircle.center[1]
      : accuracyCircle.center.lng;

    if (circleRef.current) {
      try {
        if (typeof circleRef.current.remove === 'function') {
          circleRef.current.remove();
        }
      } catch {}
      circleRef.current = null;
    }

    try {
      const circle = new window.mappls.Circle({
        map: mapRef.current,
        center: { lat: cLat, lng: cLng },
        radius: accuracyCircle.radius || 25,
        fillColor: accuracyCircle.fillColor || '#3b82f6',
        fillOpacity: accuracyCircle.fillOpacity ?? 0.18,
        strokeColor: accuracyCircle.strokeColor || '#2563eb',
        strokeOpacity: 0.7,
        strokeWeight: 2,
      });

      circleRef.current = circle;
    } catch (err) {
      console.warn('Error creating Mappls Circle:', err);
    }

    return () => {
      if (circleRef.current) {
        try {
          if (typeof circleRef.current.remove === 'function') {
            circleRef.current.remove();
          }
        } catch {}
        circleRef.current = null;
      }
    };
  }, [
    isSdkLoaded,
    circleRadius,
    circleCenterLat,
    circleCenterLng,
    accuracyCircle,
  ]);

  const hasDraggableMarker = Boolean(draggableMarker);
  const draggablePosLat = draggableMarker
    ? Array.isArray(draggableMarker.position)
      ? draggableMarker.position[0]
      : draggableMarker.position.lat
    : null;
  const draggablePosLng = draggableMarker
    ? Array.isArray(draggableMarker.position)
      ? draggableMarker.position[1]
      : draggableMarker.position.lng
    : null;

  // 4. Real window.mappls.Marker for Draggable/Clickable Pin
  useEffect(() => {
    if (!mapRef.current || !window.mappls?.Marker || !draggableMarker) return;

    const mLat = Array.isArray(draggableMarker.position)
      ? draggableMarker.position[0]
      : draggableMarker.position.lat;
    const mLng = Array.isArray(draggableMarker.position)
      ? draggableMarker.position[1]
      : draggableMarker.position.lng;

    if (!draggableMarkerRef.current) {
      try {
        const marker = new window.mappls.Marker({
          map: mapRef.current,
          position: { lat: mLat, lng: mLng },
          draggable: true,
          title: draggableMarker.title || 'Entrance Pin',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.addListener('dragend', (e: any) => {
          const pos =
            (typeof marker.getPosition === 'function'
              ? marker.getPosition()
              : null) ||
            (typeof marker.getLngLat === 'function'
              ? marker.getLngLat()
              : null) ||
            e?.target?._lngLat ||
            e?.lngLat;

          if (pos) {
            const lat = Number((pos.lat ?? pos[1]).toFixed(6));
            const lng = Number((pos.lng ?? pos.lon ?? pos[0]).toFixed(6));
            if (!isNaN(lat) && !isNaN(lng) && draggableCallbackRef.current) {
              draggableCallbackRef.current({ lat, lng });
            }
          }
        });

        draggableMarkerRef.current = marker;
      } catch (err) {
        console.warn('Error creating Mappls Marker:', err);
      }
    }

    return () => {
      if (draggableMarkerRef.current) {
        try {
          if (typeof draggableMarkerRef.current.remove === 'function') {
            draggableMarkerRef.current.remove();
          }
        } catch {}
        draggableMarkerRef.current = null;
      }
    };
  }, [isSdkLoaded, hasDraggableMarker, draggableMarker]);

  // Update marker position on prop change without recreating
  useEffect(() => {
    if (!draggableMarkerRef.current || !draggableMarker) return;

    const mLat = Array.isArray(draggableMarker.position)
      ? draggableMarker.position[0]
      : draggableMarker.position.lat;
    const mLng = Array.isArray(draggableMarker.position)
      ? draggableMarker.position[1]
      : draggableMarker.position.lng;

    try {
      if (typeof draggableMarkerRef.current.setPosition === 'function') {
        draggableMarkerRef.current.setPosition({ lat: mLat, lng: mLng });
      } else if (typeof draggableMarkerRef.current.setLngLat === 'function') {
        draggableMarkerRef.current.setLngLat([mLng, mLat]);
      }
    } catch {}
  }, [draggablePosLat, draggablePosLng, draggableMarker]);

  // 5. Real markers for non-draggable points (e.g. destinations, emergency beacons)
  useEffect(() => {
    if (!mapRef.current || !window.mappls?.Marker || markers.length === 0)
      return;

    // Clean up previous markers
    standardMarkersRef.current.forEach((inst) => {
      try {
        if (typeof inst.remove === 'function') inst.remove();
      } catch {}
    });
    standardMarkersRef.current = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = [];
    markers.forEach((item) => {
      try {
        const marker = new window.mappls.Marker({
          map: mapRef.current,
          position: { lat: item.lat, lng: item.lng },
          title: item.title || '',
        });
        instances.push(marker);
      } catch {}
    });

    standardMarkersRef.current = instances;

    return () => {
      instances.forEach((inst) => {
        try {
          if (typeof inst.remove === 'function') inst.remove();
        } catch {}
      });
    };
  }, [isSdkLoaded, markers]);

  // 6. Polyline for routing paths (if provided)
  useEffect(() => {
    if (
      !mapRef.current ||
      !window.mappls?.Polyline ||
      !routePath ||
      routePath.length < 2
    )
      return;

    if (polylineRef.current) {
      try {
        if (typeof polylineRef.current.remove === 'function')
          polylineRef.current.remove();
      } catch {}
      polylineRef.current = null;
    }

    try {
      const line = new window.mappls.Polyline({
        map: mapRef.current,
        path: routePath.map((p) => ({ lat: p[0], lng: p[1] })),
        strokeColor: '#ea580c',
        strokeOpacity: 0.85,
        strokeWeight: 4,
      });
      polylineRef.current = line;
    } catch (err) {
      console.warn('Error creating Mappls Polyline:', err);
    }

    return () => {
      if (polylineRef.current) {
        try {
          if (typeof polylineRef.current.remove === 'function')
            polylineRef.current.remove();
        } catch {}
        polylineRef.current = null;
      }
    };
  }, [isSdkLoaded, routePath]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden font-sans select-none ${className}`}
    >
      {/* ─── REAL MAPPLS VECTOR CONTAINER ─────────────────────────────────── */}
      <div
        id={containerId}
        className="absolute inset-0 h-full w-full"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* ─── MISSING OR INVALID API KEY ERROR CARD ─────────────────────────── */}
      {!apiKey && (
        <div className="border-border absolute inset-0 z-20 flex flex-col items-center justify-center border bg-zinc-50 p-6 text-center font-sans dark:bg-zinc-900">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-foreground font-sans text-sm font-bold">
            Mappls API key missing or invalid. Please configure .env
          </p>
          <p className="text-muted-foreground mt-1.5 max-w-sm font-mono text-xs">
            Ensure NEXT_PUBLIC_MAPPLS_API_KEY is set in .env.local
          </p>
        </div>
      )}

      {/* ─── SDK LOAD ERROR STATE ──────────────────────────────────────────── */}
      {loadError && apiKey && (
        <div className="border-border absolute inset-0 z-20 flex flex-col items-center justify-center border bg-zinc-50 p-6 text-center font-sans dark:bg-zinc-900">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-foreground font-sans text-sm font-bold">
            Mappls SDK failed to load
          </p>
          <p className="text-muted-foreground mt-1.5 max-w-sm font-mono text-xs">
            Please verify network connectivity and Mappls console whitelist
            permissions.
          </p>
        </div>
      )}

      {/* ─── LOADING VECTOR TILES PLACEHOLDER (NO FAKE GRID) ───────────────── */}
      {!isSdkLoaded && !loadError && apiKey && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-100 font-sans text-zinc-500 dark:bg-zinc-900">
          <div className="border-accent mb-2.5 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground font-sans text-xs font-medium">
            Loading Mappls Vector Tiles...
          </span>
        </div>
      )}

      {/* ─── MAP PROVIDER ATTRIBUTION CHIP ─────────────────────────────────── */}
      <div className="pointer-events-none absolute right-2 bottom-2 z-20">
        <span className="rounded border border-zinc-200/60 bg-white/80 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 backdrop-blur-xs dark:border-zinc-800/60 dark:bg-zinc-900/80">
          Mappls Vector SDK 3.0
        </span>
      </div>
    </div>
  );
}
