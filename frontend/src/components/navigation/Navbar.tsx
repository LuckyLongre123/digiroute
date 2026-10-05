import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { NavbarClient } from './NavbarClient';
import { NavbarUserAsync } from './NavbarUserAsync';
import { NavbarUserSkeleton } from './NavbarUserSkeleton';
import { TransitionLink } from '@/components/ui/TransitionLink';

/**
 * Navbar - Auth-Aware Server Component
 *
 * Implements strict conditional skeleton loading:
 * - If isLikelyAuthenticated is true (session cookie exists), wraps User Profile in <Suspense fallback={<NavbarUserSkeleton />}>
 * - If isLikelyAuthenticated is false (no session cookie), instantly renders guest "Login" state with zero skeleton flash.
 */
export async function Navbar() {
  const cookieStore = await cookies();
  const isLikelyAuthenticated = cookieStore.has(SESSION_COOKIE_NAME);

  const userSection = isLikelyAuthenticated ? (
    <Suspense fallback={<NavbarUserSkeleton />}>
      <NavbarUserAsync />
    </Suspense>
  ) : (
    <TransitionLink
      href="/login"
      id="navbar-login-btn"
      className="inline-flex items-center justify-center rounded-sm border border-zinc-300 bg-transparent px-3.5 py-1.5 font-sans text-xs font-semibold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-[0.98] sm:text-sm dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      Login
    </TransitionLink>
  );

  return (
    <NavbarClient
      isLikelyAuthenticated={isLikelyAuthenticated}
      userSection={userSection}
    />
  );
}
