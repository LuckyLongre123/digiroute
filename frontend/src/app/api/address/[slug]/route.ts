import { NextRequest, NextResponse } from 'next/server';
import { getAddressBySlug } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      );
    }

    const address = await getAddressBySlug(slug);
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found or expired' },
        { status: 404 }
      );
    }

    // 1. Server-Side Expiry Enforcement
    if (address.expiresAt) {
      const expiryTime = new Date(address.expiresAt).getTime();
      if (Date.now() > expiryTime) {
        return NextResponse.json(
          { error: 'Address link has expired' },
          { status: 410 }
        );
      }
    }

    // 2. Critical Passcode Security: Do NOT return protected details before authorization
    const hasPasscode = Boolean(
      address.passcode && address.passcode.trim().length > 0
    );

    if (hasPasscode) {
      // Protected address: Omit doorway photo, unit, floor, landmark, instructions, and entrance coordinates.
      // The client receives only base geographic reference and isLocked state.
      return NextResponse.json({
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
        },
      });
    }

    // Unprotected address: Return full safe address payload (passcode hash always omitted)
    const { passcode: _passcode, ...safeAddress } = address;

    return NextResponse.json({
      address: {
        ...safeAddress,
        hasPasscode: false,
        isLocked: false,
      },
    });
  } catch (err: unknown) {
    console.error('[api/address/[slug]] Route error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
