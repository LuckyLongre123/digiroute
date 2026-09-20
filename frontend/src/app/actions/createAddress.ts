'use server';

import { getSession, hashPassword } from '@/lib/auth';
import { saveAddress, type AddressPayload } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface CreateAddressResult {
  success: boolean;
  slug?: string;
  shareUrl?: string;
  photoUrl?: string | null;
  userId?: string | null;
  expiresAt?: string | null;
  isEphemeral?: boolean;
  error?: string;
}

export async function createAddress(formData: FormData): Promise<CreateAddressResult> {
  try {
    const digipin = (formData.get('digipin') as string)?.trim();
    const baseLatStr = formData.get('baseLat') as string;
    const baseLngStr = formData.get('baseLng') as string;

    if (!baseLatStr || !baseLngStr) {
      return { success: false, error: 'Base GPS coordinates are required.' };
    }

    const baseLat = parseFloat(baseLatStr);
    const baseLng = parseFloat(baseLngStr);

    if (isNaN(baseLat) || isNaN(baseLng)) {
      return { success: false, error: 'Invalid base GPS coordinates.' };
    }

    const entranceLatStr = formData.get('entranceLat') as string;
    const entranceLngStr = formData.get('entranceLng') as string;
    const entranceLat = entranceLatStr ? parseFloat(entranceLatStr) : baseLat;
    const entranceLng = entranceLngStr ? parseFloat(entranceLngStr) : baseLng;

    const floor = (formData.get('floor') as string)?.trim() || null;
    const flat = (formData.get('flat') as string)?.trim() || null;
    const landmark = (formData.get('landmark') as string)?.trim() || null;
    const label = (formData.get('label') as string)?.trim() || null;
    const routingNotes = (formData.get('routingNotes') as string)?.trim() || null;
    const rawPasscode = (formData.get('passcode') as string)?.trim() || null;
    const passcode = rawPasscode && rawPasscode.length > 0 ? await hashPassword(rawPasscode) : null;
    const expiry = (formData.get('expiry') as string)?.trim() || '30m';

    // Optimistic UI: Accept client-generated slug if provided, otherwise generate cryptographic slug
    const clientSlug = (formData.get('slug') as string)?.trim();
    const slug = clientSlug && clientSlug.startsWith('dg-') ? clientSlug : `dg-${nanoid(12)}`;

    // Handle doorway photo: check for direct Cloudinary photoUrl first, fallback to file upload.
    // STRICT VALIDATION: Never accept strings starting with blob:
    const clientPhotoUrl = (formData.get('photoUrl') as string)?.trim();
    let doorwayPhotoUrl: string | null =
      clientPhotoUrl && (clientPhotoUrl.startsWith('http://') || clientPhotoUrl.startsWith('https://'))
        ? clientPhotoUrl
        : null;
    const photoFile = formData.get('photo') as File | null;

    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'doorways');
        await fs.mkdir(uploadsDir, { recursive: true });

        const fileName = `${slug}.webp`;
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, buffer);

        doorwayPhotoUrl = `/uploads/doorways/${fileName}`;
      } catch (fileErr) {
        console.warn('[Storage] Failed to write doorway photo file:', fileErr);
      }
    }

    // TTL calculation
    const rawExpiresAt = (formData.get('expiresAt') as string)?.trim();
    let expiresAt: string | null = null;

    if (expiry === 'never') {
      expiresAt = null;
    } else if (rawExpiresAt && !isNaN(new Date(rawExpiresAt).getTime())) {
      expiresAt = rawExpiresAt;
    } else {
      let durationMs = 30 * 60 * 1000; // default 30 minutes
      if (expiry === '1h') durationMs = 60 * 60 * 1000;
      else if (expiry === '12h') durationMs = 12 * 60 * 60 * 1000;
      else if (expiry === '24h') durationMs = 24 * 60 * 60 * 1000;
      else if (expiry === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;

      expiresAt = new Date(Date.now() + durationMs).toISOString();
    }

    let session: { userId: string } | null = null;
    try {
      const activeSession = await getSession();
      if (activeSession?.user?.id) {
        session = { userId: activeSession.user.id };
      }
    } catch {
      // Unauthenticated creator or session error
    }

    const isAuthenticated = Boolean(session?.userId);

    // Auto-Link During Creation (UX Fix): If a user is already logged in when generating,
    // automatically assign their userId to the newly created address in Prisma.
    const ownerId = isAuthenticated && session?.userId ? session.userId : null;

    const addressPayload: AddressPayload = {
      slug,
      digipin: digipin || '4M8K-9P2L-1X',
      baseLat,
      baseLng,
      entranceLat,
      entranceLng,
      floor,
      flat,
      landmark,
      label,
      routingNotes,
      doorwayPhotoUrl,
      passcode,
      isEphemeral: Boolean(expiresAt),
      expiresAt,
      userId: ownerId,
    };

    await saveAddress(addressPayload);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const shareUrl = `${baseUrl}/a/${slug}`;

    return {
      success: true,
      slug,
      shareUrl,
      photoUrl: doorwayPhotoUrl,
      userId: ownerId,
      expiresAt,
      isEphemeral: Boolean(expiresAt),
    };
  } catch (error: unknown) {
    console.error('[createAddress] Action error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while saving the address. Please try again.',
    };
  }
}
