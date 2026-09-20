'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, QrCode, Printer, Check } from 'lucide-react';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface AddressQrContentProps {
  id: string;
}

function DashboardQrSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl font-sans">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-muted" />
        <div className="space-y-1">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-3 w-56 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="h-44 bg-muted/40 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 bg-muted/40 rounded-xl" />
        <div className="h-20 bg-muted/40 rounded-xl" />
        <div className="h-20 bg-muted/40 rounded-xl" />
      </div>
      <div className="bg-muted/30 rounded-2xl p-6 h-72" />
    </div>
  );
}

export default function AddressQrContent({ id }: AddressQrContentProps) {
  const mounted = useMounted();
  const [activeFormat, setActiveFormat] = useState<'card' | 'doorway' | 'a4'>('doorway');
  const [isDownloaded, setIsDownloaded] = useState(false);

  const address = {
    id: id || 'home',
    label: 'Home (Residence)',
    digipin: '4M8K-9P2L-1X',
    unit: 'Flat 402, Tower B',
    slug: 'aarav-home-delhi',
  };

  const badgeFormats = [
    { id: 'card' as const, name: 'Business Card', dimensions: '85 x 55 mm', desc: 'Wallet & packet size' },
    { id: 'doorway' as const, name: 'Doorway Sticker', dimensions: '100 x 150 mm', desc: 'Optimal for entrance gates' },
    { id: 'a4' as const, name: 'A4 Wall Poster', dimensions: '210 x 297 mm', desc: 'Lobby & society noticeboard' },
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
    <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl font-sans text-foreground">
      {/* Header & Back */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/address/${address.id}`}
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
            Generate physical entrance badges for delivery and emergency dispatch
          </p>
        </div>
      </div>

      {/* Printable Badge Preview Box */}
      <div className="bg-card border border-border rounded p-6 shadow-sm flex flex-col items-center text-center space-y-4">
        {/* Printable Card Simulation */}
        <div className="w-full max-w-xs border-2 border-primary rounded p-5 bg-white text-slate-900 shadow-md flex flex-col items-center space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#1A3A6B] tracking-tight">
              Digi<span className="text-[#FF6B00]">Route</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
              Micro-Address
            </span>
          </div>

          {/* QR Code Graphic */}
          <div className="w-36 h-36 border-2 border-slate-900 rounded p-2 bg-slate-50 flex items-center justify-center">
            <QrCode className="w-28 h-28 text-slate-900" />
          </div>

          <div className="text-center space-y-1">
            <div className="font-mono text-base font-bold text-slate-900 tracking-wider">
              {address.digipin}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {address.unit}
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pt-1 border-t border-slate-200 w-full text-center">
            Scan to navigate to doorway
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Live Doorway Preview: Formatted for high-durability weather-resistant printing
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
                <div className="text-[11px] text-muted-foreground mt-1">
                  {fmt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 h-11 bg-accent text-accent-foreground font-semibold text-sm rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          {isDownloaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Badge (PNG/PDF)</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="h-11 bg-secondary text-secondary-foreground font-medium text-sm px-5 rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
