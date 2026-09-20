/**
 * /create - Step 1 Loading Skeleton: DIGIPIN Generation
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateStep1Loading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-24 pt-2 space-y-5 font-sans animate-pulse">
      {/* Header Info: Skeleton text for title and microcopy */}
      <div className="space-y-1.5">
        <div className="h-7 w-56 bg-slate-200 rounded-sm" />
        <div className="h-4 w-72 max-w-full bg-slate-100 rounded-sm" />
      </div>

      {/* GPS Detection Box: h-24 with 1px border and icon/text placeholder */}
      <div className="h-24 w-full border border-slate-200 bg-white rounded-sm p-4 flex items-center gap-3 shadow-2xs">
        <div className="w-10 h-10 rounded-sm bg-slate-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-36 bg-slate-200 rounded-sm" />
          <div className="h-3 w-48 bg-slate-100 rounded-sm" />
        </div>
      </div>

      {/* DIGIPIN Display: Solid block where the primary DIGIPIN code appears */}
      <div className="h-16 w-full bg-slate-200 rounded-sm border border-slate-300/60" />

      {/* Manual Input Skeleton: Standard input skeleton */}
      <div className="h-12 w-full border border-slate-200 bg-slate-50 rounded-sm" />

      {/* Bottom CTA: Full-width button skeleton anchored in thumb-zone */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <div className="h-12 w-full bg-slate-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
