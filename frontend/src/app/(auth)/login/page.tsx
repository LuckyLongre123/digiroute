'use client';

import { Suspense, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { loginAction } from '@/app/actions/auth';
import { sanitizeCallbackUrl } from '@/lib/sanitizeUrl';
import { useAuthStore } from '@/store/useAuthStore';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));
  const actionParam = searchParams.get('action');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSubmittingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const registerLink = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}${
    actionParam ? `&action=${encodeURIComponent(actionParam)}` : ''
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission
    if (isLoading || isSubmittingRef.current) return;
    setErrorMessage('');

    if (!email.trim() || !password) {
      const msg = 'Please enter both email and password.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const result = await loginAction({ email, password });

      if (!result.success || !result.user) {
        const errorText =
          result.error || 'Invalid credentials. Please try again.';
        setErrorMessage(errorText);
        toast.error(errorText);
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }

      // Sync Zustand auth state
      useAuthStore.getState().setUser(result.user);

      // Determine redirect target preserving action param
      let targetUrl = callbackUrl;
      if (actionParam && !targetUrl.includes('action=')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}action=${encodeURIComponent(actionParam)}`;
      }

      // If returning to create success screen, append login=success for single authoritative toast
      if (
        targetUrl.includes('/create/success') &&
        !targetUrl.includes('login=success')
      ) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}login=success`;
      } else if (!targetUrl.includes('/create/success')) {
        toast.success(`Welcome back, ${result.user.name || 'User'}!`);
      }

      // Navigate to destination and refresh server component tree
      router.push(targetUrl);
      router.refresh();
    } catch (err) {
      console.error('[Login] Submission error:', err);
      const errText =
        'Network connection issue. Please check your internet and retry.';
      setErrorMessage(errText);
      toast.error(errText);
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in rounded-[4px] border border-zinc-300 bg-white p-6 font-sans shadow-lg duration-150 sm:p-7">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="mt-1 text-xs font-normal text-zinc-600">
          Sign in to access your addresses and permanent QR badges
        </p>
      </div>

      {errorMessage && (
        <div className="animate-in fade-in mb-4 flex items-start gap-2 rounded-[4px] border border-red-200 bg-red-50 p-3 text-xs text-red-700 duration-150">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold text-zinc-800"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="focus:border-accent focus:ring-accent w-full rounded-[4px] border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-zinc-800"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="password"
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="focus:border-accent focus:ring-accent w-full rounded-[4px] border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          id="login-submit-btn"
          className="bg-accent text-accent-foreground hover:bg-accent/90 mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] text-xs font-semibold shadow-xs transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 sm:text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
        <p className="text-xs text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link
            href={registerLink}
            className="text-accent font-semibold hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[4px] border border-zinc-300 bg-white p-6 text-center text-xs text-zinc-500 shadow-md">
          <Loader2 className="text-accent mx-auto mb-2 h-5 w-5 animate-spin" />
          <span>Loading login form...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
