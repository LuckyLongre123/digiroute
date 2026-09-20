'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  MapPin,
  Settings,
  LogOut,
  ShieldAlert,
  FileBarChart,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { logoutAction } from '@/app/actions/auth';

/**
 * Dashboard Sidebar (Desktop)
 *
 * Cleaned desktop sidebar:
 * - "Addresses" (/dashboard)
 * - "Reports" (Visually disabled, non-clickable)
 * - "Settings" (/dashboard/settings)
 * - Note: "Create" link is removed from sidebar; primary "+ Create Address" button remains on main dashboard view.
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const displayName =
    user?.name || user?.email?.split('@')[0] || 'Citizen Owner';
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : 'DR';

  const handleLogout = async () => {
    await logoutAction();
    useAuthStore.getState().clearUser();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="bg-card border-border hidden shrink-0 flex-col justify-between border-r p-5 font-sans md:flex md:w-64">
      <div className="space-y-6">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex cursor-pointer items-center"
          aria-label="DigiRoute Home"
        >
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="h-auto w-36 object-contain dark:brightness-200 dark:invert"
          />
        </Link>

        {/* User Profile Mini Badge */}
        <div className="bg-muted/50 border-border flex items-center gap-3 rounded-[4px] border p-3 font-sans">
          <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-[4px] text-sm font-bold">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-foreground truncate font-sans text-sm font-semibold">
              {displayName}
            </div>
            <div className="text-muted-foreground truncate font-sans text-xs">
              {user?.email || 'Verified Account'}
            </div>
          </div>
        </div>

        {/* Desktop Nav items */}
        <nav className="space-y-1 font-sans">
          {/* 1. Addresses */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === '/dashboard' ||
              pathname.startsWith('/dashboard/address')
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Addresses</span>
          </Link>

          {/* 2. Reports (Disabled) */}
          <div
            aria-disabled="true"
            title="Reports feature coming soon"
            className="flex cursor-not-allowed items-center justify-between rounded-[4px] px-3 py-2.5 text-sm font-medium text-zinc-500 opacity-50 select-none"
          >
            <div className="flex items-center gap-3">
              <FileBarChart className="h-4 w-4 text-zinc-500" />
              <span>Reports</span>
            </div>
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase dark:bg-zinc-800">
              Soon
            </span>
          </div>

          {/* 3. Settings */}
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="border-border space-y-2 border-t pt-4 font-sans">
        <Link
          href="/sos"
          className="text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-[4px] px-3 py-2 text-xs font-semibold transition-colors"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Emergency SOS (112)</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          id="dashboard-logout-btn"
          className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-3 py-2 text-left text-xs transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
