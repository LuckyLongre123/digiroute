import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { db } from '@/prisma/db';

/**
 * PATCH /api/admin/update-user
 * Body: { userId: string, name?: string | null, email?: string | null, phone?: string | null }
 * Updates the User record in Prisma database.
 */
export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, name, email, phone } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required.' },
        { status: 400 }
      );
    }

    const updates: Record<string, string | null> = {};
    if (name !== undefined) updates.name = name?.trim() || null;
    if (email !== undefined) updates.email = email?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided.' },
        { status: 400 }
      );
    }

    try {
      await db.orm.public.User.where({ id: userId }).update(updates);
    } catch (err: unknown) {
      console.warn('[Admin Update User] DB update failed:', err);
      const msg = err instanceof Error ? err.message : String(err || '');
      if (
        msg.includes('unique') ||
        msg.includes('duplicate') ||
        msg.includes('P2002')
      ) {
        return NextResponse.json(
          {
            error:
              'Email or phone number is already registered to another user.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update user record in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, ...updates },
    });
  } catch (err) {
    console.error('[Admin Update User] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
