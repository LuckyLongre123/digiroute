/**
 * /create - Step 1 Loading Skeleton: DIGIPIN Generation
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateStep1Loading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-5 pt-2 pb-24 font-sans">
      {/* Header Info: Skeleton text for title and microcopy */}
      <div className="space-y-1.5">
        <div className="h-7 w-56 rounded-sm bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded-sm bg-slate-100" />
      </div>

      {/* GPS Detection Box: h-24 with 1px border and icon/text placeholder */}
      <div className="flex h-24 w-full items-center gap-3 rounded-sm border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="h-10 w-10 shrink-0 rounded-sm bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 rounded-sm bg-slate-200" />
          <div className="h-3 w-48 rounded-sm bg-slate-100" />
        </div>
      </div>

      {/* DIGIPIN Display: Solid block where the primary DIGIPIN code appears */}
      <div className="h-16 w-full rounded-sm border border-slate-300/60 bg-slate-200" />

      {/* Manual Input Skeleton: Standard input skeleton */}
      <div className="h-12 w-full rounded-sm border border-slate-200 bg-slate-50" />

      {/* Bottom CTA: Full-width button skeleton anchored in thumb-zone */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans">
        <div className="mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
          <div className="h-12 w-full rounded-sm bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
