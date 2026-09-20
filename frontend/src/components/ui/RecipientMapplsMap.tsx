'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface RecipientMapProps {
  destination: {
    lat: number;
    lng: number;
    digipin?: string;
    title?: string;
  };
  viewerLocation?: {
    lat: number;
    lng: number;
  } | null;
  isLocating?: boolean;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRouteCalculated?: (data: any) => void;
  onRouteError?: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mappls?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Mappls?: any;
  }
}

// Custom "You" Pin HTML (Fallback when routing is inactive or fails)
const YOU_PIN_HTML = `
  <div class="custom-fallback-marker" style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; user-select: none;">
    <div style="background: #16a34a; color: #ffffff; padding: 2.5px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 1.5px solid #ffffff; font-family: sans-serif; display: flex; align-items: center; gap: 4px;">
      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
      You
    </div>
    <div style="width: 2px; height: 8px; background: #16a34a;"></div>
    <div style="width: 10px; height: 10px; border-radius: 50%; background: #16a34a; border: 2.5px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>
  </div>
`;

// Custom "Destination" Pin HTML (Fallback when routing is inactive or fails)
const DESTINATION_PIN_HTML = `
  <div class="custom-fallback-marker" style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; user-select: none;">
    <div style="background: #dc2626; color: #ffffff; padding: 2.5px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 1.5px solid #ffffff; font-family: sans-serif; display: flex; align-items: center; gap: 4px;">
      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
      Destination
    </div>
    <div style="width: 2px; height: 8px; background: #dc2626;"></div>
    <div style="width: 10px; height: 10px; border-radius: 50%; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>
  </div>
`;

