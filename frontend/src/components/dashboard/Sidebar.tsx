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

  const displayName = user?.name || user?.email?.split('@')[0] || 'Citizen Owner';
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
    <aside className="hidden md:flex md:w-64 flex-col justify-between bg-card border-r border-border p-5 shrink-0 font-sans">
      <div className="space-y-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group cursor-pointer" aria-label="DigiRoute Home">
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="w-36 h-auto object-contain dark:invert dark:brightness-200"
          />
        </Link>

        {/* User Profile Mini Badge */}
        <div className="p-3 bg-muted/50 rounded-[4px] border border-border flex items-center gap-3 font-sans">
          <div className="w-9 h-9 rounded-[4px] bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-foreground truncate font-sans">
              {displayName}
            </div>
            <div className="text-xs text-muted-foreground truncate font-sans">
              {user?.email || 'Verified Account'}
            </div>
          </div>
        </div>

        {/* Desktop Nav items */}
        <nav className="space-y-1 font-sans">
          {/* 1. Addresses */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-colors ${
              pathname === '/dashboard' || pathname.startsWith('/dashboard/address')
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Addresses</span>
          </Link>

          {/* 2. Reports (Disabled) */}
          <div
            aria-disabled="true"
            title="Reports feature coming soon"
            className="flex items-center justify-between px-3 py-2.5 rounded-[4px] text-sm font-medium opacity-50 cursor-not-allowed text-zinc-500 select-none"
          >
            <div className="flex items-center gap-3">
              <FileBarChart className="w-4 h-4 text-zinc-500" />
              <span>Reports</span>
            </div>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
              Soon
            </span>
          </div>

          {/* 3. Settings */}
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="space-y-2 pt-4 border-t border-border font-sans">
        <Link
          href="/sos"
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-[4px] transition-colors"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency SOS (112)</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          id="dashboard-logout-btn"
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-[4px] transition-colors cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
