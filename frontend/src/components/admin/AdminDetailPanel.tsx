'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

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

  const prevRecordRef = useRef(record);
  useEffect(() => {
    if (prevRecordRef.current !== record) {
      prevRecordRef.current = record;
      setLocalOverrides({});
    }
  }, [record]);

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
    color: '#52525b',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    fontFamily: 'var(--font-geist-mono), monospace',
  };

  const inputStyle = {
    backgroundColor: '#0c0c0e',
    border: '1px solid #3f3f46',
    color: '#e4e4e7',
    caretColor: '#22d3ee',
    fontSize: '12px',
    fontFamily: 'var(--font-geist-mono), monospace',
    width: '100%',
    padding: '6px 10px',
    borderRadius: '3px',
    outline: 'none',
  };

  return (
    <div
      className="fixed top-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden md:w-[420px]"
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
          <p style={{ ...labelStyle, marginBottom: 2 }}>
            {type === 'user' ? 'User Record' : 'Address Record'}
          </p>
          <p style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 600 }}>
            {type === 'user'
              ? user!.name || user!.email?.split('@')[0] || 'Anonymous'
              : addr!.digipin}
          </p>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-[3px] p-1.5 transition-colors"
          style={{ color: '#52525b' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e4e4e7')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
          aria-label="Close detail panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Address Quick Actions: Below Header */}
      {type === 'address' && addr && (
        <div
          className="flex shrink-0 items-center gap-2 bg-zinc-950/60 px-4 py-2.5"
          style={{ borderBottom: '1px solid #27272a' }}
        >
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-zinc-700 bg-zinc-900/60 px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition-all hover:border-cyan-400 hover:bg-zinc-900 hover:text-cyan-400"
            title="Open management controls inside admin panel"
          >
            <Edit3 size={11} className="shrink-0 text-cyan-400" />
            <span>Open Manage View</span>
          </button>
          <a
            href={`/a/${addr.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-zinc-700 bg-zinc-900/60 px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition-all hover:border-cyan-400 hover:bg-zinc-900 hover:text-cyan-400"
            title="Open public view in new tab"
          >
            <ExternalLink size={11} className="shrink-0 text-zinc-500" />
            <span>Open Public Link</span>
          </a>
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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

                {addr.doorwayPhotoUrl && (
                  <div>
                    <p style={labelStyle} className="mb-1.5">
                      Doorway Photo
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={addr.doorwayPhotoUrl}
                      alt="Doorway photo"
                      className="max-h-[180px] w-full rounded-[3px] object-cover"
                      style={{ border: '1px solid #27272a' }}
                    />
                  </div>
                )}

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
        className="shrink-0 space-y-2 p-4"
        style={{ borderTop: '1px solid #27272a' }}
      >
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={isAddress ? handleSave : handleSaveUser}
              disabled={saving}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[3px] py-2 font-mono text-xs transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#22d3ee',
                color: '#09090b',
                fontWeight: 600,
              }}
            >
              <Check size={12} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setSaveError(null);
              }}
              className="flex-1 cursor-pointer rounded-[3px] py-2 font-mono text-xs"
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
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[3px] py-2 font-mono text-xs transition-colors"
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
            <Edit3 size={12} />
            {isAddress ? 'Edit Address Fields' : 'Edit User Credentials'}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[3px] py-2 font-mono text-xs transition-all disabled:opacity-50"
          style={{
            backgroundColor: confirmDelete
              ? 'rgba(239,68,68,0.2)'
              : 'transparent',
            border: `1px solid ${confirmDelete ? 'rgba(239,68,68,0.5)' : '#3f3f46'}`,
            color: confirmDelete ? '#f87171' : '#71717a',
          }}
        >
          <Trash2 size={12} />
          {deleting
            ? 'Deleting...'
            : confirmDelete
              ? 'Click again to confirm delete'
              : `Delete ${type === 'user' ? 'User' : 'Address'}`}
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
      <p
        style={{
          color: '#52525b',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-geist-mono), monospace',
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: accent || '#e4e4e7',
          fontSize: '12px',
          fontFamily: 'var(--font-geist-mono), monospace',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </p>
    </div>
  );
}
