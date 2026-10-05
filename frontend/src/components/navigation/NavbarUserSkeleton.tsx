export function NavbarUserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      {/* Desktop User Skeleton: 4px rounded-sm container with pulsing circle + rectangle */}
      <div className="hidden h-[34px] items-center gap-2 rounded-sm border border-zinc-200 bg-white/60 px-3 py-1.5 md:inline-flex dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3.5 w-16 animate-pulse rounded-sm bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Mobile User Skeleton: Pulsing circle avatar */}
      <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-sm border border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}
