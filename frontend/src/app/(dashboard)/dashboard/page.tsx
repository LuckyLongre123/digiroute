import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, MapPin } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getUserAddresses } from '@/lib/prisma';
import { AddressBookList } from '@/components/dashboard/AddressBookList';

/**
 * /dashboard - Authenticated User Address Book Index (ROUTE-01, ROUTE-04)
 *
 * Displays strictly the authenticated citizen's permanent micro-addresses.
 * Guarantees complete data isolation: never leaks global or other users' addresses.
 */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/');
  }

  const rawAddresses = await getUserAddresses(session.user.id);
  // Guarantee newest first ordering
  const sortedRawAddresses = rawAddresses.slice().sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const addresses = sortedRawAddresses.map((addr) => ({
    id: addr.id || addr.slug,
    label: addr.label || 'Saved Location',
    digipin: addr.digipin,
    unit: [addr.floor, addr.flat].filter(Boolean).join(', ') || 'Doorway Entrance',
    landmark: addr.landmark || '',
    slug: addr.slug,
    isPermanent: !addr.isEphemeral,
    expiresAt: addr.expiresAt || null,
    isEphemeral: addr.isEphemeral,
    baseLat: addr.baseLat,
    baseLng: addr.baseLng,
    floor: addr.floor || null,
    flat: addr.flat || null,
    routingNotes: addr.routingNotes || null,
    createdAt: addr.createdAt,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Address Book
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your permanent, high-precision sovereign micro-addresses
          </p>
        </div>

        <Link
          href="/create"
          id="dashboard-create-btn"
          className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold text-sm px-4 py-2.5 rounded active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Address</span>
        </Link>
      </div>

      {/* Addresses List or Empty State */}
      {addresses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-muted-foreground">
            <MapPin className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              No saved addresses. Create your first micro-address.
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Safeguard your doorstep with a 10-character DIGIPIN, Visual Lock, and Entrance Pin.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground text-sm font-semibold px-4 py-2.5 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Address</span>
          </Link>
        </div>
      ) : (
        <AddressBookList addresses={addresses} />
      )}
    </div>
  );
}
