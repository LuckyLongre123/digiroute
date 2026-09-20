/**
 * /create/camera - Step 2 Loading Skeleton: Visual Lock Camera
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateCameraLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-4 pt-2 pb-24 font-sans">
      {/* Header Info: Title and microcopy */}
      <div className="space-y-1.5">
        <div className="h-7 w-52 rounded-sm bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded-sm bg-slate-100" />
      </div>

      {/* Viewfinder: Large rectangular block mimicking camera feed */}
      <div className="relative flex h-[60vh] w-full flex-col items-center justify-center overflow-hidden rounded-sm border border-slate-300 bg-slate-200 p-6">
        {/* Subtle camera lens indicator */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300/80">
          <div className="h-5 w-5 rounded-full bg-slate-300/80" />
        </div>

        {/* Viewfinder boundary guide */}
        <div className="flex h-48 w-48 items-center justify-center rounded-sm border border-dashed border-slate-300/90">
          <div className="h-3 w-28 rounded-sm bg-slate-300/60" />
        </div>

        {/* Bottom third capture button skeleton */}
        <div className="absolute right-0 bottom-6 left-0 flex justify-center">
          <div className="h-16 w-16 shrink-0 rounded-full border-4 border-slate-300 bg-slate-100" />
        </div>
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans">
        <div className="mx-auto flex max-w-md gap-3 md:max-w-xl lg:max-w-2xl">
          <div className="h-12 flex-1 rounded-sm bg-slate-200" />
          <div className="h-12 flex-1 rounded-sm bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
