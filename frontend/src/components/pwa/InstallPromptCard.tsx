'use client';

import React from 'react';
import Link from 'next/link';
import { AndroidIcon } from '@/components/icons/AndroidIcon';
import { ArrowRight } from 'lucide-react';

interface InstallPromptCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

/**
 * InstallPromptCard
 *
 * Contextual Native Android App banner adhering to the 4px Refined Utilitarian design system.
 * Routes users to the dedicated /download landing page.
 */
export function InstallPromptCard({
  title = 'Experience DigiRoutes on Android',
  description = 'Download our native Android app for built-in QR scanning, OpenRouteService navigation, offline DIGIPIN, and rich WhatsApp sharing.',
  buttonText = 'Download App',
  className = '',
}: InstallPromptCardProps) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-4 rounded-sm border border-zinc-200 bg-white p-4 font-sans shadow-2xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
          <AndroidIcon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <span className="rounded-xs border border-emerald-300/80 bg-emerald-50 px-1.5 py-0.2 font-mono text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Native APK
            </span>
          </div>
          <p className="max-w-md text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <Link
          href="/download"
          id="native-apk-download-card-btn"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-zinc-900 px-3.5 py-2 font-sans text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98] sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <AndroidIcon className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>{buttonText}</span>
          <ArrowRight className="h-3 w-3 opacity-60" />
        </Link>
      </div>
    </div>
  );
}
