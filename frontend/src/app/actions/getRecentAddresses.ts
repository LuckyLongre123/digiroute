'use server';

import { getCurrentSession } from '@/lib/auth';
import { getUserAddresses } from '@/lib/prisma';

export interface RecentAddressItem {
  id?: string;
  slug: string;
  digipin: string;
  label?: string | null;
  flat?: string | null;
  floor?: string | null;
  landmark?: string | null;
  baseLat: number;
  baseLng: number;
  createdAt?: string;
  expiresAt?: string | null;
  isEphemeral?: boolean;
}

/**
 * Server Action: Retrieve the authenticated user's 3 most recent addresses.
 * Returns empty array if user is unauthenticated or has 0 addresses.
 */
export async function getRecentAddressesAction(): Promise<{ addresses: RecentAddressItem[] }> {
  try {
    const session = await getCurrentSession();
    if (!session?.id) {
      return { addresses: [] };
    }

    const records = await getUserAddresses(session.id);
    if (!records || records.length === 0) {
      return { addresses: [] };
    }

    // Sort newest first
    const sorted = records.slice().sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    const recent: RecentAddressItem[] = sorted.slice(0, 3).map((r) => ({
      id: r.id,
      slug: r.slug,
      digipin: r.digipin,
      label: r.label,
      flat: r.flat,
      floor: r.floor,
      landmark: r.landmark,
      baseLat: r.baseLat,
      baseLng: r.baseLng,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt || null,
      isEphemeral: r.isEphemeral,
    }));

    return { addresses: recent };
  } catch (error) {
    console.error('[getRecentAddressesAction] Error:', error);
    return { addresses: [] };
  }
}
