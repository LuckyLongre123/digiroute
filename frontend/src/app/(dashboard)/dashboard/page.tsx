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
    unit:
      [addr.floor, addr.flat].filter(Boolean).join(', ') || 'Doorway Entrance',
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
    <div className="animate-in fade-in space-y-6 duration-150">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Address Book
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Your permanent, high-precision sovereign micro-addresses
          </p>
        </div>

        <Link
          href="/create"
          id="dashboard-create-btn"
          className="bg-accent text-accent-foreground inline-flex cursor-pointer items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Address</span>
        </Link>
      </div>

      {/* Addresses List or Empty State */}
      {addresses.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-muted-foreground mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <MapPin className="h-6 w-6 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold tracking-tight">
              No saved addresses. Create your first micro-address.
            </h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              Safeguard your doorstep with a 10-character DIGIPIN, Visual Lock,
              and Entrance Pin.
            </p>
          </div>
          <Link
            href="/create"
            className="bg-accent text-accent-foreground inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Address</span>
          </Link>
        </div>
      ) : (
        <AddressBookList addresses={addresses} />
      )}
    </div>
  );
}
