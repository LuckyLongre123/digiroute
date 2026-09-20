import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';
import fs from 'node:fs/promises';
import path from 'node:path';
import { updateAddressPhotoInDb, type AddressPayload } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCAL_STORAGE_FILE = path.join(process.cwd(), 'src', 'data', 'addresses.json');

/**
 * POST /api/admin/sync-media
 * Verifies all doorway photo URLs against Cloudinary CDN.
 * If any image returns a 404 or fails to load, cleans the dead photo reference
 * from the database and local cache so the admin graph and app stay in sync.
 */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let addresses: AddressPayload[] = [];

  // Fetch addresses from DB
  try {
    const dbAddresses = await db.orm.public.Address.where({}).all();
    addresses = (dbAddresses || []).map((a: AddressPayload) => ({
      id: a.id,
      slug: a.slug,
      digipin: a.digipin,
      baseLat: a.baseLat,
      baseLng: a.baseLng,
      entranceLat: a.entranceLat,
      entranceLng: a.entranceLng,
      floor: a.floor,
      flat: a.flat,
      landmark: a.landmark,
      label: a.label,
      routingNotes: a.routingNotes,
      doorwayPhotoUrl: a.doorwayPhotoUrl,
      isEphemeral: a.isEphemeral,
      expiresAt: a.expiresAt,
      userId: a.userId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  } catch (err) {
    console.warn('[sync-media] Falling back to local file:', err);
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      addresses = JSON.parse(content) as AddressPayload[];
    } catch {
      addresses = [];
    }
  }

  // Filter only records that have a doorwayPhotoUrl
  const withMedia = addresses.filter(
    (a) => a.doorwayPhotoUrl && typeof a.doorwayPhotoUrl === 'string' && a.doorwayPhotoUrl.trim().length > 0
  );

  const cleanedSlugs: string[] = [];
  let verifiedOk = 0;

  for (const item of withMedia) {
    const photoUrl = item.doorwayPhotoUrl!.trim();
    let isAlive = false;

    // Only verify HTTP/HTTPS URLs (ignore data: or local placeholders)
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      try {
        const checkRes = await fetch(photoUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3500),
        });

        if (checkRes.ok || checkRes.status === 304) {
          isAlive = true;
        } else if (checkRes.status === 404 || checkRes.status === 410) {
          isAlive = false;
        } else {
          // If HEAD is blocked or method not allowed, try a minimal GET range
          const getRes = await fetch(photoUrl, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            signal: AbortSignal.timeout(3500),
          });
          isAlive = getRes.ok || getRes.status === 206 || getRes.status === 304;
        }
      } catch (checkErr) {
        console.warn(`[sync-media] Verification failed for ${item.slug}:`, checkErr);
        // Timeout or network failure — don't delete immediately unless 404 confirmed
        isAlive = true;
      }
    } else {
      isAlive = true;
    }

    if (isAlive) {
      verifiedOk++;
    } else {
      // Photo 404ed on CDN: clean from database and memory cache
      console.log(`[sync-media] Cleaning broken photo for address: ${item.slug} (${photoUrl})`);
      await updateAddressPhotoInDb(item.slug, null);
      cleanedSlugs.push(item.slug);
    }
  }

  return NextResponse.json({
    success: true,
    totalWithMedia: withMedia.length,
    verifiedOk,
    cleanedCount: cleanedSlugs.length,
    cleanedSlugs,
  });
}
