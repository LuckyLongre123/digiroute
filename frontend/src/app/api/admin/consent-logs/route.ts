import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { getAllConsentAuditData } from '@/lib/consent-logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/consent-logs
 * Retrieves all normalized consent audit records, stats, and user statuses.
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

    const auditData = await getAllConsentAuditData();
    return NextResponse.json({
      success: true,
      ...auditData,
    });
  } catch (error) {
    console.error('[API /api/admin/consent-logs] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve consent audit logs.' },
      { status: 500 }
    );
  }
}
