'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LifeBuoy, MapPin, Settings } from 'lucide-react';

/**
 * MobileBottomNav
 *
 * Persistent mobile bottom navigation bar for authenticated users.
 * Refined Utilitarian 3-action layout:
 * - Left: SOS (/sos) with subtle red styling (rounded-sm 4px)
 * - Center: Addresses (/dashboard)
 * - Right: Settings (/dashboard/settings)
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'SOS',
      href: '/sos',
      icon: LifeBuoy,
      isActive: pathname === '/sos' || pathname.startsWith('/sos/'),
      isSos: true,
    },
    {
      label: 'Addresses',
      href: '/dashboard',
      icon: MapPin,
      isActive:
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/address') ||
        pathname.startsWith('/dashboard/manage'),
      isSos: false,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      isActive: pathname === '/dashboard/settings',
      isSos: false,
    },
  ];

  return (
    <nav
      className="bg-card/95 border-border fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t px-4 font-sans shadow-lg backdrop-blur-md md:hidden"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        if (item.isSos) {
          return (
            <Link
              key={item.href}
              href={item.href}
              id="mobile-bottom-nav-sos"
              aria-label="Emergency SOS"
              className="flex flex-1 flex-col items-center justify-center py-1 text-xs text-red-600 transition-transform active:scale-95 dark:text-red-400"
            >
              <div
                className={`flex h-7 w-12 items-center justify-center rounded-sm transition-colors ${
                  item.isActive
                    ? 'border border-red-200/80 bg-red-50 font-semibold text-red-600 shadow-2xs dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400'
                    : 'text-red-600/80 hover:bg-red-50/60 hover:text-red-600 dark:text-red-400/80 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                }`}
              >
                <Icon className="h-4.5 w-4.5 stroke-[2.2]" />
              </div>
              <span
                className={`mt-0.5 text-[10px] tracking-tight uppercase ${
                  item.isActive ? 'font-bold' : 'font-semibold'
                }`}
              >
                SOS
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors ${
              item.isActive
                ? 'font-semibold text-zinc-950 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <div
              className={`rounded-sm p-1 ${
                item.isActive ? 'bg-zinc-100 dark:bg-zinc-800' : ''
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="mt-0.5 text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
