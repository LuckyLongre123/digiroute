import Link from 'next/link';
import { Keyboard } from 'lucide-react';

export default function ScanPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] pb-24 animate-route-enter">
      <section className="pt-6 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-1">Scan QR Code</h1>
        <p className="text-sm text-muted-foreground">Point your camera at a DigiRoute QR badge</p>
      </section>

      {/* Viewfinder placeholder */}
      <div className="relative flex-1 bg-foreground/5 border-2 border-dashed border-border rounded flex items-center justify-center min-h-64">
        {/* Crosshair guide */}
        <div className="relative w-48 h-48">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent rounded-tl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent rounded-tr" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent rounded-bl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent rounded-br" />
          <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground text-center leading-tight px-4">
            Camera will activate here
          </p>
        </div>
      </div>

      {/* Bottom thumb-zone action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border px-4 pb-safe pt-3 pb-5">
        <div className="max-w-md mx-auto">
          <Link
            href="/create"
            id="scan-manual-entry"
            className="pressable flex items-center justify-center gap-2 w-full bg-secondary text-secondary-foreground font-medium text-sm py-3.5 rounded hover:opacity-80 transition-opacity"
          >
            <Keyboard className="w-4 h-4" />
            Enter DIGIPIN Manually
          </Link>
        </div>
      </div>
    </div>
  );
}
