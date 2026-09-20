'use client';

import { useState, useEffect, useTransition } from 'react';
import { Check, AlertCircle, Shield, KeyRound, Mail } from 'lucide-react';

export default function AdminSettingsPage() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/admin/credentials', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          setCurrentEmail(data.email);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassphrase) {
      setError('Current passphrase is required to apply changes.');
      return;
    }

    if (!newEmail && !newPassphrase) {
      setError('Please provide a new email or a new passphrase to update.');
      return;
    }

    if (newPassphrase) {
      if (newPassphrase !== confirmPassphrase) {
        setError('New passphrases do not match.');
        return;
      }
      if (newPassphrase.length < 6) {
        setError('New passphrase must be at least 6 characters.');
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload: {
          currentPassphrase: string;
          newEmail?: string;
          newPassphrase?: string;
        } = {
          currentPassphrase,
        };
        if (newEmail) payload.newEmail = newEmail;
        if (newPassphrase) payload.newPassphrase = newPassphrase;

        const res = await fetch('/api/admin/credentials', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setSuccess(data.message || 'Credentials updated successfully.');
          if (data.email) {
            setCurrentEmail(data.email);
          }
          setNewEmail('');
          setCurrentPassphrase('');
          setNewPassphrase('');
          setConfirmPassphrase('');
        } else {
          setError(data.error || 'Failed to update credentials.');
        }
      } catch {
        setError('Network error. Please retry.');
      }
    });
  };

  const inputStyle = {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    color: '#e4e4e7',
    caretColor: '#22d3ee',
  };

  return (
    <div
      className="min-h-[100dvh] p-4 sm:p-6"
      style={{
        backgroundColor: '#09090b',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      <div className="max-w-lg space-y-6">
        {/* Header */}
        <div>
          <p className="mb-1 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            /admin/settings
          </p>
          <h1 className="flex items-center gap-2 font-mono text-xl font-semibold tracking-tight text-zinc-100">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span>Admin Credentials &amp; Security</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-400">
            Configure administrative root identity, email routing, and
            cryptographic access passphrases.
          </p>
          {currentEmail && (
            <div className="mt-3 inline-flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-300">
              <span className="text-zinc-500">Active Root:</span>
              <span className="font-semibold text-cyan-400">
                {currentEmail}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group 1: Identity & Email */}
          <div className="space-y-4 rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                Admin Identity &amp; Email
              </h2>
            </div>

            <div>
              <label
                htmlFor="settings-email"
                className="mb-1.5 block font-mono text-xs tracking-wider text-zinc-400 uppercase"
              >
                New Admin Email
              </label>
              <input
                id="settings-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isPending}
                placeholder={currentEmail || 'admin@digiroute.in'}
                className="w-full rounded-[4px] px-3 py-2.5 font-mono text-sm transition-colors outline-none disabled:opacity-50"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
              />
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                Leave blank if you only want to change your passphrase.
              </p>
            </div>
          </div>

          {/* Group 2: Security & Passphrase */}
          <div className="space-y-4 rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-2">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                Security &amp; Passphrase
              </h2>
            </div>

            {/* Current Passphrase */}
            <div>
              <label
                htmlFor="settings-current"
                className="mb-1.5 block font-mono text-xs tracking-wider text-zinc-400 uppercase"
              >
                Current Passphrase <span className="text-red-400">*</span>
              </label>
              <input
                id="settings-current"
                type="password"
                value={currentPassphrase}
                onChange={(e) => setCurrentPassphrase(e.target.value)}
                required
                disabled={isPending}
                placeholder="Enter current passphrase"
                className="w-full rounded-[4px] px-3 py-2.5 font-mono text-sm transition-colors outline-none disabled:opacity-50"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
              />
            </div>

            {/* New Passphrase */}
            <div>
              <label
                htmlFor="settings-new"
                className="mb-1.5 block font-mono text-xs tracking-wider text-zinc-400 uppercase"
              >
                New Passphrase
              </label>
              <input
                id="settings-new"
                type="password"
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                minLength={6}
                disabled={isPending}
                placeholder="Enter new passphrase (min 6 chars)"
                className="w-full rounded-[4px] px-3 py-2.5 font-mono text-sm transition-colors outline-none disabled:opacity-50"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
              />
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                Leave blank if you only want to change your admin email.
              </p>
            </div>

            {/* Confirm Passphrase */}
            {newPassphrase && (
              <div className="animate-in fade-in duration-150">
                <label
                  htmlFor="settings-confirm"
                  className="mb-1.5 block font-mono text-xs tracking-wider text-zinc-400 uppercase"
                >
                  Confirm New Passphrase <span className="text-red-400">*</span>
                </label>
                <input
                  id="settings-confirm"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  required={Boolean(newPassphrase)}
                  disabled={isPending}
                  placeholder="Repeat new passphrase"
                  className="w-full rounded-[4px] px-3 py-2.5 font-mono text-sm transition-colors outline-none disabled:opacity-50"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
                  onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                />
              </div>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-[4px] px-3 py-2.5 font-mono text-xs"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="flex items-center gap-2 rounded-[4px] px-3 py-2.5 font-mono text-xs"
              style={{
                backgroundColor: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#4ade80',
              }}
            >
              <Check size={14} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit button with loading state */}
          <button
            type="submit"
            id="admin-settings-submit"
            disabled={isPending}
            className="w-full cursor-pointer rounded-[4px] py-3 font-mono text-sm font-semibold shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#22d3ee', color: '#09090b' }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>$ updating --credentials...</span>
              </span>
            ) : (
              <span>$ update --credentials</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
