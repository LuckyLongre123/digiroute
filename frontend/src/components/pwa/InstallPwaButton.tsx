'use client';

import { Check, Download, Share2, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true
    );
  });
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  });
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Listen for Chromium beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Install error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-2.5 font-sans text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>DigiRoute is already installed on your device</span>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={isInstalling}
        id="install-pwa-action-btn"
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-zinc-900 px-5 py-2.5 font-sans text-xs font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 sm:text-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{isInstalling ? 'Installing...' : 'Install DigiRoute App'}</span>
      </button>
    );
  }

  // Fallback for iOS or browsers that don't dispatch beforeinstallprompt
  return (
    <div className="flex max-w-md flex-col items-center gap-2.5 rounded-sm border border-zinc-200 bg-zinc-50/70 p-3.5 text-center font-sans dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {isIOS ? (
          <>
            <Share2 className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              To install on iOS, tap <strong>Share</strong> &gt;{' '}
              <strong>Add to Home Screen</strong>.
            </span>
          </>
        ) : (
          <>
            <Smartphone className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              To install, tap your browser menu (⋮) and select{' '}
              <strong>Add to Home Screen</strong> or{' '}
              <strong>Install App</strong>.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
