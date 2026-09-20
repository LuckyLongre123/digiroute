'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddressStore } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import { clearDraftAndReset } from '@/lib/draft';
import { claimAddressAction } from '@/app/actions/claimAddress';
import { getSessionAction } from '@/app/actions/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Step configuration - maps pathnames to step data
const STEPS = [
  { path: '/create', label: 'Base Location', num: 1 },
  { path: '/create/camera', label: 'Visual Lock', num: 2 },
  { path: '/create/map', label: 'Entrance Pin', num: 3 },
  { path: '/create/metadata', label: 'Details & Security', num: 4 },
  { path: '/create/share', label: 'Review', num: 5 },
] as const;

const PREV_STEP: Record<string, string> = {
  '/create/camera': '/create',
  '/create/map': '/create/camera',
  '/create/metadata': '/create/map',
  '/create/share': '/create/metadata',
};

/**
 * (create) Layout - 5-Step Address Creation Wizard (ROUTE-02, ROUTE-03)
 *
 * Persistent chrome:
 * - Robust back button navigating to previous step and decrementing step state
 * - Step counter "Step X of 5" + step title
 * - Saffron progress bar with CSS smooth transition
 * - Exit Confirmation Dialog on Close (X) button for Steps 1-5 (pauses progress)
 * - Ephemeral Data Loss Prevention Dialog on Close (X) for /create/success ("Discard this micro-address?")
 */
