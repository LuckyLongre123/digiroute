import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/prisma/db';
import { ContactMessageRecord, formatToIST } from './contact-types';

export type { ContactMessageRecord };
export { formatToIST };

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'src', 'data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'contact-messages.json');

/**
 * Ensure local fallback storage file exists
 */
async function ensureLocalStorage(): Promise<ContactMessageRecord[]> {
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
  } catch {
    return [];
  }
}

/**
 * Save new contact message to Prisma DB and local fallback mirror
 */
export async function saveContactMessage(input: {
  name: string;
  email: string;
  category: string;
  message: string;
}): Promise<ContactMessageRecord> {
  const record: ContactMessageRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    category: input.category.trim(),
    message: input.message.trim(),
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };

  // 1. Attempt Prisma Neon DB persistence
  try {
    await (db as any).contactMessage.create({
      data: {
        id: record.id,
        name: record.name,
        email: record.email,
        category: record.category,
        message: record.message,
        status: record.status,
        createdAt: record.createdAt,
      },
    });
  } catch (dbErr) {
    console.warn('[Contact] Prisma write failed, using local mirror:', dbErr);
  }

  // 2. Mirror non-blocking to local JSON fallback
  try {
    const existing = await ensureLocalStorage();
    const updated = [record, ...existing.filter((m) => m.id !== record.id)];
    await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (fileErr) {
    console.error('[Contact] Failed mirroring to local storage:', fileErr);
  }

  return record;
}

/**
 * Retrieve all contact messages from DB or fallback
 */
export async function getAllContactMessages(): Promise<ContactMessageRecord[]> {
  const fileRecords = await ensureLocalStorage();
  const memoryMap = new Map<string, ContactMessageRecord>();

  for (const r of fileRecords) {
    memoryMap.set(r.id, r);
  }

  try {
    const dbRecords = await (db as any).contactMessage.findMany();
    if (Array.isArray(dbRecords)) {
      for (const item of dbRecords) {
        memoryMap.set(item.id, {
          id: item.id,
          name: item.name,
          email: item.email,
          category: item.category,
          message: item.message,
          status: item.status as 'NEW' | 'REVIEWED' | 'RESOLVED',
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString(),
        });
      }
    }
  } catch (dbErr) {
    console.warn('[Contact] Prisma read failed, serving from local mirror:', dbErr);
  }

  const list = Array.from(memoryMap.values());
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

/**
 * Update message status ('NEW' | 'REVIEWED' | 'RESOLVED')
 */
export async function updateContactMessageStatus(
  id: string,
  status: 'NEW' | 'REVIEWED' | 'RESOLVED'
): Promise<boolean> {
  let updatedAny = false;

  // 1. Update in Prisma
  try {
    await (db as any).contactMessage.update({
      where: { id },
      data: { status },
    });
    updatedAny = true;
  } catch (dbErr) {
    console.warn('[Contact] Prisma status update failed, updating local mirror:', dbErr);
  }

  // 2. Update in local JSON mirror
  try {
    const existing = await ensureLocalStorage();
    const target = existing.find((m) => m.id === id);
    if (target) {
      target.status = status;
      await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(existing, null, 2), 'utf-8');
      updatedAny = true;
    }
  } catch (fileErr) {
    console.error('[Contact] Failed updating local storage status:', fileErr);
  }

  return updatedAny;
}

/**
 * Delete a contact message
 */
export async function deleteContactMessage(id: string): Promise<boolean> {
  let deletedAny = false;

  // 1. Delete in Prisma
  try {
    await (db as any).contactMessage.delete({
      where: { id },
    });
    deletedAny = true;
  } catch (dbErr) {
    console.warn('[Contact] Prisma delete failed, removing from local mirror:', dbErr);
  }

  // 2. Delete from local JSON mirror
  try {
    const existing = await ensureLocalStorage();
    const filtered = existing.filter((m) => m.id !== id);
    if (filtered.length !== existing.length) {
      await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      deletedAny = true;
    }
  } catch (fileErr) {
    console.error('[Contact] Failed deleting from local storage:', fileErr);
  }

  return deletedAny;
}
