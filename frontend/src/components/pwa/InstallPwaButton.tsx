'use client';

import React from 'react';
import { AndroidIcon } from '@/components/icons/AndroidIcon';
import { ArrowDownToLine, ExternalLink } from 'lucide-react';

export const GITHUB_RELEASES_URL =
  'https://github.com/kushkumarkashyap7280/digiroutes_app/releases/latest';

/**
 * InstallPwaButton (Native Android APK Download CTA)
 *
 * Prominent primary download button targeting our native Flutter Android release on GitHub.
 * Fully replaces legacy PWA home-screen prompt logic.
 */
export function InstallPwaButton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={GITHUB_RELEASES_URL}
        target="_blank"
        rel="noopener noreferrer"
        id="download-android-apk-main-btn"
        className="group inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-sm bg-zinc-900 px-6 py-3 font-sans text-sm font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <AndroidIcon className="h-4.5 w-4.5 shrink-0 text-emerald-400 transition-transform group-hover:scale-110 dark:text-emerald-600" />
        <span>Download Android App (APK)</span>
        <ArrowDownToLine className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-y-0.5" />
      </a>

      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Latest Release</span>
        <span>•</span>
        <span>Android 8.0+</span>
        <span>•</span>
        <span>Universal APK</span>
      </div>
    </div>
  );
}
