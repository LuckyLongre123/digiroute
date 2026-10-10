import {
  Download,
  ExternalLink,
  Navigation,
  QrCode,
  Share2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import type { Metadata } from 'next';

export const GITHUB_RELEASES_URL =
  'https://github.com/kushkumarkashyap7280/digiroutes_app/releases/latest';

export const metadata: Metadata = {
  title: 'Download DigiRoutes for Android — Native Mobile App',
  description:
    'Download our native Android app for a seamless, offline-ready micro-addressing experience with built-in QR scanning, route planning, and rich sharing.',
};

export default function DownloadPage() {
  const nativeBenefits = [
    {
      title: 'Built-in QR Scanner',
      description: 'Instantly scan doorway badges without leaving the app.',
      icon: QrCode,
    },
    {
      title: 'Offline DIGIPIN',
      description:
        'Compute and decode 10-character micro-addresses even without internet.',
      icon: WifiOff,
    },
    {
      title: 'Route Planner',
      description:
        'Navigate directly to micro-addresses with turn-by-turn guidance.',
      icon: Navigation,
    },
    {
      title: 'Rich Sharing',
      description:
        'Send addresses directly to WhatsApp with entrance photos and navigation links.',
      icon: Share2,
    },
  ];

  const installSteps = [
    {
      step: '1',
      title: 'Download APK',
      desc: 'Tap "Download Latest APK" to fetch the official release from GitHub.',
    },
    {
      step: '2',
      title: 'Open Downloaded File',
      desc: 'Tap the download notification or open the file in your Files app.',
    },
    {
      step: '3',
      title: 'Allow Installation',
      desc: 'If prompted by Android, enable "Allow from this source".',
    },
    {
      step: '4',
      title: 'Install & Launch',
      desc: 'Tap "Install" to complete setup and launch the app.',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4 font-sans sm:py-8">
      {/* 1. Hero Section */}
      <div className="flex flex-col items-center space-y-4 text-center">
        {/* Hero Copy */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Take DigiRoutes to the Next Level
          </h1>
          <p className="mx-auto max-w-lg text-xs leading-relaxed text-zinc-500 sm:text-sm dark:text-zinc-400">
            Download our native Android app for a seamless, offline-ready
            micro-addressing experience.
          </p>
        </div>
      </div>

      {/* 2. Feature Grid (2x2 on desktop, clean with Icon, Title, and Description) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          Native Features
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {nativeBenefits.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex flex-col space-y-2 rounded-sm border border-zinc-200 bg-white p-4 shadow-2xs transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {feat.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Primary CTA Button */}
      <div className="flex flex-col items-center gap-2.5 pt-1 text-center">
        <a
          href={GITHUB_RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          id="download-latest-apk-btn"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-zinc-900 px-7 py-3 font-sans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 active:scale-[0.98] sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Download Latest APK</span>
        </a>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>Official GitHub Release</span>
          <span>•</span>
          <span>Android 8.0+</span>
          <span>•</span>
          <span>Universal APK</span>
        </div>
      </div>

      {/* 4. Installation Steps (Minimal, Clean Zinc Styling) */}
      <div className="space-y-3 rounded-sm border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Installation Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
          {installSteps.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-2.5 rounded-sm border border-zinc-200 bg-zinc-50/60 p-3 text-left dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-zinc-200 font-mono text-[10px] font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {item.step}
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </p>
                <p className="text-[11px] leading-normal text-zinc-500 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. External Verification Link */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-sm border border-zinc-200 bg-white p-4 shadow-2xs sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-0.5 text-center sm:text-left">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Source Code &amp; Release Notes
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            View APK release checksums and commit logs on GitHub.
          </p>
        </div>

        <a
          href={GITHUB_RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-sans text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
        >
          <span>View on GitHub</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      </div>
    </div>
  );
}
