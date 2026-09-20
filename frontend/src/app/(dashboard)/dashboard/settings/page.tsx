'use client';

import { getSessionAction, logoutAction } from '@/app/actions/auth';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Check,
  LogOut,
  Map,
  Smartphone,
  Trash2,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * /dashboard/settings - Citizen & App Settings (ROUTE-01, ROUTE-04)
 *
 * User profile, offline map layer defaults, cache management, and sign out.
 */
export default function SettingsPage() {
  const router = useRouter();
  const [offlineMap, setOfflineMap] = useState('mappls');
  const [cleared, setCleared] = useState(false);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      getSessionAction().then((res) => {
        if (res?.user) {
          useAuthStore.getState().setUser(res.user);
        }
      });
    }
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

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Safe fallback
      }
    }
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  };

  const handleLogout = async () => {
    await logoutAction();
    useAuthStore.getState().clearUser();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Settings &amp; Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your account profile, offline storage, and spatial defaults
        </p>
      </div>

      {/* Profile Card — Dynamically rendered for authenticated user */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>Sovereign Identity Profile</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
              {name}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {email}
            </p>

          </div>
        </div>
      </div>

      {/* Spatial / Map Layer Settings */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Map className="w-3.5 h-3.5" />
          <span>Spatial &amp; Map Layer Preferences</span>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="map-provider"
            className="block text-xs font-medium text-foreground tracking-tight"
          >
            Default Spatial Base Map
          </label>
          <select
            id="map-provider"
            value={offlineMap}
            onChange={(e) => setOfflineMap(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            <option value="mappls">Mappls (MapmyIndia) Sovereign Vector</option>
            <option value="osm">OpenStreetMap India Regional</option>
            <option value="bhuvan">ISRO Bhuvan Satellite Hybrid</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            Mappls is recommended for optimal accuracy in dense Indian urban wards.
          </p>
        </div>
      </div>

      {/* Storage & Offline Cache */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Offline PWA Storage &amp; Diagnostics</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-xs font-medium text-foreground tracking-tight">
              Local Offline Cache
            </div>
            <p className="text-[11px] text-muted-foreground">
              Clear saved tile caches, temporary camera captures, and draft addresses.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0 cursor-pointer"
          >
            {cleared ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>Cache Cleared</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
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
          className="w-full h-11 border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-sm rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
