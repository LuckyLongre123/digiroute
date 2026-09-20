'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, PlusCircle, Settings } from 'lucide-react';

/**
 * MobileBottomNav
 *
 * Persistent, global mobile bottom navigation bar for authenticated users.
 * - Addresses (/dashboard)
 * - Create (/create) with center saffron accent
 * - Settings (/dashboard/settings)
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Addresses',
      href: '/dashboard',
      icon: MapPin,
      isActive:
        pathname === '/dashboard' || pathname.startsWith('/dashboard/address'),
    },
    {
      label: 'Create',
      href: '/create',
      icon: PlusCircle,
      isActive: pathname === '/create' || pathname.startsWith('/create/'),
      isAccent: true,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      isActive: pathname === '/dashboard/settings',
    },
  ];

  return (
    <nav
      className="bg-card/95 border-border fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t px-4 font-sans shadow-lg backdrop-blur-md md:hidden"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors ${
              item.isAccent
                ? 'text-accent font-semibold'
                : item.isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div
              className={`rounded-sm p-1 ${
                item.isAccent ? 'bg-accent/10' : ''
              }`}
            >
              <Icon
                className={`h-5 w-5 ${item.isAccent ? 'text-accent' : ''}`}
              />
            </div>
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
