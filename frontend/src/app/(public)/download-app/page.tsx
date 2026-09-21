import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { Database, Gauge, LayoutGrid } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Install DigiRoute App — Offline Geospatial Addressing',
  description:
    'Install DigiRoute on your device home screen for instant access without browser chrome, offline route fallback, and native speed.',
};

export default function DownloadAppPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4 font-sans sm:py-8">
      {/* Hero / Header Section */}
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-zinc-200 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute App Icon"
            width={44}
            height={44}
            className="h-auto w-full object-contain dark:brightness-200 dark:invert"
          />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
            Install DigiRoute on your Device
          </h1>
          <p className="max-w-md text-xs leading-relaxed text-zinc-500 sm:text-sm dark:text-zinc-400">
            Progressive Web App installation provides direct home-screen access,
            full offline resilience, and faster GPS tracking.
          </p>
        </div>

        {/* Install Action Button (Client Component) */}
        <div className="pt-2">
          <InstallPwaButton />
        </div>
      </div>

      {/* Features Grid (4px rounded-sm cards, refined utilitarian) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          Key Capabilities
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Card 1: Instant Access */}
          <div className="space-y-2 rounded-sm border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Instant Access
              </h3>
              <p className="mt-1 text-[11px] leading-normal text-zinc-500 dark:text-zinc-400">
                Launch directly from your home screen without browser chrome.
              </p>
            </div>
          </div>

          {/* Card 2: Offline Fallback */}
          <div className="space-y-2 rounded-sm border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Offline Fallback
              </h3>
              <p className="mt-1 text-[11px] leading-normal text-zinc-500 dark:text-zinc-400">
                Service-worker backed resilience for saved micro-addresses.
              </p>
            </div>
          </div>

          {/* Card 3: Native Speed */}
          <div className="space-y-2 rounded-sm border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Native Speed
              </h3>
              <p className="mt-1 text-[11px] leading-normal text-zinc-500 dark:text-zinc-400">
                Faster geolocation hardware hooks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Utilitarian Technical Footer Note */}
      <div className="rounded-sm border border-zinc-200/80 bg-zinc-50/50 p-3 text-center text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400">
        No app store accounts or large downloads required. Consumes &lt; 2 MB of
        device storage.
      </div>
    </div>
  );
}
