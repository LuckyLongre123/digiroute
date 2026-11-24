'use server';

import { getCurrentSession } from '@/lib/auth';
import {
  getUserConsentState,
  recordConsentEvent,
  formatToIST,
  type ConsentAction,
} from '@/lib/consent-logger';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface ConsentActionResult {
  success: boolean;
  accepted?: boolean;
  lastAction?: ConsentAction | null;
  lastUpdatedAt?: string | null;
  formattedDateIST?: string | null;
  error?: string;
}

/**
 * Server Action: Query current user's consent state
 */
export async function getUserConsentAction(): Promise<ConsentActionResult> {
  try {
    const sessionUser = await getCurrentSession();
    if (!sessionUser || !sessionUser.id) {
      return { success: false, error: 'Unauthorized.' };
    }

    const state = await getUserConsentState(sessionUser.id);
    return {
      success: true,
      accepted: state.accepted,
      lastAction: state.lastAction,
      lastUpdatedAt: state.lastUpdatedAt,
      formattedDateIST: state.lastUpdatedAt ? formatToIST(state.lastUpdatedAt) : null,
    };
  } catch (err) {
    console.error('[getUserConsentAction] Error fetching consent state:', err);
    return { success: false, error: 'Failed to retrieve consent status.' };
  }
}

/**
 * Server Action: Update (accept or revoke) user's consent in background
 */
export async function updateUserConsentAction(
  accepted: boolean
): Promise<ConsentActionResult> {
  try {
    const sessionUser = await getCurrentSession();
    if (!sessionUser || !sessionUser.id) {
      return { success: false, error: 'Unauthorized.' };
    }

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;

    const action: ConsentAction = accepted ? 'ACCEPTED' : 'REVOKED';

    const record = await recordConsentEvent({
      userId: sessionUser.id,
      userEmail: sessionUser.email || '',
      userName: sessionUser.name,
      consentType: 'AGE_AND_TERMS',
      action,
      policyVersion: 'v1.0',
      source: 'SETTINGS',
      userAgent,
    });

    revalidatePath('/dashboard/settings');

    return {
      success: true,
      accepted: record.action === 'ACCEPTED',
      lastAction: record.action,
      lastUpdatedAt: record.createdAt,
      formattedDateIST: formatToIST(record.createdAt),
    };
  } catch (err) {
    console.error('[updateUserConsentAction] Error updating consent:', err);
    return { success: false, error: 'Failed to record consent update.' };
  }
}
