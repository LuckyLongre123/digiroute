/**
 * /create/success - Terminal Success Screen Loading Skeleton
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateSuccessLoading() {
  return (
    <div
      className="text-foreground flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-4 pt-2 pb-28 font-sans"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* 1. Success Header */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-2 pb-1 text-center">
        <div className="h-12 w-12 rounded-full border border-slate-300 bg-slate-200" />
        <div className="flex flex-col items-center space-y-1">
          <div className="h-6 w-48 rounded-sm bg-slate-200" />
          <div className="h-3 w-64 rounded-sm bg-slate-100" />
        </div>
      </div>

      {/* 2. Short-Link Display Box */}
      <div className="bg-card border-border space-y-3 rounded-sm border p-4">
        <div className="h-3 w-28 rounded-sm bg-slate-200" />
        <div className="h-10 rounded-sm border border-slate-200 bg-slate-100" />
        <div className="border-border/60 flex items-center justify-between border-t pt-1">
          <div className="h-3 w-32 rounded-sm bg-slate-100" />
          <div className="h-7 w-28 rounded-sm bg-slate-200" />
        </div>
      </div>

      {/* 3. Sharing Action Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 rounded-sm border border-slate-200 bg-slate-100" />
          <div className="h-11 rounded-sm bg-slate-300" />
        </div>
        <div className="h-12 rounded-sm bg-slate-800/80" />
      </div>

      {/* 4. Bottom Thumb-Zone Actions */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans">
        <div className="mx-auto flex max-w-md flex-col gap-2.5 sm:flex-row md:max-w-xl lg:max-w-2xl">
          <div className="h-11 flex-1 rounded-sm border border-slate-200 bg-slate-100" />
          <div className="h-11 flex-1 rounded-sm bg-slate-800/80" />
          <div className="h-11 flex-1 rounded-sm bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
