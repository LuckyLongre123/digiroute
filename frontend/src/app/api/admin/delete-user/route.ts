import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AddressPayload } from '@/lib/prisma';

const LOCAL_STORAGE_FILE = path.join(process.cwd(), 'src', 'data', 'addresses.json');

/**
 * DELETE /api/admin/delete-user
 * Body: { userId: string }
 * Deletes the user and all their addresses from DB + local file.
 */
export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    // Delete all addresses belonging to this user first
    try {
      await db.orm.public.Address.where({ userId }).delete();
    } catch (err) {
      console.warn('[Admin Delete User] Could not delete addresses from DB:', err);
    }

    // Delete the user
    try {
      await db.orm.public.User.where({ id: userId }).delete();
    } catch (err) {
      console.warn('[Admin Delete User] Could not delete user from DB:', err);
    }

    // Clean up local file
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      const list = JSON.parse(content) as AddressPayload[];
      const filtered = list.filter((a) => a.userId !== userId);
      await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin Delete User] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
