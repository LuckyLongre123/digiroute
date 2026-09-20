
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';


export const ADMIN_TOKEN_COOKIE = 'digiroute_admin_token';

/**
 * Get the admin JWT signing secret.
 * Uses ADMIN_JWT_SECRET env var, falling back to JWT_SECRET + ':admin' suffix.
 * This ensures admin tokens are cryptographically separate from user tokens.
 */
function getAdminSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    (process.env.JWT_SECRET ? process.env.JWT_SECRET + ':admin' : 'digiroute-admin-supersecret-jwt-key-2026');
  return new TextEncoder().encode(secret);
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: 'superadmin';
}

/**
 * Issue a 24-hour admin JWT and set it as an httpOnly secure cookie.
 */
export async function createAdminSession(adminId: string, email: string): Promise<string> {
  const secret = getAdminSecret();
  const token = await new SignJWT({ adminId, email, role: 'superadmin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  } catch {
    // Cookie store unavailable outside Next.js request context
  }

  return token;
}

/**
 * Verify an admin token string (does NOT require cookie context; usable in middleware/API).
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const secret = getAdminSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (
      !payload ||
      typeof payload.adminId !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      role: 'superadmin',
    };
  } catch {
    return null;
  }
}

/**
 * Get the current admin session from the cookie store (server-side).
 */
export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_TOKEN_COOKIE);
    if (!cookie?.value) return null;
    return await verifyAdminToken(cookie.value);
  } catch {
    return null;
  }
}

/**
 * Clear the admin session cookie.
 */
export async function clearAdminSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch {
    // ignore
  }
}

/**
 * Hash password with scrypt (same algorithm as user auth for consistency)
 */
export async function hashAdminPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify password against stored scrypt hash.
 */
export async function verifyAdminPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      try {
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== derivedKey.length) {
          resolve(false);
          return;
        }
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}
