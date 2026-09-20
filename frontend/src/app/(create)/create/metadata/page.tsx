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
  if (exp === '7d') return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
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
    initialMetadata?.label && ['Home', 'Office', 'Delivery Point', 'Shop'].includes(initialMetadata.label)
      ? initialMetadata.label
      : initialMetadata?.customTag || initialMetadata?.label === 'Other'
        ? 'Other'
        : 'Home'
  );
  const [customTag, setCustomTag] = useState(
    initialMetadata?.customTag ||
      (initialMetadata?.label && !['Home', 'Office', 'Delivery Point', 'Shop'].includes(initialMetadata.label)
        ? initialMetadata.label
        : '')
  );
  const [password, setPassword] = useState(initialMetadata?.passcode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [expiry, setExpiry] = useState(initialMetadata?.expiry || '30m');
  const [saveToAccount, setSaveToAccount] = useState(
    typeof initialMetadata?.saveToAccount === 'boolean' ? initialMetadata.saveToAccount : true
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
          if (['Home', 'Office', 'Delivery Point', 'Shop'].includes(current.label)) {
            setSelectedLabel(current.label);
            setCustomTag('');
          } else {
            setSelectedLabel('Other');
            const tagVal = current.customTag || (current.label !== 'Other' ? current.label : '');
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
        : (isAuthenticated ? saveToAccount : false);

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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground font-sans">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs font-medium text-muted-foreground font-sans">Restoring draft...</span>
      </div>
    );
  }

  if (baseLat === null || baseLng === null) {
    return null;
  }

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 animate-in fade-in duration-150 pt-2 space-y-6 font-sans"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* Step Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-sans text-foreground tracking-tight">
          Details &amp; Security
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Provide building level guidance and configure link privacy settings.
        </p>
      </div>

      {/* ─── GROUP 1: Location Details & Hints ───────────────────────────── */}
      <div className="bg-card border border-border rounded p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Layers className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">
            Building &amp; Doorway Details
          </h2>
        </div>

        {/* Anti-autofill dummy traps to prevent browsers from pairing flat/passcode as login credentials */}
        <input type="text" name="dr-decoy-username" className="sr-only hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />
        <input type="password" name="dr-decoy-password" className="sr-only hidden" tabIndex={-1} aria-hidden="true" autoComplete="new-password" />

        {/* 2-Column Grid: Floor & Flat */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="metadata-floor"
              className="block text-xs font-semibold text-foreground mb-1.5"
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
              className="w-full px-3 py-2.5 bg-background border border-input rounded text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="metadata-flat"
              className="block text-xs font-semibold text-foreground mb-1.5"
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
              className="w-full px-3 py-2.5 bg-background border border-input rounded text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
            />
          </div>
        </div>

        {/* Expanded Secondary Routing Hints */}
        <div>
          <label
            htmlFor="metadata-hints"
            className="block text-xs font-semibold text-foreground mb-1.5"
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
            className="w-full px-3 py-2.5 bg-background border border-input rounded text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Crucial for couriers navigating dark or identical corridors.
          </p>
        </div>

        {/* Address Label Radios */}
        <div>
          <span className="block text-xs font-semibold text-foreground mb-2">
            Address Tag
          </span>
          <div className="flex flex-wrap gap-2">
            {ADDRESS_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSelectLabel(label)}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-medium border cursor-pointer hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out ${selectedLabel === label
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
            <div className="mt-3 pt-3 border-t border-border/60 animate-in fade-in duration-150 ease-out">
              <label
                htmlFor="metadata-custom-tag"
                className="block text-xs font-semibold text-foreground mb-1.5"
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
                className="w-full px-3 py-2 bg-background border border-input rounded-[4px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-[border-color,box-shadow] duration-150 ease-out"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── GROUP 2: Security & Sharing Controls (Auth-Gated) ──────────── */}
      <div className="bg-slate-50/80 dark:bg-zinc-900/60 border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-6">
        <div className="flex items-center justify-between w-full pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Security &amp; Privacy Controls
            </h2>
          </div>
          {isGuest && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
              Guest Mode
            </span>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          {/* 1. Link Expiration Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Link Expiry Time
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`py-2.5 px-2 rounded-lg text-sm font-medium border text-center cursor-pointer hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out flex items-center justify-center gap-1.5 ${expiry === opt.id
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : opt.locked
                      ? 'bg-muted/40 border-border text-muted-foreground/80 opacity-60 hover:opacity-80 hover:border-zinc-300 dark:hover:border-zinc-700'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  title={opt.locked ? 'Click to login and unlock this expiry option' : undefined}
                >
                  {opt.locked && <Lock className="text-zinc-400 shrink-0" size={14} />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Optional Password Protection */}
          <div className="space-y-2">
            <label
              htmlFor="metadata-password"
              className="block text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
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
                className="w-full pl-3 pr-10 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-[border-color,box-shadow] duration-150 ease-out"
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-[4px] cursor-pointer hover:opacity-90 active:scale-[0.96] transition-[transform,opacity,color] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Recipients must enter this passcode before doorway details reveal.
            </p>
          </div>

          {/* 3. Live Viewer Tracking Toggle (Temporarily Disabled - Coming Soon) */}
          <div
            className="flex items-start justify-between gap-4 p-4 rounded-lg bg-card border border-border opacity-60 cursor-not-allowed select-none"
            title="Live tracking will be enabled in a future release with the WebSocket engine."
          >
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  Live Viewer Tracking
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-medium tracking-wide">
                  Coming Soon
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                See when couriers open your link in real time. WebSocket tracking engine in development.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full p-0.5 pointer-events-none flex items-center">
                <div className="w-4 h-4 bg-white dark:bg-zinc-600 rounded-full shadow-xs" />
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
            className={`flex items-start justify-between gap-4 p-4 rounded-lg bg-card border border-border transition-[border-color,background-color] duration-150 ease-out cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 ${isGuest ? 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40' : ''
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
            title={isGuest ? 'Click to login and save permanently' : 'Toggle saving to your account'}
          >
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-muted-foreground" />
                Save to Digital Address Book
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isGuest
                  ? 'Keep this address permanently on your account.'
                  : saveToAccount
                    ? 'Address will be permanently saved to your dashboard.'
                    : 'Saving as anonymous link. It will not appear in your dashboard.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {isGuest ? (
                <div className="flex items-center gap-2 opacity-60">
                  <Lock className="text-zinc-400 shrink-0" size={14} />
                  <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full p-0.5 pointer-events-none flex items-center">
                    <div className="w-4 h-4 bg-white dark:bg-zinc-600 rounded-full shadow-xs" />
                  </div>
                </div>
              ) : (
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${saveToAccount ? 'bg-accent justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                    }`}
                >
                  <div className="w-4 h-4 bg-white dark:bg-zinc-950 rounded-full shadow-xs transition-transform duration-200" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <button
            type="button"
            id="metadata-continue-btn"
            onClick={handleContinue}
            className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-semibold text-sm md:text-base py-3.5 rounded hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer"
          >
            <span>Review &amp; Generate</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Interstitial Confirmation Modal ────────────────────────────── */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent
          className="rounded-[4px] border border-border bg-card p-5 sm:max-w-md shadow-xl font-sans transform-gpu will-change-[transform,opacity]"
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            willChange: 'transform, opacity',
          }}
          showCloseButton={true}
        >
          <DialogHeader className="gap-2 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[4px] bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-accent" />
              </div>
              <DialogTitle className="text-base md:text-lg font-bold font-sans text-foreground tracking-tight">
                Unlock this feature
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed pt-1">
              Sign in to use this setting. Your current progress is saved, and you&apos;ll be brought right back.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="px-3.5 py-2 rounded-[4px] border border-border text-xs md:text-sm font-medium text-foreground bg-background hover:bg-muted hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-proceed-login-btn"
              onClick={handleProceedLogin}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[4px] bg-accent text-accent-foreground text-xs md:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-150 ease-out shadow-sm cursor-pointer"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

