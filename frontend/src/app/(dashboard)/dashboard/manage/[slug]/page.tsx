import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getAddressBySlug } from '@/lib/prisma';
import { EditMicroAddressView } from '@/components/dashboard/EditMicroAddressView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * /dashboard/manage/[slug] — Edit Micro-Address Page
 * Protected with strict owner authorization to prevent IDOR vulnerabilities.
 */
export default async function ManageAddressPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/dashboard/manage/${slug}`)}`
    );
  }

  const addressRecord = await getAddressBySlug(slug);

  if (!addressRecord) {
    notFound();
  }

  // Strict Owner Authorization (IDOR Prevention)
  if (addressRecord.userId !== session.user.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-foreground text-xl font-bold">
          403 — Access Denied
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          You do not have permission to manage this micro-address. Sovereign
          addresses can only be modified by their verified owner.
        </p>
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground mt-6 rounded px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
        >
          Return to Dashboard
        </Link>
      </div>
    );
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
