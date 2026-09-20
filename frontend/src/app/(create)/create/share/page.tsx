'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  Edit3,
  Clock,
  Shield,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAddressStore, useHasHydrated, getActiveCloudinaryPromise } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/app/actions/auth';
import { db, getCameraBlob } from '@/lib/db';
import { createAddress } from '@/app/actions/createAddress';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { nanoid } from 'nanoid';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/**
 * /create/share - Step 5 of 5: Review & Publish
 *
 * 4. Correct Validation Logic: ONLY Base Location (Step 1 GPS / code) is mandatory.
 *    Visual Lock, Entrance Pin adjustments, Z-Axis, and Security are 100% optional.
 *    CTA activates immediately once Base Location exists in state.
 * 5. Full-stack publishing pipeline via createAddress server action.
 */
export default function CreateSharePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate global auth state from server session on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const session = await getSessionAction();
        if (session?.user) {
          useAuthStore.getState().setUser(session.user);
        }
      } catch {
        // Unauthenticated
      }
    }
    checkAuthSession();
  }, []);

  // Explicit reactive subscriptions to useAddressStore
  const storeMetadata = useAddressStore((state) => state.metadata);
  const digipin = useAddressStore((state) => state.digipin);
  const latitude = useAddressStore((state) => state.latitude);
  const longitude = useAddressStore((state) => state.longitude);
  const entranceLat = useAddressStore((state) => state.entranceLat);
  const entranceLng = useAddressStore((state) => state.entranceLng);
  const photoBlob = useAddressStore((state) => state.doorwayPhotoBlob);
  const photoUrlStore = useAddressStore((state) => state.doorwayPhotoUrl);
  const doorwayPhotoKey = useAddressStore((state) => state.doorwayPhotoKey);
  const doorwayPhotoBase64 = useAddressStore((state) => state.doorwayPhotoBase64);
  const setSlug = useAddressStore((state) => state.setSlug);
  const setPhotoUrlStore = useAddressStore((state) => state.setPhotoUrl);
  const setIsCompleted = useAddressStore((state) => state.setIsCompleted);

  const [photoUrl, setPhotoUrl] = useState<string | null>(doorwayPhotoBase64 || photoUrlStore || null);
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Route protection: Wait for Zustand storage hydration before evaluating coordinates
  useEffect(() => {
    if (!mounted || !hasHydrated) return;
    if (latitude === null || longitude === null) {
      router.replace('/create');
    }
  }, [mounted, hasHydrated, latitude, longitude, router]);

  // Robust photo hydration: Restore photo for display on the review page.
  // CRITICAL: blob: URLs are NEVER written back to the Zustand store (they are ephemeral and won't survive reloads).
  // Only http:// and data:image/ URLs are stored in Zustand.
  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    async function restorePhoto() {
      // 1. Best case: store already has a valid Cloudinary or Base64 URL
      const existingStoreUrl = useAddressStore.getState().photoUrl || useAddressStore.getState().doorwayPhotoUrl;
      if (
        existingStoreUrl &&
        (existingStoreUrl.startsWith('http://') ||
          existingStoreUrl.startsWith('https://') ||
          existingStoreUrl.startsWith('data:image/'))
      ) {
        if (active) setPhotoUrl(existingStoreUrl);
        return;
      }

      // 2. In-memory Blob available (just navigated from camera step)
      if (photoBlob) {
        createdBlobUrl = URL.createObjectURL(photoBlob);
        if (active) {
          setPhotoUrl(createdBlobUrl);
          // Do NOT call setPhotoUrlStore — blob: URLs must never enter Zustand persistence
        }
        return;
      }

      // 3. Fetch persisted blob from Dexie IndexedDB
      try {
        let record = doorwayPhotoKey ? await getCameraBlob(doorwayPhotoKey) : null;
        if (!record) {
          record = (await db.camera_blobs.orderBy('createdAt').last()) || null;
        }

        if (active && record?.blob) {
          useAddressStore.getState().setPhotoBlob(record.blob);
          if (record.id && !doorwayPhotoKey) {
            useAddressStore.getState().setPhotoKey(record.id);
          }
          createdBlobUrl = URL.createObjectURL(record.blob);
          // Local display only — blob: URL stays out of Zustand store
          if (active) setPhotoUrl(createdBlobUrl);
        }
      } catch (err) {
        console.warn('[share] Failed to restore photo from Dexie IndexedDB:', err);
      }

      // 4. Fallback: persisted base64 string in Zustand (survives reloads)
      if (active && !createdBlobUrl) {
        const base64 = useAddressStore.getState().doorwayPhotoBase64;
        if (base64) {
          setPhotoUrl(base64);
          // base64 already in store — no write needed
        }
      }
    }

    if (hasHydrated) {
      restorePhoto();
    }

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [hasHydrated, photoBlob, doorwayPhotoKey, setPhotoUrlStore]);

  // Validation: ONLY Base Location (Step 1 code or GPS coordinates) is strictly mandatory
  const isBaseLocationPresent = Boolean(
    (digipin && digipin.trim().length > 0) ||
    (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude))
  );
  const isValid = isBaseLocationPresent && !isSubmitting;

  // Real store data extraction
  const code = (digipin && digipin.trim()) || '4M8K-9P2L-1X';
  const hasCoordinates =
    latitude !== null &&
    longitude !== null &&
    !isNaN(latitude) &&
    !isNaN(longitude);
  const coordinates = hasCoordinates
    ? `${latitude!.toFixed(4)}° N, ${longitude!.toFixed(4)}° E`
    : 'Base coordinates acquired';

  const floor = storeMetadata?.floor?.trim() || '';
  const flat = storeMetadata?.flat?.trim() || '';
  const hints = storeMetadata?.landmark?.trim() || '';
  const tag = storeMetadata?.customTag?.trim() || storeMetadata?.label?.trim() || '';
  const hasFloorOrFlat = Boolean(floor || flat);
  const floorFlatText = [floor, flat].filter(Boolean).join(', ');
  const hasZAxisData = Boolean(hasFloorOrFlat || hints);

  const handleGenerate = () => {
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission even before re-render
    if (isSubmitting || isSubmittingRef.current) return;
    if (!isValid || latitude === null || longitude === null) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    // 1. OPTIMISTIC UI: Generate unique short slug on the client-side immediately
    const clientSlug = `dg-${nanoid(12)}`;

    const currentExpiry = storeMetadata?.expiry || '30m';
    let computedExpiresAt: string | null = null;
    if (currentExpiry !== 'never') {
      let durationMs = 30 * 60 * 1000;
      if (currentExpiry === '1h') durationMs = 60 * 60 * 1000;
      else if (currentExpiry === '12h') durationMs = 12 * 60 * 60 * 1000;
      else if (currentExpiry === '24h') durationMs = 24 * 60 * 60 * 1000;
      else if (currentExpiry === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
      computedExpiresAt = new Date(Date.now() + durationMs).toISOString();
    }

    // 2. Instantly update Zustand store so the Success screen has the active slug, expiry, and link ready
    const isAuthed = useAuthStore.getState().isAuthenticated;
    if (isAuthed) {
      useAddressStore.getState().setIsSaved(true);
      useAddressStore.getState().setSaveToAccount(true);
    }
    useAddressStore.getState().setExpiresAt(computedExpiresAt);
    useAddressStore.getState().setIsEphemeral(currentExpiry !== 'never');
    setSlug(clientSlug, currentExpiry !== 'never');
    setIsCompleted(true);

    // 3. CORE UX REQUIREMENT: Instantly transition to Success screen without blocking on DB
    router.push('/create/success');

    // 4. Fire the server action asynchronously in the background
    (async () => {
      try {
        // RACE CONDITION FIX: Await the Cloudinary upload promise before executing DB save
        let finalPhotoUrl: string | null = null;
        const uploadPromise = useAddressStore.getState().uploadPromise || getActiveCloudinaryPromise();

        if (uploadPromise) {
          try {
            const resolvedUrl = await uploadPromise;
            if (resolvedUrl && (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://'))) {
              finalPhotoUrl = resolvedUrl;
            }
          } catch (promiseErr) {
            console.warn('[share] Error awaiting Cloudinary upload promise:', promiseErr);
          }
        }

        // If not resolved from promise, check if store has a valid http/https URL
        if (!finalPhotoUrl) {
          const storeUrl = useAddressStore.getState().doorwayPhotoUrl;
          if (storeUrl && (storeUrl.startsWith('http://') || storeUrl.startsWith('https://'))) {
            finalPhotoUrl = storeUrl;
          }
        }

        // Resolve photo blob if present
        let activeBlob: Blob | null = photoBlob;
        if (!activeBlob && doorwayPhotoKey) {
          const storedRecord = await getCameraBlob(doorwayPhotoKey);
          if (storedRecord?.blob) {
            activeBlob = storedRecord.blob;
          }
        }
        if (!activeBlob && doorwayPhotoBase64) {
          try {
            const res = await fetch(doorwayPhotoBase64);
            activeBlob = await res.blob();
          } catch (b64Err) {
            console.warn('[share] Failed to convert base64 to blob:', b64Err);
          }
        }

        // Direct upload fallback: if still no http URL and we have activeBlob, upload directly to Cloudinary now
        if (!finalPhotoUrl && activeBlob) {
          try {
            const uploadResult = await uploadToCloudinary(activeBlob);
            if (
              uploadResult.success &&
              uploadResult.url &&
              (uploadResult.url.startsWith('http://') || uploadResult.url.startsWith('https://'))
            ) {
              finalPhotoUrl = uploadResult.url;
              useAddressStore.getState().setPhotoUrl(finalPhotoUrl);
            }
          } catch (fallbackErr) {
            console.warn('[share] Fallback direct Cloudinary upload error:', fallbackErr);
          }
        }

        // Strict evaluation of saveToAccount from Zustand store
        const currentStore = useAddressStore.getState();
        const currentMetadata = currentStore.metadata || {};
        const strictSaveToAccount = currentMetadata.saveToAccount === true;

        const payload = {
          slug: clientSlug,
          digipin: digipin || code,
          baseLat: latitude,
          baseLng: longitude,
          entranceLat: entranceLat ?? latitude,
          entranceLng: entranceLng ?? longitude,
          floor: floor || '',
          flat: flat || '',
          landmark: hints || '',
          label: tag || currentMetadata.label || 'Home',
          routingNotes: hints || '',
          passcode: currentMetadata.passcode || '',
          expiry: currentMetadata.expiry || '30m',
          expiresAt: computedExpiresAt,
          saveToAccount: strictSaveToAccount,
          photoUrl: finalPhotoUrl,
        };

        console.log("PAYLOAD TO BACKEND:", payload);

        // Build FormData payload for Server Action
        const formData = new FormData();
        formData.append('slug', payload.slug);
        formData.append('digipin', payload.digipin);
        formData.append('baseLat', payload.baseLat.toString());
        formData.append('baseLng', payload.baseLng.toString());
        formData.append('entranceLat', payload.entranceLat.toString());
        formData.append('entranceLng', payload.entranceLng.toString());
        formData.append('floor', payload.floor);
        formData.append('flat', payload.flat);
        formData.append('landmark', payload.landmark);
        formData.append('label', payload.label);
        formData.append('routingNotes', payload.routingNotes);
        formData.append('passcode', payload.passcode);
        formData.append('expiry', payload.expiry);
        if (payload.expiresAt) {
          formData.append('expiresAt', payload.expiresAt);
        }
        formData.append('saveToAccount', String(payload.saveToAccount));

        // STRICT VALIDATION: Ensure photoUrl starts with http. Never pass a string starting with blob:
        if (finalPhotoUrl && (finalPhotoUrl.startsWith('http://') || finalPhotoUrl.startsWith('https://'))) {
          formData.append('photoUrl', finalPhotoUrl);
        } else if (activeBlob) {
          formData.append('photo', activeBlob, 'doorway.webp');
        }

        // Fire createAddress server action in the background
        const result = await createAddress(formData);
        if (result.success) {
          if (result.photoUrl) {
            useAddressStore.getState().setPhotoUrl(result.photoUrl);
          }
          if (result.expiresAt !== undefined) {
            useAddressStore.getState().setExpiresAt(result.expiresAt);
          }
          if (result.isEphemeral !== undefined) {
            useAddressStore.getState().setIsEphemeral(result.isEphemeral);
          }
          if (result.userId) {
            useAddressStore.getState().setIsSaved(true);
            useAddressStore.getState().setSaveToAccount(true);
          }
        } else {
          setSubmitError(result.error || 'Failed to publish address');
        }
      } catch (bgErr) {
        console.error('[share] Background createAddress error:', bgErr);
        setSubmitError('Failed to publish address due to a network or server issue');
      }
    })();
  };

  // Wait momentarily for component mount and Zustand storage rehydration to finish
  if (!mounted || !hasHydrated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground font-sans">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs font-medium text-muted-foreground font-sans">Restoring review data...</span>
      </div>
    );
  }

  if (latitude === null || longitude === null) {
    return null;
  }

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 animate-in fade-in duration-150 pt-2 space-y-5 font-sans text-foreground"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* Step Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-sans text-foreground tracking-tight">
          Step 5 of 5: Review
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 font-sans">
          Verify your captured micro-address details before generating your sovereign link.
        </p>
      </div>

      {/* Validation Warning Alert only if Base Location is missing */}
      {!isBaseLocationPresent && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[4px] p-3 text-amber-900 font-sans">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-sans">
            <span className="font-semibold text-amber-950">
              Base Location Required:
            </span>{' '}
            Please lock your satellite position in Step 1 to generate a micro-address.
          </div>
        </div>
      )}

      {/* Server Action Error Banner */}
      {submitError && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-[4px] p-3 text-rose-900 font-sans animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-sans">
            <span className="font-semibold text-rose-950">Publication Error:</span>{' '}
            {submitError}
          </div>
        </div>
      )}

      {/* 4-Factor Review Card */}
      <div className="bg-card border border-border rounded-[4px] p-5 shadow-xs space-y-4 font-sans">
        {/* Factor 1: Location Code & Pin */}
        <div className="flex items-start justify-between pb-3.5 border-b border-border">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block font-sans">
              Location Code &amp; Pin
            </span>
            <div className="font-mono text-lg md:text-xl font-bold text-primary tracking-wider">
              {code}
            </div>
            <div className="space-y-0.5 pt-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Base: {coordinates}</span>
              </p>
              {entranceLat != null && entranceLng != null && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 mr-1 shrink-0" />
                  <span>Entrance Pin: {Number(entranceLat).toFixed(4)}° N, {Number(entranceLng).toFixed(4)}° E</span>
                </p>
              )}
            </div>
          </div>
          <Link
            href="/create/map"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-semibold pt-1 cursor-pointer shrink-0 font-sans"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Pin</span>
          </Link>
        </div>

        {/* Factor 2: Doorway Photo (Enlarged full-width preview) */}
        <div className="pb-4 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block font-sans">
              Doorway Visual Lock
            </span>
            <Link
              href="/create/camera"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-semibold cursor-pointer font-sans"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{photoUrl ? 'Retake Photo' : 'Add Photo'}</span>
            </Link>
          </div>

          {photoUrl ? (
            <div className="w-full aspect-video min-h-[220px] max-h-[340px] rounded-lg border border-border overflow-hidden relative shadow-xs bg-zinc-950 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Doorway visual lock"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1.5 pointer-events-none">
                <Camera className="w-3.5 h-3.5 text-accent" />
                <span>Visual Lock Attached</span>
              </div>
            </div>
          ) : (
            <div className="w-full py-6 rounded-lg border border-dashed border-border flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
              <Camera className="w-6 h-6 mb-1 text-muted-foreground/60" />
              <span className="text-xs font-medium text-foreground">No doorway photo provided</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">Optional visual lock for couriers</span>
            </div>
          )}
        </div>

        {/* Factor 3 & 4: Z-Axis Details & Security */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 text-xs w-full">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block font-sans">
                Z-Axis &amp; Security Details
              </span>
              {tag ? (
                <span className="px-1.5 py-0.5 rounded-[4px] bg-muted text-[10px] font-semibold text-foreground border border-border font-sans">
                  {tag}
                </span>
              ) : null}
            </div>

            {hasZAxisData ? (
              <>
                {hasFloorOrFlat && (
                  <p className="text-sm font-semibold text-foreground font-sans">
                    {floorFlatText}
                  </p>
                )}
                {hints && (
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    {hints}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-zinc-400 font-sans">
                No additional doorway details provided.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 text-xs font-medium text-foreground">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>
                  Link Expiry: {storeMetadata?.expiry === 'never' ? 'Permanent' : storeMetadata?.expiry === '24h' ? '24 Hours' : storeMetadata?.expiry === '1h' ? '1 Hour' : '30 Minutes'}
                </span>
              </div>
              {storeMetadata?.passcode ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Passcode Protected</span>
                </div>
              ) : null}
            </div>
          </div>
          <Link
            href="/create/metadata"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-semibold pt-0.5 shrink-0 ml-3 cursor-pointer font-sans"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </Link>
        </div>
      </div>

      {/* Bottom CTA: Generate Micro-Address */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <button
            type="button"
            id="share-generate-btn"
            onClick={handleGenerate}
            disabled={!isValid || isSubmitting}
            aria-disabled={!isValid || isSubmitting}
            className={`flex items-center justify-center gap-2 w-full font-semibold text-sm md:text-base py-3.5 rounded-[4px] transition-[transform,opacity] duration-150 ease-out font-sans ${
              isValid && !isSubmitting
                ? 'bg-accent text-accent-foreground hover:opacity-95 active:scale-[0.98] shadow-sm cursor-pointer'
                : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-accent-foreground" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate Micro-Address</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
