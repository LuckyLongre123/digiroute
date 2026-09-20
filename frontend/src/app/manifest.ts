import type { MetadataRoute } from 'next';

/**
 * DigiRoute PWA Manifest (FOUND-08)
 *
 * Generates the Web App Manifest for installability.
 * - display: standalone — removes browser chrome
 * - orientation: portrait — optimized for mobile usage
 * - start_url: "/" — lands on the home dashboard
 * - theme_color: #1A3A6B (Sovereign Navy)
 * - background_color: #F8FAFC (Eye-care soft slate)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DigiRoute — Sovereign Micro-Addressing',
    short_name: 'DigiRoute',
    description:
      'Solve the last 50 meters — create and share a precise 4-factor micro-address using DIGIPIN, doorway photo, map pin, and floor details.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8FAFC',
    theme_color: '#1A3A6B',
    categories: ['navigation', 'utilities', 'productivity'],
    icons: [
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
        purpose: 'any',
      },
    ],
    screenshots: [],
  };
}
