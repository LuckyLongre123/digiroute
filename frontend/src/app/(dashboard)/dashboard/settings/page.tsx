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
  Trash2,
  User,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

/**
 * /dashboard/settings - Account Settings & Preferences
 *
 * Dark Utilitarian Citizen Settings:
 * - Account identity snapshot
 * - Privacy & Consents with audit logging & instant optimistic toggle
 * - Map preferences & offline cache diagnostics
 * - Clean WCAG AA contrast and safe bottom-navigation clearance
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
    const nowIST =
      new Intl.DateTimeFormat('en-IN', {
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
        : 'Consent revoked. Your preference has been logged to the audit ledger.'
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
    <div className="animate-in fade-in max-w-2xl space-y-6 font-sans duration-150 pb-28 md:pb-12 text-zinc-300">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          Account Settings
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Manage your account profile, privacy consents, map preferences, and local storage.
        </p>
      </div>

      {/* 1. Account Profile Card */}
      <div className="space-y-4 rounded-[4px] border border-zinc-800 bg-zinc-900/90 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <User className="h-3.5 w-3.5 text-orange-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Account
          </h2>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] border border-orange-500/30 bg-orange-950/40 font-mono text-sm font-bold text-orange-400">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {name}
            </p>
            <p className="truncate text-xs font-mono text-zinc-400">{email}</p>
          </div>
        </div>
      </div>

      {/* 2. Privacy & Consents Card */}
      <div className="space-y-4 rounded-[4px] border border-zinc-800 bg-zinc-900/90 p-5">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-orange-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Privacy &amp; Consents
            </h2>
          </div>
          {consentAccepted ? (
            <span className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-[3px] border border-emerald-500/40 bg-emerald-950/50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
              ● Accepted
            </span>
          ) : (
            <span className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-[3px] border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
              ○ Revoked
            </span>
          )}
        </div>

        <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-100">
              Age (13+) &amp; Terms Acceptance
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              I confirm I am 13 years of age or older (or have parental consent) and agree to DigiRoute&apos;s{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orange-400 underline inline-flex items-center gap-0.5 hover:text-orange-300"
              >
                Terms <ExternalLink className="h-2.5 w-2.5" />
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orange-400 underline inline-flex items-center gap-0.5 hover:text-orange-300"
              >
                Privacy Policy <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              .
            </p>
            {consentDateIST && (
              <p className="font-mono text-[10px] text-zinc-500">
                {consentLastAction === 'ACCEPTED'
                  ? `Accepted on: ${consentDateIST}`
                  : `Revoked on: ${consentDateIST}`}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center">
            <Switch
              checked={consentAccepted}
              onCheckedChange={handleConsentToggle}
              id="consent-status-toggle"
              aria-label="Toggle Age and Terms Consent"
            />
          </div>
        </div>

        <div className="border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Unticking this setting records consent revocation in the compliance audit ledger. Your account credentials and saved micro-addresses remain preserved; you can re-accept at any time.
          </p>
        </div>
      </div>

      {/* 3. Map & Storage Card */}
      <div className="space-y-5 rounded-[4px] border border-zinc-800 bg-zinc-900/90 p-5">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <Map className="h-4 w-4 text-orange-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Map &amp; Storage
          </h2>
        </div>

        {/* Map Layer Selector */}
        <div className="space-y-2">
          <label
            htmlFor="map-provider"
            className="block text-xs font-medium text-zinc-200"
          >
            Default Spatial Base Map
          </label>
          <select
            id="map-provider"
            value={offlineMap}
            onChange={(e) => setOfflineMap(e.target.value)}
            className="w-full cursor-pointer rounded-[4px] border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="mappls">Mappls (MapmyIndia) Sovereign Vector</option>
            <option value="osm">OpenStreetMap India Regional</option>
            <option value="bhuvan">ISRO Bhuvan Satellite Hybrid</option>
          </select>
          <p className="text-[11px] text-zinc-500">
            Mappls is recommended for sub-meter resolution in dense Indian municipal sectors.
          </p>
        </div>

        {/* Offline Cache Cleanup */}
        <div className="border-t border-zinc-800/80 pt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
              <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
              <span>Local Offline Cache</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Purges cached map tiles, temporary camera frames, and local drafts.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            type="button"
            id="clear-offline-cache-btn"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClearing ? (
              <>
                <Check className="h-3.5 w-3.5 text-orange-400" />
                <span>Clearing Cache...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Clear Cache</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Session Termination */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleLogout}
          id="settings-logout-btn"
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-red-500/30 bg-red-950/20 text-xs font-semibold text-red-400 transition-colors hover:bg-red-950/40 hover:border-red-500/50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
