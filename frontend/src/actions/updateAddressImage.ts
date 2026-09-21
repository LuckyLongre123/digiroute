'use server';

import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';
import type { AddressPayload } from '@/lib/prisma';
import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';

const LOCAL_STORAGE_FILE = path.join(
  process.cwd(),
  'src',
  'data',
  'addresses.json'
);

export interface UpdateAddressImageParams {
  slug: string;
  newPhotoUrl: string;
}

export interface UpdateAddressImageResult {
  success: boolean;
  photoUrl?: string;
  error?: string;
}

/**
 * Server Action: updateAddressImage
 *
 * 1. Verifies the caller is an authorized admin.
 * 2. Updates the Address record's doorwayPhotoUrl in the Prisma database.
 * 3. Updates the local filesystem fallback cache.
 * 4. Calls revalidatePath to refresh the Admin Overview, Media Gallery, and recipient views.
 */
export async function updateAddressImage({
  slug,
  newPhotoUrl,
}: UpdateAddressImageParams): Promise<UpdateAddressImageResult> {
  // 1. Verify Admin Session
  const session = await getAdminSession();
  if (!session) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required.',
    };
  }

  if (!slug || !newPhotoUrl) {
    return {
      success: false,
      error: 'Address slug and new photo URL are required.',
    };
  }

  const trimmedUrl = newPhotoUrl.trim();

  // 2. Update in Prisma Database
  try {
    await db.orm.public.Address.where({ slug }).update({
      doorwayPhotoUrl: trimmedUrl,
    });
  } catch (err) {
    console.warn(
      '[updateAddressImage] DB update failed, checking local file fallback:',
      err
    );
  }

  // 3. Update in Local Storage File (resilience fallback)
  try {
    const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
    const list = JSON.parse(content) as AddressPayload[];
    const idx = list.findIndex((a) => a.slug === slug);
    if (idx !== -1) {
      list[idx].doorwayPhotoUrl = trimmedUrl;
      list[idx].updatedAt = new Date().toISOString();
      await fs.writeFile(
        LOCAL_STORAGE_FILE,
        JSON.stringify(list, null, 2),
        'utf-8'
      );
    }
  } catch (fsErr) {
    console.warn('[updateAddressImage] Local storage update warning:', fsErr);
  }

  // 4. Revalidate cache
  try {
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin/overview');
    revalidatePath('/admin/images');
    revalidatePath(`/a/${slug}`);
  } catch {
    // Ignore outside request cycle
  }

  return {
    success: true,
    photoUrl: trimmedUrl,
  };
}
