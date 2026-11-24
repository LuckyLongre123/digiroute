import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import {
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from '@/lib/contact';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/contacts
 * Retrieves all submitted contact messages.
 * Protected by digiroute_admin_token session cookie.
 */
export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }

    const messages = await getAllContactMessages();
    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('[API /api/admin/contacts GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve contact messages.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/contacts
 * Updates status of a contact message ('NEW' | 'REVIEWED' | 'RESOLVED').
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !['NEW', 'REVIEWED', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Missing id or invalid status.' },
        { status: 400 }
      );
    }

    const ok = await updateContactMessageStatus(id, status);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Message not found or failed to update.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error('[API /api/admin/contacts PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message status.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/contacts
 * Deletes a contact message by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing message id to delete.' },
        { status: 400 }
      );
    }

    const ok = await deleteContactMessage(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Message not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('[API /api/admin/contacts DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message.' },
      { status: 500 }
    );
  }
}
