/**
 * /create/share - Step 5 Loading Skeleton: Share / QR Review
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateShareLoading() {
  return (
    <div className="text-foreground flex min-h-[calc(100vh-8rem)] animate-pulse flex-col space-y-5 pt-2 pb-28 font-sans">
      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="h-7 w-48 rounded-sm bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded-sm bg-slate-100" />
      </div>

      {/* Prominent QR Badge Card Skeleton */}
      <div className="bg-card border-border flex flex-col items-center justify-center rounded-sm border p-6 text-center">
        {/* QR Badge Square: prominent square skeleton */}
        <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-sm border border-slate-300 bg-slate-200">
          <div className="h-16 w-16 rounded-sm bg-slate-300/60" />
        </div>

        {/* DIGIPIN Text: Centered readout */}
        <div className="mx-auto mt-4 h-8 w-40 rounded-sm bg-slate-200" />
        <div className="mx-auto mt-1.5 h-4 w-32 rounded-sm bg-slate-100" />
      </div>

      {/* Action Row: 2 smaller button skeletons mimicking Share/Print actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-11 rounded-sm border border-slate-300/80 bg-slate-200" />
        <div className="h-11 rounded-sm border border-slate-300/80 bg-slate-200" />
      </div>

      {/* Passcode Block: Subtle rectangular block for lock feature */}
      <div className="flex h-14 w-full items-center justify-between rounded-sm border border-slate-200 bg-slate-100 p-3.5">
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 rounded-sm bg-slate-200" />
          <div className="h-3 w-48 max-w-full rounded-sm bg-slate-100" />
        </div>
        <div className="h-6 w-6 shrink-0 rounded-sm bg-slate-200" />
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3.5 font-sans">
        <div className="mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
          <div className="h-12 w-full rounded-sm bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
