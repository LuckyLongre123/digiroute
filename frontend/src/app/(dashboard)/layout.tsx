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
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 md:hidden bg-card border-b border-border px-4 h-14 flex items-center justify-between font-sans">
          <Link href="/" className="flex items-center group cursor-pointer" aria-label="DigiRoute Home">
            <Image
              src="/logo-transparent.png"
              alt="DigiRoute Logo"
              width={150}
              height={40}
              priority={true}
              quality={75}
              className="w-28 sm:w-32 h-auto object-contain dark:invert dark:brightness-200"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/sos"
              className="inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-semibold px-2.5 py-1 rounded"
              aria-label="SOS"
            >
              <ShieldAlert className="w-3 h-3" />
              SOS
            </Link>
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 rounded-[4px] bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs"
              aria-label="User profile"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page Content with bottom padding for mobile nav bar */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Persistent Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
