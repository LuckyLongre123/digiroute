/**
 * /create/map - Step 3 Loading Skeleton: Entrance Pin Map
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateMapLoading() {
  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] animate-pulse flex-col overflow-hidden font-sans">
      {/* Map Canvas Skeleton: Massive full-width, full-height block */}
      <div className="relative flex h-[65vh] w-full items-center justify-center rounded-sm border border-slate-300 bg-slate-200">
        {/* Subtle darker dot in the center to represent the pin loading */}
        <div className="relative flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-slate-400" />
          <div className="absolute -bottom-2 h-3 w-1.5 rounded-xs bg-slate-400" />
          <div className="absolute -bottom-3 h-1.5 w-4 rounded-full bg-slate-300 opacity-60" />
        </div>

        {/* Top Floating Controls placeholder */}
        <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
          <div className="h-8 w-36 rounded-sm border border-slate-200 bg-white/90 shadow-2xs" />
          <div className="h-8 w-20 rounded-sm border border-slate-200 bg-white/90 shadow-2xs" />
        </div>
      </div>

      {/* Bottom Sheet / CTA Readout: Bottom anchored block */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 space-y-3 border-t p-4 font-sans">
        <div className="mx-auto max-w-md space-y-3 md:max-w-xl lg:max-w-2xl">
          {/* Readout Block */}
          <div className="flex h-16 w-full items-center justify-between rounded-sm border border-slate-200 bg-slate-100 p-3">
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded-sm bg-slate-200" />
              <div className="h-5 w-36 rounded-sm bg-slate-300" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 rounded-sm bg-slate-200" />
              <div className="h-3 w-20 rounded-sm bg-slate-200" />
            </div>
          </div>

          {/* Confirm Pin CTA Button */}
          <div className="h-12 w-full rounded-sm bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
