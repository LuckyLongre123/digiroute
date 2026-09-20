import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';

export const SESSION_COOKIE_NAME = 'digiroute_session';

/**
 * Retrieve JWT signing secret strictly from environment variables.
 * Throws an explicit error if JWT_SECRET is missing.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return new TextEncoder().encode(secret);
}

export { sanitizeCallbackUrl } from './sanitizeUrl';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

/**
 * Hash password with scrypt (crypto native, zero external dependencies)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify password against stored scrypt hash using timingSafeEqual
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
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

/**
 * Create a signed JWT session token with a 30-day expiration
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    if (!payload || typeof payload.id !== 'string') {
      return null;
    }

    return {
      id: payload.id as string,
      email: (payload.email as string) || '',
      name: (payload.name as string) || '',
      role: (payload.role as 'user' | 'admin') || 'user',
    };
  } catch {
    return null;
  }
}

/**
 * Set the secure HTTP-only session cookie
 */
export async function setSessionCookie(user: SessionUser): Promise<string> {
  const token = await createSessionToken(user);
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch {
    // Cookie store unavailable outside Next request context (e.g. test scripts)
  }

  return token;
}

/**
 * Clear the session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch {
    // Cookie store unavailable outside Next request context
  }
}

/**
 * Retrieve the current authenticated session user from cookies
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return null;
    }
    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Retrieve session object wrapping user for server components and actions
 */
export async function getSession(): Promise<{ user: SessionUser } | null> {
  const user = await getCurrentSession();
  if (!user) return null;
  return { user };
}
