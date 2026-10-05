'use server';

import { getAddressBySlug, type AddressPayload } from '@/lib/prisma';

export interface QrAddressData {
  id: string;
  slug: string;
  digipin: string;
  label?: string | null;
  flat?: string | null;
  floor?: string | null;
  landmark?: string | null;
  expiresAt?: string | null;
  isEphemeral?: boolean;
}

export interface GetQrAddressResult {
  success: boolean;
  address?: QrAddressData | null;
  error?: string;
  notFound?: boolean;
}

/**
 * Server action to fetch address for QR code generation and validations.
 * Returns the address with its expiration timestamp without blocking expired records,
 * allowing the frontend to enforce Condition B (expired hard block) and Condition C (warning banner).
 */
export async function getQrAddressAction(
  slugOrId: string
): Promise<GetQrAddressResult> {
  try {
    if (!slugOrId || typeof slugOrId !== 'string' || slugOrId.trim().length === 0) {
      return { success: false, notFound: true, error: 'Address not found or invalid.' };
    }

    const trimmed = slugOrId.trim();
    const record = await getAddressBySlug(trimmed);
    if (!record) {
      return { success: false, notFound: true, error: 'Address not found or invalid.' };
    }

    return {
      success: true,
      address: {
        id: record.id || record.slug,
        slug: record.slug,
        digipin: record.digipin,
        label: record.label || null,
        flat: record.flat || null,
        floor: record.floor || null,
        landmark: record.landmark || null,
        expiresAt: record.expiresAt || null,
        isEphemeral: record.isEphemeral,
      },
    };
  } catch (error) {
    console.error('[getQrAddressAction] Error:', error);
    return { success: false, notFound: true, error: 'Address not found or invalid.' };
  }
}
