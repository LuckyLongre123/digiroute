import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AddressPayload } from '@/lib/prisma';

const LOCAL_STORAGE_FILE = path.join(
  process.cwd(),
  'src',
  'data',
  'addresses.json'
);

/**
 * PATCH /api/admin/update-address
 * Body: { slug: string, updates: Partial<AddressFields> }
 * Updates editable address fields.
 */
export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, updates } = body;

    if (!slug || !updates) {
      return NextResponse.json(
        { error: 'slug and updates are required.' },
        { status: 400 }
      );
    }

    const allowedFields = [
      'label',
      'floor',
      'flat',
      'landmark',
      'routingNotes',
    ];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        sanitized[key] = updates[key] ?? null;
      }
    }

    // Handle expiresAt and isEphemeral
    if ('expiresAt' in updates) {
      if (
        !updates.expiresAt ||
        updates.expiresAt === 'never' ||
        updates.expiresAt === 'null'
      ) {
        sanitized.expiresAt = null;
        sanitized.isEphemeral = false;
      } else {
        const d = new Date(updates.expiresAt);
        if (!isNaN(d.getTime())) {
          sanitized.expiresAt = d.toISOString();
          sanitized.isEphemeral = true;
        }
      }
    }

    // Update in DB
    try {
      await db.orm.public.Address.where({ slug }).update(sanitized);
    } catch (err) {
      console.warn('[Admin Update Address] DB update failed:', err);
    }

    // Update in local file
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      const list = JSON.parse(content) as AddressPayload[];
      const idx = list.findIndex((a) => a.slug === slug);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...sanitized };
        await fs.writeFile(
          LOCAL_STORAGE_FILE,
          JSON.stringify(list, null, 2),
          'utf-8'
        );
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin Update Address] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
