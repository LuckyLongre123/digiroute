/**
 * /create/metadata - Step 4 Loading Skeleton: Details & Security
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateMetadataLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 pt-2 space-y-5 font-sans animate-pulse">
      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="h-7 w-48 bg-slate-200 rounded-sm" />
        <div className="h-4 w-80 max-w-full bg-slate-100 rounded-sm" />
      </div>

      {/* Form Fields Container */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded-sm mb-3" />

        {/* Input Field 1: Floor */}
        <div className="mb-4">
          <div className="h-4 w-24 bg-slate-200 rounded-sm mb-2" />
          <div className="h-12 w-full bg-slate-100 border border-slate-200 rounded-sm" />
        </div>

        {/* Input Field 2: Flat / Unit */}
        <div className="mb-4">
          <div className="h-4 w-24 bg-slate-200 rounded-sm mb-2" />
          <div className="h-12 w-full bg-slate-100 border border-slate-200 rounded-sm" />
        </div>

        {/* Input Field 3: Landmark / Navigation Hint */}
        <div className="mb-4">
          <div className="h-4 w-24 bg-slate-200 rounded-sm mb-2" />
          <div className="h-12 w-full bg-slate-100 border border-slate-200 rounded-sm" />
        </div>
      </div>

      {/* Secondary Group: Label Selector & Security Control */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-3">
        <div className="h-4 w-28 bg-slate-200 rounded-sm mb-2" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-9 bg-slate-100 border border-slate-200 rounded-sm" />
          <div className="h-9 bg-slate-100 border border-slate-200 rounded-sm" />
          <div className="h-9 bg-slate-100 border border-slate-200 rounded-sm" />
        </div>
      </div>

      {/* Bottom CTA: Standard h-12 thumb-zone button skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <div className="h-12 w-full bg-slate-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
