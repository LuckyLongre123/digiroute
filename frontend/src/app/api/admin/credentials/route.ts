import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { getAdminUser, updateAdminCredentials } from '@/lib/adminStore';
import { hashAdminPassword } from '@/lib/adminAuth';

async function handleUpdateCredentials(request: Request) {
  // Verify admin session
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newEmail = (body.newEmail || body.email || '').trim();
    const newPassphrase = body.newPassphrase || body.newPassword || '';
    const currentPassword =
      body.currentPassphrase || body.currentPassword || '';

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current passphrase is required to authenticate changes.' },
        { status: 400 }
      );
    }

    if (!newEmail && !newPassphrase) {
      return NextResponse.json(
        { error: 'Provide a new email or new passphrase to update.' },
        { status: 400 }
      );
    }

    // Verify current password against admin store
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin record not found.' },
        { status: 404 }
      );
    }

    const { verifyAdminPassword } = await import('@/lib/adminAuth');
    const valid = await verifyAdminPassword(
      currentPassword,
      admin.passwordHash
    );
    if (!valid) {
      return NextResponse.json(
        { error: 'Current passphrase is incorrect.' },
        { status: 403 }
      );
    }

    let passwordHash = admin.passwordHash;
    if (newPassphrase) {
      if (newPassphrase.length < 6) {
        return NextResponse.json(
          { error: 'New passphrase must be at least 6 characters.' },
          { status: 400 }
        );
      }
      passwordHash = await hashAdminPassword(newPassphrase);
    }

    const emailToSet = newEmail ? newEmail.toLowerCase() : admin.email;
    const updated = await updateAdminCredentials(emailToSet, passwordHash);

    return NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      email: updated.email,
    });
  } catch (err) {
    console.error('[Admin Credentials] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await getAdminUser();
  return NextResponse.json({
    email: admin?.email || session.email || 'officailluckylongre@gmail.com',
  });
}

export async function PATCH(request: Request) {
  return handleUpdateCredentials(request);
}

export async function PUT(request: Request) {
  return handleUpdateCredentials(request);
}
