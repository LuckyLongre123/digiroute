'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/app/actions/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { Navbar } from '@/components/navigation/Navbar';

/**
 * (dashboard) Layout - Authenticated User Area (ROUTE-04)
 *
 * Provides:
 * - Desktop sidebar with navigation links (<Sidebar />)
 * - Unified mobile top header (<Navbar />) matching home layout
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

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans md:flex-row">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Unified Top Navbar for mobile */}
        <div className="md:hidden">
          <Navbar />
        </div>

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
