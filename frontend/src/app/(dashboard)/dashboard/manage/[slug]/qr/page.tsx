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
    redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/manage/${slug}/qr`)}`);
  }

  const addressRecord = await getAddressBySlug(slug);

  if (!addressRecord) {
    notFound();
  }

  // Strict Owner Authorization (IDOR Prevention)
  if (addressRecord.userId !== session.user.id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground">403 — Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          You do not have permission to access this micro-address QR badge. Only the verified owner can view badge details.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
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
