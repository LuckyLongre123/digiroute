'use client';

import { Suspense, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { registerAction } from '@/app/actions/auth';
import { sanitizeCallbackUrl } from '@/lib/sanitizeUrl';
import { useAuthStore } from '@/store/useAuthStore';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));
  const actionParam = searchParams.get('action');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSubmittingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loginLink = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}${
    actionParam ? `&action=${encodeURIComponent(actionParam)}` : ''
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission
    if (isLoading || isSubmittingRef.current) return;
    setErrorMessage('');

    if (!name.trim()) {
      const msg = 'Please enter your full name.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!password || password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const result = await registerAction({ name, email, password });

      if (!result.success || !result.user) {
        const errorText =
          result.error || 'Failed to create account. Please try again.';
        setErrorMessage(errorText);
        toast.error(errorText);
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }

      // Sync Zustand auth state (auto-login enabled)
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
        toast.success(
          `Account created! Welcome, ${result.user.name || 'User'}.`
        );
      }

      // Navigate to destination and refresh server component tree
      router.push(targetUrl);
      router.refresh();
    } catch (err) {
      console.error('[Register] Submission error:', err);
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
          Create sovereign account
        </h1>
        <p className="mt-1 text-xs font-normal text-zinc-600">
          Save permanent micro-addresses, unlock passcodes, and track delivery
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
            htmlFor="name"
            className="mb-1.5 block text-xs font-semibold text-zinc-800"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="name"
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              className="focus:border-accent focus:ring-accent w-full rounded-[4px] border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
          </div>
        </div>

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
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold text-zinc-800"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="password"
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="focus:border-accent focus:ring-accent w-full rounded-[4px] border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          id="register-submit-btn"
          className="bg-accent text-accent-foreground hover:bg-accent/90 mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] text-xs font-semibold shadow-xs transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 sm:text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
        <p className="text-xs text-zinc-600">
          Already have an account?{' '}
          <Link
            href={loginLink}
            className="text-accent font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[4px] border border-zinc-300 bg-white p-6 text-center text-xs text-zinc-500 shadow-md">
          <Loader2 className="text-accent mx-auto mb-2 h-5 w-5 animate-spin" />
          <span>Loading registration form...</span>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
