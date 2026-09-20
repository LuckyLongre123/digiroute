import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AddressPayload } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCAL_STORAGE_FILE = path.join(
  process.cwd(),
  'src',
  'data',
  'addresses.json'
);

interface DbUserRecord {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  createdAt: string | Date;
}

interface DbAddressRecord {
  id: string;
  slug: string;
  digipin: string;
  baseLat: number;
  baseLng: number;
  entranceLat?: number | null;
  entranceLng?: number | null;
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  label?: string | null;
  routingNotes?: string | null;
  doorwayPhotoUrl?: string | null;
  isEphemeral?: boolean;
  expiresAt?: string | Date | null;
  userId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * GET /api/admin/data
 * Returns all users and all addresses for the admin graph view.
 * Requires valid admin_token cookie.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let users: DbUserRecord[] = [];
  let addresses: AddressPayload[] = [];

  // Fetch users from DB (ordered newest first)
  try {
    const dbUsers = await db.orm.public.User.where({})
      .orderBy((u) => u.createdAt.desc())
      .all();
    users = (dbUsers || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      createdAt: u.createdAt,
    }));
  } catch (err) {
    console.warn('[Admin Data] Could not fetch users from DB:', err);
  }

  // Fetch addresses from DB (ordered newest first)
  try {
    const dbAddresses = await db.orm.public.Address.where({})
      .orderBy((a) => a.createdAt.desc())
      .all();
    addresses = (dbAddresses || []).map((a) => ({
      id: a.id,
      slug: a.slug,
      digipin: a.digipin,
      baseLat: a.baseLat,
      baseLng: a.baseLng,
      entranceLat: a.entranceLat ?? a.baseLat,
      entranceLng: a.entranceLng ?? a.baseLng,
      floor: a.floor,
      flat: a.flat,
      landmark: a.landmark,
      label: a.label,
      routingNotes: a.routingNotes,
      doorwayPhotoUrl: a.doorwayPhotoUrl,
      isEphemeral: a.isEphemeral,
      expiresAt: a.expiresAt ? String(a.expiresAt) : null,
      userId: a.userId,
      createdAt: a.createdAt ? String(a.createdAt) : undefined,
      updatedAt: a.updatedAt ? String(a.updatedAt) : undefined,
    }));
  } catch (err) {
    console.warn(
      '[Admin Data] Could not fetch addresses from DB, falling back to local file:',
      err
    );
    // Fallback to local file
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(content) as AddressPayload[];
      addresses = parsed.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    } catch {
      addresses = [];
    }
  }

  return NextResponse.json({ users, addresses });
}
