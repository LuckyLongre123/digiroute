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
      isActive: pathname === '/dashboard' || pathname.startsWith('/dashboard/address'),
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-4 font-sans shadow-lg"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
              item.isAccent
                ? 'text-accent font-semibold'
                : item.isActive
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div
              className={`p-1 rounded-sm ${
                item.isAccent ? 'bg-accent/10' : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${item.isAccent ? 'text-accent' : ''}`} />
            </div>
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
