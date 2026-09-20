/**
 * /create/share - Step 5 Loading Skeleton: Share / QR Review
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateShareLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-28 pt-2 space-y-5 font-sans animate-pulse text-foreground">
      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="h-7 w-48 bg-slate-200 rounded-sm" />
        <div className="h-4 w-72 max-w-full bg-slate-100 rounded-sm" />
      </div>

      {/* Prominent QR Badge Card Skeleton */}
      <div className="bg-card border border-border rounded-sm p-6 flex flex-col items-center justify-center text-center">
        {/* QR Badge Square: prominent square skeleton */}
        <div className="w-64 h-64 mx-auto bg-slate-200 rounded-sm border border-slate-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-slate-300/60 rounded-sm" />
        </div>

        {/* DIGIPIN Text: Centered readout */}
        <div className="h-8 w-40 bg-slate-200 rounded-sm mt-4 mx-auto" />
        <div className="h-4 w-32 bg-slate-100 rounded-sm mt-1.5 mx-auto" />
      </div>

      {/* Action Row: 2 smaller button skeletons mimicking Share/Print actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-11 bg-slate-200 border border-slate-300/80 rounded-sm" />
        <div className="h-11 bg-slate-200 border border-slate-300/80 rounded-sm" />
      </div>

      {/* Passcode Block: Subtle rectangular block for lock feature */}
      <div className="h-14 w-full bg-slate-100 border border-slate-200 rounded-sm p-3.5 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 bg-slate-200 rounded-sm" />
          <div className="h-3 w-48 max-w-full bg-slate-100 rounded-sm" />
        </div>
        <div className="w-6 h-6 rounded-sm bg-slate-200 shrink-0" />
      </div>

      {/* Bottom Thumb-Zone CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3.5 font-sans">
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
          <div className="h-12 w-full bg-slate-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
