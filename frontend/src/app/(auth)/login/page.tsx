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
        const errorText = result.error || 'Invalid credentials. Please try again.';
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
      if (targetUrl.includes('/create/success') && !targetUrl.includes('login=success')) {
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
      const errText = 'Network connection issue. Please check your internet and retry.';
      setErrorMessage(errText);
      toast.error(errText);
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-300 rounded-[4px] p-6 sm:p-7 shadow-lg animate-in fade-in duration-150 font-sans">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs text-zinc-600 mt-1 font-normal">
          Sign in to access your addresses and permanent QR badges
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-[4px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-zinc-800 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="w-full rounded-[4px] pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-300 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none bg-white disabled:bg-zinc-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-zinc-800"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-[4px] pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-300 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none bg-white disabled:bg-zinc-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          id="login-submit-btn"
          className="w-full mt-2 h-10 bg-accent text-accent-foreground font-semibold text-xs sm:text-sm rounded-[4px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-accent/90 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-200 text-center">
        <p className="text-xs text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link
            href={registerLink}
            className="font-semibold text-accent hover:underline"
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
        <div className="p-6 text-center text-xs text-zinc-500 bg-white rounded-[4px] border border-zinc-300 shadow-md">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
          <span>Loading login form...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
