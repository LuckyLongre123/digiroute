import { nanoid } from 'nanoid';
import { db } from '@/prisma/db';

export interface UserRecord {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Find user by email strictly from the database.
 * Returns null if user does not exist or has no password hash.
 * Strictly zero mock, fallback, or default users.
 */
export async function findUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  try {
    const record = await db.orm.public.User.where({
      email: normalizedEmail,
    }).first();
    if (!record || !record.email || !record.passwordHash) {
      return null;
    }

    return {
      id: record.id,
      email: record.email,
      phone: record.phone,
      name: record.name || 'User',
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  } catch (err) {
    console.error(
      '[UserService] Database query error in findUserByEmail:',
      err
    );
    return null;
  }
}

/**
 * Find user by ID strictly from the database.
 * Returns null if user does not exist.
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  if (!id) return null;

  try {
    const record = await db.orm.public.User.where({ id }).first();
    if (!record || !record.email || !record.passwordHash) {
      return null;
    }

    return {
      id: record.id,
      email: record.email,
      phone: record.phone,
      name: record.name || 'User',
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  } catch (err) {
    console.error('[UserService] Database query error in findUserById:', err);
    return null;
  }
}

/**
 * Create a new user strictly in the database.
 * Throws if creation fails.
 */
export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  phone?: string | null;
}): Promise<UserRecord> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const id = `usr_${nanoid(16)}`;

  const created = await db.orm.public.User.create({
    id,
    email: normalizedEmail,
    name: data.name.trim(),
    phone: data.phone || null,
    passwordHash: data.passwordHash,
  });

  if (!created || !created.email) {
    throw new Error('Database failed to create user record.');
  }

  return {
    id: created.id,
    email: created.email,
    name: created.name || data.name.trim(),
    phone: created.phone,
    passwordHash: data.passwordHash,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}
