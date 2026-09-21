'use client';

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  useSyncExternalStore,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LocateFixed,
  MapPin,
  Search,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Edit3,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
import { toast } from 'sonner';
import { useAddressStore } from '@/store/useAddressStore';
import { useDigipinGps } from '@/hooks/useDigipinGps';
import { isValid, decode, formatDigipin, cleanDigipin } from '@/lib/digipin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/**
 * Isolated searchParams consumer wrapped in Suspense boundary
 * to prevent Next.js client-side navigation bailouts and rendering crashes.
 */
function CreateStepQueryHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    try {
      const step = searchParams ? searchParams.get('step') : null;
      if (step === '5') {
        const isCompleted = useAddressStore.getState().isCompleted;
        if (isCompleted) {
          router.replace('/create/success');
        } else {
          router.replace('/create/share');
        }
        return;
      }
    } catch {
      // Graceful error fallback during route transitions
    }
  }, [searchParams, router]);

  return null;
}

/**
 * /create - Step 1: Base Location & DIGIPIN Generation
 *
 * Satellite positioning & pure mathematical WGS84 DIGIPIN calculation:
 * - Pure-client side calculation in < 0.1ms (DIGIPIN-01, DIGIPIN-04)
 * - Jitter stabilization (2.5m dampener) to stop code flickering
 * - Graceful Out-of-Bounds failure: warns without crashing if coordinates fall outside India
 * - Real-time manual DIGIPIN input with live format masking and validation (DIGIPIN-03, DIGIPIN-05)
 * - Anti-slop: strict Geist typography, zero em-dashes
 */
function CreateStep1Skeleton() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-5 pt-2 pb-24 font-sans">
      <div className="space-y-1">
        <div className="bg-muted h-7 w-56 rounded" />
        <div className="bg-muted/60 h-4 w-72 rounded" />
      </div>
      <div className="border-border bg-card space-y-4 rounded-xl border p-5">
        <div className="bg-muted h-5 w-40 rounded" />
        <div className="bg-muted/70 h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function CreateStep1Page() {
  return (
    <Suspense fallback={<CreateStep1Skeleton />}>
      <CreateStep1Content />
    </Suspense>
  );
}

