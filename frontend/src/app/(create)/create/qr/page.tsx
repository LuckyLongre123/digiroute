'use client';

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
import { ArrowLeft, Download, Share2, Check, Edit2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAddressStore } from '@/store/useAddressStore';
import {
  drawQrBadgeToCanvas,
  downloadCanvasAsJpg,
  shareCanvasBadge,
} from '@/lib/qr';

function QrBadgeSkeleton() {
  return (
    <div className="text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl animate-pulse flex-col space-y-6 px-4 pt-4 pb-24 font-sans">
      <div className="flex items-center gap-3">
        <div className="bg-muted border-border h-9 w-9 rounded-lg border" />
        <div className="space-y-1">
          <div className="bg-muted h-6 w-44 rounded" />
          <div className="bg-muted/60 h-3 w-60 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-3 w-28 rounded" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-muted border-border h-14 rounded-lg border" />
          <div className="bg-muted border-border h-14 rounded-lg border" />
          <div className="bg-muted border-border h-14 rounded-lg border" />
        </div>
      </div>
      <div className="bg-muted/40 border-border flex flex-col items-center justify-center space-y-4 rounded-xl border p-6">
        <div className="bg-muted/80 h-80 w-full max-w-[360px] rounded-xl" />
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
  const [activeFormat, setActiveFormat] = useState<'card' | 'sticker' | 'a4'>(
    'sticker'
  );
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

  const currentPreset =
    badgeFormats.find((f) => f.id === activeFormat) || badgeFormats[1];

  // Prevent hydration mismatch by rendering skeleton until component is mounted
  if (!mounted) {
    return <QrBadgeSkeleton />;
  }

  return (
    <div className="animate-in fade-in text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col space-y-6 px-4 pt-4 pb-24 font-sans duration-150">
      {/* Top Header with Safe Back Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-lg border p-2 transition-colors"
          aria-label="Back to success step"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
            Printable QR Badge
          </h1>
          <p className="text-muted-foreground text-xs">
            High-contrast doorway QR badge with verified DIGIPIN
          </p>
        </div>
      </div>

      {/* Preset Format Selector */}
      <div className="space-y-2">
        <label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
          Print Preset Format
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {badgeFormats.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setActiveFormat(fmt.id)}
              className={`cursor-pointer rounded-lg border p-2.5 text-left transition-all ${
                activeFormat === fmt.id
                  ? 'border-accent bg-accent/10 ring-accent text-accent ring-1'
                  : 'border-border bg-card hover:border-border/80 text-foreground'
              }`}
            >
              <div className="text-xs font-bold">{fmt.name}</div>
              <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                {fmt.dimensions}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Badge Preview Card with Dynamic Padding, Width, and Scale */}
      <div className="bg-muted/40 border-border flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-xl border p-4 shadow-xs sm:p-6">
        <div
          id="printable-qr-badge-card"
          className={`w-full ${currentPreset.maxWidth} ${currentPreset.padding} ${currentPreset.scaleClass} flex flex-col items-center rounded-xl border-2 border-slate-200 bg-white text-center text-slate-950 shadow-xl transition-all duration-300`}
        >
          {/* Brand Header */}
          <div className="w-full border-b-2 border-slate-200 pb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#1A3A6B] sm:text-3xl">
                DigiRoute
              </span>
              <span className="text-2xl font-black tracking-tight text-[#EA580C] sm:text-3xl">
                Doorway
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              Official Micro-Address Badge
            </p>
          </div>

          {/* QR Code Container with Center App Logo */}
          <div className="my-5 flex items-center justify-center rounded-2xl border-2 border-slate-900 bg-slate-50 p-3 shadow-inner sm:p-4">
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
                <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase())}
                    className="w-24 bg-transparent text-center font-mono text-xs font-bold tracking-wider text-orange-700 uppercase outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTag();
                    }}
                    onBlur={handleSaveTag}
                  />
                  <button
                    type="button"
                    onClick={handleSaveTag}
                    className="cursor-pointer text-orange-700 hover:text-orange-950"
                    title="Save tag"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 font-mono text-xs font-bold tracking-wider text-orange-700 shadow-xs">
                  <span>{tag || 'HOME'}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingTag(true)}
                    className="cursor-pointer text-orange-600 transition-colors hover:text-orange-900"
                    aria-label="Edit badge tag"
                    title="Rename tag"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* DIGIPIN Code */}
            <div className="space-y-0.5">
              <div className="font-mono text-xl font-black tracking-widest text-slate-900 sm:text-2xl">
                {digipin}
              </div>
              {unit && (
                <div className="text-xs font-semibold text-slate-700 sm:text-sm">
                  {unit}
                </div>
              )}
            </div>

            {/* High Legibility Footer Copy: Strictly Powered by DIGIPIN */}
            <div className="space-y-1 border-t border-slate-100 pt-2">
              <p className="text-xs font-bold text-slate-800 sm:text-sm">
                Scan with any mobile camera for doorstep navigation
              </p>
              <p className="font-mono text-[10px] font-bold text-slate-500 uppercase sm:text-xs">
                Powered by DIGIPIN
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden high-res canvas used for clean file export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Primary Action Buttons: Download JPG and Share QR */}
      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleDownloadJpg}
          className="bg-accent text-accent-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 font-sans text-sm font-semibold shadow-xs transition-all hover:opacity-95 active:scale-[0.98]"
        >
          {isDownloaded ? (
            <>
              <Check className="h-4 w-4 text-emerald-700" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Printable JPG</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShareQr}
          className="border-border bg-card text-foreground hover:bg-muted flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 font-sans text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
        >
          {isShared ? (
            <>
              <Check className="text-accent h-4 w-4" />
              <span>Badge Shared!</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              <span>Share QR Badge</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
