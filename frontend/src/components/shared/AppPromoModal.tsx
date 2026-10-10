'use client';

import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const GITHUB_RELEASES_URL =
  'https://github.com/kushkumarkashyap7280/digiroutes_app/releases/latest';

interface AppPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

/**
 * AppPromoModal
 *
 * Clean, utilitarian modal teasing native Android app capabilities.
 * Strictly 4px rounded-sm, zinc/slate palette, zero AI slop.
 */
export function AppPromoModal({
  isOpen,
  onClose,
  title = 'Unlock the Full Experience',
  description = 'This feature is exclusively available on the DigiRoutes Android App. Download it now to access native QR scanning, offline DIGIPIN routing, and more!',
}: AppPromoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity"
      />

      {/* Modal Dialog Content (Strict 4px rounded-sm, Utilitarian Zinc/Slate) */}
      <div className="relative z-10 w-full max-w-md rounded-sm border border-zinc-200 bg-white p-5 font-sans shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h2
            id="promo-modal-title"
            className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer rounded-xs p-1 transition-colors dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Description */}
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>

        {/* Feature Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            📷 Built-in Scanner
          </div>
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            📶 Offline DIGIPIN
          </div>
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            🗺️ Route Planner
          </div>
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            🔗 Rich Sharing
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            id="promo-maybe-later-btn"
            className="cursor-pointer rounded-sm border border-zinc-200 bg-transparent px-3.5 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Maybe Later
          </button>

          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="promo-download-apk-btn"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download APK</span>
          </a>
        </div>
      </div>
    </div>
  );
}
