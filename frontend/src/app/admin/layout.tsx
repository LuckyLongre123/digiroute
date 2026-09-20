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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 1. Isolate the Login Page strictly without sidebar or admin shell
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {children}
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between font-mono text-xs">
      <div>
        {/* Brand Header with DigiRoute Logo */}
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2 group cursor-pointer"
            title="Return to DigiRoute Public Home"
          >
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
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            admin
          </span>
        </div>

        {/* Terminal Header */}
        <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-cyan-400" />
            <span className="font-bold text-cyan-400 tracking-wide">admin</span>
            <span className="text-zinc-600">:~#</span>
          </div>
          {/* Mobile drawer close button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] transition-colors ${
                  active
                    ? 'text-cyan-400 bg-cyan-400/10 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
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
      <div className="p-3 border-t border-zinc-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
        >
          <LogOut size={14} />
          <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="dark min-h-[100dvh] flex flex-col md:flex-row bg-zinc-950 font-mono text-zinc-200"
      style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
    >
      {/* 3. Mobile Header with Hamburger */}
      <header className="md:hidden flex items-center justify-between p-3 px-4 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="w-24 sm:w-28 h-auto object-contain dark:invert dark:brightness-200"
          />
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-[11px] text-zinc-400 hover:text-cyan-400 px-2 py-1 transition-colors"
          >
            Public Site &rarr;
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-[3px] text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* 3. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <aside className="relative w-64 max-w-[80vw] bg-zinc-950 border-r border-zinc-800 h-full z-10 flex flex-col shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}

      {/* 3. Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col fixed left-0 top-0 h-full border-r border-zinc-800 bg-zinc-950 z-40">
        {navContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 w-full overflow-auto flex flex-col min-h-[calc(100dvh-49px)] md:min-h-[100dvh]">
        {children}
      </main>
    </div>
  );
}
