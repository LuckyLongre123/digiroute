'use client';

import { getSessionAction, logoutAction } from '@/app/actions/auth';
import {
  getUserConsentAction,
  updateUserConsentAction,
} from '@/app/actions/consent';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Check,
  LogOut,
  Map,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

/**
 * /dashboard/settings - Citizen & App Settings (ROUTE-01, ROUTE-04)
 *
 * User profile, legal consents, offline map layer defaults, cache management, and sign out.
 */
export default function SettingsPage() {
  const router = useRouter();
  const [offlineMap, setOfflineMap] = useState('mappls');
  const [isClearing, setIsClearing] = useState(false);

  // Legal Consent State (Optimistic)
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [consentDateIST, setConsentDateIST] = useState<string | null>(null);
  const [consentLastAction, setConsentLastAction] = useState<
    'ACCEPTED' | 'REVOKED' | null
  >(null);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      getSessionAction().then((res) => {
        if (res?.user) {
          useAuthStore.getState().setUser(res.user);
        }
      });
    }

    // Load user consent status
    getUserConsentAction().then((res) => {
      if (res && res.success) {
        if (res.lastAction) {
          setConsentAccepted(res.accepted ?? true);
          setConsentLastAction(res.lastAction);
          setConsentDateIST(res.formattedDateIST || null);
        } else {
          // Pre-existing or unrecorded user: default active
          setConsentAccepted(true);
          setConsentLastAction('ACCEPTED');
        }
      }
    });
  }, [user]);

  const email = user?.email || 'citizen@digiroute.in';
  const name = user?.name?.trim() || email.split('@')[0] || 'Citizen Owner';
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : email.slice(0, 2).toUpperCase();

  const handleConsentToggle = async (checked: boolean) => {
    // 1. Optimistic UI update (Instant, zero blocking spinner)
    const prevAccepted = consentAccepted;
    const prevDate = consentDateIST;
    const prevAction = consentLastAction;

    setConsentAccepted(checked);
    setConsentLastAction(checked ? 'ACCEPTED' : 'REVOKED');
    const nowIST = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date()) + ' IST';
    setConsentDateIST(nowIST);

    toast.success(
      checked
        ? 'Consent recorded: Terms & Privacy Policy accepted.'
        : 'Consent revoked. Your preferences have been updated in the audit ledger.'
    );

    // 2. Non-blocking background persistence
    try {
      const res = await updateUserConsentAction(checked);
      if (!res.success) {
        // Revert on failure
        setConsentAccepted(prevAccepted);
        setConsentDateIST(prevDate);
        setConsentLastAction(prevAction);
        toast.error('Failed to update consent preference. Please retry.');
      } else if (res.formattedDateIST) {
        setConsentDateIST(res.formattedDateIST);
      }
    } catch {
      setConsentAccepted(prevAccepted);
      setConsentDateIST(prevDate);
      setConsentLastAction(prevAction);
      toast.error('Failed to update consent preference. Please retry.');
    }
  };

  const handleClearCache = async () => {
    if (isClearing) return;
    setIsClearing(true);

    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      if (typeof window !== 'undefined' && 'caches' in window) {
        await caches
          .keys()
          .then((names) =>
            Promise.all(names.map((name) => caches.delete(name)))
          );
      }

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      toast.success('Cache cleared successfully. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.warn('[Settings] Failed to clear cache completely:', err);
      toast.error('Failed to clear cache completely. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    useAuthStore.getState().clearUser();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="animate-in fade-in max-w-2xl space-y-6 font-sans duration-150">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Settings &amp; Preferences
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Manage your account profile, legal consents, offline storage, and spatial defaults
        </p>
      </div>

      {/* Profile Card */}
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <User className="h-3.5 w-3.5" />
          <span>Sovereign Identity Profile</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-base font-semibold tracking-tight">
              {name}
            </h2>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>
        </div>
      </div>

      {/* Privacy & Legal Consents Card */}
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>Privacy &amp; Legal Consents</span>
          </div>
          {consentAccepted ? (
            <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
              ● Active Accepted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
              ○ Consent Revoked
            </span>
          )}
        </div>

        <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="text-foreground text-xs font-medium tracking-tight">
              Age (13+) &amp; Terms of Service Acceptance
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Confirm you are 13 years of age or older (or have parental consent) and agree to DigiRoute&apos;s{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 underline inline-flex items-center gap-0.5 hover:text-amber-400"
              >
                Terms of Service <ExternalLink className="h-2.5 w-2.5" />
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 underline inline-flex items-center gap-0.5 hover:text-amber-400"
              >
                Privacy Policy <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              .
            </p>
            {consentDateIST && (
              <p className="text-muted-foreground font-mono text-[10px]">
                {consentLastAction === 'ACCEPTED'
                  ? `Accepted on: ${consentDateIST}`
                  : `Revoked on: ${consentDateIST}`}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Switch
              checked={consentAccepted}
              onCheckedChange={handleConsentToggle}
              id="consent-status-toggle"
              aria-label="Toggle Age and Terms Consent"
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
          <p className="text-muted-foreground text-[11px]">
            Unticking this setting revokes your legal consent in the immutable audit ledger. Your account and saved addresses remain active; you can re-accept at any time.
          </p>
        </div>
      </div>

      {/* Spatial / Map Layer Settings */}
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Map className="h-3.5 w-3.5" />
          <span>Spatial &amp; Map Layer Preferences</span>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="map-provider"
            className="text-foreground block text-xs font-medium tracking-tight"
          >
            Default Spatial Base Map
          </label>
          <select
            id="map-provider"
            value={offlineMap}
            onChange={(e) => setOfflineMap(e.target.value)}
            className="bg-background border-input text-foreground focus:ring-accent w-full cursor-pointer rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="mappls">Mappls (MapmyIndia) Sovereign Vector</option>
            <option value="osm">OpenStreetMap India Regional</option>
            <option value="bhuvan">ISRO Bhuvan Satellite Hybrid</option>
          </select>
          <p className="text-muted-foreground text-[11px]">
            Mappls is recommended for optimal accuracy in dense Indian urban wards.
          </p>
        </div>
      </div>

      {/* Storage & Offline Cache */}
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Smartphone className="h-3.5 w-3.5" />
          <span>Offline PWA Storage &amp; Diagnostics</span>
        </div>

        <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
          <div>
            <div className="text-foreground text-xs font-medium tracking-tight">
              Local Offline Cache
            </div>
            <p className="text-muted-foreground text-[11px]">
              Clear saved tile caches, temporary camera captures, and draft addresses.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            type="button"
            id="clear-offline-cache-btn"
            className="border-border bg-background hover:bg-muted text-foreground inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClearing ? (
              <>
                <Check className="text-accent h-3.5 w-3.5" />
                <span>Clearing Cache...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Cache</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Session Management */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          id="settings-logout-btn"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded border text-sm font-semibold transition-all active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
