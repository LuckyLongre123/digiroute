/**
 * /create/qr - Printable QR Badge Loading Skeleton
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateQrLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-24 pt-4 px-4 space-y-6 font-sans text-foreground max-w-xl mx-auto animate-pulse">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-sm bg-slate-200 border border-slate-300/80" />
        <div className="space-y-1">
          <div className="h-6 w-44 bg-slate-200 rounded-sm" />
          <div className="h-3 w-60 bg-slate-100 rounded-sm" />
        </div>
      </div>

      {/* Preset Format Selector */}
      <div className="space-y-2">
        <div className="h-3 w-28 bg-slate-200 rounded-sm" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-14 bg-slate-100 rounded-sm border border-slate-200" />
          <div className="h-14 bg-slate-200 rounded-sm border border-slate-300" />
          <div className="h-14 bg-slate-100 rounded-sm border border-slate-200" />
        </div>
      </div>

      {/* Live Badge Preview Card Skeleton */}
      <div className="bg-card border border-border rounded-sm p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-full max-w-[360px] h-80 bg-slate-200 rounded-sm border border-slate-300 p-6 flex flex-col items-center justify-between">
          <div className="h-6 w-36 bg-slate-300 rounded-sm" />
          <div className="w-40 h-40 bg-slate-300 rounded-sm border border-slate-400/50" />
          <div className="h-5 w-28 bg-slate-300 rounded-sm" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="h-12 bg-slate-300 rounded-sm" />
        <div className="h-12 bg-slate-200 border border-slate-300 rounded-sm" />
      </div>
    </div>
  );
}
