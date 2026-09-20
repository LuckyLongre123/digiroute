import Link from 'next/link';
import { Keyboard } from 'lucide-react';

export default function ScanPage() {
  return (
    <div className="animate-route-enter flex min-h-[calc(100vh-3.5rem)] flex-col pb-24">
      <section className="pt-6 pb-4">
        <h1 className="text-foreground mb-1 text-xl font-bold">Scan QR Code</h1>
        <p className="text-muted-foreground text-sm">
          Point your camera at a DigiRoute QR badge
        </p>
      </section>

      {/* Viewfinder placeholder */}
      <div className="bg-foreground/5 border-border relative flex min-h-64 flex-1 items-center justify-center rounded border-2 border-dashed">
        {/* Crosshair guide */}
        <div className="relative h-48 w-48">
          <div className="border-accent absolute top-0 left-0 h-8 w-8 rounded-tl border-t-2 border-l-2" />
          <div className="border-accent absolute top-0 right-0 h-8 w-8 rounded-tr border-t-2 border-r-2" />
          <div className="border-accent absolute bottom-0 left-0 h-8 w-8 rounded-bl border-b-2 border-l-2" />
          <div className="border-accent absolute right-0 bottom-0 h-8 w-8 rounded-br border-r-2 border-b-2" />
          <p className="text-muted-foreground absolute inset-0 flex items-center justify-center px-4 text-center text-xs leading-tight">
            Camera will activate here
          </p>
        </div>
      </div>

      {/* Bottom thumb-zone action bar */}
      <div className="bg-card/95 border-border pb-safe fixed right-0 bottom-0 left-0 z-30 border-t px-4 pt-3 pb-5 backdrop-blur-sm">
        <div className="mx-auto max-w-md">
          <Link
            href="/create"
            id="scan-manual-entry"
            className="pressable bg-secondary text-secondary-foreground flex w-full items-center justify-center gap-2 rounded py-3.5 text-sm font-medium transition-opacity hover:opacity-80"
          >
            <Keyboard className="h-4 w-4" />
            Enter DIGIPIN Manually
          </Link>
        </div>
      </div>
    </div>
  );
}
