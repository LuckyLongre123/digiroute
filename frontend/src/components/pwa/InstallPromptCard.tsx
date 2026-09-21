'use client';

import { Download, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

/**
 * InstallPromptCard
 *
 * Contextual PWA installation banner/card adhering to the 4px Refined Utilitarian design system.
 * Automatically hides if already running in standalone display mode.
 */
export function InstallPromptCard({
  title = 'Install DigiRoute App',
  description = 'Add DigiRoute to your home screen for instant access, native speed, and offline navigation.',
  buttonText = 'Download App',
  className = '',
}: InstallPromptCardProps) {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true
    );
  });
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Strictly hide if already installed/running in standalone mode
  if (isStandalone) {
    return null;
  }

  const handleAction = async () => {
    if (deferredPrompt) {
      setIsPrompting(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[InstallPromptCard] Prompt trigger failed:', err);
        router.push('/download-app');
      } finally {
        setIsPrompting(false);
      }
    } else {
      router.push('/download-app');
    }
  };

  return (
    <div
      className={`flex flex-col items-start justify-between gap-4 rounded-sm border border-zinc-200 bg-white p-4 font-sans shadow-2xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="max-w-md text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={handleAction}
          disabled={isPrompting}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-zinc-900 px-3.5 py-2 font-sans text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isPrompting ? 'Opening...' : buttonText}</span>
        </button>

        <Link
          href="/download-app"
          className="inline-flex cursor-pointer items-center justify-center rounded-sm border border-zinc-200 bg-transparent px-2.5 py-2 font-sans text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
