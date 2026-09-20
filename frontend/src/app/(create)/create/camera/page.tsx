'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Camera,
  RefreshCw,
  AlertTriangle,
  Check,
  RotateCcw,
  MapPin,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAddressStore, useHasHydrated, setActiveCloudinaryPromise } from '@/store/useAddressStore';
import { saveCameraBlob, getCameraBlob } from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * Helper to downscale and compress an image or video frame into WebP (< 300KB)
 * and natively strip all EXIF metadata.
 */
async function compressImageToWebp(
  source: HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension = 1280,
  quality = 0.75
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  let width = sourceWidth;
  let height = sourceHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context initialization failed.');
  }

  // Draw video frame to canvas (natively drops EXIF metadata)
  ctx.drawImage(source, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Safe fallback to jpeg if browser fails webp export
          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob) resolve(jpegBlob);
              else reject(new Error('Image blob export failed.'));
            },
            'image/jpeg',
            quality
          );
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * /create/camera - Step 2: Visual Lock (Real-Time Hardware Camera Capture Only)
 *
 * Strict UX & Privacy Engineering:
 * 1. Hardware-only real-time capture: Zero file uploads or gallery pickers allowed.
 * 2. Instant hardware track shutdown: Stops all camera tracks immediately upon frame extraction.
 * 3. 4:3 architectural framing reticle with corner brackets.
 * 4. Offscreen canvas frame extraction, EXIF stripping, and WebP compression (< 300KB).
 * 5. IndexedDB (Dexie) Blob persistence and Zustand sync.
 * 6. Hydration restoration on page reload from IndexedDB.
 * 7. Explicit step-by-step camera permission instructions with reload action.
 * 8. Utilitarian light-mode zinc aesthetic with zero em-dashes.
 */
