import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/prisma/db';

export interface AddressPayload {
  id?: string;
  slug: string;
  digipin: string;
  baseLat: number;
  baseLng: number;
  entranceLat: number;
  entranceLng: number;
  floor?: string | null;
  flat?: string | null;
  landmark?: string | null;
  label?: string | null;
  routingNotes?: string | null;
  doorwayPhotoUrl?: string | null;
  passcode?: string | null;
  isEphemeral?: boolean;
  expiresAt?: string | null;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'src', 'data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'addresses.json');

// In-memory cache for ultra-fast lookups and local resilience
const addressMemoryCache = new Map<string, AddressPayload>();

/**
 * Initialize local filesystem fallback storage
 */
async function ensureLocalStorage(): Promise<void> {
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      const list: AddressPayload[] = JSON.parse(content);
      for (const item of list) {
        addressMemoryCache.set(item.slug, item);
      }
    } catch {
      await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[Storage] Local storage initialization warning:', err);
  }
}

// Initial hydration of memory cache
ensureLocalStorage().catch(() => {});

/**
 * Save address with Prisma 8 ORM and fallback to local storage
 */
export async function saveAddress(payload: AddressPayload): Promise<AddressPayload> {
  const now = new Date().toISOString();
  const ownerId = payload.userId ?? null;
  const isGuest = !ownerId;

  const addressRecord: AddressPayload = {
    ...payload,
    floor: payload.floor || null,
    flat: payload.flat || null,
    landmark: payload.landmark || null,
    label: payload.label || null,
    routingNotes: payload.routingNotes || null,
    doorwayPhotoUrl: payload.doorwayPhotoUrl || null,
    passcode: payload.passcode || null,
    isEphemeral: isGuest ? true : (payload.isEphemeral ?? false),
    expiresAt: payload.expiresAt || null,
    userId: ownerId,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  };

  // Always update in-memory cache
  addressMemoryCache.set(addressRecord.slug, addressRecord);

  // Attempt database persistence via Prisma 8
  try {
    const created = await db.orm.public.Address.create({
      slug: addressRecord.slug,
      digipin: addressRecord.digipin,
      baseLat: addressRecord.baseLat,
      baseLng: addressRecord.baseLng,
      entranceLat: addressRecord.entranceLat,
      entranceLng: addressRecord.entranceLng,
      floor: addressRecord.floor,
      flat: addressRecord.flat,
      landmark: addressRecord.landmark,
      label: addressRecord.label,
      routingNotes: addressRecord.routingNotes,
      doorwayPhotoUrl: addressRecord.doorwayPhotoUrl,
      passcode: addressRecord.passcode,
      isEphemeral: isGuest ? true : (addressRecord.isEphemeral ?? false),
      expiresAt: addressRecord.expiresAt,
      userId: ownerId,
    });

    if (created) {
      console.log(`[Prisma 8] Address ${addressRecord.slug} saved to PostgreSQL.`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[Prisma 8] Database connection unavailable (${message}). Falling back to local file persistence.`
    );
  }

  // File-based fallback persistence
  try {
    await ensureLocalStorage();
    const currentList = Array.from(addressMemoryCache.values());
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Storage] Error writing address to local file:', fileErr);
  }

  return addressRecord;
}

/**
 * Retrieve address by public slug
 */
export async function getAddressBySlug(slug: string): Promise<AddressPayload | null> {
  // 1. Try Prisma 8 database first
  try {
    let record = await db.orm.public.Address.where({ slug }).first();
    if (!record) {
      record = await db.orm.public.Address.where({ id: slug }).first();
    }
    if (record) {
      return {
        id: record.id,
        slug: record.slug,
        digipin: record.digipin,
        baseLat: record.baseLat,
        baseLng: record.baseLng,
        entranceLat: record.entranceLat,
        entranceLng: record.entranceLng,
        floor: record.floor,
        flat: record.flat,
        landmark: record.landmark,
        label: record.label,
        routingNotes: record.routingNotes,
        doorwayPhotoUrl: record.doorwayPhotoUrl,
        passcode: record.passcode,
        isEphemeral: record.isEphemeral,
        expiresAt: record.expiresAt,
        userId: record.userId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    }
  } catch {
    // Database offline or query error, fall through to cache/file
  }

  // 2. Check in-memory cache
  if (addressMemoryCache.has(slug)) {
    return addressMemoryCache.get(slug)!;
  }
  for (const item of addressMemoryCache.values()) {
    if (item.id === slug) return item;
  }

  // 3. Check local file
  try {
    await ensureLocalStorage();
    const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
    const list: AddressPayload[] = JSON.parse(content);
    const found = list.find((item) => item.slug === slug || item.id === slug);
    if (found) {
      addressMemoryCache.set(found.slug, found);
      return found;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Retrieve all addresses belonging strictly to a specific authenticated user.
 * Strictly isolates addresses so no user can see global or other users' addresses.
 */
export async function getUserAddresses(userId: string): Promise<AddressPayload[]> {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return [];
  }

  // 1. Try Prisma 8 Neon PostgreSQL first (ordered newest first)
  try {
    const records = await db.orm.public.Address.where({ userId }).orderBy((a) => a.createdAt.desc()).all();
    if (records && records.length > 0) {
      return records.map((record) => ({
        id: record.id,
        slug: record.slug,
        digipin: record.digipin,
        baseLat: record.baseLat,
        baseLng: record.baseLng,
        entranceLat: record.entranceLat,
        entranceLng: record.entranceLng,
        floor: record.floor,
        flat: record.flat,
        landmark: record.landmark,
        label: record.label,
        routingNotes: record.routingNotes,
        doorwayPhotoUrl: record.doorwayPhotoUrl,
        passcode: record.passcode,
        isEphemeral: record.isEphemeral,
        expiresAt: record.expiresAt,
        userId: record.userId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));
    }
  } catch (dbErr) {
    console.warn('[Prisma 8] Failed to query user addresses from DB, checking local storage:', dbErr);
  }

  // 2. Check local storage fallback strictly filtered by userId and sorted newest first
  try {
    await ensureLocalStorage();
    const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
    const list: AddressPayload[] = JSON.parse(content);
    return list
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch {
    return [];
  }
}

/**
 * Update an address owned strictly by a specific user.
 */
export async function updateUserAddress(
  userId: string,
  slugOrId: string,
  updates: Partial<Pick<AddressPayload, 'label' | 'floor' | 'flat' | 'landmark' | 'routingNotes' | 'expiresAt'>>
): Promise<AddressPayload | null> {
  const existing = await getAddressBySlug(slugOrId);
  // Strict Owner Authorization: Must exist and strictly belong to the requesting user
  if (!existing || !userId || existing.userId !== userId) {
    return null;
  }

  const isEphemeral =
    updates.expiresAt !== undefined ? Boolean(updates.expiresAt) : existing.isEphemeral;

  const updated: AddressPayload = {
    ...existing,
    ...updates,
    isEphemeral,
    updatedAt: new Date().toISOString(),
  };

  addressMemoryCache.set(updated.slug, updated);

  try {
    const dbUpdates: Record<string, unknown> = {
      label: updated.label,
      floor: updated.floor,
      flat: updated.flat,
      landmark: updated.landmark,
      routingNotes: updated.routingNotes,
    };
    if (updates.expiresAt !== undefined) {
      dbUpdates.expiresAt = updated.expiresAt;
      dbUpdates.isEphemeral = isEphemeral;
    }
    await db.orm.public.Address.where({ slug: updated.slug }).update(dbUpdates);
  } catch (dbErr) {
    console.warn('[Prisma 8] Failed to update address in PostgreSQL:', dbErr);
  }

  try {
    await ensureLocalStorage();
    const currentList = Array.from(addressMemoryCache.values());
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Storage] Error writing updated address to local file:', fileErr);
  }

  return updated;
}

/**
 * Update doorway photo URL for an address.
 */
export async function updateAddressPhotoInDb(
  slugOrId: string,
  doorwayPhotoUrl: string | null,
  userId?: string
): Promise<AddressPayload | null> {
  const existing = await getAddressBySlug(slugOrId);
  if (!existing) return null;
  // Strict Owner Authorization: If userId is provided or address is owned, verify exact ownership
  if (userId && (!existing.userId || existing.userId !== userId)) return null;

  const updated: AddressPayload = {
    ...existing,
    doorwayPhotoUrl,
    updatedAt: new Date().toISOString(),
  };

  addressMemoryCache.set(updated.slug, updated);

  try {
    await db.orm.public.Address.where({ slug: updated.slug }).update({
      doorwayPhotoUrl,
    });
  } catch (dbErr) {
    console.warn('[Prisma 8] Failed to update doorway photo in PostgreSQL:', dbErr);
  }

  try {
    await ensureLocalStorage();
    const currentList = Array.from(addressMemoryCache.values());
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Storage] Error writing doorway photo to local file:', fileErr);
  }

  return updated;
}

/**
 * Delete an address owned strictly by a specific user.
 */
export async function deleteUserAddress(userId: string, slugOrId: string): Promise<boolean> {
  const existing = await getAddressBySlug(slugOrId);
  if (!existing || existing.userId !== userId) {
    return false;
  }

  addressMemoryCache.delete(existing.slug);

  try {
    await db.orm.public.Address.where({ slug: existing.slug }).delete();
  } catch (dbErr) {
    console.warn('[Prisma 8] Failed to delete address from PostgreSQL:', dbErr);
  }

  try {
    await ensureLocalStorage();
    const currentList = Array.from(addressMemoryCache.values());
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Storage] Error removing address from local file:', fileErr);
  }

  return true;
}

/**
 * Claim an ephemeral address for an authenticated user.
 * Persists the userId binding to Prisma 8 Neon PostgreSQL, in-memory cache, and local file storage.
 */
export async function claimAddressForUser(slugOrId: string, userId: string): Promise<AddressPayload | null> {
  const existing = await getAddressBySlug(slugOrId);
  if (!existing) return null;

  // Strict constraint: Address must be unclaimed (userId IS NULL) or already belong to this user
  if (existing.userId && existing.userId !== userId) {
    console.warn(`[claimAddressForUser] Address ${existing.slug} is already claimed by user ${existing.userId}`);
    return null;
  }

  const claimed: AddressPayload = {
    ...existing,
    userId,
    isEphemeral: existing.isEphemeral,
    expiresAt: existing.expiresAt,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory cache
  addressMemoryCache.set(claimed.slug, claimed);

  // 2. Persist update to PostgreSQL via Prisma 8 (strictly only update userId, preserving expiresAt)
  try {
    const updated = await db.orm.public.Address.where({ slug: claimed.slug }).update({
      userId,
    });
    if (updated) {
      console.log(`[Prisma 8] Address ${claimed.slug} claimed and attached to user ${userId} in PostgreSQL.`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Prisma 8] Database update error for claimed address (${message}). Retaining file & cache state.`);
  }

  // 3. Persist update to local file storage
  try {
    await ensureLocalStorage();
    const currentList = Array.from(addressMemoryCache.values());
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Storage] Error writing claimed address to local file:', fileErr);
  }

  return claimed;
}

/**
 * Update expiration time and ephemeral status for an address.
 */
export async function updateAddressExpiryInDb(
  slugOrId: string,
  expiresAt: string | null,
  isEphemeral: boolean
): Promise<AddressPayload | null> {
  const existing = await getAddressBySlug(slugOrId);
  if (!existing) return null;

  const updated: AddressPayload = {
    ...existing,
    expiresAt,
    isEphemeral,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory cache
  addressMemoryCache.set(updated.slug, updated);

  // 2. Persist update to PostgreSQL via Prisma 8
  try {
    await db.orm.public.Address.where({ slug: updated.slug }).update({
      expiresAt,
      isEphemeral,
    });
    console.log(`[Prisma 8] Address ${updated.slug} expiry updated: expiresAt=${expiresAt}, isEphemeral=${isEphemeral}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Prisma 8] Database update error for address expiry (${message}). Retaining file & cache state.`);
  }

  // 3. Persist update to local file storage
  try {
    await ensureLocalStorage();
    const currentList = Array.from(addressMemoryCache.values());
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Storage] Error writing address expiry to local file:', fileErr);
  }

  return updated;
}

export { db };

