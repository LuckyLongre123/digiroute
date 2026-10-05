import { getSession } from '@/lib/auth';
import { getUserAddresses } from '@/lib/prisma';
import { RecentAddressesClient } from './RecentAddressesClient';
import { type RecentAddressItem } from '@/app/actions/getRecentAddresses';

export async function RecentAddressesAsync() {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const records = await getUserAddresses(session.user.id);
  if (!records || records.length === 0) {
    return null;
  }

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
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    expiresAt: r.expiresAt || null,
    isEphemeral: r.isEphemeral,
  }));

  return <RecentAddressesClient addresses={recent} />;
}
