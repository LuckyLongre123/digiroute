import { getSession } from '@/lib/auth';
import { TransitionLink } from '@/components/ui/TransitionLink';

export async function NavbarUserAsync() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <TransitionLink
        href="/login"
        id="navbar-login-btn"
        className="inline-flex items-center justify-center rounded-sm border border-zinc-300 bg-transparent px-3.5 py-1.5 font-sans text-xs font-semibold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-[0.98] sm:text-sm dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
      >
        Login
      </TransitionLink>
    );
  }

  const userInitial = session.user.name
    ? session.user.name.charAt(0).toUpperCase()
    : session.user.email
      ? session.user.email.charAt(0).toUpperCase()
      : 'D';

  return (
    <>
      {/* Desktop Dashboard Button (subtle outline user menu trigger, 4px rounded-sm) */}
      <TransitionLink
        href="/dashboard"
        id="navbar-dashboard-btn"
        className="hidden items-center gap-2 rounded-sm border border-zinc-200 bg-white/60 px-3 py-1.5 font-sans text-xs font-medium text-zinc-800 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-100/80 active:scale-[0.98] sm:text-sm md:inline-flex dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-zinc-100 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {userInitial}
        </span>
        <span>Dashboard</span>
      </TransitionLink>

      {/* Mobile Dashboard Compact Avatar Trigger (4px rounded-sm) */}
      <TransitionLink
        href="/dashboard"
        id="navbar-dashboard-mobile-btn"
        aria-label="Go to Dashboard"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-200 bg-white text-xs font-bold text-zinc-800 shadow-2xs transition-colors hover:bg-zinc-100 md:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span>{userInitial}</span>
      </TransitionLink>
    </>
  );
}
