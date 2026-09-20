'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export interface QrAddressRecord {
  id: string;
  slug: string;
  digipin: string;
  floor?: string | null;
  flat?: string | null;
  label?: string | null;
}

interface PrintableQrBadgeViewProps {
  address: QrAddressRecord;
  backHref?: string;
}

export function PrintableQrBadgeView({
  address,
  backHref,
}: PrintableQrBadgeViewProps) {
  const mounted = useMounted();
  const [activeFormat, setActiveFormat] = useState<'card' | 'doorway' | 'a4'>('doorway');
  const [isDownloaded, setIsDownloaded] = useState(false);

  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/a/${address.slug}`;

  const resolvedBackHref = backHref || `/dashboard/manage/${address.slug}`;

  const unitDetails =
    [address.flat, address.floor].filter(Boolean).join(', ') || 'Doorway Verified';

  const badgeFormats = [
    {
      id: 'card' as const,
      name: 'Business Card',
      dimensions: '85 x 55 mm',
      desc: 'Wallet & packet size',
    },
    {
      id: 'doorway' as const,
      name: 'Doorway Sticker',
      dimensions: '100 x 150 mm',
      desc: 'Optimal for entrance gates',
    },
    {
      id: 'a4' as const,
      name: 'A4 Wall Poster',
      dimensions: '210 x 297 mm',
      desc: 'Lobby & society noticeboard',
    },
  ];

  const handleDownload = () => {
    // Download printable SVG
    const svgElement = document.getElementById('sovereign-qr-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = `digiroute-badge-${address.digipin}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(blobUrl);

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl font-sans">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-80 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl font-sans text-foreground">
      {/* Header & Back */}
      <div className="flex items-center gap-3">
        <Link
          href={resolvedBackHref}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to address"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Printable QR Badge
          </h1>
          <p className="text-xs text-muted-foreground">
            Entrance dispatch badge for couriers and visitors
          </p>
        </div>
      </div>

      {/* Printable Badge Preview Box */}
      <div className="bg-card border border-border rounded p-6 shadow-sm flex flex-col items-center text-center space-y-4">
        {/* Printable Card Simulation */}
        <div
          id="printable-badge-card"
          className="w-full max-w-xs border-2 border-primary rounded p-5 bg-white text-slate-900 shadow-md flex flex-col items-center space-y-3"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#1A3A6B] tracking-tight">
              DigiRoute™
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-1.5 py-0.5 rounded border border-emerald-300">
              Verified Doorway
            </span>
          </div>

          {/* Real QR Code using qrcode.react */}
          <div className="w-40 h-40 border-2 border-slate-900 rounded p-2.5 bg-slate-50 flex items-center justify-center shadow-2xs">
            <QRCodeSVG
              id="sovereign-qr-svg"
              value={shareUrl}
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center space-y-1">
            <div className="font-mono text-base font-bold text-slate-900 tracking-wider">
              {address.digipin}
            </div>
            <div className="text-xs text-slate-700 font-medium">
              {unitDetails}
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pt-1 border-t border-slate-200 w-full text-center">
            Scan to navigate directly to doorway
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Live Doorway Badge: High-contrast reference formatted for physical printing
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select Print Format
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {badgeFormats.map((fmt) => {
            const isActive = activeFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setActiveFormat(fmt.id)}
                className={`p-3 rounded border text-left cursor-pointer transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{fmt.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-accent" />}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  {fmt.dimensions}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{fmt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded hover:opacity-95 transition-all flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Doorway Badge</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 border border-border bg-card hover:bg-muted/50 text-foreground font-semibold py-2.5 px-4 rounded transition-all flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
        >
          {isDownloaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>SVG Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download SVG Badge</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