export default function CreateCameraPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const baseLat = useAddressStore((state) => state.latitude);
  const baseLng = useAddressStore((state) => state.longitude);

  const setPhotoBlob = useAddressStore((state) => state.setPhotoBlob);
  const setPhotoUrl = useAddressStore((state) => state.setPhotoUrl);
  const setPhotoKey = useAddressStore((state) => state.setPhotoKey);
  const setPhotoBase64 = useAddressStore((state) => state.setPhotoBase64);
  const doorwayPhotoBlob = useAddressStore((state) => state.doorwayPhotoBlob);
  const doorwayPhotoKey = useAddressStore((state) => state.doorwayPhotoKey);
  const doorwayPhotoBase64 = useAddressStore((state) => state.doorwayPhotoBase64);
  const existingPhotoUrl = useAddressStore((state) => state.doorwayPhotoUrl);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(doorwayPhotoBase64 || existingPhotoUrl || null);
  const [blobSizeKB, setBlobSizeKB] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Route protection: Wait for Zustand storage hydration before evaluating coordinates
  useEffect(() => {
    if (!hasHydrated) return;
    if (baseLat === null || baseLng === null) {
      router.replace('/create');
    }
  }, [hasHydrated, baseLat, baseLng, router]);

  // Stop hardware camera stream and release hardware tracks immediately
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Initialize camera with specified facingMode
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not supported on this browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsStreaming(true);
        };
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permission to access camera was denied. Please allow camera access in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No physical camera device was detected on your system.');
      } else {
        setCameraError(err.message || 'Failed to initialize camera.');
      }
      setIsStreaming(false);
    }
  }, [facingMode, stopStream]);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

  // Hydration Restoration: Restore saved photo from Base64 or IndexedDB on page reload
  useEffect(() => {
    if (!hasHydrated) return;
    if (baseLat === null || baseLng === null) return;

    let isMounted = true;

    async function hydrateSavedPhoto() {
      // 1. Direct photoUrl / doorwayPhotoBase64 restoration (survives tab close and page reloads)
      const currentPhoto = existingPhotoUrl || doorwayPhotoBase64;
      if (
        currentPhoto &&
        (currentPhoto.startsWith('data:image/') ||
          currentPhoto.startsWith('http://') ||
          currentPhoto.startsWith('https://'))
      ) {
        if (isMounted) {
          setPreviewUrl(currentPhoto);
          setPhotoUrl(currentPhoto);
          setIsHydrating(false);
          return;
        }
      }

      // 2. IndexedDB (Dexie) blob recovery fallback
      if (doorwayPhotoKey) {
        try {
          const record = await getCameraBlob(doorwayPhotoKey);
          if (record?.blob && isMounted) {
            const base64 = await blobToBase64(record.blob);
            setPreviewUrl(base64);
            setBlobSizeKB(Math.round(record.blob.size / 1024));
            setPhotoBlob(record.blob);
            setPhotoUrl(base64);
            setPhotoBase64(base64);
            setIsHydrating(false);
            return; // Photo restored, bypass camera initialization
          }
        } catch (err) {
          console.warn('Failed to restore photo from IndexedDB:', err);
        }
      }

      if (isMounted) {
        setIsHydrating(false);
        startCamera();
      }
    }

    hydrateSavedPhoto();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [hasHydrated, baseLat, baseLng, doorwayPhotoKey, doorwayPhotoBase64, existingPhotoUrl, startCamera, stopStream, setPhotoBlob, setPhotoUrl, setPhotoBase64]);

  // Save WebP blob into Base64 data URI, sync to IndexedDB and Zustand store
  const persistAndPreviewBlob = async (blob: Blob) => {
    try {
      const base64DataUri = await blobToBase64(blob);
      const { id } = await saveCameraBlob(blob);

      setPreviewUrl(base64DataUri);
      setBlobSizeKB(Math.round(blob.size / 1024));

      setPhotoBlob(blob);
      // Crucial: Store Base64 string directly in photoUrl instead of ephemeral blob: URL
      setPhotoUrl(base64DataUri);
      setPhotoBase64(base64DataUri);
      setPhotoKey(id);
    } catch (err) {
      console.error('Failed to encode and persist blob:', err);
    }
  };

  // Capture frame from active video element with immediate track shutdown
  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current || !isStreaming || isProcessing) return;

    try {
      setIsProcessing(true);
      const video = videoRef.current;

      // 1. Draw frame to canvas offscreen
      const blob = await compressImageToWebp(
        video,
        video.videoWidth || 1280,
        video.videoHeight || 960,
        1280,
        0.75
      );

      // 2. PRIVACY REQUIREMENT: Shut down hardware camera tracks the exact moment photo is captured!
      stopStream();

      // 3. Persist to Dexie IndexedDB and Zustand store as Base64
      await persistAndPreviewBlob(blob);
    } catch (err: any) {
      console.error('Capture failed:', err);
      alert('Failed to capture frame: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setBlobSizeKB(null);
    setPhotoBlob(null);
    setPhotoUrl(null);
    setPhotoKey(null);
    setPhotoBase64(null);
    useAddressStore.getState().setUploadPromise(null);
    setActiveCloudinaryPromise(null);
    startCamera();
  };

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleContinue = () => {
    if (!previewUrl) return;

    // Persist wizard currentStep = 3 before navigating
    useAddressStore.getState().setCurrentStep(3);

    // Resolve active photo data for background upload
    const fileOrDataToUpload = doorwayPhotoBlob || doorwayPhotoBase64 || previewUrl;

    // CORE UX REQUIREMENT: Instantly route user to Step 3 so their flow is uninterrupted
    router.push('/create/map');

    // Execute deferred unsigned upload to Cloudinary asynchronously in the background
    if (fileOrDataToUpload) {
      const uploadPromise = uploadToCloudinary(fileOrDataToUpload)
        .then((result) => {
          if (result.success && result.url) {
            // Silently replace Base64 string in Zustand store with returned Cloudinary secure_url
            useAddressStore.getState().setPhotoUrl(result.url);
            return result.url;
          } else {
            console.warn('[Camera] Cloudinary background upload result:', result.error);
            return null;
          }
        })
        .catch((err) => {
          console.warn('[Camera] Cloudinary background upload error:', err);
          return null;
        });

      // Store in Zustand store and module-level ref for Step 5 to await
      useAddressStore.getState().setUploadPromise(uploadPromise);
      setActiveCloudinaryPromise(uploadPromise);
    }
  };

  // Wait momentarily for Zustand storage rehydration to finish
  if (!hasHydrated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-accent mb-2" />
        <span className="text-xs font-medium text-muted-foreground font-sans">Restoring address session...</span>
      </div>
    );
  }

  if (baseLat === null || baseLng === null) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 animate-in fade-in duration-150 pt-2 space-y-4 font-sans">
      {/* Header Info */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-sans text-foreground tracking-tight">
          Capture Visual Lock
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 font-sans">
          Take a real-time photo of your front entrance or door number. Delivery agents use this to confirm they have reached the right doorstep.
        </p>
      </div>

      {/* ─── SCENARIO 0: HYDRATING PERSISTED PHOTO ON RELOAD ─────────────── */}
      {isHydrating ? (
        <div className="bg-card border border-border rounded-xl p-12 shadow-xs flex flex-col items-center justify-center gap-3 text-muted-foreground font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <span className="text-xs font-medium">Checking saved visual lock...</span>
        </div>
      ) : previewUrl ? (
        /* ─── SCENARIO A: PREVIEW / REVIEW STATE (CAMERA SHUT OFF) ───────── */
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-4 font-sans animate-in zoom-in-95 duration-150">
          <div className="relative aspect-[4/3] w-full max-w-lg mx-auto bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center">
            <Image
              src={previewUrl}
              alt="Doorway Visual Lock"
              fill
              unoptimized
              className="object-cover"
            />

            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-white text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>EXIF Stripped</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-border text-xs">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                Visual Lock Ready {blobSizeKB ? `(${blobSizeKB} KB • WebP)` : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-muted text-foreground font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─── SCENARIO B: LIVE VIEWFINDER OR PERMISSION INSTRUCTIONS ─────── */
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-4 font-sans">
          {cameraError ? (
            /* Explicit Step-by-Step Camera Permission Instructions */
            <div className="p-5 sm:p-6 rounded-lg bg-card border border-zinc-200 dark:border-zinc-800 text-left space-y-4 font-sans max-w-md mx-auto shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Camera Access Required
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Camera access is required for the Visual Lock.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 border border-border/80 rounded-lg p-3.5 space-y-2.5 text-xs font-sans">
                <p className="font-semibold text-foreground">
                  Follow these steps to enable camera access:
                </p>
                <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside leading-relaxed">
                  <li>
                    Click the <span className="font-semibold text-foreground">🔒 lock icon</span> in your browser&apos;s address bar.
                  </li>
                  <li>
                    Go to <span className="font-semibold text-foreground">Site Settings / Permissions</span>.
                  </li>
                  <li>
                    Set <span className="font-semibold text-foreground">Camera</span> to <span className="font-semibold text-emerald-600">Allow</span>.
                  </li>
                  <li>
                    Reload the page.
                  </li>
                </ol>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  id="reload-camera-page-btn"
                  onClick={() => window.location.reload()}
                  className="w-full h-10 bg-accent text-accent-foreground font-semibold text-xs rounded-lg flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-xs font-sans"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Page</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Live Viewfinder with 4:3 Reticle */
            <div className="relative aspect-[4/3] w-full max-w-lg mx-auto bg-zinc-950 rounded-lg overflow-hidden border border-border flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* 4:3 Alignment Reticle */}
              <div className="absolute w-[82%] aspect-[4/3] rounded-md pointer-events-none">
                {/* Reticle Corner Brackets */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-accent" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-accent" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-accent" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-accent" />

                {/* Reticle Guide Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-3">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-xs font-sans">
                    Doorway Framing
                  </span>
                  <span className="text-[11px] font-medium text-white/90 drop-shadow-sm font-sans">
                    Align entrance in center
                  </span>
                </div>
              </div>

              {/* Camera Flip Option */}
              <button
                type="button"
                onClick={handleToggleCamera}
                title="Flip Camera"
                aria-label="Flip Camera"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Processing Spinner Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white text-xs font-medium">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <span>Compressing WebP &amp; Stripping EXIF...</span>
                </div>
              )}
            </div>
          )}

          {/* Viewfinder Controls (Shutter Button Only - Real-Time Hardware Only) */}
          {!cameraError && (
            <div className="flex flex-col items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!isStreaming || isProcessing}
                id="camera-shutter-btn"
                aria-label="Capture doorway photo"
                className="w-16 h-16 rounded-full bg-accent text-accent-foreground border-4 border-card flex items-center justify-center shadow-md hover:opacity-95 active:scale-[0.92] transition-transform duration-75 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-7 h-7 fill-current" />
              </button>

              <span className="text-xs text-muted-foreground font-sans font-medium">
                Tap shutter to capture
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Thumb-Zone CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          {previewUrl ? (
            <button
              type="button"
              id="camera-continue-btn"
              onClick={handleContinue}
              className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-semibold text-sm md:text-base py-3.5 rounded-lg hover:opacity-95 active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
            >
              <MapPin className="w-4 h-4 fill-current" />
              <span>Lock Photo &amp; Set Entrance Pin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              id="camera-continue-btn"
              className="flex items-center justify-center gap-2 w-full bg-muted text-muted-foreground font-semibold text-sm md:text-base py-3.5 rounded-lg opacity-60 cursor-not-allowed font-sans"
            >
              <Camera className="w-4 h-4" />
              <span>Capture doorway photo to continue</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
