import { getAdminSession } from '@/lib/adminAuth';
import type { AddressPayload } from '@/lib/prisma';
import { db } from '@/prisma/db';
import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOCAL_STORAGE_FILE = path.join(process.cwd(), 'src', 'data', 'addresses.json');

async function deleteFromCloudinary(photoUrl: string): Promise<void> {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) return;
    if (!photoUrl.includes('cloudinary.com')) return;

    // Extract public_id from Cloudinary URL
    const urlParts = photoUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return;
    // Skip the version segment if present (v1234567890)
    let publicIdParts = urlParts.slice(uploadIndex + 1);
    if (publicIdParts[0]?.startsWith('v') && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }
    const publicIdWithExt = publicIdParts.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // strip extension

    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = await import('node:crypto');
    const signStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    console.log('[Cloudinary Delete]', result);
  } catch (err) {
    console.warn('[Cloudinary Delete] Failed:', err);
  }
}

/**
 * DELETE /api/admin/delete-address
 * Body: { slug: string, deletePhotoOnly?: boolean }
 * Deletes an address (or just its photo) from DB + local file + Cloudinary.
 */
export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, deletePhotoOnly } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug is required.' }, { status: 400 });
    }

    let photoUrl: string | null = null;

    if (deletePhotoOnly) {
      // Only remove the photo URL from the record, don't delete the address
      try {
        // Get address first to find the photo URL
        const existing = await db.orm.public.Address.where({ slug }).first();
        if (existing) {
          photoUrl = existing.doorwayPhotoUrl || null;
          await db.orm.public.Address.where({ slug }).update({ doorwayPhotoUrl: null });
        }
      } catch {
        // DB offline, update local file
        try {
          const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
          const list = JSON.parse(content) as AddressPayload[];
          const idx = list.findIndex((a) => a.slug === slug);
          if (idx !== -1) {
            photoUrl = list[idx].doorwayPhotoUrl || null;
            list[idx] = { ...list[idx], doorwayPhotoUrl: null };
            await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
          }
        } catch {
          // ignore
        }
      }
    } else {
      // Full address delete
      try {
        const existing = await db.orm.public.Address.where({ slug }).first();
        if (existing) {
          photoUrl = existing.doorwayPhotoUrl || null;
          await db.orm.public.Address.where({ slug }).delete();
        }
      } catch {
        // DB offline, delete from local file
        try {
          const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
          const list = JSON.parse(content) as AddressPayload[];
          const idx = list.findIndex((a) => a.slug === slug);
          if (idx !== -1) {
            photoUrl = list[idx].doorwayPhotoUrl || null;
            list.splice(idx, 1);
            await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
          }
        } catch {
          // ignore
        }
      }

      // Also update local file if DB succeeded
      try {
        const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
        const list = JSON.parse(content) as AddressPayload[];
        const filtered = list.filter((a) => a.slug !== slug);
        await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      } catch {
        // ignore
      }
    }

    // Delete from Cloudinary if URL exists
    if (photoUrl) {
      await deleteFromCloudinary(photoUrl);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin Delete Address] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
