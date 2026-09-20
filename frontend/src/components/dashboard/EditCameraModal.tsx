'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, AlertTriangle, Loader2 } from 'lucide-react';

interface EditCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

/**
 * Downscale and compress video frame to WebP (< 300KB) and drop EXIF metadata.
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

  ctx.drawImage(source, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
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
 * EditCameraModal: Live device hardware camera capture for Edit Micro-Address flow.
 * Reuses the exact camera reticle framing and frame compression from Step 2.
 */
export function EditCameraModal({
  isOpen,
  onClose,
  onCapture,
}: EditCameraModalProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera API is not supported on this browser or environment.'
        );
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
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      const errorObj = err as { name?: string; message?: string } | undefined;
      if (
        errorObj?.name === 'NotAllowedError' ||
        errorObj?.name === 'PermissionDeniedError'
      ) {
        setCameraError(
          'Permission to access camera was denied. Please allow camera access in browser settings.'
        );
      } else if (
        errorObj?.name === 'NotFoundError' ||
        errorObj?.name === 'DevicesNotFoundError'
      ) {
        setCameraError(
          'No physical camera device was detected on your system.'
        );
      } else {
        setCameraError(errorObj?.message || 'Failed to initialize camera.');
      }
      setIsStreaming(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    if (isOpen) {
      timeoutId = setTimeout(() => {
        startCamera();
      }, 0);
    } else {
      stopStream();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current || !isStreaming || isProcessing)
      return;

    try {
      setIsProcessing(true);
      const video = videoRef.current;

      const blob = await compressImageToWebp(
        video,
        video.videoWidth || 1280,
        video.videoHeight || 960,
        1280,
        0.75
      );

      stopStream();
      onCapture(blob);
      onClose();
    } catch (err: unknown) {
      console.error('Capture failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to capture frame: ' + message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 font-sans duration-150 sm:p-4">
      <div className="bg-card border-border text-card-foreground relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-2xl">
        {/* Header */}
        <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3">
          <div className="text-foreground flex items-center gap-2 text-xs font-semibold sm:text-sm">
            <Camera className="text-primary h-4 w-4" />
            <span>Retake Doorway Photo</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-md p-1.5 transition-colors"
            aria-label="Close camera"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="flex flex-col items-center p-4">
          {cameraError ? (
            <div className="max-w-sm space-y-3 p-6 text-center">
              <div className="bg-destructive/10 text-destructive border-destructive/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full border">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-foreground text-sm font-bold">
                Camera Access Required
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="bg-primary text-primary-foreground mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : (
            <div className="border-border relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border bg-black shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />

              {/* 4:3 Reticle Corner Brackets */}
              <div className="pointer-events-none absolute aspect-[4/3] w-[82%] rounded-md">
                <div className="absolute -top-0.5 -left-0.5 h-6 w-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute -top-0.5 -right-0.5 h-6 w-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute -right-0.5 -bottom-0.5 h-6 w-6 border-r-2 border-b-2 border-cyan-400" />

                <div className="absolute inset-0 flex flex-col items-center justify-between p-2">
                  <span className="rounded bg-black/60 px-2 py-0.5 font-sans text-[10px] font-semibold tracking-wider text-white uppercase">
                    Doorway Framing
                  </span>
                  <span className="font-sans text-[11px] font-medium text-white drop-shadow-sm">
                    Align entrance in center
                  </span>
                </div>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleToggleCamera}
                title="Flip Camera"
                className="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80 active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 text-xs font-medium text-white">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  <span>Processing WebP...</span>
                </div>
              )}
            </div>
          )}

          {/* Shutter Button */}
          {!cameraError && (
            <div className="flex flex-col items-center justify-center gap-1.5 pt-4">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!isStreaming || isProcessing}
                className="bg-primary text-primary-foreground border-card flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 shadow-lg transition-all hover:opacity-90 active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Capture photo"
              >
                <Camera className="h-7 w-7 fill-current" />
              </button>
              <span className="text-muted-foreground text-[11px] font-medium">
                Tap shutter to capture entrance
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
