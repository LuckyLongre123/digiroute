'use client';

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
import {
  ArrowLeft,
  Download,
  Share2,
  Check,
  Edit2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAddressStore } from '@/store/useAddressStore';
import {
  drawQrBadgeToCanvas,
  downloadCanvasAsJpg,
  shareCanvasBadge,
} from '@/lib/qr';

function QrBadgeSkeleton() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-24 pt-4 px-4 space-y-6 font-sans text-foreground max-w-xl mx-auto animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted border border-border" />
        <div className="space-y-1">
          <div className="h-6 w-44 bg-muted rounded" />
          <div className="h-3 w-60 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-14 bg-muted rounded-lg border border-border" />
          <div className="h-14 bg-muted rounded-lg border border-border" />
          <div className="h-14 bg-muted rounded-lg border border-border" />
        </div>
      </div>
      <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-full max-w-[360px] h-80 bg-muted/80 rounded-xl" />
      </div>
    </div>
  );
}

export default function CreateQrBadgePage() {
  return (
    <Suspense fallback={<QrBadgeSkeleton />}>
      <CreateQrBadgeContent />
    </Suspense>
  );
}

function CreateQrBadgeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useMounted();

  const storeSlug = useAddressStore((state) => state.slug);
  const storeDigipin = useAddressStore((state) => state.digipin);
  const storeMetadata = useAddressStore((state) => state.metadata);
  const setMetadata = useAddressStore((state) => state.setMetadata);

  // Safely resolve slug from search params or Zustand store with fallback
  const slugFromParam = searchParams ? searchParams.get('slug') : null;
  const activeSlug = slugFromParam || storeSlug || '7x9k2m4p1q8z';

  const [tag, setTag] = useState(
    storeMetadata?.customTag || storeMetadata?.label || 'HOME'
  );
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'card' | 'sticker' | 'a4'>('sticker');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const [fetchedData, setFetchedData] = useState<{
    digipin?: string;
    label?: string;
    unit?: string;
  } | null>(null);

  useEffect(() => {
    if (slugFromParam) {
      fetch(`/api/address/${slugFromParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.address) {
            const a = data.address;
            const u =
              [a.flat, a.floor].filter(Boolean).join(', ') || a.landmark || '';
            setFetchedData({
              digipin: a.digipin,
              label: a.label,
              unit: u,
            });
            if (a.label) setTag(a.label);
          }
        })
        .catch(() => {});
    }
  }, [slugFromParam]);

  const digipin = fetchedData?.digipin || storeDigipin || '4M8K-9P2L-1X';
  const unit =
    fetchedData?.unit ||
    [storeMetadata?.floor, storeMetadata?.flat].filter(Boolean).join(', ') ||
    storeMetadata?.landmark ||
    '';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'http://localhost:3000');
  const shareUrl = `${baseUrl}/a/${activeSlug}`;

  // Keep canvas rendered in sync for download / share operations
  useEffect(() => {
    if (mounted && canvasRef.current) {
      drawQrBadgeToCanvas(canvasRef.current, {
        text: shareUrl,
        digipin,
        unit: unit || undefined,
        label: tag,
        format: activeFormat,
      });
    }
  }, [mounted, shareUrl, digipin, unit, tag, activeFormat]);

  const handleSaveTag = () => {
    setIsEditingTag(false);
    setMetadata({ customTag: tag });
  };

  const handleDownloadJpg = () => {
    if (!canvasRef.current) return;
    downloadCanvasAsJpg(canvasRef.current, `digiroute-badge-${activeSlug}.jpg`);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  const handleShareQr = async () => {
    if (!canvasRef.current) return;
    const success = await shareCanvasBadge(canvasRef.current, {
      title: `DigiRoute Doorway Badge: ${digipin}`,
      text: `Official DigiRoute Doorway Badge for ${digipin}. Scan for doorstep navigation:`,
      url: shareUrl,
    });
    if (success) {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/create/success');
    }
  };

  const badgeFormats = [
    {
      id: 'card' as const,
      name: 'Business Card',
      dimensions: '85 x 55 mm',
      desc: 'Wallet & packet size',
      maxWidth: 'max-w-[310px]',
      padding: 'p-4',
      qrSize: 150,
      scaleClass: 'scale-95',
    },
    {
      id: 'sticker' as const,
      name: 'Doorway Sticker',
      dimensions: '100 x 150 mm',
      desc: 'Optimal for entrance gate',
      maxWidth: 'max-w-[360px]',
      padding: 'p-6',
      qrSize: 180,
      scaleClass: 'scale-100',
    },
    {
      id: 'a4' as const,
      name: 'A4 Wall Poster',
      dimensions: '210 x 297 mm',
      desc: 'Lobby & noticeboard',
      maxWidth: 'max-w-[420px]',
      padding: 'p-8',
      qrSize: 220,
      scaleClass: 'scale-105',
    },
  ];

  const currentPreset = badgeFormats.find((f) => f.id === activeFormat) || badgeFormats[1];

  // Prevent hydration mismatch by rendering skeleton until component is mounted
  if (!mounted) {
    return <QrBadgeSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-24 animate-in fade-in duration-150 pt-4 px-4 space-y-6 font-sans text-foreground max-w-xl mx-auto">
      {/* Top Header with Safe Back Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
          aria-label="Back to success step"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Printable QR Badge
          </h1>
          <p className="text-xs text-muted-foreground">
            High-contrast doorway QR badge with verified DIGIPIN
          </p>
        </div>
      </div>

      {/* Preset Format Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Print Preset Format
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {badgeFormats.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setActiveFormat(fmt.id)}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeFormat === fmt.id
                  ? 'border-accent bg-accent/10 ring-1 ring-accent text-accent'
                  : 'border-border bg-card hover:border-border/80 text-foreground'
              }`}
            >
              <div className="text-xs font-bold">{fmt.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                {fmt.dimensions}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Badge Preview Card with Dynamic Padding, Width, and Scale */}
      <div className="bg-muted/40 border border-border rounded-xl p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center space-y-4 overflow-hidden">
        <div
          id="printable-qr-badge-card"
          className={`w-full ${currentPreset.maxWidth} ${currentPreset.padding} ${currentPreset.scaleClass} bg-white text-slate-950 rounded-xl border-2 border-slate-200 shadow-xl transition-all duration-300 flex flex-col items-center text-center`}
        >
          {/* Brand Header */}
          <div className="w-full pb-3 border-b-2 border-slate-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1A3A6B]">
                DigiRoute
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#EA580C]">
                Doorway
              </span>
            </div>
            <p className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase mt-0.5">
              Official Micro-Address Badge
            </p>
          </div>

          {/* QR Code Container with Center App Logo */}
          <div className="my-5 p-3 sm:p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 shadow-inner flex items-center justify-center">
            <QRCodeSVG
              value={shareUrl}
              size={currentPreset.qrSize}
              level="H"
              marginSize={1}
              imageSettings={{
                src: '/favicon.ico',
                excavate: true,
                height: Math.round(currentPreset.qrSize * 0.18),
                width: Math.round(currentPreset.qrSize * 0.18),
              }}
            />
          </div>

          {/* Details & Tag Section */}
          <div className="w-full space-y-4">
            {/* Editable Tag with Pencil Icon */}
            <div className="flex items-center justify-center gap-1.5">
              {isEditingTag ? (
                <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-300 rounded-full px-2.5 py-1">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase())}
                    className="text-xs font-bold text-orange-700 bg-transparent uppercase tracking-wider outline-none w-24 text-center font-mono"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTag();
                    }}
                    onBlur={handleSaveTag}
                  />
                  <button
                    type="button"
                    onClick={handleSaveTag}
                    className="text-orange-700 hover:text-orange-950 cursor-pointer"
                    title="Save tag"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono shadow-xs">
                  <span>{tag || 'HOME'}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingTag(true)}
                    className="text-orange-600 hover:text-orange-900 transition-colors cursor-pointer"
                    aria-label="Edit badge tag"
                    title="Rename tag"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* DIGIPIN Code */}
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-widest">
                {digipin}
              </div>
              {unit && (
                <div className="text-xs sm:text-sm font-semibold text-slate-700">
                  {unit}
                </div>
              )}
            </div>

            {/* High Legibility Footer Copy: Strictly Powered by DIGIPIN */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Scan with any mobile camera for doorstep navigation
              </p>
              <p className="text-[10px] sm:text-xs font-bold font-mono text-slate-500 uppercase">
                Powered by DIGIPIN
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden high-res canvas used for clean file export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Primary Action Buttons: Download JPG and Share QR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleDownloadJpg}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
        >
          {isDownloaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Printable JPG</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShareQr}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted active:scale-[0.98] transition-all shadow-xs cursor-pointer font-sans"
        >
          {isShared ? (
            <>
              <Check className="w-4 h-4 text-accent" />
              <span>Badge Shared!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share QR Badge</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
