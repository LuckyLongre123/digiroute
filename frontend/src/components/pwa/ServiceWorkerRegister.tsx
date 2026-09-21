'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister
 *
 * Registers the DigiRoute PWA service worker (/sw.js) upon window load.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(
              '[PWA] Service Worker registered with scope:',
              reg.scope
            );
          }
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  return null;
}
