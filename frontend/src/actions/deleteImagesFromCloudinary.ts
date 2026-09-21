'use server';

import { getAdminSession } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';

export interface DeleteImagesResult {
  success: boolean;
  deletedCount: number;
  error?: string;
}

/**
 * Permanently deletes an individual image from Cloudinary using the authenticated destroy endpoint.
 */
async function destroySingleCloudinaryImage(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  publicId: string
): Promise<boolean> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      }
    );

    if (!res.ok) return false;
    const json = await res.json().catch(() => ({}));
    return json?.result === 'ok' || json?.result === 'not found';
  } catch (err) {
    console.warn(`[Cloudinary Destroy] Failed for ${publicId}:`, err);
    return false;
  }
}

/**
 * Server Action: Permanently deletes one or more images from Cloudinary storage.
 *
 * 1. Verifies admin session.
 * 2. Attempts batch deletion via Cloudinary Admin API.
 * 3. Falls back to individual signed destroy requests for resilience.
 * 4. Calls revalidatePath on the admin trash route.
 */
export async function deleteImagesFromCloudinary(
  publicIds: string[]
): Promise<DeleteImagesResult> {
  // 1. Verify Admin Session
  const session = await getAdminSession();
  if (!session) {
    return {
      success: false,
      deletedCount: 0,
      error: 'Unauthorized: Admin privileges required.',
    };
  }

  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return {
      success: false,
      deletedCount: 0,
      error: 'No image public IDs provided for deletion.',
    };
  }

  // 2. Validate Credentials
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      deletedCount: 0,
      error:
        'Cloudinary Admin credentials missing (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).',
    };
  }

  let totalDeleted = 0;
  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

  // Process in batches of up to 100 (Cloudinary Admin API limit)
  const batchSize = 100;
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);

    // Try Cloudinary Admin API bulk delete endpoint first
    try {
      const params = new URLSearchParams();
      for (const id of batch) {
        params.append('public_ids[]', id);
      }

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params.toString()}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: authHeader,
          },
          cache: 'no-store',
        }
      );

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const deletedObj = data.deleted || {};
        const deletedInBatch = Object.values(deletedObj).filter(
          (status) => status === 'deleted' || status === 'not_found'
        ).length;

        totalDeleted += deletedInBatch > 0 ? deletedInBatch : batch.length;
      } else {
        // If Admin API bulk delete returned an error, fallback to individual signed destroy
        for (const id of batch) {
          const ok = await destroySingleCloudinaryImage(
            cloudName,
            apiKey,
            apiSecret,
            id
          );
          if (ok) totalDeleted++;
        }
      }
    } catch {
      // Fallback on network or endpoint issue
      for (const id of batch) {
        const ok = await destroySingleCloudinaryImage(
          cloudName,
          apiKey,
          apiSecret,
          id
        );
        if (ok) totalDeleted++;
      }
    }
  }

  // Revalidate Admin Trash page
  try {
    revalidatePath('/admin/images/trash');
  } catch {
    // Ignore outside request cycle
  }

  return {
    success: true,
    deletedCount: totalDeleted,
  };
}
