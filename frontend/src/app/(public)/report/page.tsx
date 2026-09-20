import { Flag } from 'lucide-react';

const CATEGORIES = [
  { id: 'pothole', label: 'Pothole' },
  { id: 'broken-streetlight', label: 'Broken Streetlight' },
  { id: 'water-leak', label: 'Water Leak' },
  { id: 'road-block', label: 'Road Block' },
  { id: 'other', label: 'Other' },
] as const;

export default function ReportPage() {
  return (
    <div className="animate-route-enter flex min-h-[calc(100vh-3.5rem)] flex-col pb-24">
      <section className="pt-6 pb-4">
        <h1 className="text-foreground mb-1 text-xl font-bold">
          Report Civic Defect
        </h1>
        <p className="text-muted-foreground text-sm">
          Anonymous. Takes 30 seconds.
        </p>
      </section>

      <form id="civic-report-form" className="flex flex-col gap-4">
        {/* Category picker */}
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="pressable bg-card border-border has-[:checked]:border-accent has-[:checked]:bg-accent/5 flex cursor-pointer items-center gap-2 rounded border px-3 py-2.5 transition-colors"
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  className="accent-accent"
                />
                <span className="text-foreground text-sm">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="report-description"
            className="text-foreground mb-1.5 block text-sm font-medium"
          >
            Description{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <textarea
            id="report-description"
            rows={3}
            placeholder="Brief description of the issue..."
            className="bg-card border-input placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded border px-3 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
          />
        </div>

        {/* Photo capture placeholder */}
        <div>
          <label className="text-foreground mb-1.5 block text-sm font-medium">
            Photo{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <div className="bg-muted border-border flex h-24 w-full items-center justify-center rounded border border-dashed">
            <p className="text-muted-foreground text-xs">
              Tap to capture photo evidence
            </p>
          </div>
        </div>
      </form>

      {/* Bottom thumb-zone action bar */}
      <div className="bg-card/95 border-border pb-safe fixed right-0 bottom-0 left-0 z-30 border-t px-4 pt-3 pb-5 backdrop-blur-sm">
        <div className="mx-auto max-w-md">
          <button
            type="submit"
            form="civic-report-form"
            id="report-submit-btn"
            className="pressable bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <Flag className="h-4 w-4" />
            <span>Submit Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
