'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

import { useRouter } from 'next/navigation';

/**
 * /admin/login — Hidden Admin Login
 *
 * Terminal aesthetic: zinc-950 bg, electric cyan accent, Geist Mono.
 * No branding. No public references. Just a secure auth gate.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          router.push('/admin/overview');
          router.refresh();
        } else {
          setError(data.error || 'Authentication failed.');
        }
      } catch {
        setError('Network error. Please retry.');
      }
    });
  };

  return (
    <div
      className="dark flex min-h-[100dvh] w-full flex-col items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: '#09090b',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      {/* Subtle scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.8) 1px, rgba(255,255,255,0.8) 2px)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md rounded-md border border-zinc-800/90 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-md sm:p-7 md:p-8">
        {/* Return to Home link */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-900 pb-3">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2 font-mono text-sm text-zinc-400 transition-colors hover:text-cyan-400 md:text-xs"
          >
            <ArrowLeft size={15} />
            <span>&larr; Return to DigiRoute</span>
          </Link>
          <span className="font-mono text-xs text-zinc-600 md:text-[10px]">
            restricted-terminal
          </span>
        </div>

        {/* Brand Logo in Admin Login */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex min-h-[44px] cursor-pointer items-center"
          >
            <Image
              src="/logo-transparent.png"
              alt="DigiRoute Logo"
              width={150}
              height={40}
              priority={true}
              quality={75}
              className="h-auto w-32 object-contain dark:brightness-200 dark:invert"
            />
          </Link>
          <span className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-400 md:text-[10px]">
            Admin Auth
          </span>
        </div>

        {/* Terminal prompt header */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <p
            className="mb-1 font-mono text-sm md:text-xs"
            style={{ color: '#71717a' }}
          >
            root@digiroute-admin:~$
          </p>
          <p
            className="font-mono text-base font-semibold md:text-sm"
            style={{ color: '#22d3ee' }}
          >
            authenticate --elevated
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block font-mono text-xs tracking-widest uppercase md:text-[11px]"
              style={{ color: '#71717a' }}
            >
              Identifier
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              disabled={isPending}
              className="min-h-[44px] w-full rounded-[3px] px-3.5 py-3 font-mono text-base transition-colors outline-none disabled:opacity-50 md:py-2.5 md:text-sm"
              style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                color: '#e4e4e7',
                caretColor: '#22d3ee',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
              onBlur={(e) => (e.target.style.borderColor = '#27272a')}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block font-mono text-xs tracking-widest uppercase md:text-[11px]"
              style={{ color: '#71717a' }}
            >
              Passphrase
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isPending}
              className="min-h-[44px] w-full rounded-[3px] px-3.5 py-3 font-mono text-base transition-colors outline-none disabled:opacity-50 md:py-2.5 md:text-sm"
              style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                color: '#e4e4e7',
                caretColor: '#22d3ee',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
              onBlur={(e) => (e.target.style.borderColor = '#27272a')}
            />
          </div>

          {error && (
            <p
              className="rounded-[3px] px-3.5 py-2.5 font-mono text-sm md:text-xs"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              [ERROR] {error}
            </p>
          )}

          <button
            type="submit"
            id="admin-login-submit"
            disabled={isPending}
            className="min-h-[44px] w-full cursor-pointer rounded-[3px] py-3 font-mono text-base font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:py-2.5 md:text-sm"
            style={{
              backgroundColor: isPending ? '#164e63' : '#22d3ee',
              color: '#09090b',
            }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              '$ authenticate'
            )}
          </button>
        </form>

        {/* Version stamp */}
        <p
          className="mt-8 text-center font-mono text-xs md:text-[10px]"
          style={{ color: '#3f3f46' }}
        >
          digiroute-admin v1.0.0 — restricted access
        </p>
      </div>
    </div>
  );
}
