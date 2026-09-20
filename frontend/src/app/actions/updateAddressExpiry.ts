'use server';

import { revalidatePath } from 'next/cache';
import { updateAddressExpiryInDb } from '@/lib/prisma';

export async function updateAddressExpiry(addressId: string, expiryValue: string) {
  try {
    if (!addressId || typeof addressId !== 'string') {
      return { success: false, error: 'Missing address identifier.' };
    }

    let expiresAt: string | null = null;
    let isEphemeral = true;
    const now = Date.now();

    const normalized = expiryValue.trim().toLowerCase();
    if (normalized.includes('1 hour') || normalized === '1h') {
      expiresAt = new Date(now + 60 * 60 * 1000).toISOString();
      isEphemeral = true;
    } else if (normalized.includes('12 hour') || normalized === '12h') {
      expiresAt = new Date(now + 12 * 60 * 60 * 1000).toISOString();
      isEphemeral = true;
    } else if (normalized.includes('24 hour') || normalized === '24h' || normalized.includes('1 day')) {
      expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
      isEphemeral = true;
    } else if (normalized.includes('7 day') || normalized === '7d' || normalized.includes('1 week')) {
      expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
      isEphemeral = true;
    } else if (normalized.includes('never') || normalized.includes('permanent')) {
      expiresAt = null;
      isEphemeral = false;
    } else {
      // Default fallback: 24 hours
      expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
      isEphemeral = true;
    }

    const updated = await updateAddressExpiryInDb(addressId, expiresAt, isEphemeral);
    if (!updated) {
      return { success: false, error: 'Address not found in database.' };
    }

    try {
      revalidatePath(`/a/${updated.slug}`);
      revalidatePath('/create/success');
      revalidatePath('/dashboard');
    } catch {
      // Non-blocking cache revalidation
    }

    return {
      success: true,
      slug: updated.slug,
      expiresAt: updated.expiresAt,
      isEphemeral: updated.isEphemeral,
      label: expiryValue,
    };
  } catch (err) {
    console.error('[updateAddressExpiry] Server action error:', err);
    return { success: false, error: 'Failed to update address expiry.' };
  }
}
