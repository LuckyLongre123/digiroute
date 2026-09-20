'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  QrCode,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateAddressAction } from '@/app/actions/updateAddress';
import { deleteAddressAction } from '@/app/actions/deleteAddress';
import { updateAddressPhoto } from '@/app/actions/updateAddressPhoto';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { EditCameraModal } from '@/components/dashboard/EditCameraModal';

export interface EditableAddressRecord {
  id: string;
  slug: string;
  digipin: string;
  coordinates: string;
  label?: string | null;
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  doorwayPhotoUrl?: string | null;
  expiresAt?: string | null;
  isEphemeral?: boolean;
}

interface EditMicroAddressViewProps {
  address: EditableAddressRecord;
  backHref?: string;
}

const toLocalDatetime = (isoStr?: string | null) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

export function EditMicroAddressView({
  address,
  backHref = '/dashboard',
}: EditMicroAddressViewProps) {
  const router = useRouter();

  // Form Fields
  const [label, setLabel] = useState(address.label || '');
  const [floor, setFloor] = useState(address.floor || '');
  const [unit, setUnit] = useState(address.flat || '');
  const [landmark, setLandmark] = useState(address.landmark || '');

  // 1. Photo Preview & Retake Logic (Local State & Live Camera)
  // CRITICAL: When a new photo is taken, save it in local React state (Blob) and DO NOT upload immediately
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newPhotoBlob, setNewPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    address.doorwayPhotoUrl || null
  );

  // 2. Expiry Edit Field
  const [expiryOption, setExpiryOption] = useState<'never' | '24h' | '7d' | 'custom'>(
    !address.expiresAt
      ? 'never'
      : 'custom'
  );
  const [customDatetime, setCustomDatetime] = useState<string>(
    toLocalDatetime(address.expiresAt)
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const isUpdatingRef = useRef(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);

  // Live Camera frame capture handler
  const handleCameraCapture = (blob: Blob) => {
    setNewPhotoBlob(blob);
    const blobUrl = URL.createObjectURL(blob);
    setPreviewUrl(blobUrl);
  };

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Compute final expiresAt ISO string based on selection
  const computeExpiresAt = (): string | null => {
    if (expiryOption === 'never') return null;
    const now = Date.now();
    if (expiryOption === '24h') {
      return new Date(now + 24 * 3600 * 1000).toISOString();
    }
    if (expiryOption === '7d') {
      return new Date(now + 7 * 24 * 3600 * 1000).toISOString();
    }
    if (expiryOption === 'custom') {
      if (!customDatetime) return null;
      const d = new Date(customDatetime);
      return !isNaN(d.getTime()) ? d.toISOString() : null;
    }
    return null;
  };

  // 3. Save Changes: Intercept submission, upload pendingImage to Cloudinary, retrieve photoUrl, and persist
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdating || isUpdatingRef.current || isDeleting || isDeletingRef.current) return;

    isUpdatingRef.current = true;
    setIsUpdating(true);

    try {
      const finalExpiresAt = computeExpiresAt();

      // Step A: If a new photo was captured, upload to Cloudinary and update database photo first
      let uploadedPhotoUrl: string | null = null;
      if (newPhotoBlob) {
        const uploadRes = await uploadToCloudinary(newPhotoBlob);
        if (!uploadRes.success || !uploadRes.url) {
          toast.error('Failed to upload new doorway photo to cloud storage.');
          setIsUpdating(false);
          isUpdatingRef.current = false;
          return;
        }
        uploadedPhotoUrl = uploadRes.url;
        // Update database with new photoUrl
        await updateAddressPhoto(address.slug || address.id, uploadedPhotoUrl);
      }

      // Step B: Save text/metadata edits and expiresAt
      const result = await updateAddressAction({
        slugOrId: address.slug || address.id,
        label: label.trim(),
        floor: floor.trim(),
        flat: unit.trim(),
        landmark: landmark.trim(),
        expiresAt: finalExpiresAt,
      });

      if (result.success) {
        toast.success('Changes Saved Successfully');
        setNewPhotoBlob(null);
        if (uploadedPhotoUrl) {
          setPreviewUrl(uploadedPhotoUrl);
        }
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save address changes.');
      }
    } catch (err) {
      console.error('[EditMicroAddressView] Save error:', err);
      toast.error('Network error while saving changes.');
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
    }
  };

  // Handle address deletion
  const handleDelete = async () => {
    if (isDeleting || isDeletingRef.current || isUpdating || isUpdatingRef.current) return;

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this micro-address? This action cannot be undone.'
    );
    if (!confirmed) return;

    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      const result = await deleteAddressAction(address.id || address.slug);
      if (result.success) {
        toast.success('Address deleted successfully.');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to delete address.');
        isDeletingRef.current = false;
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('[EditMicroAddressView] Delete error:', err);
      toast.error('Network error while deleting address.');
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl font-sans text-foreground">
      {/* Back Navigation & Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to addresses"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Edit Micro-Address
            </h1>
            <p className="text-xs font-mono text-muted-foreground">ID: {address.slug}</p>
          </div>
        </div>

        <Link
          href={`/dashboard/manage/${address.slug}/qr`}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors shadow-2xs"
        >
          <QrCode className="w-4 h-4 text-primary" />
          <span>QR Badge</span>
        </Link>
      </div>

      <div className="space-y-5">
        {/* Factor 1: DIGIPIN & Coordinates */}
        <div className="bg-card border border-border rounded p-4 space-y-3 shadow-2xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            10-Character Sovereign DIGIPIN
          </div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-xl font-bold text-primary tracking-wider">
              {address.digipin}
            </div>
            <Link
              href={`/a/${address.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
            >
              <span>Public Card</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">Coordinates: {address.coordinates}</span>
          </div>
        </div>

        {/* Factor 2: Visual Lock Doorway Photo Preview & Retake */}
        <div className="bg-card border border-border rounded p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Visual Lock (Doorway Photo)
            </div>
            <button
              type="button"
              id="retake-photo-btn"
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{previewUrl ? 'Retake Photo' : 'Take Photo'}</span>
            </button>
          </div>

          {/* Doorway image preview container */}
          {previewUrl ? (
            <div className="relative w-full h-52 sm:h-60 rounded border border-border overflow-hidden bg-muted/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Doorway visual reference"
                className="w-full h-full object-cover"
              />
              {newPhotoBlob && (
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-amber-500/90 text-black text-[10px] font-mono font-bold shadow-xs">
                  Pending Save (Local Preview)
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => setIsCameraOpen(true)}
              className="w-full h-44 bg-muted/30 hover:bg-muted/50 rounded border border-dashed border-border flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-colors"
            >
              <Camera className="w-8 h-8 text-muted-foreground/60 mb-2" />
              <p className="text-xs text-foreground font-medium">Doorway Visual Lock</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Click to open live camera and capture entrance reference
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Factor 4: Z-AXIS & BUILDING METADATA */}
        <div className="bg-card border border-border rounded p-4 space-y-4 shadow-2xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
            Z-Axis &amp; Building Metadata
          </div>

          {/* Address Label */}
          <div>
            <label
              htmlFor="address-label"
              className="block text-xs font-medium text-foreground mb-1.5 font-sans"
            >
              Address Label
            </label>
            <input
              id="address-label"
              type="text"
              disabled={isUpdating || isDeleting}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Home, Office, Studio"
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="floor"
                className="block text-xs font-medium text-foreground mb-1.5 font-sans"
              >
                Floor / Level
              </label>
              <input
                id="floor"
                type="text"
                disabled={isUpdating || isDeleting}
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. 3rd Floor"
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="unit"
                className="block text-xs font-medium text-foreground mb-1.5 font-sans"
              >
                Flat / Unit No.
              </label>
              <input
                id="unit"
                type="text"
                disabled={isUpdating || isDeleting}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Flat 302, Tower B"
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="landmark"
              className="block text-xs font-medium text-foreground mb-1.5 font-sans"
            >
              Visible Landmark
            </label>
            <input
              id="landmark"
              type="text"
              disabled={isUpdating || isDeleting}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Opposite Metro Pillar 42"
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>

          {/* 2. Expiry Edit Field */}
          <div className="pt-2 border-t border-border/60">
            <label className="block text-xs font-medium text-foreground mb-1.5 font-sans flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Expiry Time (expiresAt)</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setExpiryOption('never');
                  setCustomDatetime('');
                }}
                className={`py-1.5 px-2 text-xs rounded border transition-colors cursor-pointer text-center ${
                  expiryOption === 'never'
                    ? 'border-accent bg-accent/10 font-semibold text-accent'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Permanent (Never)
              </button>
              <button
                type="button"
                onClick={() => setExpiryOption('24h')}
                className={`py-1.5 px-2 text-xs rounded border transition-colors cursor-pointer text-center ${
                  expiryOption === '24h'
                    ? 'border-accent bg-accent/10 font-semibold text-accent'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                24 Hours (TTL)
              </button>
              <button
                type="button"
                onClick={() => setExpiryOption('7d')}
                className={`py-1.5 px-2 text-xs rounded border transition-colors cursor-pointer text-center ${
                  expiryOption === '7d'
                    ? 'border-accent bg-accent/10 font-semibold text-accent'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                7 Days (TTL)
              </button>
              <button
                type="button"
                onClick={() => setExpiryOption('custom')}
                className={`py-1.5 px-2 text-xs rounded border transition-colors cursor-pointer text-center ${
                  expiryOption === 'custom'
                    ? 'border-accent bg-accent/10 font-semibold text-accent'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom Date
              </button>
            </div>

            {expiryOption === 'custom' && (
              <div className="mt-2 animate-in fade-in duration-100">
                <input
                  type="datetime-local"
                  disabled={isUpdating || isDeleting}
                  value={customDatetime}
                  onChange={(e) => setCustomDatetime(e.target.value)}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 font-sans">
              Ephemeral addresses automatically expire for guest couriers.
            </p>
          </div>
        </div>

        {/* 3. Primary "Save Changes" Button & Delete */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            id="save-address-changes-btn"
            disabled={isUpdating || isDeleting}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 px-4 rounded hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isUpdating || isDeleting}
            className="w-full border border-destructive/40 text-destructive hover:bg-destructive/10 font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Micro-Address</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Device Camera Modal */}
      <EditCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
