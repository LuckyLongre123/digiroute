'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/app/actions/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';

/**
 * (dashboard) Layout - Authenticated User Area (ROUTE-04)
 *
 * Provides:
 * - Desktop sidebar with navigation links (<Sidebar />)
 * - Mobile top header with avatar greeting
 * - Mobile persistent bottom navigation bar (<MobileBottomNav />)
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      getSessionAction().then((res) => {
        if (res.user) {
          useAuthStore.getState().setUser(res.user);
        }
      });
    }
  }, [user]);

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

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans md:flex-row">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="bg-card border-border sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 font-sans md:hidden">
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
              className="h-auto w-28 object-contain sm:w-32 dark:brightness-200 dark:invert"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/sos"
              className="bg-destructive text-destructive-foreground inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold"
              aria-label="SOS"
            >
              <ShieldAlert className="h-3 w-3" />
              SOS
            </Link>
            <Link
              href="/dashboard/settings"
              className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-[4px] text-xs font-bold"
              aria-label="User profile"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page Content with bottom padding for mobile nav bar */}
        <main className="mx-auto w-full max-w-4xl flex-1 p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>

        {/* Mobile Persistent Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
