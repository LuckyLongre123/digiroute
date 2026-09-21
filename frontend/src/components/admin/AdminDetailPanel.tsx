'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { updateAddressImage } from '@/actions/updateAddressImage';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface AddressRecord {
  id?: string;
  slug: string;
  digipin: string;
  baseLat: number;
  baseLng: number;
  entranceLat: number;
  entranceLng: number;
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  label?: string | null;
  routingNotes?: string | null;
  doorwayPhotoUrl?: string | null;
  isEphemeral: boolean;
  expiresAt?: string | null;
  userId?: string | null;
  createdAt?: string;
}

type PanelRecord = UserRecord | AddressRecord;

interface Props {
  type: 'user' | 'address';
  record: PanelRecord;
  isLoading?: boolean;
  onClose: () => void;
  onDelete: (type: 'user' | 'address', id: string) => void;
  onUpdate: (slug: string, updates: Record<string, unknown>) => void;
  onUpdateUser?: (
    userId: string,
    updates: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    }
  ) => Promise<void> | void;
  onRefresh?: () => void;
}

const EDITABLE_FIELDS = [
  'label',
  'floor',
  'flat',
  'landmark',
  'routingNotes',
] as const;

const FIELD_LABELS: Record<string, string> = {
  label: 'Label',
  floor: 'Floor',
  flat: 'Flat / Unit',
  landmark: 'Landmark',
  routingNotes: 'Routing Notes',
};

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

