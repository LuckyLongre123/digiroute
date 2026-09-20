/**
 * /create/qr - Printable QR Badge Loading Skeleton
 *
 * Enforces strict 4px radius (rounded-sm), bg-slate-200 skeleton blocks,
 * and zero cumulative layout shift (CLS) during transition.
 */
export default function CreateQrLoading() {
  return (
    <div className="text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl animate-pulse flex-col space-y-6 px-4 pt-4 pb-24 font-sans">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-sm border border-slate-300/80 bg-slate-200" />
        <div className="space-y-1">
          <div className="h-6 w-44 rounded-sm bg-slate-200" />
          <div className="h-3 w-60 rounded-sm bg-slate-100" />
        </div>
      </div>

      {/* Preset Format Selector */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded-sm bg-slate-200" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-14 rounded-sm border border-slate-200 bg-slate-100" />
          <div className="h-14 rounded-sm border border-slate-300 bg-slate-200" />
          <div className="h-14 rounded-sm border border-slate-200 bg-slate-100" />
        </div>
      </div>

      {/* Live Badge Preview Card Skeleton */}
      <div className="bg-card border-border flex flex-col items-center justify-center space-y-4 rounded-sm border p-6">
        <div className="flex h-80 w-full max-w-[360px] flex-col items-center justify-between rounded-sm border border-slate-300 bg-slate-200 p-6">
          <div className="h-6 w-36 rounded-sm bg-slate-300" />
          <div className="h-40 w-40 rounded-sm border border-slate-400/50 bg-slate-300" />
          <div className="h-5 w-28 rounded-sm bg-slate-300" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
        <div className="h-12 rounded-sm bg-slate-300" />
        <div className="h-12 rounded-sm border border-slate-300 bg-slate-200" />
      </div>
    </div>
  );
}
