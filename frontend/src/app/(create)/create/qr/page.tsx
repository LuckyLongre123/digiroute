'use client';

import {
  getQrAddressAction,
  type QrAddressData,
} from '@/app/actions/getQrAddress';
import {
  downloadCanvasAsJpg,
  drawQrBadgeToCanvas,
  getOrPreloadLogoImage,
  shareCanvasBadge,
} from '@/lib/qr';
import { useAddressStore } from '@/store/useAddressStore';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Download,
  Edit2,
  Share2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

const emptySubscribe = () => () => { };
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function formatExpiryDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function QrBadgeSkeleton() {
  return (
    <div className="text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl animate-pulse flex-col space-y-6 px-4 pt-4 pb-24 font-sans">
      <div className="flex items-center gap-3">
        <div className="bg-muted border-border h-9 w-9 rounded-sm border" />
        <div className="space-y-1">
          <div className="bg-muted h-6 w-44 rounded-sm" />
          <div className="bg-muted/60 h-3 w-60 rounded-sm" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-3 w-28 rounded-sm" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-muted border-border h-14 rounded-sm border" />
          <div className="bg-muted border-border h-14 rounded-sm border" />
          <div className="bg-muted border-border h-14 rounded-sm border" />
        </div>
      </div>
      <div className="bg-muted/40 border-border flex flex-col items-center justify-center space-y-4 rounded-sm border p-6">
        <div className="bg-muted/80 h-80 w-full max-w-[360px] rounded-sm" />
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

  // Safely resolve slug from query params or Zustand store
  const slugFromParam = searchParams ? searchParams.get('slug') : null;
  const activeSlug = slugFromParam || storeSlug || '';

  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [addressData, setAddressData] = useState<QrAddressData | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [tag, setTag] = useState(
    storeMetadata?.customTag || storeMetadata?.label || 'HOME'
  );
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'card' | 'sticker' | 'a4'>(
    'sticker'
  );
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-load local logo asset for instantaneous canvas export
  useEffect(() => {
    getOrPreloadLogoImage().catch(() => { });
  }, []);

  // Fetch address record by active slug with strict error handling
  useEffect(() => {
    let isCancelled = false;

    async function loadAddress() {
      if (!activeSlug) {
        if (!isCancelled) {
          setIsNotFound(true);
          setIsLoadingAddress(false);
        }
        return;
      }

      setIsLoadingAddress(true);
      setIsNotFound(false);

      try {
        const result = await getQrAddressAction(activeSlug);
        if (isCancelled) return;

        if (result.success && result.address) {
          setAddressData(result.address);
          if (result.address.label) {
            setTag(result.address.label);
          }
        } else {
          setIsNotFound(true);
        }
      } catch (err) {
        console.error('[CreateQrBadge] Failed to fetch address data:', err);
        if (!isCancelled) {
          setIsNotFound(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingAddress(false);
        }
      }
    }

    loadAddress();

    return () => {
      isCancelled = true;
    };
  }, [activeSlug]);

  // Derived expiry conditions
  const expiryDate = addressData?.expiresAt
    ? new Date(addressData.expiresAt)
    : null;
  const isDateValid = expiryDate && !isNaN(expiryDate.getTime());
  const isExpired = Boolean(isDateValid && expiryDate.getTime() < Date.now());
  const isExpiringSoon = Boolean(
    isDateValid && expiryDate.getTime() > Date.now()
  );

  const digipin = addressData?.digipin || storeDigipin || '4M8K-9P2L-1X';
  const unit =
    [addressData?.flat, addressData?.floor].filter(Boolean).join(', ') ||
    addressData?.landmark ||
    [storeMetadata?.floor, storeMetadata?.flat].filter(Boolean).join(', ') ||
    storeMetadata?.landmark ||
    '';

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'http://localhost:3000');
  const shareUrl = `${baseUrl}/a/${activeSlug || addressData?.slug || 'unknown'}`;

  // Keep canvas rendered in sync for download / share operations
  useEffect(() => {
    if (mounted && canvasRef.current && !isExpired && !isNotFound && addressData) {
      drawQrBadgeToCanvas(canvasRef.current, {
        text: shareUrl,
        digipin,
        unit: unit || undefined,
        label: tag,
        format: activeFormat,
      }).catch((err) => {
        console.error('[CreateQrBadge] Error drawing canvas:', err);
      });
    }
  }, [
    mounted,
    shareUrl,
    digipin,
    unit,
    tag,
    activeFormat,
    isExpired,
    isNotFound,
    addressData,
  ]);

  const handleSaveTag = () => {
    setIsEditingTag(false);
    setMetadata({ customTag: tag });
  };

  const handleDownloadJpg = async () => {
    if (!canvasRef.current) return;
    await drawQrBadgeToCanvas(canvasRef.current, {
      text: shareUrl,
      digipin,
      unit: unit || undefined,
      label: tag,
      format: activeFormat,
    });
    downloadCanvasAsJpg(
      canvasRef.current,
      `digiroute-badge-${activeSlug || addressData?.slug || 'qr'}.jpg`
    );
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  const handleShareQr = async () => {
    if (!canvasRef.current) return;
    await drawQrBadgeToCanvas(canvasRef.current, {
      text: shareUrl,
      digipin,
      unit: unit || undefined,
      label: tag,
      format: activeFormat,
    });
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

  // Prevent hydration mismatch by rendering skeleton until component is mounted or address is loading
  if (!mounted || isLoadingAddress) {
    return <QrBadgeSkeleton />;
  }

  // CONDITION A: Address Not Found or Invalid
  if (isNotFound || !addressData) {
    return (
      <div className="animate-in fade-in text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col space-y-6 px-4 pt-4 pb-24 font-sans duration-150">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-sm border p-2 transition-colors"
            aria-label="Back"
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

        {/* Clean Error State */}
        <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-5 font-sans space-y-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
              Address not found or invalid.
            </h2>
          </div>
          <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
            The requested address does not exist or may have been deleted. Please verify the link and try again.
          </p>
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="cursor-pointer rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted shadow-xs transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              type="button"
              onClick={() => router.push('/create')}
              className="cursor-pointer rounded-sm bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-95 shadow-xs transition-opacity"
            >
              Create New Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONDITION B: Hard Block for Expired Address
  if (isExpired) {
    return (
      <div className="animate-in fade-in text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col space-y-6 px-4 pt-4 pb-24 font-sans duration-150">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-sm border p-2 transition-colors"
            aria-label="Back"
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

        {/* Red Expired Warning Box */}
        <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-5 font-sans space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
                Address Expired
              </h2>
              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                This address is expired. Change its expiry to permanent, then return to create QR.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/address/${addressData.id || addressData.slug}`)
              }
              className="cursor-pointer inline-flex items-center gap-2 rounded-sm bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              Change Expiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in text-foreground mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col space-y-6 px-4 pt-4 pb-24 font-sans duration-150">
      {/* Top Header with Safe Back Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-sm border p-2 transition-colors"
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

      {/* CONDITION C: Warning Banner for Expiring Soon / Ephemeral Addresses */}
      {isExpiringSoon && addressData.expiresAt && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm border border-amber-500/40 bg-amber-500/10 p-3.5 font-sans text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              This address expires on{' '}
              <strong>{formatExpiryDate(addressData.expiresAt)}</strong>. Change its expiry to permanent to ensure the QR code keeps working.
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/address/${addressData.id || addressData.slug}`)
            }
            className="cursor-pointer shrink-0 self-start sm:self-auto rounded-sm border border-amber-600/40 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
          >
            Make Permanent
          </button>
        </div>
      )}

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
              className={`cursor-pointer rounded-sm border p-2.5 text-left transition-all ${activeFormat === fmt.id
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
      <div className="bg-muted/40 border-border flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-sm border p-4 shadow-xs sm:p-6">
        <div
          id="printable-qr-badge-card"
          className={`w-full ${currentPreset.maxWidth} ${currentPreset.padding} ${currentPreset.scaleClass} flex flex-col items-center rounded-sm border-2 border-slate-200 bg-white text-center text-slate-950 shadow-xl transition-all duration-300`}
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

          {/* QR Code Container with Pre-loaded Center App Logo */}
          <div className="my-5 flex items-center justify-center rounded-sm border-2 border-slate-900 bg-slate-50 p-3 shadow-inner sm:p-4">
            <QRCodeSVG
              value={shareUrl}
              size={currentPreset.qrSize}
              level="H"
              marginSize={1}
              imageSettings={{
                src: '/icon.png',
                excavate: true,
                height: Math.round(currentPreset.qrSize * 0.13),
                width: Math.round(currentPreset.qrSize * 0.13),
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
          className="bg-accent text-accent-foreground flex cursor-pointer items-center justify-center gap-2 rounded-sm px-4 py-3 font-sans text-sm font-semibold shadow-xs transition-all hover:opacity-95 active:scale-[0.98]"
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
          className="border-border bg-card text-foreground hover:bg-muted flex cursor-pointer items-center justify-center gap-2 rounded-sm border px-4 py-3 font-sans text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
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
