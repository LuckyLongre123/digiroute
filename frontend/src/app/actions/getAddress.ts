'use server';

import { getAddressBySlug, type AddressPayload } from '@/lib/prisma';

export interface GetAddressActionResult {
  success: boolean;
  address?: Partial<AddressPayload> & {
    hasPasscode: boolean;
    isLocked: boolean;
  };
  isExpired?: boolean;
  error?: string;
}

/**
 * Server Action: Securely fetch address record with server-side expiry enforcement
 * and sensitive field protection prior to passcode authentication.
 */
export async function getAddressAction(
  slug: string
): Promise<GetAddressActionResult> {
  try {
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return { success: false, error: 'Missing address slug parameter.' };
    }

    const address = await getAddressBySlug(slug.trim());
    if (!address) {
      return { success: false, error: 'Address not found or expired.' };
    }

    // 1. Strict Server-Side Expiry Enforcement
    if (address.expiresAt) {
      const expiryTime = new Date(address.expiresAt).getTime();
      if (Date.now() > expiryTime) {
        return {
          success: false,
          isExpired: true,
          error: 'Address link has expired.',
        };
      }
    }

    // 2. Sensitive Field Protection: Mask doorstep details if passcode is configured
    const hasPasscode = Boolean(
      address.passcode && address.passcode.trim().length > 0
    );

    if (hasPasscode) {
      return {
        success: true,
        address: {
          slug: address.slug,
          digipin: address.digipin,
          baseLat: address.baseLat,
          baseLng: address.baseLng,
          label: address.label,
          hasPasscode: true,
          isLocked: true,
          isEphemeral: address.isEphemeral,
          expiresAt: address.expiresAt,
          userId: address.userId,
        },
      };
    }

    const { passcode: _passcode, ...safeAddress } = address;
    return {
      success: true,
      address: {
        ...safeAddress,
        hasPasscode: false,
        isLocked: false,
      },
    };
  } catch (error) {
    console.error('[getAddressAction] Error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while loading address.',
    };
  }
}