function CreateStep1Content() {
  const router = useRouter();
  const mounted = useMounted();
  const setDigipin = useAddressStore((state) => state.setDigipin);
  const setCoordinates = useAddressStore((state) => state.setCoordinates);

  const {
    coords,
    digipin: gpsDigipin,
    formattedDigipin: gpsFormattedDigipin,
    accuracy,
    isAcquiring,
    error: gpsError,
    isOutOfBounds,
    isTimedOut,
    refreshLocation,
  } = useDigipinGps();

  const storeDigipin = useAddressStore((state) => state.digipin);
  const storeLat = useAddressStore((state) => state.latitude);
  const storeLng = useAddressStore((state) => state.longitude);
  const storeCurrentStep = useAddressStore((state) => state.currentStep);
  const storeStep = useAddressStore((state) => state.step);

  const hasStoredLocation = Boolean(
    (storeDigipin && storeDigipin.trim().length > 0) ||
    (storeLat !== null && storeLng !== null)
  );

  const activeDigipin =
    gpsDigipin || (storeDigipin ? cleanDigipin(storeDigipin) : null);
  const activeFormattedDigipin =
    gpsFormattedDigipin ||
    storeDigipin ||
    (activeDigipin ? formatDigipin(activeDigipin) : null);
  const activeCoords =
    coords ||
    (storeLat !== null && storeLng !== null
      ? { lat: storeLat, lng: storeLng }
      : null);

  const [hasManuallyTriggered, setHasManuallyTriggered] = useState(false);
  const hasTriggeredGps = hasManuallyTriggered || hasStoredLocation;
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');

  const resetDraft = useAddressStore((state) => state.resetDraft);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const hasPromptedResumeRef = useRef(false);

  // Draft Resumption Interstitial: Check on mount if user has existing unfinished draft
  useEffect(() => {
    if (!mounted) return;
    if (hasPromptedResumeRef.current) return;

    const state = useAddressStore.getState();
    const hasExistingDraft =
      !state.isCompleted &&
      Boolean(
        (state.digipin && state.digipin.trim().length > 0) ||
        state.latitude !== null ||
        state.baseLat !== null ||
        state.doorwayPhotoUrl ||
        state.photoUrl ||
        state.doorwayPhotoBase64 ||
        state.doorwayPhotoKey ||
        state.metadata.floor ||
        state.metadata.flat ||
        state.metadata.landmark ||
        (state.currentStep && state.currentStep > 1)
      );

    if (hasExistingDraft) {
      hasPromptedResumeRef.current = true;
      queueMicrotask(() => {
        setIsResumeModalOpen(true);
      });
    }
  }, [mounted]);

  const handleRestoreProgress = () => {
    setIsResumeModalOpen(false);
    const state = useAddressStore.getState();
    const resumeStep = state.currentStep || state.step || 1;
    toast.success(`Resuming progress at Step ${resumeStep}...`);
    const STEP_ROUTES: Record<number, string> = {
      1: '/create',
      2: '/create/camera',
      3: '/create/map',
      4: '/create/metadata',
      5: '/create/share',
    };
    if (resumeStep > 1 && STEP_ROUTES[resumeStep]) {
      setIsNavigating(true);
      router.push(STEP_ROUTES[resumeStep]);
    }
  };

  const handleStartFresh = () => {
    setIsResumeModalOpen(false);
    hasPromptedResumeRef.current = true;
    resetDraft();
    setHasManuallyTriggered(false);
    setManualCode('');
    setManualError('');
    toast.info('Started fresh address session.');
  };

  const handleDetectLocation = () => {
    setHasManuallyTriggered(true);
    refreshLocation();
  };

  const cleanManual = cleanDigipin(manualCode);
  const isManualValid = isValid(cleanManual);

  const handleManualChange = (val: string) => {
    const formatted = formatDigipin(val);
    setManualCode(formatted);
    if (manualError) setManualError('');
  };

  const isContinueEnabled =
    (Boolean(activeDigipin) && Boolean(activeCoords) && !isOutOfBounds) ||
    isManualValid;

  const handleContinue = () => {
    if (!isContinueEnabled || isNavigating) return;
    setIsNavigating(true);

    if (isManualValid) {
      const decoded = decode(cleanManual);
      const formatted = formatDigipin(cleanManual);
      setDigipin(formatted);
      setCoordinates(decoded.center.lat, decoded.center.lng);
      useAddressStore.getState().setCurrentStep(2);
      useAddressStore.getState().setStep(2);
      router.push('/create/camera');
      return;
    }

    if (activeDigipin && activeCoords && !isOutOfBounds) {
      setDigipin(activeFormattedDigipin || formatDigipin(activeDigipin));
      setCoordinates(activeCoords.lat, activeCoords.lng);
      useAddressStore.getState().setCurrentStep(2);
      useAddressStore.getState().setStep(2);
      router.push('/create/camera');
      return;
    }
  };

  if (!mounted) {
    return <CreateStep1Skeleton />;
  }

  return (
    <div className="animate-in fade-in flex min-h-[calc(100vh-8rem)] flex-col space-y-5 pt-2 pb-24 font-sans duration-150">
      <Suspense fallback={<p className="sr-only">Loading...</p>}>
        <CreateStepQueryHandler />
      </Suspense>

      {/* Title & Microcopy */}
      <div>
        <h1 className="text-foreground font-sans text-xl font-bold tracking-tight md:text-2xl">
          Establish Base Location
        </h1>
        <p className="text-muted-foreground mt-0.5 font-sans text-xs md:text-sm">
          Detect your entrance location to establish your official 10-character
          DIGIPIN.
        </p>
      </div>

      {/* Geolocation Detection Card with Clean Reactive States */}
      <div className="bg-card border-border space-y-4 rounded-xl border p-5 font-sans shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
              activeDigipin && !isOutOfBounds && !isAcquiring
                ? 'border border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800'
                : isAcquiring
                  ? 'bg-accent/10 text-accent border-accent/20 border'
                  : isOutOfBounds || gpsError
                    ? 'border border-amber-200 bg-amber-500/10 text-amber-600 dark:border-amber-800'
                    : 'bg-muted text-muted-foreground border-border border'
            }`}
          >
            {isAcquiring ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : activeDigipin && !isOutOfBounds ? (
              <Check className="h-5 w-5" />
            ) : isOutOfBounds || gpsError ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <LocateFixed className="h-5 w-5" />
            )}
          </div>

          <div>
            <p className="text-foreground font-sans text-sm font-semibold">
              {isAcquiring && 'Getting your location...'}
              {activeDigipin &&
                !isOutOfBounds &&
                !isAcquiring &&
                'DIGIPIN Generated Successfully'}
              {isOutOfBounds && 'Location Outside Supported Region'}
              {gpsError && !isOutOfBounds && !isAcquiring && 'Location Error'}
              {!hasTriggeredGps &&
                !activeDigipin &&
                !isAcquiring &&
                'Ready to detect'}
            </p>
            <p className="text-muted-foreground font-sans text-xs">
              {isAcquiring &&
                'Please wait while we establish your coordinates.'}
              {activeDigipin &&
                !isOutOfBounds &&
                !isAcquiring &&
                `Doorway resolution: ±${accuracy ? Math.round(accuracy) : 4} meters.`}
              {isOutOfBounds &&
                'Device coordinates are outside India Post grid bounds.'}
              {gpsError && !isOutOfBounds && !isAcquiring && gpsError}
              {!hasTriggeredGps &&
                !activeDigipin &&
                !isAcquiring &&
                'Stand near your front entrance for highest accuracy.'}
            </p>
          </div>
        </div>

        {/* State 1: Idle (Initial State - only shown if no active location has been detected or stored) */}
        {!hasTriggeredGps && !activeDigipin && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDetectLocation}
              id="detect-location-btn"
              className="bg-accent text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg font-sans text-sm font-semibold shadow-xs transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <LocateFixed className="h-4 w-4" />
              <span>Detect My Location</span>
            </button>
          </div>
        )}

        {/* State 2: Acquiring / Loading */}
        {isAcquiring && (
          <div className="bg-muted/40 border-border text-muted-foreground flex items-center justify-center gap-2.5 rounded-lg border p-4 font-sans text-xs">
            <Loader2 className="text-accent h-4 w-4 animate-spin" />
            <span>Please wait while we establish your coordinates...</span>
          </div>
        )}

        {/* State 3: Out-of-Bounds Graceful Warning (Zero Crash) */}
        {isOutOfBounds && activeCoords && (
          <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 font-sans text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Location outside supported region</span>
            </div>
            <p className="leading-relaxed text-amber-900/80 dark:text-amber-200/80">
              Detected coordinates [{activeCoords.lat.toFixed(4)}°,{' '}
              {activeCoords.lng.toFixed(4)}°] fall outside India&apos;s
              sovereign boundary (2.5°N to 38.5°N, 63.5°E to 99.5°E).
            </p>
            <div className="flex items-center justify-between border-t border-amber-500/20 pt-2">
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                You can enter an in-bounds DIGIPIN manually below.
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-amber-900 hover:underline dark:text-amber-200"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry GPS</span>
              </button>
            </div>
          </div>
        )}

        {/* State 4: Geolocation Timeout / Error Fallback (Strict Non-Blocking UI) */}
        {gpsError && !activeDigipin && !isAcquiring && (
          <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 font-sans text-xs">
            <div className="flex items-start gap-2.5 font-semibold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">
                  {isTimedOut
                    ? 'GPS Satellite Lock Timed Out'
                    : 'Location Detection Failed'}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed font-normal text-amber-900/80 dark:text-amber-200/80">
                  {gpsError}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 border-t border-amber-500/20 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowManual(true)}
                id="timeout-manual-btn"
                className="flex h-9 w-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 font-sans text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Enter DIGIPIN Manually</span>
              </button>
              <button
                type="button"
                onClick={handleDetectLocation}
                id="timeout-retry-gps-btn"
                className="border-border bg-card text-foreground hover:bg-muted flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 font-sans text-xs font-semibold transition-all active:scale-[0.98] sm:w-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry GPS Lock</span>
              </button>
            </div>
          </div>
        )}

        {/* State 5: Success - Locked DIGIPIN & Coordinates Readout */}
        {activeDigipin && !isOutOfBounds && activeCoords && !isAcquiring && (
          <div className="bg-muted/40 border-border space-y-3 rounded-lg border p-4 font-sans">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Computed DIGIPIN
              </span>
              <span className="flex items-center gap-1 font-mono font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                High Precision (±{accuracy ? Math.round(accuracy) : 4}m)
              </span>
            </div>

            {/* Prominent DIGIPIN Monospace Code */}
            <div className="bg-card border-border flex items-center justify-between rounded-lg border px-3.5 py-2.5 shadow-2xs">
              <span className="text-foreground font-mono text-xl font-black tracking-widest md:text-2xl">
                {activeFormattedDigipin}
              </span>
              <span className="bg-accent/10 text-accent rounded px-2 py-0.5 font-sans text-[10px] font-semibold uppercase">
                Official WGS84
              </span>
            </div>

            {/* Coordinates and Retry */}
            <div className="border-border/80 flex items-center justify-between border-t pt-1 text-xs">
              <span className="text-muted-foreground font-mono text-[11px]">
                {activeCoords.lat.toFixed(6)}° N, {activeCoords.lng.toFixed(6)}°
                E
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-accent inline-flex cursor-pointer items-center gap-1 font-sans text-xs font-medium hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh Fix</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Option with Real-Time Validation */}
      <div className="font-sans">
        {!showManual ? (
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-1 font-sans text-xs font-medium transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Enter DIGIPIN manually</span>
          </button>
        ) : (
          <div className="bg-card border-border animate-in fade-in zoom-in-95 space-y-3 rounded-xl border p-4.5 font-sans shadow-xs duration-150">
            <div className="flex items-center justify-between">
              <label
                htmlFor="manual-code-input"
                className="text-foreground font-sans text-xs font-semibold"
              >
                Manual DIGIPIN Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowManual(false);
                  setManualCode('');
                  setManualError('');
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                aria-label="Cancel manual entry"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative">
              <input
                id="manual-code-input"
                type="text"
                autoFocus
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="e.g. 39J-M99-P923"
                maxLength={14}
                value={manualCode}
                onChange={(e) => handleManualChange(e.target.value)}
                className={`bg-background placeholder:text-muted-foreground w-full rounded-lg border px-3.5 py-2.5 font-mono text-sm tracking-widest uppercase transition-colors outline-none ${
                  cleanManual.length === 10
                    ? isManualValid
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-destructive focus:ring-destructive/20 focus:ring-2'
                    : 'focus:border-primary focus:ring-primary/20 border-zinc-300 focus:ring-2 dark:border-zinc-700'
                }`}
              />
            </div>

            {/* Validation Feedback */}
            {cleanManual.length > 0 && cleanManual.length < 10 && (
              <p className="text-muted-foreground font-sans text-[11px]">
                {10 - cleanManual.length} characters remaining (
                {cleanManual.length}/10)
              </p>
            )}

            {cleanManual.length === 10 && isManualValid && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span>Valid India Post DIGIPIN verified</span>
              </div>
            )}

            {cleanManual.length === 10 && !isManualValid && (
              <p className="text-destructive text-xs font-medium">
                Invalid code. Characters must only be from charset:
                23456789CJKLMPFT
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="bg-card/95 border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans backdrop-blur-sm">
        <div className="mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
          {isContinueEnabled ? (
            <button
              type="button"
              id="create-step1-continue"
              disabled={isNavigating}
              onClick={handleContinue}
              className="bg-accent text-accent-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm py-3.5 font-sans text-sm font-semibold shadow-xs transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:text-base"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 fill-current" />
                  <span>Lock DIGIPIN &amp; Continue</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              id="create-step1-continue"
              className="bg-muted text-muted-foreground flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-sm py-3.5 font-sans text-sm font-semibold opacity-60 md:text-base"
            >
              <MapPin className="h-4 w-4" />
              <span>Detect location to continue</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Resume Previous Progress Interstitial Dialog ───────────────── */}
      <Dialog open={isResumeModalOpen} onOpenChange={setIsResumeModalOpen}>
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={false}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <div className="flex items-center gap-2">
              <div className="bg-accent/10 border-accent/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border">
                <RotateCcw className="text-accent h-4 w-4" />
              </div>
              <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
                Resume Previous Progress?
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              You have an unfinished address creation draft. Would you like to
              restore your entered details or start over with a fresh session?
            </DialogDescription>
          </DialogHeader>

          {/* Draft Summary Details */}
          <div className="bg-muted/50 border-border/80 my-1 space-y-1.5 rounded-[4px] border p-3 font-sans text-xs">
            <div className="text-muted-foreground flex items-center justify-between">
              <span>Saved Stage:</span>
              <span className="text-foreground font-semibold">
                Step {storeCurrentStep || storeStep || 1} of 5
              </span>
            </div>
            {storeDigipin && (
              <div className="text-muted-foreground flex items-center justify-between">
                <span>DIGIPIN:</span>
                <span className="text-foreground font-mono font-semibold">
                  {storeDigipin}
                </span>
              </div>
            )}
            {storeLat !== null && storeLng !== null && (
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Coordinates:</span>
                <span className="text-foreground font-mono font-semibold">
                  {storeLat.toFixed(4)}°, {storeLng.toFixed(4)}°
                </span>
              </div>
            )}
          </div>

          <div className="border-border mt-2 flex items-center justify-end gap-2.5 border-t pt-4 font-sans">
            <button
              type="button"
              id="resume-modal-start-over-btn"
              onClick={handleStartFresh}
              className="border-border text-foreground bg-background hover:bg-muted cursor-pointer rounded-[4px] border px-3.5 py-2 font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] md:text-sm"
            >
              Start Over
            </button>
            <button
              type="button"
              id="resume-modal-restore-btn"
              onClick={handleRestoreProgress}
              className="bg-primary text-primary-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 font-sans text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] md:text-sm"
            >
              <span>Restore Progress</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
