'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, QrCode, Printer, Check } from 'lucide-react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface AddressQrContentProps {
  id: string;
}

function DashboardQrSkeleton() {
  return (
    <div className="max-w-2xl animate-pulse space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <div className="bg-muted h-8 w-8 rounded" />
        <div className="space-y-1">
          <div className="bg-muted h-5 w-40 rounded" />
          <div className="bg-muted/60 h-3 w-56 rounded" />
        </div>
      </div>
      <div className="bg-muted/40 h-44 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/40 h-20 rounded-xl" />
        <div className="bg-muted/40 h-20 rounded-xl" />
        <div className="bg-muted/40 h-20 rounded-xl" />
      </div>
      <div className="bg-muted/30 h-72 rounded-2xl p-6" />
    </div>
  );
}

export default function AddressQrContent({ id }: AddressQrContentProps) {
  const mounted = useMounted();
  const [activeFormat, setActiveFormat] = useState<'card' | 'doorway' | 'a4'>(
    'doorway'
  );
  const [isDownloaded, setIsDownloaded] = useState(false);

  const address = {
    id: id || 'home',
    label: 'Home (Residence)',
    digipin: '4M8K-9P2L-1X',
    unit: 'Flat 402, Tower B',
    slug: 'aarav-home-delhi',
  };

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
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!mounted) {
    return <DashboardQrSkeleton />;
  }

  return (
    <div className="animate-in fade-in text-foreground max-w-2xl space-y-6 font-sans duration-150">
      {/* Header & Back */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/address/${address.id}`}
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
            Generate physical entrance badges for delivery and emergency
            dispatch
          </p>
        </div>
      </div>

      {/* Printable Badge Preview Box */}
      <div className="bg-card border-border flex flex-col items-center space-y-4 rounded border p-6 text-center shadow-sm">
        {/* Printable Card Simulation */}
        <div className="border-primary flex w-full max-w-xs flex-col items-center space-y-3 rounded border-2 bg-white p-5 text-slate-900 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-tight text-[#1A3A6B]">
              Digi<span className="text-[#FF6B00]">Route</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
              Micro-Address
            </span>
          </div>

          {/* QR Code Graphic */}
          <div className="flex h-36 w-36 items-center justify-center rounded border-2 border-slate-900 bg-slate-50 p-2">
            <QrCode className="h-28 w-28 text-slate-900" />
          </div>

          <div className="space-y-1 text-center">
            <div className="font-mono text-base font-bold tracking-wider text-slate-900">
              {address.digipin}
            </div>
            <div className="text-xs font-medium text-slate-600">
              {address.unit}
            </div>
          </div>

          <div className="w-full border-t border-slate-200 pt-1 text-center font-mono text-[9px] tracking-wider text-slate-400 uppercase">
            Scan to navigate to doorway
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Live Doorway Preview: Formatted for high-durability weather-resistant
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

      {/* Action CTA Buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          className="bg-accent text-accent-foreground flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded text-sm font-semibold transition-all active:scale-[0.98]"
        >
          {isDownloaded ? (
            <>
              <Check className="h-4 w-4 text-emerald-700" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Badge (PNG/PDF)</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="bg-secondary text-secondary-foreground flex h-11 cursor-pointer items-center justify-center gap-2 rounded px-5 text-sm font-medium transition-all active:scale-[0.98]"
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
