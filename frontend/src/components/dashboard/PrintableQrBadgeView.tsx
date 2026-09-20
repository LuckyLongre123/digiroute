'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
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
  const [activeFormat, setActiveFormat] = useState<'card' | 'doorway' | 'a4'>(
    'doorway'
  );
  const [isDownloaded, setIsDownloaded] = useState(false);

  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/a/${address.slug}`;

  const resolvedBackHref = backHref || `/dashboard/manage/${address.slug}`;

  const unitDetails =
    [address.flat, address.floor].filter(Boolean).join(', ') ||
    'Doorway Verified';

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
      <div className="max-w-2xl animate-pulse space-y-6 font-sans">
        <div className="bg-muted h-8 w-48 rounded" />
        <div className="bg-muted h-80 rounded" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in text-foreground max-w-2xl space-y-6 font-sans duration-150">
      {/* Header & Back */}
      <div className="flex items-center gap-3">
        <Link
          href={resolvedBackHref}
          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
          aria-label="Back to address"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            Printable QR Badge
          </h1>
          <p className="text-muted-foreground text-xs">
            Entrance dispatch badge for couriers and visitors
          </p>
        </div>
      </div>

      {/* Printable Badge Preview Box */}
      <div className="bg-card border-border flex flex-col items-center space-y-4 rounded border p-6 text-center shadow-sm">
        {/* Printable Card Simulation */}
        <div
          id="printable-badge-card"
          className="border-primary flex w-full max-w-xs flex-col items-center space-y-3 rounded border-2 bg-white p-5 text-slate-900 shadow-md"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-tight text-[#1A3A6B]">
              DigiRoute™
            </span>
            <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              Verified Doorway
            </span>
          </div>

          {/* Real QR Code using qrcode.react */}
          <div className="flex h-40 w-40 items-center justify-center rounded border-2 border-slate-900 bg-slate-50 p-2.5 shadow-2xs">
            <QRCodeSVG
              id="sovereign-qr-svg"
              value={shareUrl}
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="space-y-1 text-center">
            <div className="font-mono text-base font-bold tracking-wider text-slate-900">
              {address.digipin}
            </div>
            <div className="text-xs font-medium text-slate-700">
              {unitDetails}
            </div>
          </div>

          <div className="w-full border-t border-slate-200 pt-1 text-center font-mono text-[9px] tracking-wider text-slate-400 uppercase">
            Scan to navigate directly to doorway
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Live Doorway Badge: High-contrast reference formatted for physical
          printing
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
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
                className={`cursor-pointer rounded border p-3 text-left transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/5 ring-accent ring-1'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-xs font-bold">
                    {fmt.name}
                  </span>
                  {isActive && <Check className="text-accent h-3.5 w-3.5" />}
                </div>
                <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                  {fmt.dimensions}
                </div>
                <div className="text-muted-foreground mt-1 text-[11px]">
                  {fmt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={handlePrint}
          className="bg-primary text-primary-foreground flex flex-1 cursor-pointer items-center justify-center gap-2 rounded px-4 py-2.5 text-xs font-semibold shadow-sm transition-all hover:opacity-95"
        >
          <Printer className="h-4 w-4" />
          <span>Print Doorway Badge</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="border-border bg-card hover:bg-muted/50 text-foreground flex flex-1 cursor-pointer items-center justify-center gap-2 rounded border px-4 py-2.5 text-xs font-semibold shadow-sm transition-all"
        >
          {isDownloaded ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span>SVG Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download SVG Badge</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
