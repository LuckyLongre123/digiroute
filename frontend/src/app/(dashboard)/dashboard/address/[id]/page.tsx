import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAddressBySlug, getUserAddresses } from '@/lib/prisma';
import { EditMicroAddressView } from '@/components/dashboard/EditMicroAddressView';

interface AddressPageProps {
  params: Promise<{ id: string }>;
}

/**
 * /dashboard/address/[id] - Address Details and Edit Page
 */
export default async function AddressDetailPage({ params }: AddressPageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/');
  }

  // Load address by slug or find by ID in user's addresses
  let addressRecord = await getAddressBySlug(id);
  if (!addressRecord) {
    const userAddresses = await getUserAddresses(session.user.id);
    addressRecord = userAddresses.find((a) => a.id === id || a.slug === id) || null;
  }

  // Strict User Data Isolation: Ensure user strictly owns this address
  if (!addressRecord || addressRecord.userId !== session.user.id) {
    notFound();
  }

  const address = {
    id: addressRecord.id || addressRecord.slug,
    slug: addressRecord.slug,
    digipin: addressRecord.digipin,
    coordinates: `${addressRecord.baseLat.toFixed(4)}° N, ${addressRecord.baseLng.toFixed(4)}° E`,
    label: addressRecord.label || 'Home (Residence)',
    floor: addressRecord.floor || '',
    flat: addressRecord.flat || '',
    landmark: addressRecord.landmark || '',
    doorwayPhotoUrl: addressRecord.doorwayPhotoUrl || null,
    expiresAt: addressRecord.expiresAt || null,
    isEphemeral: addressRecord.isEphemeral,
  };

  return <EditMicroAddressView address={address} backHref="/dashboard" />;
}
