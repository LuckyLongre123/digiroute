import type { MetadataRoute } from 'next';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

/**
 * Dynamic robots.txt
 *
 * Allows public canonical pages while strictly protecting user privacy
 * and preventing crawl index leakage for admin, auth, API, and ephemeral routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/a/',
        '/login',
        '/register',
        '/track/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
