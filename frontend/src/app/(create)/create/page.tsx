'use client';
 
import { useState, useEffect, useRef, Suspense, useSyncExternalStore } from 'react';
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
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
import { toast } from 'sonner';
import { useAddressStore } from '@/store/useAddressStore';
import { useDigipinGps } from '@/hooks/useDigipinGps';
import {
  isValid,
  decode,
  formatDigipin,
  cleanDigipin,
} from '@/lib/digipin';
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
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 pt-2 space-y-5 font-sans animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-56 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted/60 rounded" />
      </div>
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="h-12 w-full bg-muted/70 rounded-lg" />
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

  const activeDigipin = gpsDigipin || (storeDigipin ? cleanDigipin(storeDigipin) : null);
  const activeFormattedDigipin =
    gpsFormattedDigipin || storeDigipin || (activeDigipin ? formatDigipin(activeDigipin) : null);
  const activeCoords =
    coords || (storeLat !== null && storeLng !== null ? { lat: storeLat, lng: storeLng } : null);

  const [hasManuallyTriggered, setHasManuallyTriggered] = useState(false);
  const hasTriggeredGps = hasManuallyTriggered || hasStoredLocation;
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');

  const resetDraft = useAddressStore((state) => state.resetDraft);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
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
    (Boolean(activeDigipin) && Boolean(activeCoords) && !isOutOfBounds) || isManualValid;

  const handleContinue = () => {
    if (!isContinueEnabled) return;

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
    }
  };

  if (!mounted) {
    return <CreateStep1Skeleton />;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 animate-in fade-in duration-150 pt-2 space-y-5 font-sans">
      <Suspense fallback={<p className="sr-only">Loading...</p>}>
        <CreateStepQueryHandler />
      </Suspense>

      {/* Title & Microcopy */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-sans text-foreground tracking-tight">
          Establish Base Location
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 font-sans">
          Detect your entrance location to establish your official 10-character DIGIPIN.
        </p>
      </div>

      {/* Geolocation Detection Card with Clean Reactive States */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              activeDigipin && !isOutOfBounds && !isAcquiring
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                : isAcquiring
                ? 'bg-accent/10 text-accent border border-accent/20'
                : isOutOfBounds || gpsError
                ? 'bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {isAcquiring ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : activeDigipin && !isOutOfBounds ? (
              <Check className="w-5 h-5" />
            ) : isOutOfBounds || gpsError ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <LocateFixed className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground font-sans">
              {isAcquiring && 'Getting your location...'}
              {activeDigipin && !isOutOfBounds && !isAcquiring && 'DIGIPIN Generated Successfully'}
              {isOutOfBounds && 'Location Outside Supported Region'}
              {gpsError && !isOutOfBounds && !isAcquiring && 'Location Error'}
              {!hasTriggeredGps && !activeDigipin && !isAcquiring && 'Ready to detect'}
            </p>
            <p className="text-xs text-muted-foreground font-sans">
              {isAcquiring && 'Please wait while we establish your coordinates.'}
              {activeDigipin && !isOutOfBounds && !isAcquiring && `Doorway resolution: ±${accuracy ? Math.round(accuracy) : 4} meters.`}
              {isOutOfBounds && 'Device coordinates are outside India Post grid bounds.'}
              {gpsError && !isOutOfBounds && !isAcquiring && gpsError}
              {!hasTriggeredGps && !activeDigipin && !isAcquiring && 'Stand near your front entrance for highest accuracy.'}
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
              className="w-full h-11 bg-accent text-accent-foreground font-semibold text-sm rounded-lg flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
            >
              <LocateFixed className="w-4 h-4" />
              <span>Detect My Location</span>
            </button>
          </div>
        )}

        {/* State 2: Acquiring / Loading */}
        {isAcquiring && (
          <div className="p-4 rounded-lg bg-muted/40 border border-border flex items-center justify-center gap-2.5 text-xs text-muted-foreground font-sans">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            <span>Please wait while we establish your coordinates...</span>
          </div>
        )}

        {/* State 3: Out-of-Bounds Graceful Warning (Zero Crash) */}
        {isOutOfBounds && activeCoords && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs font-sans">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Location outside supported region</span>
            </div>
            <p className="text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              Detected coordinates [{activeCoords.lat.toFixed(4)}°, {activeCoords.lng.toFixed(4)}°] fall outside
              India&apos;s sovereign boundary (2.5°N to 38.5°N, 63.5°E to 99.5°E).
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                You can enter an in-bounds DIGIPIN manually below.
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry GPS</span>
              </button>
            </div>
          </div>
        )}

        {/* State 4: Geolocation Timeout / Error Fallback (Strict Non-Blocking UI) */}
        {gpsError && !activeDigipin && !isAcquiring && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs font-sans">
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">
                  {isTimedOut ? 'GPS Satellite Lock Timed Out' : 'Location Detection Failed'}
                </p>
                <p className="text-[11px] font-normal text-amber-900/80 dark:text-amber-200/80 mt-0.5 leading-relaxed">
                  {gpsError}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setShowManual(true)}
                id="timeout-manual-btn"
                className="w-full sm:w-auto flex-1 h-9 px-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Enter DIGIPIN Manually</span>
              </button>
              <button
                type="button"
                onClick={handleDetectLocation}
                id="timeout-retry-gps-btn"
                className="w-full sm:w-auto h-9 px-3 border border-border bg-card text-foreground rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-muted active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry GPS Lock</span>
              </button>
            </div>
          </div>
        )}

        {/* State 5: Success - Locked DIGIPIN & Coordinates Readout */}
        {activeDigipin && !isOutOfBounds && activeCoords && !isAcquiring && (
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3 font-sans">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Computed DIGIPIN</span>
              <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                High Precision (±{accuracy ? Math.round(accuracy) : 4}m)
              </span>
            </div>

            {/* Prominent DIGIPIN Monospace Code */}
            <div className="flex items-center justify-between bg-card border border-border px-3.5 py-2.5 rounded-lg shadow-2xs">
              <span className="font-mono text-xl md:text-2xl font-black text-foreground tracking-widest">
                {activeFormattedDigipin}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/10 text-accent font-sans uppercase">
                Official WGS84
              </span>
            </div>

            {/* Coordinates and Retry */}
            <div className="flex items-center justify-between pt-1 border-t border-border/80 text-xs">
              <span className="font-mono text-muted-foreground text-[11px]">
                {activeCoords.lat.toFixed(6)}° N, {activeCoords.lng.toFixed(6)}° E
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium font-sans cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
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
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium py-1 px-1 rounded transition-colors cursor-pointer font-sans"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Enter DIGIPIN manually</span>
          </button>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4.5 shadow-xs space-y-3 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between">
              <label htmlFor="manual-code-input" className="text-xs font-semibold text-foreground font-sans">
                Manual DIGIPIN Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowManual(false);
                  setManualCode('');
                  setManualError('');
                }}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Cancel manual entry"
              >
                <X className="w-3.5 h-3.5" />
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
                className={`w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm font-mono placeholder:text-muted-foreground tracking-widest uppercase transition-colors outline-none ${
                  cleanManual.length === 10
                    ? isManualValid
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-destructive focus:ring-2 focus:ring-destructive/20'
                    : 'border-zinc-300 dark:border-zinc-700 focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>

            {/* Validation Feedback */}
            {cleanManual.length > 0 && cleanManual.length < 10 && (
              <p className="text-[11px] text-muted-foreground font-sans">
                {10 - cleanManual.length} characters remaining ({cleanManual.length}/10)
              </p>
            )}

            {cleanManual.length === 10 && isManualValid && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Valid India Post DIGIPIN verified</span>
              </div>
            )}

            {cleanManual.length === 10 && !isManualValid && (
              <p className="text-xs text-destructive font-medium">
                Invalid code. Characters must only be from charset: 23456789CJKLMPFT
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          {isContinueEnabled ? (
            <button
              type="button"
              id="create-step1-continue"
              onClick={handleContinue}
              className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-semibold text-sm md:text-base py-3.5 rounded-lg hover:opacity-95 active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
            >
              <MapPin className="w-4 h-4 fill-current" />
              <span>Lock DIGIPIN &amp; Continue</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              id="create-step1-continue"
              className="flex items-center justify-center gap-2 w-full bg-muted text-muted-foreground font-semibold text-sm md:text-base py-3.5 rounded-lg opacity-60 cursor-not-allowed font-sans"
            >
              <MapPin className="w-4 h-4" />
              <span>Detect location to continue</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Resume Previous Progress Interstitial Dialog ───────────────── */}
      <Dialog open={isResumeModalOpen} onOpenChange={setIsResumeModalOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={false}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[4px] bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-accent" />
              </div>
              <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
                Resume Previous Progress?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              You have an unfinished address creation draft. Would you like to restore your entered details or start over with a fresh session?
            </DialogDescription>
          </DialogHeader>

          {/* Draft Summary Details */}
          <div className="bg-muted/50 border border-border/80 rounded-[4px] p-3 text-xs space-y-1.5 font-sans my-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Saved Stage:</span>
              <span className="font-semibold text-foreground">
                Step {storeCurrentStep || storeStep || 1} of 5
              </span>
            </div>
            {storeDigipin && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>DIGIPIN:</span>
                <span className="font-mono text-foreground font-semibold">{storeDigipin}</span>
              </div>
            )}
            {storeLat !== null && storeLng !== null && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Coordinates:</span>
                <span className="font-mono text-foreground font-semibold">
                  {storeLat.toFixed(4)}°, {storeLng.toFixed(4)}°
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2 font-sans">
            <button
              type="button"
              id="resume-modal-start-over-btn"
              onClick={handleStartFresh}
              className="px-3.5 py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans"
            >
              Start Over
            </button>
            <button
              type="button"
              id="resume-modal-restore-btn"
              onClick={handleRestoreProgress}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[4px] bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer font-sans"
            >
              <span>Restore Progress</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
