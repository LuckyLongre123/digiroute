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
      className="dark min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#09090b', fontFamily: 'var(--font-geist-mono), monospace' }}
    >
      {/* Subtle scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.8) 1px, rgba(255,255,255,0.8) 2px)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto p-5 sm:p-7 rounded-md border border-zinc-800/90 bg-zinc-950/95 shadow-2xl backdrop-blur-md">
        {/* Return to Home link */}
        <div className="mb-6 pb-3 border-b border-zinc-900 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>&larr; Return to DigiRoute</span>
          </Link>
          <span className="text-[10px] text-zinc-700 font-mono">restricted-terminal</span>
        </div>

        {/* Brand Logo in Admin Login */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="inline-block cursor-pointer">
            <Image
              src="/logo-transparent.png"
              alt="DigiRoute Logo"
              width={150}
              height={40}
              priority={true}
              quality={75}
              className="w-32 h-auto object-contain dark:invert dark:brightness-200"
            />
          </Link>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            Admin Auth
          </span>
        </div>

        {/* Terminal prompt header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <p className="text-xs font-mono mb-1" style={{ color: '#71717a' }}>
            root@digiroute-admin:~$
          </p>
          <p className="text-sm font-mono" style={{ color: '#22d3ee' }}>
            authenticate --elevated
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[11px] uppercase tracking-widest mb-1.5 font-mono"
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
              className="w-full px-3 py-2.5 text-sm font-mono rounded-[3px] outline-none disabled:opacity-50 transition-colors"
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
              className="block text-[11px] uppercase tracking-widest mb-1.5 font-mono"
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
              className="w-full px-3 py-2.5 text-sm font-mono rounded-[3px] outline-none disabled:opacity-50 transition-colors"
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
            <p className="text-xs font-mono py-2 px-3 rounded-[3px]"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              [ERROR] {error}
            </p>
          )}

          <button
            type="submit"
            id="admin-login-submit"
            disabled={isPending}
            className="w-full py-2.5 text-sm font-mono font-semibold rounded-[3px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isPending ? '#164e63' : '#22d3ee',
              color: '#09090b',
            }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              '$ authenticate'
            )}
          </button>
        </form>

        {/* Version stamp */}
        <p className="text-center text-[10px] font-mono mt-8" style={{ color: '#3f3f46' }}>
          digiroute-admin v1.0.0 — restricted access
        </p>
      </div>
    </div>
  );
}
