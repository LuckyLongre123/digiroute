/**
 * (dashboard)/address/[id] - Loading Skeleton (ROUTE-07, FOUND-05)
 *
 * Shape-matched skeleton for address detail and edit forms.
 */
export default function AddressDetailLoading() {
  return (
    <div className="max-w-2xl animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-muted h-8 w-8 rounded" />
          <div className="space-y-1">
            <div className="bg-muted h-5 w-40 rounded" />
            <div className="bg-muted h-3 w-24 rounded" />
          </div>
        </div>
        <div className="bg-muted h-8 w-20 rounded" />
      </div>

      <div className="bg-card border-border space-y-3 rounded border p-4">
        <div className="bg-muted h-3 w-32 rounded" />
        <div className="bg-muted h-7 w-48 rounded" />
        <div className="bg-muted h-3 w-60 rounded" />
      </div>

      <div className="bg-card border-border space-y-3 rounded border p-4">
        <div className="bg-muted h-3 w-40 rounded" />
        <div className="bg-muted h-44 w-full rounded" />
      </div>

      <div className="bg-card border-border space-y-4 rounded border p-4">
        <div className="bg-muted h-3 w-36 rounded" />
        <div className="bg-muted h-10 w-full rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted h-10 w-full rounded" />
          <div className="bg-muted h-10 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
