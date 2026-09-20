import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getAddressBySlug } from '@/lib/prisma';
import { PrintableQrBadgeView } from '@/components/dashboard/PrintableQrBadgeView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * /dashboard/manage/[slug]/qr — Printable QR Badge Generator with Real Data
 * Protected with strict owner authorization to prevent IDOR vulnerabilities.
 */
export default async function ManageAddressQrPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/dashboard/manage/${slug}/qr`)}`
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
          You do not have permission to access this micro-address QR badge. Only
          the verified owner can view badge details.
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
    floor: addressRecord.floor || '',
    flat: addressRecord.flat || '',
    label: addressRecord.label || 'Home (Residence)',
  };

  return (
    <PrintableQrBadgeView
      address={address}
      backHref={`/dashboard/manage/${address.slug}`}
    />
  );
}
