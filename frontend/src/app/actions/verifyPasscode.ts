'use server';

import { getAddressBySlug, type AddressPayload } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export interface VerifyPasscodeResult {
  success: boolean;
  address?: Partial<AddressPayload>;
  isExpired?: boolean;
  error?: string;
}

/**
 * Server Action: Securely verify resident passcode against stored hash.
 * 1. Enforces strict server-side expiry validation.
 * 2. Only releases protected doorway/building details after successful verification.
 * 3. Prevents raw passcode or password hash from ever leaking to the client.
 */
export async function verifyAddressPasscode(
  slug: string,
  enteredPasscode: string
): Promise<VerifyPasscodeResult> {
  try {
    if (!slug || !enteredPasscode) {
      return { success: false, error: 'Passcode is required.' };
    }

    const address = await getAddressBySlug(slug.trim());
    if (!address || !address.passcode) {
      return { success: false, error: 'Address not found or no passcode required.' };
    }

    // Strict Server-Side Expiry Enforcement
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

    const isValid = await verifyPassword(enteredPasscode.trim(), address.passcode);
    if (!isValid) {
      return { success: false, error: 'Incorrect passcode. Please try again.' };
    }

    // Authorized: Release protected doorway & building details
    return {
      success: true,
      address: {
        slug: address.slug,
        digipin: address.digipin,
        baseLat: address.baseLat,
        baseLng: address.baseLng,
        entranceLat: address.entranceLat,
        entranceLng: address.entranceLng,
        floor: address.floor,
        flat: address.flat,
        landmark: address.landmark,
        label: address.label,
        routingNotes: address.routingNotes,
        doorwayPhotoUrl: address.doorwayPhotoUrl,
        isEphemeral: address.isEphemeral,
        expiresAt: address.expiresAt,
      },
    };
  } catch (error) {
    console.error('[verifyAddressPasscode] Verification error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during verification. Please try again.',
    };
  }
}
