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
  const [expiryOption, setExpiryOption] = useState<
    'never' | '24h' | '7d' | 'custom'
  >(!address.expiresAt ? 'never' : 'custom');
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
    if (
      isUpdating ||
      isUpdatingRef.current ||
      isDeleting ||
      isDeletingRef.current
    )
      return;

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
    if (
      isDeleting ||
      isDeletingRef.current ||
      isUpdating ||
      isUpdatingRef.current
    )
      return;

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
        router.refresh();
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
    <div className="animate-in fade-in text-foreground max-w-2xl space-y-6 font-sans duration-150">
      {/* Back Navigation & Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
            aria-label="Back to addresses"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">
              Edit Micro-Address
            </h1>
            <p className="text-muted-foreground font-mono text-xs">
              ID: {address.slug}
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/manage/${address.slug}/qr`}
          className="bg-secondary text-secondary-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors"
        >
          <QrCode className="text-primary h-4 w-4" />
          <span>QR Badge</span>
        </Link>
      </div>

      <div className="space-y-5">
        {/* Factor 1: DIGIPIN & Coordinates */}
        <div className="bg-card border-border space-y-3 rounded border p-4 shadow-2xs">
          <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            10-Character Sovereign DIGIPIN
          </div>
          <div className="flex items-center justify-between">
            <div className="text-primary font-mono text-xl font-bold tracking-wider">
              {address.digipin}
            </div>
            <Link
              href={`/a/${address.slug}`}
              target="_blank"
              className="text-accent inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              <span>Public Card</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
            <MapPin className="text-accent h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Coordinates: {address.coordinates}</span>
          </div>
        </div>

        {/* Factor 2: Visual Lock Doorway Photo Preview & Retake */}
        <div className="bg-card border-border space-y-3 rounded border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Visual Lock (Doorway Photo)
            </div>
            <button
              type="button"
              id="retake-photo-btn"
              onClick={() => setIsCameraOpen(true)}
              className="text-accent inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium hover:underline"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>{previewUrl ? 'Retake Photo' : 'Take Photo'}</span>
            </button>
          </div>

          {/* Doorway image preview container */}
          {previewUrl ? (
            <div className="border-border bg-muted/40 relative flex h-52 w-full items-center justify-center overflow-hidden rounded border sm:h-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Doorway visual reference"
                className="h-full w-full object-cover"
              />
              {newPhotoBlob && (
                <div className="absolute bottom-2 left-2 rounded bg-amber-500/90 px-2 py-1 font-mono text-[10px] font-bold text-black shadow-xs">
                  Pending Save (Local Preview)
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => setIsCameraOpen(true)}
              className="bg-muted/30 hover:bg-muted/50 border-border flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded border border-dashed p-4 text-center transition-colors"
            >
              <Camera className="text-muted-foreground/60 mb-2 h-8 w-8" />
              <p className="text-foreground text-xs font-medium">
                Doorway Visual Lock
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Click to open live camera and capture entrance reference
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Factor 4: Z-AXIS & BUILDING METADATA */}
        <div className="bg-card border-border space-y-4 rounded border p-4 shadow-2xs">
          <div className="text-muted-foreground font-sans text-xs font-semibold tracking-wider uppercase">
            Z-Axis &amp; Building Metadata
          </div>

          {/* Address Label */}
          <div>
            <label
              htmlFor="address-label"
              className="text-foreground mb-1.5 block font-sans text-xs font-medium"
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
              className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="floor"
                className="text-foreground mb-1.5 block font-sans text-xs font-medium"
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
                className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="unit"
                className="text-foreground mb-1.5 block font-sans text-xs font-medium"
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
                className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="landmark"
              className="text-foreground mb-1.5 block font-sans text-xs font-medium"
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
              className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>

          {/* 2. Expiry Edit Field */}
          <div className="border-border/60 border-t pt-2">
            <label className="text-foreground mb-1.5 block flex items-center gap-1.5 font-sans text-xs font-medium">
              <Clock className="text-accent h-3.5 w-3.5" />
              <span>Expiry Time (expiresAt)</span>
            </label>

            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setExpiryOption('never');
                  setCustomDatetime('');
                }}
                className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                  expiryOption === 'never'
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Permanent (Never)
              </button>
              <button
                type="button"
                onClick={() => setExpiryOption('24h')}
                className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                  expiryOption === '24h'
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                24 Hours (TTL)
              </button>
              <button
                type="button"
                onClick={() => setExpiryOption('7d')}
                className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                  expiryOption === '7d'
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                7 Days (TTL)
              </button>
              <button
                type="button"
                onClick={() => setExpiryOption('custom')}
                className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                  expiryOption === 'custom'
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom Date
              </button>
            </div>

            {expiryOption === 'custom' && (
              <div className="animate-in fade-in mt-2 duration-100">
                <input
                  type="datetime-local"
                  disabled={isUpdating || isDeleting}
                  value={customDatetime}
                  onChange={(e) => setCustomDatetime(e.target.value)}
                  className="bg-background border-input text-foreground focus:ring-accent w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            )}
            <p className="text-muted-foreground mt-1 font-sans text-[11px]">
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
            className="bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isUpdating || isDeleting}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 flex w-full cursor-pointer items-center justify-center gap-2 rounded border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
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
