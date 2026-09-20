/**
 * /create/metadata - Step 4 Loading Skeleton: Details & Security
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateMetadataLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-5 pt-2 pb-28 font-sans">
      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="h-7 w-48 rounded-sm bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded-sm bg-slate-100" />
      </div>

      {/* Form Fields Container */}
      <div className="bg-card border-border space-y-4 rounded-sm border p-4">
        <div className="mb-3 h-4 w-32 rounded-sm bg-slate-200" />

        {/* Input Field 1: Floor */}
        <div className="mb-4">
          <div className="mb-2 h-4 w-24 rounded-sm bg-slate-200" />
          <div className="h-12 w-full rounded-sm border border-slate-200 bg-slate-100" />
        </div>

        {/* Input Field 2: Flat / Unit */}
        <div className="mb-4">
          <div className="mb-2 h-4 w-24 rounded-sm bg-slate-200" />
          <div className="h-12 w-full rounded-sm border border-slate-200 bg-slate-100" />
        </div>

        {/* Input Field 3: Landmark / Navigation Hint */}
        <div className="mb-4">
          <div className="mb-2 h-4 w-24 rounded-sm bg-slate-200" />
          <div className="h-12 w-full rounded-sm border border-slate-200 bg-slate-100" />
        </div>
      </div>

      {/* Secondary Group: Label Selector & Security Control */}
      <div className="bg-card border-border space-y-3 rounded-sm border p-4">
        <div className="mb-2 h-4 w-28 rounded-sm bg-slate-200" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-9 rounded-sm border border-slate-200 bg-slate-100" />
          <div className="h-9 rounded-sm border border-slate-200 bg-slate-100" />
          <div className="h-9 rounded-sm border border-slate-200 bg-slate-100" />
        </div>
      </div>

      {/* Bottom CTA: Standard h-12 thumb-zone button skeleton */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans">
        <div className="mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
          <div className="h-12 w-full rounded-sm bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
