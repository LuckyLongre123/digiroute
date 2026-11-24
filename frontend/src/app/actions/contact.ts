'use server';

import { saveContactMessage, updateContactMessageStatus, deleteContactMessage } from '@/lib/contact';
import { getAdminSession } from '@/lib/adminAuth';

const ALLOWED_CATEGORIES = [
  'General Inquiry',
  'Doorway Photo Takedown',
  'Bug / Technical Issue',
  'Feedback',
] as const;

export type ContactCategory = (typeof ALLOWED_CATEGORIES)[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SubmitContactResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Public Server Action to submit a contact message
 */
export async function submitContactMessageAction(payload: {
  name: string;
  email: string;
  category: string;
  message: string;
}): Promise<SubmitContactResponse> {
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  const category = (payload.category || '').trim();
  const message = (payload.message || '').trim();

  if (!name || name.length < 2) {
    return { success: false, error: 'Please provide your full name (at least 2 characters).' };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address so we can follow up.' };
  }

  if (!ALLOWED_CATEGORIES.includes(category as ContactCategory)) {
    return { success: false, error: 'Please select a valid topic category.' };
  }

  if (!message || message.length < 10) {
    return { success: false, error: 'Please enter a detailed message (minimum 10 characters).' };
  }

  if (message.length > 3000) {
    return { success: false, error: 'Message cannot exceed 3,000 characters.' };
  }

  try {
    const record = await saveContactMessage({
      name,
      email,
      category,
      message,
    });

    return {
      success: true,
      messageId: record.id,
    };
  } catch (err: any) {
    console.error('[Action: submitContactMessage] Error:', err);
    return {
      success: false,
      error: 'Unable to submit your message at this time. Please try again.',
    };
  }
}

/**
 * Admin Server Action to update message status
 */
export async function updateContactStatusAction(
  id: string,
  status: 'NEW' | 'REVIEWED' | 'RESOLVED'
): Promise<{ success: boolean; error?: string }> {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, error: 'Unauthorized. Admin credentials required.' };
  }

  if (!['NEW', 'REVIEWED', 'RESOLVED'].includes(status)) {
    return { success: false, error: 'Invalid status value.' };
  }

  const ok = await updateContactMessageStatus(id, status);
  if (!ok) {
    return { success: false, error: 'Failed to update message status.' };
  }

  return { success: true };
}

/**
 * Admin Server Action to delete a contact message
 */
export async function deleteContactAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, error: 'Unauthorized. Admin credentials required.' };
  }

  const ok = await deleteContactMessage(id);
  if (!ok) {
    return { success: false, error: 'Failed to delete message.' };
  }

  return { success: true };
}
