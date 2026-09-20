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
export function EditCameraModal({ isOpen, onClose, onCapture }: EditCameraModalProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
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
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      const errorObj = err as { name?: string; message?: string } | undefined;
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        setCameraError('Permission to access camera was denied. Please allow camera access in browser settings.');
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        setCameraError('No physical camera device was detected on your system.');
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
    if (!videoRef.current || !streamRef.current || !isStreaming || isProcessing) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl overflow-hidden shadow-2xl flex flex-col text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <Camera className="w-4 h-4 text-primary" />
            <span>Retake Doorway Photo</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-4 flex flex-col items-center">
          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Camera Access Required</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : (
            <div className="relative aspect-[4/3] w-full bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* 4:3 Reticle Corner Brackets */}
              <div className="absolute w-[82%] aspect-[4/3] rounded-md pointer-events-none">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

                <div className="absolute inset-0 flex flex-col items-center justify-between p-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/60 text-white font-sans">
                    Doorway Framing
                  </span>
                  <span className="text-[11px] font-medium text-white drop-shadow-sm font-sans">
                    Align entrance in center
                  </span>
                </div>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleToggleCamera}
                title="Flip Camera"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 text-white text-xs font-medium">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
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
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground border-4 border-card flex items-center justify-center shadow-lg hover:opacity-90 active:scale-[0.92] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Capture photo"
              >
                <Camera className="w-7 h-7 fill-current" />
              </button>
              <span className="text-[11px] text-muted-foreground font-medium">
                Tap shutter to capture entrance
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
