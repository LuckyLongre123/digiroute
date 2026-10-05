import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { HomePageClient } from '@/components/home/HomePageClient';
import { RecentAddressesAsync } from '@/components/home/RecentAddressesAsync';
import { RecentAddressesSkeleton } from '@/components/home/RecentAddressesSkeleton';

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
    <HomePageClient isLikelyAuthenticated={isLikelyAuthenticated}>
      {isLikelyAuthenticated && (
        <Suspense fallback={<RecentAddressesSkeleton />}>
          <RecentAddressesAsync />
        </Suspense>
      )}
    </HomePageClient>
  );
}
