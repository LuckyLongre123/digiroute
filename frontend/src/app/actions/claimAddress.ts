'use server';

import { getSession } from '@/lib/auth';
import { claimAddressForUser } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Claim an unassigned address for the currently authenticated user.
 * Strictly executes:
 * UPDATE MicroAddress SET userId = session.userId
 * WHERE id = addressId (strictly preserves existing expiresAt value)
 */
export async function claimAddress(addressId: string) {
  try {
    if (!addressId || typeof addressId !== 'string') {
      return { success: false, error: 'Missing address identifier.' };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required to claim address.',
      };
    }

    let claimed = await claimAddressForUser(addressId, session.user.id);
    if (!claimed) {
      // Retry in case createAddress background action is completing persistence
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        claimed = await claimAddressForUser(addressId, session.user.id);
        if (claimed) break;
      }
    }
    if (!claimed) {
      return {
        success: false,
        error: 'Address not found or already claimed by another account.',
      };
    }

    try {
      revalidatePath(`/a/${claimed.slug}`);
      revalidatePath('/create/success');
      revalidatePath('/dashboard');
    } catch {
      // Non-blocking cache revalidation
    }

    return { success: true, address: claimed };
  } catch (err) {
    console.error('[claimAddress] Error:', err);
    return { success: false, error: 'Failed to save address to account.' };
  }
}

export async function claimGuestAddress(addressId: string) {
  return claimAddress(addressId);
}

export async function attachUserToAddress(addressId: string) {
  return claimAddress(addressId);
}

export async function claimAddressAction(slugOrId: string) {
  return claimAddress(slugOrId);
}