export default function CreateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isStartOverDialogOpen, setIsStartOverDialogOpen] = useState(false);
  const [isSavingInLayout, setIsSavingInLayout] = useState(false);
  const isSavingInLayoutRef = useRef(false);

  const normalizedPath = pathname.replace(/\/+$/, '') || '/create';
  const currentStep = STEPS.find((s) => s.path === normalizedPath) ?? STEPS[0];
  const progressPct = (currentStep.num / STEPS.length) * 100;
  const prevPath = PREV_STEP[normalizedPath];

  const isCameraStep = normalizedPath === '/create/camera';
  const isMapStep = normalizedPath === '/create/map';
  const isSuccessStep = normalizedPath === '/create/success';
  const isQrPage = pathname === '/create/qr' || pathname.startsWith('/create/qr');

  // Synchronize active step in Zustand store - must execute unconditionally before any return
  useEffect(() => {
    if (!isQrPage && !isSuccessStep && currentStep) {
      if (currentStep.num === 1) {
        // At Step 1 (/create), preserve draft's saved currentStep until the user confirms restore or start over
        const storeCurrentStep = useAddressStore.getState().currentStep;
        if (!storeCurrentStep || storeCurrentStep <= 1) {
          useAddressStore.getState().setStep(1);
        }
      } else {
        useAddressStore.getState().setCurrentStep(currentStep.num);
        useAddressStore.getState().setStep(currentStep.num);
      }
    }
  }, [currentStep, isSuccessStep, isQrPage]);

  // Handle post-reload toast notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingToast = sessionStorage.getItem('digiroute_toast_msg');
      if (pendingToast) {
        sessionStorage.removeItem('digiroute_toast_msg');
        toast.success(pendingToast);
      }
    }
  }, []);

  // Hydrate global auth state from server session on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const session = await getSessionAction();
        if (session?.user) {
          useAuthStore.getState().setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: 'user',
          });
        }
      } catch {
        // Unauthenticated
      }
    }
    checkAuthSession();
  }, []);

  // Hide wizard layout completely when rendering the QR badge print/download page
  if (isQrPage) {
    return <>{children}</>;
  }

  function handleBack() {
    if (prevPath) {
      const prevStepObj = STEPS.find((s) => s.path === prevPath);
      if (prevStepObj) {
        useAddressStore.getState().setCurrentStep(prevStepObj.num);
        useAddressStore.getState().setStep(prevStepObj.num);
      }
      router.push(prevPath);
    } else {
      router.back();
    }
  }

  function handleSafeExitHome() {
    const isAuthed = useAuthStore.getState().isAuthenticated;
    const saveToAccount = useAddressStore.getState().metadata.saveToAccount;
    const isSaved = useAddressStore.getState().isSaved;
    const isCompleted = useAddressStore.getState().isCompleted;

    // Fast-path 1: address already published — always allow leaving without any modal
    if (isCompleted) {
      router.push('/');
      return;
    }

    // Fast-path 2: authenticated and saved/tagged for save — no data loss risk
    if (isAuthed && (saveToAccount || isSaved)) {
      router.push('/');
      return;
    }

    // Ephemeral data loss prevention dialog: "Wait! You are leaving without saving"
    setIsDiscardDialogOpen(true);
  }

  function handleCloseClick() {
    handleSafeExitHome();
  }

  function handleConfirmLeave() {
    // Preserve Zustand state, close modal, route home
    setIsExitDialogOpen(false);
    router.push('/');
  }

  function handleDiscardAndLeave() {
    // Clears Zustand state and routes home
    useAddressStore.getState().resetDraft();
    setIsDiscardDialogOpen(false);
    router.push('/');
  }

  function handleSaveProgress() {
    // Preserves local Zustand state and navigates home
    setIsDiscardDialogOpen(false);
    router.push('/');
  }

  async function handleSaveToAccount() {
    if (isSavingInLayout || isSavingInLayoutRef.current) return;

    let isAuthed = useAuthStore.getState().isAuthenticated;
    if (!isAuthed) {
      try {
        const session = await getSessionAction();
        if (session?.user) {
          useAuthStore.getState().setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: 'user',
          });
          isAuthed = true;
        }
      } catch {
        // Unauthenticated
      }
    }

    if (!isAuthed) {
      // Route to login callback to preserve draft permanently
      setIsDiscardDialogOpen(false);
      router.push('/login?callbackUrl=/create/success');
      return;
    }

    isSavingInLayoutRef.current = true;
    setIsSavingInLayout(true);

    const slug = useAddressStore.getState().slug;
    if (slug) {
      try {
        const result = await claimAddressAction(slug);
        if (result.success) {
          useAddressStore.getState().setSaveToAccount(true);
          toast.success('Address permanently saved to your account.');
        } else {
          toast.error(result.error || 'Failed to save address.');
        }
      } catch (err) {
        console.warn('[layout] Error claiming address:', err);
      }
    }

    isSavingInLayoutRef.current = false;
    setIsSavingInLayout(false);
    setIsDiscardDialogOpen(false);
    router.push('/');
  }

  function handleStartOver() {
    setIsStartOverDialogOpen(true);
  }

  async function handleConfirmStartOver() {
    setIsStartOverDialogOpen(false);
    await clearDraftAndReset();
  }


  return (
    <div className={`min-h-screen bg-background flex flex-col ${isCameraStep || isMapStep ? 'h-[100dvh] overflow-hidden' : ''}`}>
      {/* Wizard Chrome Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shrink-0 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Top-Left: Back button (for previous steps) + DigiRoute Brand Logo with Safety Net */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isSuccessStep && prevPath && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go to previous step"
                className="pressable w-8 h-8 flex items-center justify-center rounded-sm hover:bg-muted active:scale-[0.98] transition-all shrink-0 cursor-pointer text-foreground"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseClick}
              id="wizard-header-logo-btn"
              className="flex items-center gap-1.5 group cursor-pointer focus:outline-none"
              aria-label="Return Home"
            >
              <span className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight font-sans">
                Digi<span className="text-accent">Route</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            </button>
          </div>

          {/* Step info */}
          <div className="flex-1 text-center" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
            {isSuccessStep ? (
              <h2 className="text-sm font-bold text-foreground leading-none font-sans tracking-tight">
                Micro-Address Created
              </h2>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-none mb-1 font-sans font-medium">
                  Step {currentStep.num} of {STEPS.length}
                </p>
                <h2 className="text-sm font-bold text-foreground leading-none font-sans tracking-tight">
                  {currentStep.label}
                </h2>
              </>
            )}
          </div>

          {/* Right Action Group: Start Over & Close */}
          <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[72px]">
            {!isSuccessStep && (
              <button
                type="button"
                onClick={handleStartOver}
                id="create-start-over-btn"
                title="Reset draft and start fresh"
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-sm transition-colors cursor-pointer font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Start Over</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseClick}
              aria-label={isSuccessStep ? 'Exit address creation' : 'Exit address creation'}
              className="pressable w-8 h-8 flex items-center justify-center rounded-sm hover:bg-muted active:scale-[0.98] transition-all shrink-0 cursor-pointer text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Saffron progress bar */}
        {!isSuccessStep && (
          <div className="h-0.5 bg-muted">
            <div
              role="progressbar"
              aria-valuenow={currentStep.num}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              className="h-full bg-accent transition-all duration-200 ease-in-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </header>

      {/* Wizard content */}
      <main className={`flex-1 max-w-md md:max-w-xl lg:max-w-2xl mx-auto w-full ${isCameraStep || isMapStep ? 'px-3 sm:px-4 py-2 flex flex-col min-h-0 h-full overflow-hidden' : 'px-4 py-4 md:py-6'}`}>
        {children}
      </main>

      {/* ─── Exit Confirmation Dialog (Steps 1-5) ─────────────────────────── */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
              Leave address creation?
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              Your progress will be paused.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 w-full mt-4 pt-4 border-t border-border font-sans">
            <button
              type="button"
              onClick={() => setIsExitDialogOpen(false)}
              className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-leave-creation-btn"
              onClick={handleConfirmLeave}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-[4px] bg-secondary text-secondary-foreground text-xs md:text-sm font-semibold hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out border border-border shadow-xs cursor-pointer font-sans"
            >
              <span>Leave</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Ephemeral Data Loss Prevention Dialog (Success Screen) ──────── */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
              {isSuccessStep ? 'Wait! You are leaving without saving' : 'Leave address creation?'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              {isSuccessStep
                ? "You haven't saved this address to an account. If you leave without copying the link, it will be lost."
                : 'Do you want to save your current progress locally, or discard it and leave?'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 w-full mt-4 pt-4 border-t border-border font-sans">
            <button
              type="button"
              onClick={() => setIsDiscardDialogOpen(false)}
              className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              id="discard-leave-btn"
              onClick={handleDiscardAndLeave}
              className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-[4px] border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs md:text-sm font-medium active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans text-center"
            >
              Discard &amp; Leave
            </button>
            {isSuccessStep ? (
              <button
                type="button"
                id="discard-save-account-btn"
                onClick={handleSaveToAccount}
                disabled={isSavingInLayout}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-[4px] bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingInLayout ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save to Account</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                id="discard-save-progress-btn"
                onClick={handleSaveProgress}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-[4px] bg-primary text-primary-foreground text-xs md:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer font-sans"
              >
                <span>Save Progress</span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Start Over Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={isStartOverDialogOpen} onOpenChange={setIsStartOverDialogOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
              Start over from scratch?
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1 font-sans">
              This will clear all entered location data, doorway photos, and metadata. You will be redirected to Step 1.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 w-full mt-4 pt-4 border-t border-border font-sans">
            <button
              type="button"
              onClick={() => setIsStartOverDialogOpen(false)}
              className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer font-sans text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-start-over-btn"
              onClick={handleConfirmStartOver}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-[4px] bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold hover:bg-destructive/90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-xs cursor-pointer font-sans"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yes, Start Over</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