export function RecipientMapplsMap({
  destination,
  viewerLocation: externalViewerLocation,
  isLocating: externalIsLocating,
  className = '',
  onRouteCalculated,
  onRouteError,
}: RecipientMapProps) {
  const [containerId] = useState(
    () => `recipient_map_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directionPluginRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const standaloneDestMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const standaloneYouMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customMarkersRef = useRef<any[]>([]);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onRouteErrorRef = useRef(onRouteError);
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
    onRouteErrorRef.current = onRouteError;
  });

  const [internalIsLocating, setInternalIsLocating] = useState(externalIsLocating ?? true);
  const isLocating = externalIsLocating !== undefined ? externalIsLocating : internalIsLocating;
  const [internalViewerLocation, setInternalViewerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(() => typeof window !== 'undefined' && Boolean(window.mappls?.Map));
  const [isPluginLoaded, setIsPluginLoaded] = useState(() => typeof window !== 'undefined' && Boolean(window.mappls?.direction));
  const [loadError, setLoadError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY || process.env.NEXT_PUBLIC_MAPPLS_TOKEN || '';

  // 1. Sync GPS Location
  useEffect(() => {
    if (externalViewerLocation !== undefined) return;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setInternalViewerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setInternalIsLocating(false);
        },
        (err) => {
          console.warn('[RecipientMapplsMap] Geolocation denied:', err);
          setInternalViewerLocation(null);
          setInternalIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setInternalViewerLocation(null);
      setInternalIsLocating(false);
    }
  }, [externalViewerLocation]);

  const activeViewerLocation = externalViewerLocation !== undefined ? externalViewerLocation : internalViewerLocation;

  // 2. Load Base Map SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!apiKey) {
      console.warn('[RecipientMapplsMap] Mappls API key is missing. Ensure NEXT_PUBLIC_MAPPLS_API_KEY is set in .env.local');
      return;
    }

    if (window.mappls?.Map) {
      setIsSdkLoaded(true);
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 150; // 15s window for 1.45MB SDK

    const checkSdkReady = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        attempts++;
        if (window.mappls?.Map) {
          setIsSdkLoaded(true);
          if (interval) clearInterval(interval);
        } else if (attempts > MAX_ATTEMPTS) {
          if (interval) clearInterval(interval);
          console.error('[RecipientMapplsMap] Timed out waiting for window.mappls.Map to initialize.');
          setLoadError(true);
        }
      }, 100);
    };

    const scriptId = 'mappls-sdk-web-v3';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${apiKey}`;
      script.async = true;
      script.onload = checkSdkReady;
      script.onerror = (e) => {
        if (interval) clearInterval(interval);
        console.error('[RecipientMapplsMap] Failed to load Mappls SDK script:', e);
        setLoadError(true);
      };
      document.head.appendChild(script);
    } else {
      if (window.mappls?.Map) {
        setIsSdkLoaded(true);
      } else {
        script.addEventListener('load', checkSdkReady);
        checkSdkReady(); // Also poll immediately in case load already fired
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (script) {
        script.removeEventListener('load', checkSdkReady);
      }
    };
  }, [apiKey]);

  // 3. Load Direction Plugin
  useEffect(() => {
    if (typeof window === 'undefined' || !apiKey || !isSdkLoaded) return;
    if (window.mappls?.direction) {
      setIsPluginLoaded(true);
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    const checkPluginReady = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        attempts++;
        if (window.mappls?.direction) {
          setIsPluginLoaded(true);
          if (interval) clearInterval(interval);
        } else if (attempts > MAX_ATTEMPTS) {
          if (interval) clearInterval(interval);
          console.warn('[RecipientMapplsMap] Direction plugin polling timed out, using fallback pins.');
          setIsPluginLoaded(false);
        }
      }, 100);
    };

    const pluginScriptId = 'mappls-direction-plugin';
    let pluginScript = document.getElementById(pluginScriptId) as HTMLScriptElement | null;
    if (!pluginScript) {
      pluginScript = document.createElement('script');
      pluginScript.id = pluginScriptId;
      pluginScript.src = `https://sdk.mappls.com/map/sdk/plugins?access_token=${apiKey}&v=3.0&libraries=direction`;
      pluginScript.async = true;
      pluginScript.onload = checkPluginReady;
      pluginScript.onerror = () => {
        if (interval) clearInterval(interval);
        setIsPluginLoaded(false);
      };
      document.head.appendChild(pluginScript);
    } else {
      if (window.mappls?.direction) {
        setIsPluginLoaded(true);
      } else {
        pluginScript.addEventListener('load', checkPluginReady);
        checkPluginReady();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (pluginScript) {
        pluginScript.removeEventListener('load', checkPluginReady);
      }
    };
  }, [apiKey, isSdkLoaded]);

  const [isMapReady, setIsMapReady] = useState(false);
  const lastRoutedKey = useRef<string>('');
  const lastFallbackKey = useRef<string>('');

  // Coordinate Validation Helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isValidCoord = (c: any): c is { lat: number; lng: number } =>
    Boolean(c && typeof c.lat === 'number' && !isNaN(c.lat) && typeof c.lng === 'number' && !isNaN(c.lng));

  // 4. Safe Map Instantiation with Load Event Synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !window.mappls || !window.mappls.Map) return;
    if (!isSdkLoaded) return;
    if (mapRef.current) return;

    const container = containerRef.current || document.getElementById(containerId);
    if (!container) return;

    try {
      // Protect against Mappls SDK internal crash when cleaning up previous map instances
      if (window.mappls?.mObj) {
        const objs = Array.isArray(window.mappls.mObj)
          ? window.mappls.mObj
          : Object.values(window.mappls.mObj);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        objs.forEach((m: any) => {
          if (m && typeof m.remove === 'function' && !m._safeRemoveWrapped) {
            m._safeRemoveWrapped = true;
            const orig = m.remove;
            m.remove = function () {
              try {
                if (this.style && typeof orig === 'function') {
                  orig.call(this);
                }
              } catch {
                // suppress Mappls destroy on undefined error
              }
            };
          }
        });
      }

      const validViewer = isValidCoord(activeViewerLocation);
      const validDest = isValidCoord(destination);

      const initialCenter = validViewer
        ? { lat: activeViewerLocation.lat, lng: activeViewerLocation.lng }
        : validDest
          ? { lat: destination.lat, lng: destination.lng }
          : { lat: 28.6139, lng: 77.209 };

      const map = new window.mappls.Map(containerId, {
        center: initialCenter,
        zoom: 16,
        geolocation: false,
        zoomControl: true,
      });

      // Wrap remove method on the newly created map to guarantee it never throws 'destroy' on undefined
      const originalRemove = map.remove;
      map.remove = function () {
        if (this._isDestroyed) return;
        this._isDestroyed = true;
        try {
          if (this.style && typeof originalRemove === 'function') {
            originalRemove.call(this);
          }
        } catch {
          // ignore harmless cleanup error
        }
      };

      mapRef.current = map;

      const handleMapReady = () => {
        setIsMapReady(true);
      };

      if (typeof map.on === 'function') {
        map.on('load', handleMapReady);
      }
      if (typeof map.addListener === 'function') {
        map.addListener('load', handleMapReady);
      }
      if (typeof map.loaded === 'function' && map.loaded()) {
        setTimeout(handleMapReady, 0);
      } else {
        setTimeout(handleMapReady, 400);
      }
    } catch (err) {
      console.error('[RecipientMapplsMap] Error instantiating Mappls Map:', err);
      setLoadError(true);
    }

    return () => {
      if (mapRef.current) {
        try {
          if (typeof mapRef.current.remove === 'function') {
            mapRef.current.remove();
          }
        } catch { }
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
    // Map is instantiated once upon SDK load; center/destination dynamic changes are handled by separate effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSdkLoaded, containerId]);

  // 5. THE STRICT IF/ELSE ROUTING LOGIC
  useEffect(() => {
    if (!isMapReady || !mapRef.current || isLocating) return;

    let isActive = true; // Protects against React 18 StrictMode double-renders

    // 1. Clean up all manual custom markers
    const cleanupCustomMarkers = () => {
      if (customMarkersRef.current && customMarkersRef.current.length > 0) {
        customMarkersRef.current.forEach((marker) => {
          try {
            if (typeof marker?.remove === 'function') {
              marker.remove();
            } else if (window.mappls?.remove && mapRef.current) {
              window.mappls.remove({ map: mapRef.current, layer: marker });
            }
          } catch (e) {
            console.warn('[RecipientMapplsMap] Error removing custom marker:', e);
          }
        });
        customMarkersRef.current = [];
      }

      if (standaloneDestMarkerRef.current) {
        try {
          if (typeof standaloneDestMarkerRef.current.remove === 'function') {
            standaloneDestMarkerRef.current.remove();
          } else if (window.mappls?.remove && mapRef.current) {
            window.mappls.remove({ map: mapRef.current, layer: standaloneDestMarkerRef.current });
          }
        } catch { }
        standaloneDestMarkerRef.current = null;
      }

      if (standaloneYouMarkerRef.current) {
        try {
          if (typeof standaloneYouMarkerRef.current.remove === 'function') {
            standaloneYouMarkerRef.current.remove();
          } else if (window.mappls?.remove && mapRef.current) {
            window.mappls.remove({ map: mapRef.current, layer: standaloneYouMarkerRef.current });
          }
        } catch { }
        standaloneYouMarkerRef.current = null;
      }

      // Also remove any DOM nodes created for custom fallback markers
      const mapContainer = containerRef.current || document.getElementById(containerId);
      if (mapContainer) {
        mapContainer.querySelectorAll('.custom-fallback-marker').forEach((el) => {
          try {
            const wrapper = el.closest('.mapboxgl-marker, .mappls-marker');
            if (wrapper) {
              wrapper.remove();
            } else {
              el.remove();
            }
          } catch { }
        });
      }
    };

    // 2. Clean up Mappls direction plugin route layer
    const removeDirectionPlugin = () => {
      if (directionPluginRef.current) {
        try {
          if (window.mappls?.remove && mapRef.current) {
            window.mappls.remove({ map: mapRef.current, layer: directionPluginRef.current });
          } else if (typeof directionPluginRef.current.remove === 'function') {
            directionPluginRef.current.remove();
          }
        } catch { }
        directionPluginRef.current = null;
      }
    };

    const cleanupAll = () => {
      cleanupCustomMarkers();
      removeDirectionPlugin();
    };

    // Render manual fallback pins ONLY when no active route exists
    const renderFallbackPins = (onlyDestination = false) => {
      if (!isActive || !window.mappls?.Marker || !mapRef.current) return;
      cleanupCustomMarkers();

      try {
        const validViewer = isValidCoord(activeViewerLocation);
        const validDest = isValidCoord(destination);

        if (validDest) {
          const destMarker = new window.mappls.Marker({
            map: mapRef.current,
            position: { lat: destination.lat, lng: destination.lng },
            html: DESTINATION_PIN_HTML,
          });
          standaloneDestMarkerRef.current = destMarker;
          customMarkersRef.current.push(destMarker);
        }

        if (!onlyDestination && validViewer) {
          const youMarker = new window.mappls.Marker({
            map: mapRef.current,
            position: { lat: activeViewerLocation.lat, lng: activeViewerLocation.lng },
            html: YOU_PIN_HTML,
          });
          standaloneYouMarkerRef.current = youMarker;
          customMarkersRef.current.push(youMarker);
        }

        const currentFallbackKey = `${activeViewerLocation?.lat}-${destination?.lat}`;
        if (lastFallbackKey.current !== currentFallbackKey) {
          lastFallbackKey.current = currentFallbackKey;
          if (!onlyDestination && validViewer && validDest) {
            if (typeof mapRef.current.setCenter === 'function') {
              mapRef.current.setCenter({
                lat: Number(((activeViewerLocation.lat + destination.lat) / 2).toFixed(6)),
                lng: Number(((activeViewerLocation.lng + destination.lng) / 2).toFixed(6)),
              });
            }
            if (typeof mapRef.current.setZoom === 'function') {
              mapRef.current.setZoom(17);
            }
          } else if (validDest) {
            if (typeof mapRef.current.setCenter === 'function') {
              mapRef.current.setCenter({
                lat: Number(destination.lat.toFixed(6)),
                lng: Number(destination.lng.toFixed(6)),
              });
            }
            if (typeof mapRef.current.setZoom === 'function') {
              mapRef.current.setZoom(16);
            }
          }
        }
      } catch (err) {
        console.warn('[RecipientMapplsMap] Error rendering custom fallback markers:', err);
      }
    };

    // If destination coordinates are not valid numbers, do not proceed
    if (!isValidCoord(destination)) return;

    // CASE A: No viewer location -> Single pin view without a route:
    if (!activeViewerLocation || !isValidCoord(activeViewerLocation)) {
      removeDirectionPlugin();
      renderFallbackPins(true); // Only destination pin
      onRouteErrorRef.current?.();
      return () => {
        isActive = false;
        cleanupAll();
      };
    }

    // CASE B: Attempt Route Calculation
    const startCoord = `${activeViewerLocation.lat.toFixed(6)},${activeViewerLocation.lng.toFixed(6)}`;
    const endCoord = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
    const routeKey = `${startCoord}->${endCoord}`;

    // Prevent duplicate routing calls if already routed with identical coordinates
    if (lastRoutedKey.current === routeKey && directionPluginRef.current) {
      cleanupCustomMarkers();
      return;
    }
    lastRoutedKey.current = routeKey;

    // Remove any custom markers BEFORE executing the direction plugin
    cleanupCustomMarkers();

    if (window.mappls?.direction && isPluginLoaded) {
      try {
        const panelId = `${containerId}_direction_panel`;
        const roughDist = Math.hypot(
          (activeViewerLocation.lat - destination.lat) * 111000,
          (activeViewerLocation.lng - destination.lng) * 111000 * Math.cos((destination.lat * Math.PI) / 180)
        );
        const routingProfile = roughDist > 1000 ? 'driving' : 'walking';

        directionPluginRef.current = window.mappls.direction({
          map: mapRef.current,
          start: startCoord,
          end: endCoord,
          divId: panelId,
          token: apiKey,
          resource: 'route_adv',
          profile: routingProfile,
          alternatives: false,
          fitbounds: true,
          search: false,
          geolocation: false,
          routeColor: '#ea580c',
          strokeWidth: 5,
          activeColor: '#ea580c',
          activeStrokeWidth: 6,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (data: any) => {
            if (!isActive) return;

            // EXPLICIT SUCCESS: Route drawn. Mappls direction draws its own default markers.
            // Strictly remove and do NOT draw manual custom markers!
            if (data && !data.error) {
              cleanupCustomMarkers();
              onRouteCalculatedRef.current?.(data);
            }
            // EXPLICIT FAILURE: Engine threw an error -> ONLY here render fallback markers!
            else {
              console.warn('[RecipientMapplsMap] Direction returned error, displaying custom fallback pins:', data?.error);
              renderFallbackPins(false);
              onRouteErrorRef.current?.();
            }
          },
        });
      } catch (e) {
        console.warn('[RecipientMapplsMap] Direction plugin warning:', e);
        renderFallbackPins(false);
        onRouteErrorRef.current?.();
      }
    } else {
      // Plugin not available or not loaded yet -> draw fallback markers
      renderFallbackPins(false);
      onRouteErrorRef.current?.();
    }

    return () => {
      isActive = false;
      cleanupAll();
    };
  }, [
    apiKey,
    containerId,
    isMapReady,
    isSdkLoaded,
    isPluginLoaded,
    isLocating,
    activeViewerLocation?.lat,
    activeViewerLocation?.lng,
    destination?.lat,
    destination?.lng,
  ]);

  return (
    <div className={`relative w-full h-full overflow-hidden font-sans select-none ${className}`}>
      {/* Aggressive CSS Overrides */}
      <style>{`
        .mapmyindia-direction-box, .mapmyindia-search-result-box, .mappls-search-result-box,
        .search-result-box, .mappls-direction-container, .leaflet-popup, .leaflet-tooltip,
        .mapmyindia-direction-container, .mappls-direction-panel, .direction-panel,
        .direction-box, .dir-main-cntr, .dir-tabs, .dir-steps, .leaflet-routing-container,
        .leaflet-routing-alt, .leaflet-r-container, .leaflet-popup-content-wrapper,
        .mappls-tooltip, .mapmyindia-popup, .mappls-popup, .mapboxgl-popup, .dir-popup-cntr,
        .route-popup, .dir-summary-box, .mapboxgl-user-location-dot, .mappls-user-location-dot,
        .mapmyindia-location-icon, .mappls-geolocation-control, div[class*="direction"],
        div[class*="leaflet-routing"], div[class*="leaflet-popup"], div[class*="mappls-tooltip"],
        div[class*="search-result"] {
          display: none !important; visibility: hidden !important; opacity: 0 !important;
          pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important;
        }
      `}</style>

      <div
        ref={containerRef}
        id={containerId}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Hidden direction panel element providing all required DOM nodes for Mappls direction plugin */}
      <div id={`${containerId}_direction_panel`} style={{ display: 'none' }}>
        <div id={`expColSec_${containerId}`}><span></span></div>
        <div id={`${containerId}_costRT`}></div>
      </div>

      {isLocating && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mb-3 shadow-sm" />
          <span className="text-sm font-semibold text-foreground tracking-wide">Acquiring live location...</span>
        </div>
      )}

      {(!apiKey || loadError) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-6 text-center border border-border">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-foreground">
            {loadError ? 'Failed to initialize Mappls SDK' : 'Mappls API key missing'}
          </p>
        </div>
      )}
    </div>
  );
}

export default RecipientMapplsMap;