'use client';

import { getSessionAction } from '@/app/actions/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAddressStore, useHasHydrated } from '@/store/useAddressStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ArrowRight,
  BookmarkCheck,
  Clock,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ADDRESS_LABELS = ['Home', 'Office', 'Delivery Point', 'Shop', 'Other'];

function computeExpiresAt(exp: string): string | null {
  if (exp === 'never') return null;
  const now = Date.now();
  if (exp === '1h') return new Date(now + 60 * 60 * 1000).toISOString();
  if (exp === '12h') return new Date(now + 12 * 60 * 60 * 1000).toISOString();
  if (exp === '24h') return new Date(now + 24 * 60 * 60 * 1000).toISOString();
  if (exp === '7d')
    return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  return new Date(now + 30 * 60 * 1000).toISOString();
}

/**
 * /create/metadata - Step 4: Details & Security
 *
 * Group 1: Building Z-axis details and secondary routing directions.
 * Group 2: Ephemeral sharing and security controls with interactive guest auth-gates.
 * Interstitial Confirmation Modal: Confirms draft preservation before routing to login.
 * Zero data loss: persists all input fields into useAddressStore before auth redirection
 * and pre-fills them upon return.
 * Anti-slop verified: zero em-dashes, WCAG AA contrast, strict Geist sans-serif.
 */
