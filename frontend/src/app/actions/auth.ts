'use server';

import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getCurrentSession,
  type SessionUser,
} from '@/lib/auth';
import { findUserByEmail, createUser } from '@/lib/userService';

export interface AuthActionResult {
  success: boolean;
  user?: SessionUser;
  error?: string;
}

/**
 * Server Action: Authenticate existing user with email and password
 */
export async function loginAction(
  input: FormData | { email?: string; password?: string }
): Promise<AuthActionResult> {
  try {
    let email = '';
    let password = '';

    if (input instanceof FormData) {
      email = (input.get('email') as string)?.trim() || '';
      password = (input.get('password') as string) || '';
    } else {
      email = input.email?.trim() || '';
      password = input.password || '';
    }

    if (!email || !password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const normalizedEmail = email.toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'user',
    };

    await setSessionCookie(sessionUser);

    return {
      success: true,
      user: sessionUser,
    };
  } catch (error) {
    console.error('[loginAction] Authentication error:', error);
    return {
      success: false,
      error: 'Invalid email or password.',
    };
  }
}

/**
 * Server Action: Register new user and automatically establish active session
 */
export async function registerAction(
  input: FormData | { name?: string; email?: string; password?: string }
): Promise<AuthActionResult> {
  try {
    let name = '';
    let email = '';
    let password = '';

    if (input instanceof FormData) {
      name = (input.get('name') as string)?.trim() || '';
      email = (input.get('email') as string)?.trim() || '';
      password = (input.get('password') as string) || '';
    } else {
      name = input.name?.trim() || '';
      email = input.email?.trim() || '';
      password = input.password || '';
    }

    if (!name) {
      return { success: false, error: 'Full name is required.' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Check if account already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email address already exists.',
      };
    }

    // Hash password and persist user
    const passwordHash = await hashPassword(password);
    const newUser = await createUser({
      email,
      name,
      passwordHash,
    });

    const sessionUser: SessionUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'user',
    };

    // Auto-login requirement: automatically issue session cookie
    await setSessionCookie(sessionUser);

    return {
      success: true,
      user: sessionUser,
    };
  } catch (error) {
    console.error('[registerAction] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to create account. Please try again.',
    };
  }
}

/**
 * Server Action: Clear session cookie and sign out
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch (error) {
    console.error('[logoutAction] Error clearing session:', error);
    return { success: false };
  }
}

/**
 * Server Action: Query active session user from cookies
 */
export async function getSessionAction(): Promise<{ user: SessionUser | null }> {
  try {
    const user = await getCurrentSession();
    return { user };
  } catch {
    return { user: null };
  }
}
