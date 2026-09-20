/**
 * (dashboard)/address/[id] - Loading Skeleton (ROUTE-07, FOUND-05)
 *
 * Shape-matched skeleton for address detail and edit forms.
 */
export default function AddressDetailLoading() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded" />
          <div className="space-y-1">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="h-8 w-20 bg-muted rounded" />
      </div>

      <div className="bg-card border border-border rounded p-4 space-y-3">
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-3 w-60 bg-muted rounded" />
      </div>

      <div className="bg-card border border-border rounded p-4 space-y-3">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-44 w-full bg-muted rounded" />
      </div>

      <div className="bg-card border border-border rounded p-4 space-y-4">
        <div className="h-3 w-36 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