export function AdminDetailPanel({
  type,
  record,
  isLoading = false,
  onClose,
  onDelete,
  onUpdate,
  onUpdateUser,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Address edit state
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // User edit state
  const [userEditValues, setUserEditValues] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, unknown>>(
    {}
  );

  // Image replacement and error fallback state
  const [imageError, setImageError] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementPreview, setReplacementPreview] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevRecordRef = useRef(record);
  useEffect(() => {
    if (prevRecordRef.current !== record) {
      prevRecordRef.current = record;
      setLocalOverrides({});
      setImageError(false);
      setReplacementFile(null);
      setReplacementPreview(null);
    }
  }, [record]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplacementFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setReplacementPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleUploadAndOverride = async () => {
    if (!replacementFile || !addr) return;
    setIsUploadingImage(true);
    try {
      // 1. Upload to Cloudinary using direct utility
      const uploadRes = await uploadToCloudinary(replacementFile);
      if (!uploadRes.success || !uploadRes.url) {
        toast.error(
          uploadRes.error || 'Failed to upload replacement image to Cloudinary.'
        );
        setIsUploadingImage(false);
        return;
      }

      // 2. Call Server Action to update Prisma DB and local fallback
      const updateRes = await updateAddressImage({
        slug: addr.slug,
        newPhotoUrl: uploadRes.url,
      });

      if (updateRes.success) {
        toast.success(`Doorway image overridden for ${addr.digipin}`);
        setLocalOverrides((prev) => ({
          ...prev,
          doorwayPhotoUrl: uploadRes.url,
        }));
        setImageError(false);
        setReplacementFile(null);
        setReplacementPreview(null);
        onUpdate(addr.slug, { doorwayPhotoUrl: uploadRes.url });
        onRefresh?.();
      } else {
        toast.error(updateRes.error || 'Failed to update address in database.');
      }
    } catch (err) {
      console.error('Error overriding address image:', err);
      toast.error('Network error during image override.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const isAddress = type === 'address';
  const effectiveRecord = { ...record, ...localOverrides };
  const addr = isAddress ? (effectiveRecord as AddressRecord) : null;
  const user = !isAddress ? (effectiveRecord as UserRecord) : null;

  // Start Address edit
  const handleStartEdit = () => {
    if (!addr) return;
    setEditValues({
      label: addr.label || '',
      floor: addr.floor || '',
      flat: addr.flat || '',
      landmark: addr.landmark || '',
      routingNotes: addr.routingNotes || '',
      expiresAt: toLocalDatetime(addr.expiresAt),
    });
    setEditing(true);
    setSaveError(null);
  };

  // Start User edit
  const handleStartUserEdit = () => {
    if (!user) return;
    setUserEditValues({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setEditing(true);
    setSaveError(null);
  };

  // Save Address updates
  const handleSave = async () => {
    if (!addr) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updates: Record<string, string | null> = {};
      for (const field of EDITABLE_FIELDS) {
        updates[field] = editValues[field]?.trim() || null;
      }
      updates.expiresAt = editValues.expiresAt
        ? new Date(editValues.expiresAt).toISOString()
        : null;

      await onUpdate(addr.slug, updates);
      setLocalOverrides((prev) => ({
        ...prev,
        ...updates,
        isEphemeral: Boolean(updates.expiresAt),
      }));
      setEditing(false);
      if (onRefresh) onRefresh();
    } catch {
      setSaveError('Failed to save address. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // Save User updates
  const handleSaveUser = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updates = {
        name: userEditValues.name.trim() || null,
        email: userEditValues.email.trim() || null,
        phone: userEditValues.phone.trim() || null,
      };

      if (onUpdateUser) {
        await onUpdateUser(user.id, updates);
      } else {
        const res = await fetch('/api/admin/update-user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...updates }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update user.');
        }
      }

      setLocalOverrides((prev) => ({ ...prev, ...updates }));
      setEditing(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const id = isAddress ? addr!.slug : user!.id;
    await onDelete(type, id);
  };

  const labelStyle = {
    color: '#71717a',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    fontFamily: 'var(--font-geist-mono), monospace',
  };

  const inputStyle = {
    backgroundColor: '#0c0c0e',
    border: '1px solid #3f3f46',
    color: '#e4e4e7',
    caretColor: '#22d3ee',
    fontSize: '13px',
    fontFamily: 'var(--font-geist-mono), monospace',
    width: '100%',
    padding: '8px 12px',
    borderRadius: '3px',
    outline: 'none',
  };

  return (
    <div
      className="fixed top-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden md:w-[440px]"
      style={{
        backgroundColor: '#111113',
        borderLeft: '1px solid #27272a',
        fontFamily: 'var(--font-geist-mono), monospace',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Panel header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #27272a' }}
      >
        <div>
          <p className="mb-0.5 font-mono text-xs tracking-wider text-zinc-500 uppercase md:text-[10px]">
            {type === 'user' ? 'User Record' : 'Address Record'}
          </p>
          <p className="font-mono text-base font-semibold text-cyan-400 md:text-sm">
            {type === 'user'
              ? user!.name || user!.email?.split('@')[0] || 'Anonymous'
              : addr!.digipin}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[3px] p-2 text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label="Close detail panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Address Quick Actions: Below Header */}
      {type === 'address' && addr && (
        <div
          className="flex shrink-0 items-center gap-2 bg-zinc-950/60 px-4 py-3 md:py-2.5"
          style={{ borderBottom: '1px solid #27272a' }}
        >
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[3px] border border-zinc-700 bg-zinc-900/60 px-3 py-2 font-mono text-xs text-zinc-300 transition-all hover:border-cyan-400 hover:bg-zinc-900 hover:text-cyan-400 md:min-h-0 md:px-2.5 md:py-1 md:text-[11px]"
            title="Open management controls inside admin panel"
          >
            <Edit3 size={13} className="shrink-0 text-cyan-400" />
            <span>Open Manage View</span>
          </button>
          <a
            href={`/a/${addr.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[3px] border border-zinc-700 bg-zinc-900/60 px-3 py-2 font-mono text-xs text-zinc-300 transition-all hover:border-cyan-400 hover:bg-zinc-900 hover:text-cyan-400 md:min-h-0 md:px-2.5 md:py-1 md:text-[11px]"
            title="Open public view in new tab"
          >
            <ExternalLink size={13} className="shrink-0 text-zinc-500" />
            <span>Open Public Link</span>
          </a>
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 md:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 font-mono text-xs text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span>Loading node details...</span>
          </div>
        ) : (
          <>
            {/* USER RECORD */}
            {type === 'user' && user && (
              <>
                <Field label="User ID" value={user.id} />
                <Field
                  label="Created"
                  value={
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleString()
                      : '—'
                  }
                />

                {/* User Edit Fields */}
                {editing ? (
                  <div className="space-y-3 pt-2">
                    <p
                      style={{ ...labelStyle, color: '#22d3ee' }}
                      className="mb-2"
                    >
                      Editing User Fields
                    </p>
                    <div>
                      <p style={labelStyle} className="mb-1">
                        Full Name
                      </p>
                      <input
                        style={inputStyle}
                        value={userEditValues.name}
                        placeholder="e.g. John Doe"
                        onChange={(e) =>
                          setUserEditValues((v) => ({
                            ...v,
                            name: e.target.value,
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#22d3ee')
                        }
                        onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
                      />
                    </div>
                    <div>
                      <p style={labelStyle} className="mb-1">
                        Email Address
                      </p>
                      <input
                        type="email"
                        style={inputStyle}
                        value={userEditValues.email}
                        placeholder="user@example.com"
                        onChange={(e) =>
                          setUserEditValues((v) => ({
                            ...v,
                            email: e.target.value,
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#22d3ee')
                        }
                        onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
                      />
                    </div>
                    <div>
                      <p style={labelStyle} className="mb-1">
                        Phone Number
                      </p>
                      <input
                        type="tel"
                        style={inputStyle}
                        value={userEditValues.phone}
                        placeholder="+91 9876543210"
                        onChange={(e) =>
                          setUserEditValues((v) => ({
                            ...v,
                            phone: e.target.value,
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#22d3ee')
                        }
                        onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
                      />
                    </div>

                    {saveError && (
                      <div
                        className="flex items-center gap-2 rounded-[3px] px-2.5 py-2 text-[11px]"
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: '#f87171',
                        }}
                      >
                        <AlertCircle size={11} />
                        {saveError}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Field label="Name" value={user.name || '—'} />
                    <Field label="Email" value={user.email || '—'} />
                    <Field label="Phone" value={user.phone || '—'} />
                  </>
                )}
              </>
            )}

            {/* ADDRESS RECORD */}
            {type === 'address' && addr && (
              <>
                <Field label="DIGIPIN" value={addr.digipin} accent="#22d3ee" />
                <Field label="Slug" value={addr.slug} />
                <Field
                  label="Coordinates (Base)"
                  value={`${addr.baseLat.toFixed(6)}, ${addr.baseLng.toFixed(6)}`}
                />
                <Field
                  label="Coordinates (Entrance)"
                  value={`${addr.entranceLat.toFixed(6)}, ${addr.entranceLng.toFixed(6)}`}
                />
                <Field
                  label="Type"
                  value={
                    addr.isEphemeral ? 'Guest (Ephemeral)' : 'Saved (Permanent)'
                  }
                  accent={addr.isEphemeral ? '#f59e0b' : '#22d3ee'}
                />
                {addr.userId && <Field label="Owner ID" value={addr.userId} />}

                {/* Doorway Photo Block with Milestone 2 Error Fallback & Override UI */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="admin-override-photo-input"
                  />

                  {/* 1. Staged Replacement Preview */}
                  {replacementPreview ? (
                    <div className="space-y-2.5 rounded-sm border border-cyan-500/40 bg-zinc-900/90 p-3.5 font-mono sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-cyan-400 md:text-xs">
                          <Check className="h-4 w-4 md:h-3.5 md:w-3.5" />
                          <span>Replacement Staged</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReplacementFile(null);
                            setReplacementPreview(null);
                          }}
                          className="flex min-h-[44px] cursor-pointer items-center text-xs text-zinc-400 hover:text-zinc-200 md:min-h-0 md:text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={replacementPreview}
                        alt="Replacement Preview"
                        className="max-h-[180px] w-full rounded-sm border border-zinc-700 object-cover"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-zinc-400 md:text-[10px]">
                        <span
                          className="max-w-[160px] truncate"
                          title={replacementFile?.name}
                        >
                          {replacementFile?.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleUploadAndOverride}
                          disabled={isUploadingImage}
                          className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[3px] bg-cyan-400 px-3.5 py-2 font-mono text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:opacity-50 md:min-h-0 md:gap-1.5 md:px-2.5 md:py-1 md:text-xs"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} />
                              <span>Upload & Override</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : !addr.doorwayPhotoUrl || imageError ? (
                    /* 2. Media Missing or Deleted Placeholder Box */
                    <div className="rounded-sm border border-amber-500/40 bg-zinc-900/90 p-4 font-mono">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-amber-500/30 bg-amber-500/10 text-amber-400">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tracking-wide text-amber-400 md:text-xs">
                              Media Missing or Deleted
                            </span>
                            <span className="rounded-sm bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 md:text-[9px]">
                              {!addr.doorwayPhotoUrl
                                ? 'Missing Media'
                                : '404 Broken'}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-zinc-400 md:text-[11px]">
                            {!addr.doorwayPhotoUrl
                              ? 'No doorway photo is currently linked to this database record.'
                              : 'The linked image fails to load or was deleted from cloud storage.'}
                          </p>
                          {addr.doorwayPhotoUrl && (
                            <p
                              className="truncate text-xs text-zinc-500 md:text-[10px]"
                              title={addr.doorwayPhotoUrl}
                            >
                              URL: {addr.doorwayPhotoUrl}
                            </p>
                          )}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-sm border border-amber-600/60 bg-amber-950/40 px-3.5 py-2 text-sm font-semibold text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-900/50 hover:text-amber-200 md:min-h-0 md:px-2.5 md:py-1.5 md:text-xs"
                            >
                              <Upload className="h-4 w-4 md:h-3.5 md:w-3.5" />
                              <span>Upload Replacement Image</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 3. Valid Working Image with Replace Option */
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p style={labelStyle}>Doorway Photo</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-cyan-400 md:min-h-0 md:text-[10px]"
                          title="Select a replacement image"
                        >
                          <Upload size={12} />
                          <span>Replace Image</span>
                        </button>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={addr.doorwayPhotoUrl}
                        alt="Doorway photo"
                        onError={() => setImageError(true)}
                        className="max-h-[200px] w-full rounded-sm object-cover"
                        style={{ border: '1px solid #27272a' }}
                      />
                    </div>
                  )}
                </div>

                {/* Editable fields */}
                {editing ? (
                  <div className="space-y-3 pt-2">
                    <p
                      style={{ ...labelStyle, color: '#22d3ee' }}
                      className="mb-2"
                    >
                      Editing Address Fields
                    </p>

                    {/* Standard Text Fields */}
                    {EDITABLE_FIELDS.map((field) => (
                      <div key={field}>
                        <p style={labelStyle} className="mb-1">
                          {FIELD_LABELS[field]}
                        </p>
                        <input
                          style={inputStyle}
                          value={editValues[field] || ''}
                          onChange={(e) =>
                            setEditValues((v) => ({
                              ...v,
                              [field]: e.target.value,
                            }))
                          }
                          onFocus={(e) =>
                            (e.target.style.borderColor = '#22d3ee')
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = '#3f3f46')
                          }
                        />
                      </div>
                    ))}

                    {/* Expiry Time (expiresAt) Input */}
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <p style={labelStyle}>Expiry Time (expiresAt)</p>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + 24 * 3600 * 1000);
                              setEditValues((v) => ({
                                ...v,
                                expiresAt: toLocalDatetime(d.toISOString()),
                              }));
                            }}
                            className="cursor-pointer text-cyan-400 hover:underline"
                            title="Set to 24 hours from now"
                          >
                            +24h
                          </button>
                          <span className="text-zinc-600">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(
                                Date.now() + 7 * 24 * 3600 * 1000
                              );
                              setEditValues((v) => ({
                                ...v,
                                expiresAt: toLocalDatetime(d.toISOString()),
                              }));
                            }}
                            className="cursor-pointer text-cyan-400 hover:underline"
                            title="Set to 7 days from now"
                          >
                            +7d
                          </button>
                          <span className="text-zinc-600">|</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditValues((v) => ({ ...v, expiresAt: '' }))
                            }
                            className="cursor-pointer text-amber-400 hover:underline"
                            title="Clear expiry (make permanent)"
                          >
                            Never
                          </button>
                        </div>
                      </div>
                      <input
                        type="datetime-local"
                        style={inputStyle}
                        value={editValues.expiresAt || ''}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            expiresAt: e.target.value,
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#22d3ee')
                        }
                        onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
                        className="w-full [color-scheme:dark]"
                      />
                      <p className="mt-1 font-mono text-[10px] text-zinc-500">
                        Set a deadline or clear for permanent retention.
                      </p>
                    </div>

                    {saveError && (
                      <div
                        className="flex items-center gap-2 rounded-[3px] px-2.5 py-2 text-[11px]"
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: '#f87171',
                        }}
                      >
                        <AlertCircle size={11} />
                        {saveError}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Field label="Label" value={addr.label || '—'} />
                    <Field label="Floor" value={addr.floor || '—'} />
                    <Field label="Flat" value={addr.flat || '—'} />
                    <Field label="Landmark" value={addr.landmark || '—'} />
                    <Field
                      label="Routing Notes"
                      value={addr.routingNotes || '—'}
                    />
                    <Field
                      label="Expires At"
                      value={
                        addr.expiresAt
                          ? new Date(addr.expiresAt).toLocaleString()
                          : 'Never (Permanent)'
                      }
                      accent={addr.expiresAt ? '#f59e0b' : '#22d3ee'}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Action footer */}
      <div
        className="shrink-0 space-y-2.5 p-4 md:p-4"
        style={{ borderTop: '1px solid #27272a' }}
      >
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={isAddress ? handleSave : handleSaveUser}
              disabled={saving}
              className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[3px] py-3 font-mono text-sm font-semibold transition-all disabled:opacity-50 md:min-h-0 md:py-2 md:text-xs"
              style={{
                backgroundColor: '#22d3ee',
                color: '#09090b',
              }}
            >
              <Check size={14} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setSaveError(null);
              }}
              className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[3px] py-3 font-mono text-sm transition-colors md:min-h-0 md:py-2 md:text-xs"
              style={{
                border: '1px solid #3f3f46',
                color: '#71717a',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={isAddress ? handleStartEdit : handleStartUserEdit}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[3px] py-3 font-mono text-sm transition-colors md:min-h-0 md:py-2 md:text-xs"
            style={{
              border: '1px solid #3f3f46',
              color: '#a1a1aa',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#22d3ee';
              e.currentTarget.style.color = '#22d3ee';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3f3f46';
              e.currentTarget.style.color = '#a1a1aa';
            }}
          >
            <Edit3 size={14} />
            <span>
              {isAddress ? 'Edit Address Fields' : 'Edit User Credentials'}
            </span>
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[3px] py-3 font-mono text-sm font-semibold transition-all disabled:opacity-50 md:min-h-0 md:py-2 md:text-xs"
          style={{
            backgroundColor: confirmDelete
              ? 'rgba(239,68,68,0.2)'
              : 'transparent',
            border: `1px solid ${confirmDelete ? 'rgba(239,68,68,0.5)' : '#3f3f46'}`,
            color: confirmDelete ? '#f87171' : '#71717a',
          }}
        >
          <Trash2 size={14} />
          <span>
            {deleting
              ? 'Deleting...'
              : confirmDelete
                ? 'Click again to confirm delete'
                : `Delete ${type === 'user' ? 'User' : 'Address'}`}
          </span>
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-xs tracking-wider text-zinc-500 uppercase md:text-[10px]">
        {label}
      </p>
      <p
        className="font-mono text-sm leading-relaxed break-all md:text-xs"
        style={{
          color: accent || '#e4e4e7',
        }}
      >
        {value}
      </p>
    </div>
  );
}
