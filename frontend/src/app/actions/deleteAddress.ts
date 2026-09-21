'use server';

import { getSession } from '@/lib/auth';
import { deleteUserAddress } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteAddressAction(slugOrId: string) {
  try {
    if (!slugOrId) {
      return { success: false, error: 'Missing address identifier.' };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required.' };
    }

    const deleted = await deleteUserAddress(session.user.id, slugOrId);
    if (!deleted) {
      return {
        success: false,
        error: 'Address not found or permission denied.',
      };
    }

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin/overview');
    return { success: true };
  } catch (err) {
    console.error('[deleteAddressAction] Error:', err);
    return { success: false, error: 'Failed to delete address.' };
  }
}
