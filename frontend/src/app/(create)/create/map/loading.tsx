/**
 * /create/map - Step 3 Loading Skeleton: Entrance Pin Map
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateMapLoading() {
  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden font-sans animate-pulse">
      {/* Map Canvas Skeleton: Massive full-width, full-height block */}
      <div className="relative w-full h-[65vh] bg-slate-200 rounded-sm flex items-center justify-center border border-slate-300">
        {/* Subtle darker dot in the center to represent the pin loading */}
        <div className="relative flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-slate-400" />
          <div className="absolute -bottom-2 w-1.5 h-3 bg-slate-400 rounded-xs" />
          <div className="absolute -bottom-3 w-4 h-1.5 bg-slate-300 rounded-full opacity-60" />
        </div>

        {/* Top Floating Controls placeholder */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="h-8 w-36 bg-white/90 border border-slate-200 rounded-sm shadow-2xs" />
          <div className="h-8 w-20 bg-white/90 border border-slate-200 rounded-sm shadow-2xs" />
        </div>
      </div>

      {/* Bottom Sheet / CTA Readout: Bottom anchored block */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border p-4 space-y-3 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-3">
          {/* Readout Block */}
          <div className="h-16 w-full bg-slate-100 border border-slate-200 rounded-sm p-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-slate-200 rounded-sm" />
              <div className="h-5 w-36 bg-slate-300 rounded-sm" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-slate-200 rounded-sm" />
              <div className="h-3 w-20 bg-slate-200 rounded-sm" />
            </div>
          </div>

          {/* Confirm Pin CTA Button */}
          <div className="h-12 w-full bg-slate-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
