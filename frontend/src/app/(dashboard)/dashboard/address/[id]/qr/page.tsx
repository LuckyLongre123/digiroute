import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAddressBySlug, getUserAddresses } from '@/lib/prisma';
import { PrintableQrBadgeView } from '@/components/dashboard/PrintableQrBadgeView';

interface QrPageProps {
  params: Promise<{ id: string }>;
}

/**
 * /dashboard/address/[id]/qr: Printable QR Badge Generator with Real Data
 */
export default async function AddressQrPage({ params }: QrPageProps) {
  const { id } = await params;
  const session = await getSession();

  let addressRecord = await getAddressBySlug(id);
  if (!addressRecord && session?.user?.id) {
    const userAddresses = await getUserAddresses(session.user.id);
    addressRecord = userAddresses.find((a) => a.id === id || a.slug === id) || null;
  }

  if (!addressRecord) {
    notFound();
  }

  const address = {
    id: addressRecord.id || addressRecord.slug,
    slug: addressRecord.slug,
    digipin: addressRecord.digipin,
    floor: addressRecord.floor || '',
    flat: addressRecord.flat || '',
    label: addressRecord.label || 'Home (Residence)',
  };

  return (
    <PrintableQrBadgeView
      address={address}
      backHref={`/dashboard/address/${address.slug}`}
    />
  );
}
