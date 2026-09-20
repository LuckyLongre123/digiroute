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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] pb-24 animate-route-enter">
      <section className="pt-6 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-1">Report Civic Defect</h1>
        <p className="text-sm text-muted-foreground">Anonymous. Takes 30 seconds.</p>
      </section>

      <form id="civic-report-form" className="flex flex-col gap-4">
        {/* Category picker */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="pressable flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-colors"
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  className="accent-accent"
                />
                <span className="text-sm text-foreground">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="report-description" className="block text-sm font-medium text-foreground mb-1.5">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="report-description"
            rows={3}
            placeholder="Brief description of the issue..."
            className="w-full px-3 py-2.5 bg-card border border-input rounded text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
          />
        </div>

        {/* Photo capture placeholder */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Photo <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="w-full h-24 bg-muted border border-dashed border-border rounded flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Tap to capture photo evidence</p>
          </div>
        </div>
      </form>

      {/* Bottom thumb-zone action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border px-4 pb-safe pt-3 pb-5">
        <div className="max-w-md mx-auto">
          <button
            type="submit"
            form="civic-report-form"
            id="report-submit-btn"
            className="pressable flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-semibold text-sm py-3.5 rounded hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Flag className="w-4 h-4" />
            <span>Submit Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
