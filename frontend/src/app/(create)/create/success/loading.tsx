/**
 * /create/success - Terminal Success Screen Loading Skeleton
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateSuccessLoading() {
  return (
    <div
      className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 pt-2 space-y-4 font-sans text-foreground animate-pulse"
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* 1. Success Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 space-y-2">
        <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300" />
        <div className="space-y-1 flex flex-col items-center">
          <div className="h-6 w-48 bg-slate-200 rounded-sm" />
          <div className="h-3 w-64 bg-slate-100 rounded-sm" />
        </div>
      </div>

      {/* 2. Short-Link Display Box */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-3">
        <div className="h-3 w-28 bg-slate-200 rounded-sm" />
        <div className="h-10 bg-slate-100 border border-slate-200 rounded-sm" />
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="h-3 w-32 bg-slate-100 rounded-sm" />
          <div className="h-7 w-28 bg-slate-200 rounded-sm" />
        </div>
      </div>

      {/* 3. Sharing Action Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-slate-100 border border-slate-200 rounded-sm" />
          <div className="h-11 bg-slate-300 rounded-sm" />
        </div>
        <div className="h-12 bg-slate-800/80 rounded-sm" />
      </div>

      {/* 4. Bottom Thumb-Zone Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5">
          <div className="h-11 flex-1 bg-slate-100 border border-slate-200 rounded-sm" />
          <div className="h-11 flex-1 bg-slate-800/80 rounded-sm" />
          <div className="h-11 flex-1 bg-slate-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
