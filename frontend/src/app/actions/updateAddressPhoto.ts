'use server';

import { getSession } from '@/lib/auth';
import { updateAddressPhotoInDb } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server action to update address doorway photo URL.
 * Can be called silently in the background after client-side direct upload.
 */
export async function updateAddressPhoto(slugOrId: string, photoUrl: string) {
  try {
    if (!slugOrId || !photoUrl) {
      return { success: false, error: 'Missing address identifier or photo URL.' };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required.' };
    }

    const updated = await updateAddressPhotoInDb(slugOrId, photoUrl, session.user.id);

    if (!updated) {
      return { success: false, error: 'Address not found or permission denied.' };
    }

    try {
      revalidatePath(`/dashboard/address/${slugOrId}`);
      revalidatePath(`/dashboard/manage/${slugOrId}`);
      revalidatePath(`/a/${updated.slug}`);
      revalidatePath('/dashboard');
    } catch {
      // Non-blocking revalidation
    }

    return {
      success: true,
      slug: updated.slug,
      doorwayPhotoUrl: updated.doorwayPhotoUrl,
    };
  } catch (err) {
    console.error('[updateAddressPhoto] Server action error:', err);
    return { success: false, error: 'Failed to update doorway photo.' };
  }
}
