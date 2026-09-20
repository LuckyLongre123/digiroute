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

const DEFAULT_EMAIL = 'officailluckylongre@gmail.com';
const DEFAULT_PASSWORD = 'Lucky123';

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
 * Initialize the admin user with default credentials if no admin exists.
 * Default: officailluckylongre@gmail.com / Lucky123
 */
export async function initAdminIfNeeded(): Promise<AdminRecord> {
  const existing = await getAdminUser();
  if (existing) return existing;

  await ensureAdminDir();
  const passwordHash = await hashAdminPassword(DEFAULT_PASSWORD);
  const now = new Date().toISOString();

  const admin: AdminRecord = {
    id: 'admin-root',
    email: DEFAULT_EMAIL,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  await fs.writeFile(ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf-8');
  console.log('[AdminStore] Initialized default admin user.');
  return admin;
}

/**
 * Update admin credentials (email and/or password hash).
 */
export async function updateAdminCredentials(
  email: string,
  passwordHash: string,
): Promise<AdminRecord> {
  await ensureAdminDir();
  const existing = await initAdminIfNeeded();
  const updated: AdminRecord = {
    ...existing,
    email,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(ADMIN_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
