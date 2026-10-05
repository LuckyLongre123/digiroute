import { MapPin, ChevronRight } from 'lucide-react';

/**
 * RecentAddressesSkeleton - Refined Utilitarian loading state
 * Consists of 3 empty cards with pulsing zinc backgrounds,
 * strictly matching the dimensions and 4px rounded-sm corners of real address cards.
 */
export function RecentAddressesSkeleton() {
  return (
    <section className="bg-card space-y-3 rounded-sm border border-zinc-200 p-5 font-sans shadow-xs sm:p-6 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="text-accent h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold tracking-tight sm:text-base">
            Recent Addresses
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
          <span>View all in Dashboard</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="animate-pulse bg-zinc-100/80 dark:bg-zinc-800/50 flex flex-col justify-between rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 p-3.5 text-left h-[104px]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-10 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-3 w-28 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-700/60 pt-2 text-[11px]">
              <div className="h-2.5 w-16 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-2.5 w-14 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
