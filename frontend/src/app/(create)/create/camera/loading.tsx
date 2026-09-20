/**
 * /create/camera - Step 2 Loading Skeleton: Visual Lock Camera
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateCameraLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 pt-2 space-y-4 font-sans animate-pulse">
      {/* Header Info: Title and microcopy */}
      <div className="space-y-1.5">
        <div className="h-7 w-52 bg-slate-200 rounded-sm" />
        <div className="h-4 w-80 max-w-full bg-slate-100 rounded-sm" />
      </div>

      {/* Viewfinder: Large rectangular block mimicking camera feed */}
      <div className="relative w-full h-[60vh] bg-slate-200 rounded-sm border border-slate-300 flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Subtle camera lens indicator */}
        <div className="w-14 h-14 rounded-full border-2 border-slate-300/80 flex items-center justify-center mb-6">
          <div className="w-5 h-5 rounded-full bg-slate-300/80" />
        </div>

        {/* Viewfinder boundary guide */}
        <div className="w-48 h-48 border border-dashed border-slate-300/90 rounded-sm flex items-center justify-center">
          <div className="h-3 w-28 bg-slate-300/60 rounded-sm" />
        </div>

        {/* Bottom third capture button skeleton */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-300 bg-slate-100 shrink-0" />
        </div>
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex gap-3">
          <div className="h-12 flex-1 bg-slate-200 rounded-sm" />
          <div className="h-12 flex-1 bg-slate-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
