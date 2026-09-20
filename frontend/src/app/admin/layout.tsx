'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Settings,
  LogOut,
  Terminal,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/overview', label: 'Graph Overview', icon: LayoutDashboard },
  { href: '/admin/images', label: 'Media Gallery', icon: ImageIcon },
  { href: '/admin/settings', label: 'Security & Keys', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 1. Isolate the Login Page strictly without sidebar or admin shell
  if (pathname === '/admin/login') {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950">{children}</div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between font-mono text-xs">
      <div>
        {/* Brand Header with DigiRoute Logo */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-3.5">
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="group flex cursor-pointer items-center gap-2"
            title="Return to DigiRoute Public Home"
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
          <span className="rounded border border-cyan-800/60 bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">
            admin
          </span>
        </div>

        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-cyan-400" />
            <span className="font-bold tracking-wide text-cyan-400">admin</span>
            <span className="text-zinc-600">:~#</span>
          </div>
          {/* Mobile drawer close button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="cursor-pointer p-1 text-zinc-400 transition-colors hover:text-zinc-200 md:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-[3px] px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-cyan-400/10 font-semibold text-cyan-400'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="border-t border-zinc-800 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-[3px] px-3 py-2 text-left text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut size={14} />
          <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="dark flex min-h-[100dvh] flex-col bg-zinc-950 font-mono text-zinc-200 md:flex-row"
      style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
    >
      {/* 3. Mobile Header with Hamburger */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-3 px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="h-auto w-24 object-contain sm:w-28 dark:brightness-200 dark:invert"
          />
          <span className="rounded border border-cyan-800/60 bg-cyan-950/80 px-1 py-0.5 font-mono text-[9px] text-cyan-400">
            admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:text-cyan-400"
          >
            Public Site &rarr;
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="cursor-pointer rounded-[3px] p-1.5 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-cyan-400"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* 3. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <aside className="relative z-10 flex h-full w-64 max-w-[80vw] flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}

      {/* 3. Desktop Persistent Sidebar */}
      <aside className="fixed top-0 left-0 z-40 hidden h-full border-r border-zinc-800 bg-zinc-950 md:flex md:w-64 md:flex-col">
        {navContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex min-h-[calc(100dvh-49px)] w-full flex-1 flex-col overflow-auto md:ml-64 md:min-h-[100dvh]">
        {children}
      </main>
    </div>
  );
}
