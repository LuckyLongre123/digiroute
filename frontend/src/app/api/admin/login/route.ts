import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initAdminIfNeeded } from '@/lib/adminStore';
import {
  verifyAdminPassword,
  createAdminSession,
  ADMIN_TOKEN_COOKIE,
} from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Initialize default admin if first run
    const admin = await initAdminIfNeeded();

    if (email.trim().toLowerCase() !== admin.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const valid = await verifyAdminPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Issue admin JWT
    const token = await createAdminSession(admin.id, admin.email);

    // Explicitly set the cookie on the root path '/' so it is accessible across all pages
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Admin authenticated.',
    });
    response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error('[Admin Login] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
