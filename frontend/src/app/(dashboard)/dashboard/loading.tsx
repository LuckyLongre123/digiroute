/**
 * (dashboard) Loading Skeleton (ROUTE-07, FOUND-05)
 *
 * Card list skeleton with CSS pulse shimmer.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-36 rounded" />
          <div className="bg-muted h-3 w-64 rounded" />
        </div>
        <div className="bg-muted h-10 w-32 rounded" />
      </div>

      {/* Grid of cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border-border space-y-4 rounded border p-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="bg-muted h-4 w-16 rounded" />
                <div className="bg-muted h-3 w-20 rounded" />
              </div>
              <div className="bg-muted h-6 w-44 rounded" />
              <div className="bg-muted h-3 w-32 rounded" />
              <div className="bg-muted h-3 w-48 rounded" />
            </div>
            <div className="border-border flex items-center justify-between border-t pt-3">
              <div className="bg-muted h-4 w-20 rounded" />
              <div className="bg-muted h-4 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
