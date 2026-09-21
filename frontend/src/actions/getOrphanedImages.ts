'use server';

import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';
import type { AddressPayload } from '@/lib/prisma';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOCAL_STORAGE_FILE = path.join(
  process.cwd(),
  'src',
  'data',
  'addresses.json'
);

export interface OrphanedImage {
  public_id: string;
  secure_url: string;
  format?: string;
  bytes?: number;
  created_at?: string;
  width?: number;
  height?: number;
}

export interface GetOrphanedImagesResult {
  success: boolean;
  orphanedImages: OrphanedImage[];
  totalCloudinaryImages: number;
  totalDbImages: number;
  error?: string;
}

interface CloudinaryAdminResource {
  public_id: string;
  format?: string;
  version?: number;
  resource_type?: string;
  type?: string;
  created_at?: string;
  bytes?: number;
  width?: number;
  height?: number;
  url?: string;
  secure_url?: string;
}

interface CloudinaryAdminResponse {
  resources?: CloudinaryAdminResource[];
  next_cursor?: string;
  error?: {
    message?: string;
  };
}

import { extractCloudinaryPublicId } from '@/lib/cloudinary';

/**
 * Milestone 1: Backend Reconciliation Logic (Find the Trash)
 *
 * 1. Fetches all active image resources from Cloudinary (with optional folder/prefix filter).
 * 2. Fetches all valid image URLs currently linked to Address records in Prisma/local storage.
 * 3. Cross-references the two lists. Any Cloudinary image NOT active in DB is classified as "Trash".
 * 4. Returns the array of orphaned image objects.
 */
export async function getOrphanedImages(): Promise<GetOrphanedImagesResult> {
  // 1. Verify Admin Session
  const session = await getAdminSession();
  if (!session) {
    return {
      success: false,
      orphanedImages: [],
      totalCloudinaryImages: 0,
      totalDbImages: 0,
      error: 'Unauthorized: Admin privileges required.',
    };
  }

  // 2. Validate Cloudinary Configuration
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder =
    process.env.CLOUDINARY_DOORWAY_FOLDER ||
    process.env.CLOUDINARY_FOLDER ||
    '';

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      orphanedImages: [],
      totalCloudinaryImages: 0,
      totalDbImages: 0,
      error:
        'Cloudinary Admin API credentials missing (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).',
    };
  }

  // 3. Fetch Active Address Records from Database (with local file fallback)
  const activeDbUrls = new Set<string>();
  const activeDbPublicIds = new Set<string>();

  try {
    let addresses: AddressPayload[] = [];
    try {
      const dbAddresses = await db.orm.public.Address.where({}).all();
      addresses = (dbAddresses || []).map((a: AddressPayload) => ({
        slug: a.slug,
        doorwayPhotoUrl: a.doorwayPhotoUrl,
      })) as AddressPayload[];
    } catch (dbErr) {
      console.warn(
        '[getOrphanedImages] DB offline, reading local fallback file:',
        dbErr
      );
      try {
        const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
        addresses = JSON.parse(content) as AddressPayload[];
      } catch {
        addresses = [];
      }
    }

    for (const addr of addresses) {
      if (
        addr.doorwayPhotoUrl &&
        typeof addr.doorwayPhotoUrl === 'string' &&
        addr.doorwayPhotoUrl.trim().length > 0
      ) {
        const trimmedUrl = addr.doorwayPhotoUrl.trim();
        activeDbUrls.add(trimmedUrl);

        const extractedId = extractCloudinaryPublicId(trimmedUrl);
        if (extractedId) {
          activeDbPublicIds.add(extractedId);
        }
      }
    }
  } catch (err) {
    console.error('[getOrphanedImages] Error loading database addresses:', err);
    return {
      success: false,
      orphanedImages: [],
      totalCloudinaryImages: 0,
      totalDbImages: 0,
      error: 'Failed to retrieve active addresses from database.',
    };
  }

  // 4. Fetch All Images from Cloudinary Admin API
  const cloudinaryResources: CloudinaryAdminResource[] = [];
  let nextCursor: string | undefined = undefined;
  const maxIterations = 5; // Guard against infinite pagination; handles up to 2500 images
  let iteration = 0;

  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

  try {
    do {
      iteration++;
      const params = new URLSearchParams({
        max_results: '500',
        type: 'upload',
      });

      if (folder.trim().length > 0) {
        params.set('prefix', folder.trim());
      }

      if (nextCursor) {
        params.set('next_cursor', nextCursor);
      }

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params.toString()}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errJson: CloudinaryAdminResponse = await res
          .json()
          .catch(() => ({}));
        const errMsg =
          errJson.error?.message ||
          `Cloudinary Admin API responded with HTTP ${res.status}: ${res.statusText}`;
        console.error('[getOrphanedImages] Cloudinary API error:', errMsg);
        return {
          success: false,
          orphanedImages: [],
          totalCloudinaryImages: cloudinaryResources.length,
          totalDbImages: activeDbUrls.size,
          error: errMsg,
        };
      }

      const data: CloudinaryAdminResponse = await res.json();
      if (Array.isArray(data.resources)) {
        cloudinaryResources.push(...data.resources);
      }

      nextCursor = data.next_cursor;
    } while (nextCursor && iteration < maxIterations);
  } catch (err: unknown) {
    console.error(
      '[getOrphanedImages] Network error contacting Cloudinary:',
      err
    );
    return {
      success: false,
      orphanedImages: [],
      totalCloudinaryImages: 0,
      totalDbImages: activeDbUrls.size,
      error:
        err instanceof Error
          ? err.message
          : 'Network error while contacting Cloudinary Admin API.',
    };
  }

  // 5. Cross-Reference: Filter out assets present in DB, classify rest as "Trash"
  const orphaned: OrphanedImage[] = [];

  for (const item of cloudinaryResources) {
    const pubId = item.public_id;
    const secUrl = item.secure_url || item.url || '';

    // Check if matched by public_id
    const matchesPublicId = activeDbPublicIds.has(pubId);

    // Check if matched by full secure URL or standard URL
    const matchesUrl =
      (secUrl && activeDbUrls.has(secUrl)) ||
      (item.url && activeDbUrls.has(item.url));

    // Check if any active URL ends with or contains this public_id
    let matchesSubstring = false;
    if (!matchesPublicId && !matchesUrl) {
      for (const dbUrl of activeDbUrls) {
        if (dbUrl.includes(pubId)) {
          matchesSubstring = true;
          break;
        }
      }
    }

    // If NOT found in DB addresses, it is orphaned trash!
    if (!matchesPublicId && !matchesUrl && !matchesSubstring) {
      orphaned.push({
        public_id: pubId,
        secure_url: secUrl,
        format: item.format,
        bytes: item.bytes,
        created_at: item.created_at,
        width: item.width,
        height: item.height,
      });
    }
  }

  return {
    success: true,
    orphanedImages: orphaned,
    totalCloudinaryImages: cloudinaryResources.length,
    totalDbImages: activeDbUrls.size,
  };
}