export default function CreateMetadataPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const baseLat = useAddressStore((state) => state.latitude);
  const baseLng = useAddressStore((state) => state.longitude);
  const setMetadata = useAddressStore((state) => state.setMetadata);

  const initialMetadata = useAddressStore.getState().metadata;
  const [floor, setFloor] = useState(initialMetadata?.floor || '');
  const [flat, setFlat] = useState(initialMetadata?.flat || '');
  const [landmark, setLandmark] = useState(initialMetadata?.landmark || '');
  const [selectedLabel, setSelectedLabel] = useState(
    initialMetadata?.label &&
      ['Home', 'Office', 'Delivery Point', 'Shop'].includes(
        initialMetadata.label
      )
      ? initialMetadata.label
      : initialMetadata?.customTag || initialMetadata?.label === 'Other'
        ? 'Other'
        : 'Home'
  );
  const [customTag, setCustomTag] = useState(
    initialMetadata?.customTag ||
      (initialMetadata?.label &&
      !['Home', 'Office', 'Delivery Point', 'Shop'].includes(
        initialMetadata.label
      )
        ? initialMetadata.label
        : '')
  );
  const [password, setPassword] = useState(initialMetadata?.passcode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [expiry, setExpiry] = useState(initialMetadata?.expiry || '30m');
  const [saveToAccount, setSaveToAccount] = useState(
    typeof initialMetadata?.saveToAccount === 'boolean'
      ? initialMetadata.saveToAccount
      : true
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Dynamic user authentication state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isGuest = !isAuthenticated;

  // Sync active auth session on mount
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
        // Unauthenticated guest
      }
    }
    checkAuthSession();
  }, []);

  // Route protection: Wait for Zustand storage hydration before evaluating coordinates
  useEffect(() => {
    if (!hasHydrated) return;
    if (baseLat === null || baseLng === null) {
      router.replace('/create');
    }
  }, [hasHydrated, baseLat, baseLng, router]);

  // Hydration on Return: Pre-fill all inputs from Zustand store once hydrated
  useEffect(() => {
    if (!hasHydrated) return;
    queueMicrotask(() => {
      const current = useAddressStore.getState().metadata;
      if (current) {
        if (current.floor) setFloor(current.floor);
        if (current.flat) setFlat(current.flat);
        if (current.landmark) setLandmark(current.landmark);
        if (current.label) {
          if (
            ['Home', 'Office', 'Delivery Point', 'Shop'].includes(current.label)
          ) {
            setSelectedLabel(current.label);
            setCustomTag('');
          } else {
            setSelectedLabel('Other');
            const tagVal =
              current.customTag ||
              (current.label !== 'Other' ? current.label : '');
            setCustomTag(tagVal);
          }
        }
        if (current.customTag) {
          setSelectedLabel('Other');
          setCustomTag(current.customTag);
        }
        if (current.passcode) setPassword(current.passcode);
        if (typeof current.saveToAccount === 'boolean') {
          setSaveToAccount(current.saveToAccount);
        }
        if (current.expiry) {
          setExpiry(current.expiry);
          useAddressStore.setState({ isEphemeral: current.expiry !== 'never' });
        }
      }
    });
  }, [hasHydrated]);

  // Zero Data Loss: Persist all currently entered values to Zustand
  const persistCurrentData = (overrides?: Record<string, unknown>) => {
    const effectiveLabel =
      selectedLabel === 'Other' ? customTag.trim() || 'Other' : selectedLabel;
    const effectiveExpiry = (overrides?.expiry as string) || expiry || '30m';
    const effectiveSaveToAccount =
      overrides?.saveToAccount !== undefined
        ? Boolean(overrides.saveToAccount)
        : isAuthenticated
          ? saveToAccount
          : false;

    setMetadata({
      floor,
      flat,
      landmark,
      label: effectiveLabel,
      customTag: selectedLabel === 'Other' ? customTag : '',
      passcode: password,
      expiry: effectiveExpiry,
      saveToAccount: effectiveSaveToAccount,
      ...overrides,
    });
    const calculatedExpiresAt = computeExpiresAt(String(effectiveExpiry));
    useAddressStore.setState({
      expiresAt: calculatedExpiresAt,
      isEphemeral: effectiveExpiry !== 'never',
    });
  };

  const handleSelectExpiry = (selectedExpiry: string, locked: boolean) => {
    if (locked) {
      handleOpenAuthModal();
      return;
    }
    setExpiry(selectedExpiry);
    setMetadata({ expiry: selectedExpiry });
    const calculatedExpiresAt = computeExpiresAt(selectedExpiry);
    useAddressStore.setState({
      expiresAt: calculatedExpiresAt,
      isEphemeral: selectedExpiry !== 'never',
    });
  };

  const handleSelectLabel = (label: string) => {
    if (label === 'Other') {
      setSelectedLabel('Other');
      setMetadata({
        label: customTag.trim() || 'Other',
        customTag,
        expiry,
      });
    } else {
      setSelectedLabel(label);
      setCustomTag('');
      setMetadata({
        label,
        customTag: '',
        expiry,
      });
    }
  };

  // Open confirmation modal instead of immediate jarring redirect
  const handleOpenAuthModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsAuthModalOpen(true);
  };

  const handleProceedLogin = () => {
    persistCurrentData({ expiry });
    setIsAuthModalOpen(false);
    router.push('/login?callbackUrl=/create/metadata');
  };

  const handleContinue = () => {
    persistCurrentData({ expiry });
    useAddressStore.getState().setCurrentStep(5);
    useAddressStore.getState().setStep(5);
    router.push('/create/share');
  };

  // Wait momentarily for Zustand storage rehydration to finish
  if (!hasHydrated) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] flex-1 flex-col items-center justify-center font-sans">
        <div className="border-accent mb-2 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-muted-foreground font-sans text-xs font-medium">
          Restoring draft...
        </span>
      </div>
    );
  }

  if (baseLat === null || baseLng === null) {
    return null;
  }

  return (
    <div
      className="animate-in fade-in flex min-h-[calc(100vh-8rem)] flex-col space-y-6 pt-2 pb-28 font-sans duration-150"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* Step Header */}
      <div>
        <h1 className="text-foreground font-sans text-xl font-bold tracking-tight md:text-2xl">
          Details &amp; Security
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">
          Provide building level guidance and configure link privacy settings.
        </p>
      </div>

      {/* ─── GROUP 1: Location Details & Hints ───────────────────────────── */}
      <div className="bg-card border-border space-y-4 rounded border p-5 shadow-sm">
        <div className="border-border flex items-center gap-2 border-b pb-2">
          <Layers className="text-accent h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">
            Building &amp; Doorway Details
          </h2>
        </div>

        {/* Anti-autofill dummy traps to prevent browsers from pairing flat/passcode as login credentials */}
        <input
          type="text"
          name="dr-decoy-username"
          className="sr-only hidden"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
        />
        <input
          type="password"
          name="dr-decoy-password"
          className="sr-only hidden"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="new-password"
        />

        {/* 2-Column Grid: Floor & Flat */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="metadata-floor"
              className="text-foreground mb-1.5 block text-xs font-semibold"
            >
              Floor / Level
            </label>
            <input
              id="metadata-floor"
              name="dr-floor-mock"
              type="text"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={floor}
              onChange={(e) => {
                const val = e.target.value;
                setFloor(val);
                setMetadata({ floor: val });
              }}
              placeholder="e.g. 4th Floor"
              className="bg-background border-input placeholder:text-muted-foreground focus:ring-accent w-full rounded border px-3 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="metadata-flat"
              className="text-foreground mb-1.5 block text-xs font-semibold"
            >
              Flat / Unit No.
            </label>
            <input
              id="metadata-flat"
              name="dr-flat-mock"
              type="text"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={flat}
              onChange={(e) => {
                const val = e.target.value;
                setFlat(val);
                setMetadata({ flat: val });
              }}
              placeholder="e.g. Flat 402, Tower B"
              className="bg-background border-input placeholder:text-muted-foreground focus:ring-accent w-full rounded border px-3 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Expanded Secondary Routing Hints */}
        <div>
          <label
            htmlFor="metadata-hints"
            className="text-foreground mb-1.5 block text-xs font-semibold"
          >
            Secondary Address &amp; Routing Hints
          </label>
          <textarea
            id="metadata-hints"
            rows={3}
            value={landmark}
            onChange={(e) => {
              const val = e.target.value;
              setLandmark(val);
              setMetadata({ landmark: val });
            }}
            placeholder="e.g. Opposite elevator B. Turn left after glass door. Ring black doorbell."
            className="bg-background border-input placeholder:text-muted-foreground focus:ring-accent w-full resize-none rounded border px-3 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
          />
          <p className="text-muted-foreground mt-1 text-[11px]">
            Crucial for couriers navigating dark or identical corridors.
          </p>
        </div>

        {/* Address Label Radios */}
        <div>
          <span className="text-foreground mb-2 block text-xs font-semibold">
            Address Tag
          </span>
          <div className="flex flex-wrap gap-2">
            {ADDRESS_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSelectLabel(label)}
                className={`cursor-pointer rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] ${
                  selectedLabel === label
                    ? 'bg-accent text-accent-foreground border-accent font-semibold'
                    : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Conditional Custom Tag Input when "Other" is selected */}
          {selectedLabel === 'Other' && (
            <div className="border-border/60 animate-in fade-in mt-3 border-t pt-3 duration-150 ease-out">
              <label
                htmlFor="metadata-custom-tag"
                className="text-foreground mb-1.5 block text-xs font-semibold"
              >
                Specify Custom Tag
              </label>
              <input
                id="metadata-custom-tag"
                type="text"
                autoFocus
                value={customTag}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomTag(val);
                  setMetadata({
                    label: val.trim() || 'Other',
                    customTag: val,
                  });
                }}
                placeholder='e.g. "Warehouse", "Side Gate"'
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-accent w-full rounded-[4px] border px-3 py-2 text-sm transition-[border-color,box-shadow] duration-150 ease-out focus:ring-2 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── GROUP 2: Security & Sharing Controls (Auth-Gated) ──────────── */}
      <div className="border-border space-y-6 rounded-xl border bg-slate-50/80 p-4 shadow-sm sm:p-5 dark:bg-zinc-900/60">
        <div className="border-border flex w-full items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Shield className="text-primary h-4 w-4" />
            <h2 className="text-foreground text-sm font-bold tracking-tight">
              Security &amp; Privacy Controls
            </h2>
          </div>
          {isGuest && (
            <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              Guest Mode
            </span>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          {/* 1. Link Expiration Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground flex items-center gap-1.5 font-semibold">
                <Clock className="text-muted-foreground h-3.5 w-3.5" />
                Link Expiry Time
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: '30m', label: '30 Min', locked: false },
                { id: '1h', label: '1 Hour', locked: isGuest },
                { id: '24h', label: '24 Hours', locked: isGuest },
                { id: 'never', label: 'Never', locked: isGuest },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectExpiry(opt.id, opt.locked)}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center text-sm font-medium transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] ${
                    expiry === opt.id
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : opt.locked
                        ? 'bg-muted/40 border-border text-muted-foreground/80 opacity-60 hover:border-zinc-300 hover:opacity-80 dark:hover:border-zinc-700'
                        : 'bg-card border-border text-foreground hover:bg-muted'
                  }`}
                  title={
                    opt.locked
                      ? 'Click to login and unlock this expiry option'
                      : undefined
                  }
                >
                  {opt.locked && (
                    <Lock className="shrink-0 text-zinc-400" size={14} />
                  )}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Optional Password Protection */}
          <div className="space-y-2">
            <label
              htmlFor="metadata-password"
              className="text-foreground block flex items-center gap-1.5 text-xs font-semibold"
            >
              <Lock className="text-muted-foreground h-3.5 w-3.5" />
              Passcode Protection (Optional)
            </label>
            <div className="relative">
              <input
                id="metadata-password"
                name="dr-passcode-mock"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="Leave blank for open link"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  setMetadata({ passcode: val });
                }}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-accent w-full rounded-lg border py-2.5 pr-10 pl-3 text-sm transition-[border-color,box-shadow] duration-150 ease-out focus:ring-2 focus:outline-none"
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                className="focus-visible:ring-accent absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-[4px] p-1 text-zinc-500 transition-[transform,opacity,color] duration-150 ease-out outline-none hover:text-zinc-800 hover:opacity-90 focus-visible:ring-2 active:scale-[0.96] dark:hover:text-zinc-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Recipients must enter this passcode before doorway details reveal.
            </p>
          </div>

          {/* 3. Live Viewer Tracking Toggle (Temporarily Disabled - Coming Soon) */}
          <div
            className="bg-card border-border flex cursor-not-allowed items-start justify-between gap-4 rounded-lg border p-4 opacity-60 select-none"
            title="Live tracking will be enabled in a future release with the WebSocket engine."
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                  <Eye className="text-muted-foreground h-3.5 w-3.5" />
                  Live Viewer Tracking
                </span>
                <span className="rounded-[2px] bg-zinc-200/80 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Coming Soon
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                See when couriers open your link in real time. WebSocket
                tracking engine in development.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              <div className="pointer-events-none flex h-5 w-9 items-center rounded-full bg-zinc-200 p-0.5 dark:bg-zinc-800">
                <div className="h-4 w-4 rounded-full bg-white shadow-xs dark:bg-zinc-600" />
              </div>
            </div>
          </div>

          {/* 4. Save to Address Book Toggle (Auth-Gated & Interactive) */}
          <div
            onClick={
              isGuest
                ? handleOpenAuthModal
                : () => {
                    setSaveToAccount((prev) => {
                      const nextVal = !prev;
                      setMetadata({ saveToAccount: nextVal });
                      return nextVal;
                    });
                  }
            }
            className={`bg-card border-border flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-[border-color,background-color] duration-150 ease-out hover:border-zinc-300 dark:hover:border-zinc-700 ${
              isGuest ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40' : ''
            }`}
            role="switch"
            aria-checked={!isGuest && saveToAccount}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isGuest) {
                  handleOpenAuthModal();
                } else {
                  setSaveToAccount((prev) => {
                    const nextVal = !prev;
                    setMetadata({ saveToAccount: nextVal });
                    return nextVal;
                  });
                }
              }
            }}
            title={
              isGuest
                ? 'Click to login and save permanently'
                : 'Toggle saving to your account'
            }
          >
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <BookmarkCheck className="text-muted-foreground h-3.5 w-3.5" />
                Save to Digital Address Book
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {isGuest
                  ? 'Keep this address permanently on your account.'
                  : saveToAccount
                    ? 'Address will be permanently saved to your dashboard.'
                    : 'Saving as anonymous link. It will not appear in your dashboard.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {isGuest ? (
                <div className="flex items-center gap-2 opacity-60">
                  <Lock className="shrink-0 text-zinc-400" size={14} />
                  <div className="pointer-events-none flex h-5 w-9 items-center rounded-full bg-zinc-200 p-0.5 dark:bg-zinc-800">
                    <div className="h-4 w-4 rounded-full bg-white shadow-xs dark:bg-zinc-600" />
                  </div>
                </div>
              ) : (
                <div
                  className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    saveToAccount
                      ? 'bg-accent justify-end'
                      : 'justify-start bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <div className="h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 dark:bg-zinc-950" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5">
        <div className="mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
          <button
            type="button"
            id="metadata-continue-btn"
            onClick={handleContinue}
            className="bg-accent text-accent-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded py-3.5 text-sm font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] md:text-base"
          >
            <span>Review &amp; Generate</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Interstitial Confirmation Modal ────────────────────────────── */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent
          className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            willChange: 'transform, opacity',
          }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left">
            <div className="flex items-center gap-2">
              <div className="bg-accent/10 border-accent/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border">
                <Lock className="text-accent h-4 w-4" />
              </div>
              <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
                Unlock this feature
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-1 text-xs leading-relaxed md:text-sm">
              Sign in to use this setting. Your current progress is saved, and
              you&apos;ll be brought right back.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border mt-2 flex items-center justify-end gap-2.5 border-t pt-4">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="border-border text-foreground bg-background hover:bg-muted cursor-pointer rounded-[4px] border px-3.5 py-2 text-xs font-medium transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] md:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-proceed-login-btn"
              onClick={handleProceedLogin}
              className="bg-accent text-accent-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 text-xs font-semibold shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] md:text-sm"
            >
              <span>Continue to Login</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
