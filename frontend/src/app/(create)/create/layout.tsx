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
export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  const isQrPage =
    pathname === '/create/qr' || pathname.startsWith('/create/qr');

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
    <div
      className={`bg-background flex min-h-screen flex-col ${isCameraStep || isMapStep ? 'h-[100dvh] overflow-hidden' : ''}`}
    >
      {/* Wizard Chrome Header (Two-Row Refined Utilitarian Layout) */}
      <header className="bg-card border-border sticky top-0 z-40 shrink-0 border-b font-sans">
        <div className="mx-auto max-w-md px-4 md:max-w-xl lg:max-w-2xl">
          {/* Top Row (Brand & Actions) */}
          <div className="flex h-12 items-center justify-between">
            {/* Left: DigiRoute Home / Logo (+ back button) */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {!isSuccessStep && prevPath && (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go to previous step"
                  className="pressable hover:bg-muted text-foreground flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-all active:scale-[0.98]"
                >
                  <ArrowLeft className="text-foreground h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseClick}
                id="wizard-header-logo-btn"
                className="group flex cursor-pointer items-center gap-1.5 focus:outline-none"
                aria-label="Return Home"
              >
                <span className="font-sans text-base font-bold tracking-tight text-zinc-950 sm:text-lg dark:text-zinc-50">
                  Digi<span className="text-accent">Route</span>
                </span>
                <span
                  className="bg-accent h-2 w-2 animate-pulse rounded-full"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Right: Start Over & Close (X) */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {!isSuccessStep && (
                <button
                  type="button"
                  onClick={handleStartOver}
                  id="create-start-over-btn"
                  title="Reset draft and start fresh"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-sans text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span>Start Over</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseClick}
                aria-label="Exit address creation"
                className="pressable hover:bg-muted text-foreground flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-all active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row (Step Context) */}
          <div className="pt-0.5 pb-2.5">
            {!isSuccessStep ? (
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Step {currentStep.num} of {STEPS.length}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-600">
                  -
                </span>
                <h2 className="font-sans text-xs font-semibold tracking-tight text-zinc-900 sm:text-sm dark:text-zinc-100">
                  {currentStep.label}
                </h2>
              </div>
            ) : (
              <h2 className="font-sans text-xs font-semibold tracking-tight text-zinc-900 sm:text-sm dark:text-zinc-100">
                Micro-Address Created
              </h2>
            )}
          </div>
        </div>

        {/* Orange Progress Bar spanning the width of the screen */}
        {!isSuccessStep && (
          <div className="bg-muted h-0.5 w-full">
            <div
              role="progressbar"
              aria-valuenow={currentStep.num}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              className="bg-accent h-full transition-all duration-200 ease-in-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </header>

      {/* Wizard content */}
      <main
        className={`mx-auto w-full max-w-md flex-1 md:max-w-xl lg:max-w-2xl ${isCameraStep || isMapStep ? 'flex h-full min-h-0 flex-col overflow-hidden px-3 py-2 sm:px-4' : 'px-4 py-4 md:py-6'}`}
      >
        {children}
      </main>

      {/* ─── Exit Confirmation Dialog (Steps 1-5) ─────────────────────────── */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
              Leave address creation?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              Your progress will be paused.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border mt-4 flex w-full flex-col-reverse gap-2 border-t pt-4 font-sans sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setIsExitDialogOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted w-full cursor-pointer rounded-[4px] border px-3.5 py-2.5 text-center font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-leave-creation-btn"
              onClick={handleConfirmLeave}
              className="bg-secondary text-secondary-foreground hover:bg-muted border-border flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border px-4 py-2.5 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
            >
              <span>Leave</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Ephemeral Data Loss Prevention Dialog (Success Screen) ──────── */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
              {isSuccessStep
                ? 'Wait! You are leaving without saving'
                : 'Leave address creation?'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              {isSuccessStep
                ? "You haven't saved this address to an account. If you leave without copying the link, it will be lost."
                : 'Do you want to save your current progress locally, or discard it and leave?'}
            </DialogDescription>
          </DialogHeader>

          <div className="border-border mt-4 flex w-full flex-col-reverse gap-2 border-t pt-4 font-sans sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setIsDiscardDialogOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted w-full cursor-pointer rounded-[4px] border px-3.5 py-2.5 text-center font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              id="discard-leave-btn"
              onClick={handleDiscardAndLeave}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full cursor-pointer rounded-[4px] border px-3.5 py-2.5 text-center font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
            >
              Discard &amp; Leave
            </button>
            {isSuccessStep ? (
              <button
                type="button"
                id="discard-save-account-btn"
                onClick={handleSaveToAccount}
                disabled={isSavingInLayout}
                className="bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2.5 font-sans text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 md:text-sm"
              >
                {isSavingInLayout ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
                className="bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2.5 font-sans text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
              >
                <span>Save Progress</span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Start Over Confirmation Dialog ──────────────────────────────── */}
      <Dialog
        open={isStartOverDialogOpen}
        onOpenChange={setIsStartOverDialogOpen}
      >
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left font-sans">
            <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
              Start over from scratch?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              This will clear all entered location data, doorway photos, and
              metadata. You will be redirected to Step 1.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border mt-4 flex w-full flex-col-reverse gap-2 border-t pt-4 font-sans sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => setIsStartOverDialogOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted w-full cursor-pointer rounded-[4px] border px-3.5 py-2.5 text-center font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-start-over-btn"
              onClick={handleConfirmStartOver}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2.5 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto sm:py-2 md:text-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Yes, Start Over</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
