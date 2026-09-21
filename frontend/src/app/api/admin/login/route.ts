import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  verifyAdminPassword,
  createAdminSession,
  ADMIN_TOKEN_COOKIE,
} from '@/lib/adminAuth';

export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { configured: false, error: 'Network error. Please retry.' },
      { status: 503 }
    );
  }

  return NextResponse.json({ configured: true });
}

export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    // If ENV variables are not set, return Network error
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Network error. Please retry.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const inputEmail = email.trim().toLowerCase();
    const expectedEmail = adminEmail.toLowerCase();

    if (inputEmail !== expectedEmail) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const valid =
      password === adminPassword ||
      (await verifyAdminPassword(password, adminPassword));

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Issue admin JWT
    const token = await createAdminSession('admin-root', adminEmail);

    // Explicitly set the cookie on the root path '/' so it is accessible across all pages
    try {
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    } catch {
      // Context outside Next.js request handler
    }

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
      { error: 'Network error. Please retry.' },
      { status: 500 }
    );
  }
}

