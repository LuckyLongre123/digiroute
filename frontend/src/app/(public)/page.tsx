import { HomePageClient } from '@/components/home/HomePageClient';
import { RecentAddressesAsync } from '@/components/home/RecentAddressesAsync';
import { RecentAddressesSkeleton } from '@/components/home/RecentAddressesSkeleton';
import { JsonLd } from '@/components/seo/JsonLd';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  title: 'Sovereign Micro-Addressing & DIGIPIN Navigation',
  description:
    'Resolve last-50-meter delivery failures in India with 2-factor micro-addresses pairing India Post DIGIPIN codes with verified doorway visual lock photos.',
  alternates: {
    canonical: '/',
  },
};

const homeSchemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DigiRoute',
    url: BASE_URL,
    description:
      'Sovereign micro-addressing and spatial navigation resolving last-50-meter delivery failures in India using DIGIPIN and verified doorway visual locks.',
    applicationCategory: 'NavigationApplication',
    operatingSystem: 'Web, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DigiRoute',
    url: BASE_URL,
    logo: `${BASE_URL}/android-chrome-512x512.png`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DigiRoute',
    url: BASE_URL,
  },
];

/**
 * Public Home Page (/) - Auth-Aware Server Component
 *
 * Implements strict conditional skeleton loading:
 * - Cookie check: checks if session cookie exists via cookies().has(SESSION_COOKIE_NAME)
 * - If isLikelyAuthenticated is true: wraps RecentAddressesAsync in <Suspense fallback={<RecentAddressesSkeleton />}>
 * - If isLikelyAuthenticated is false: does not render recent addresses section or any skeleton (zero skeleton flash for guest visitors)
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  const isLikelyAuthenticated = cookieStore.has(SESSION_COOKIE_NAME);

  return (
    <>
      <JsonLd data={homeSchemas} />
      <HomePageClient isLikelyAuthenticated={isLikelyAuthenticated}>
        {isLikelyAuthenticated && (
          <Suspense fallback={<RecentAddressesSkeleton />}>
            <RecentAddressesAsync />
          </Suspense>
        )}
      </HomePageClient>
    </>
  );
}
