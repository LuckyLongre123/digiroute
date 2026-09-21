'use server';

import { getSession } from '@/lib/auth';
import { updateUserAddress } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface UpdateAddressInput {
  slugOrId: string;
  label?: string;
  floor?: string;
  flat?: string;
  landmark?: string;
  routingNotes?: string;
  expiresAt?: string | null;
}

export async function updateAddressAction(input: UpdateAddressInput) {
  try {
    if (!input.slugOrId) {
      return { success: false, error: 'Missing address identifier.' };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required.' };
    }

    const updated = await updateUserAddress(session.user.id, input.slugOrId, {
      label: input.label,
      floor: input.floor,
      flat: input.flat,
      landmark: input.landmark,
      routingNotes: input.routingNotes,
      expiresAt: input.expiresAt,
    });

    if (!updated) {
      return {
        success: false,
        error: 'Address not found or permission denied.',
      };
    }

    revalidatePath('/dashboard', 'layout');
    revalidatePath(`/dashboard/address/${input.slugOrId}`);
    revalidatePath('/admin/overview');
    return { success: true, address: updated };
  } catch (err) {
    console.error('[updateAddressAction] Error:', err);
    return { success: false, error: 'Failed to update address.' };
  }
}
