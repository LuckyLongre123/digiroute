import type { MetadataRoute } from 'next';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

/**
 * Dynamic XML Sitemap
 *
 * Serves canonical, 200-status public routes with stable ISO lastModified dates.
 * Excludes private, administrative, auth, and ephemeral routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = '2026-11-24T00:00:00.000Z';

  return [
    {
      url: `${BASE_URL}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/download-app`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/create`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/scan`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sos`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/report`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
