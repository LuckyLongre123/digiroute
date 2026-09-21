import fs from 'node:fs/promises';
import path from 'node:path';
import { hashAdminPassword } from './adminAuth';

const ADMIN_DIR = path.join(process.cwd(), 'src', 'data');
const ADMIN_FILE = path.join(ADMIN_DIR, 'admin.json');

export interface AdminRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_EMAIL = process.env.ADMIN_EMAIL || '';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || '';

/**
 * Ensure the admin data directory exists.
 */
async function ensureAdminDir(): Promise<void> {
  await fs.mkdir(ADMIN_DIR, { recursive: true });
}

/**
 * Read the admin record from the file.
 * Returns null if not found or file doesn't exist.
 */
export async function getAdminUser(): Promise<AdminRecord | null> {
  try {
    const content = await fs.readFile(ADMIN_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (data && data.id && data.email && data.passwordHash) {
      return data as AdminRecord;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Initialize the admin user from environment variables if no admin exists.
 */
export async function initAdminIfNeeded(): Promise<AdminRecord | null> {
  const existing = await getAdminUser();
  if (existing) return existing;

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return null;
  }

  await ensureAdminDir();
  const passwordHash = await hashAdminPassword(password);
  const now = new Date().toISOString();

  const admin: AdminRecord = {
    id: 'admin-root',
    email,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  await fs.writeFile(ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf-8');
  console.log('[AdminStore] Initialized admin user from environment variables.');
  return admin;
}

/**
 * Update admin credentials (email and/or password hash).
 */
export async function updateAdminCredentials(
  email: string,
  passwordHash: string
): Promise<AdminRecord> {
  await ensureAdminDir();
  const existing = await initAdminIfNeeded();
  const now = new Date().toISOString();
  const updated: AdminRecord = {
    id: existing?.id || 'admin-root',
    email,
    passwordHash,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await fs.writeFile(ADMIN_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
