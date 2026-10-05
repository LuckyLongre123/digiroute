'use server';

import { getSession } from '@/lib/auth';
import { bulkDeleteUserAddresses } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface BulkDeleteResult {
  success: boolean;
  count?: number;
  error?: string;
}

/**
 * Bulk delete user addresses with strict session ownership verification.
 * Only addresses owned by the authenticated user (userId: session.user.id) will be removed.
 */
export async function bulkDeleteAddressesAction(
  ids: string[]
): Promise<BulkDeleteResult> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: 'No addresses selected for deletion.' };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required.' };
    }

    const result = await bulkDeleteUserAddresses(session.user.id, ids);

    // Cache Busting: Clear Next.js stale cache on dashboard and admin routes
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin/overview');

    return {
      success: true,
      count: result.count,
    };
  } catch (err) {
    console.error('[bulkDeleteAddressesAction] Error:', err);
    return {
      success: false,
      error: 'Failed to delete selected addresses. Please try again.',
    };
  }
}
