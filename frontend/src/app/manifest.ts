import type { MetadataRoute } from 'next';

/**
 * DigiRoute PWA Web App Manifest
 *
 * Configured for standalone PWA installation on mobile and desktop.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DigiRoute',
    short_name: 'DigiRoute',
    description:
      'Sovereign micro-addressing and spatial navigation for the last 50 meters.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#09090b',
    theme_color: '#09090b',
    categories: ['navigation', 'utilities', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
