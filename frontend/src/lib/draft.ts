import { useAddressStore } from '@/store/useAddressStore';
import { db } from '@/lib/db';

interface ClearDraftOptions {
  showToast?: boolean;
  message?: string;
}

/**
 * Wipes all address creation draft state:
 * - Zustand address store (useAddressStore)
 * - localStorage and sessionStorage draft keys
 * - Dexie IndexedDB camera blobs
 * Strictly preserves authenticated sessions (cookies, auth tokens, etc.).
 *
 * Then redirects the user to Step 1 (/create) with a full hard reload
 * to eliminate any lingering memory or UI state bugs.
 */
export async function clearDraftAndReset(options?: ClearDraftOptions): Promise<void> {
  try {
    // 1. Reset client Zustand address store to initial state
    useAddressStore.getState().resetDraft();

    // 2. Wipe draft storage keys while strictly preserving auth
    if (typeof window !== 'undefined') {
      const draftKeys = [
        'digiroute_address_draft',
        'digiroute-draft-storage',
        'digiroute_camera_key',
        'digiroute_temp_draft',
      ];

      draftKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        } catch {
          // ignore
        }
      });

      // Clear any other keys prefixed with draft_ or digiroute_draft
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('digiroute_draft') || key.startsWith('draft_'))) {
          localStorage.removeItem(key);
        }
      }
    }

    // 3. Clear temporary camera blobs in IndexedDB
    try {
      await db.camera_blobs.clear();
    } catch (dbErr) {
      console.warn('[clearDraft] Failed to clear camera blobs:', dbErr);
    }

    // 4. Set post-reload toast if requested
    if (typeof window !== 'undefined') {
      if (options?.showToast !== false) {
        sessionStorage.setItem(
          'digiroute_toast_msg',
          options?.message || 'Draft cleared. Starting fresh.'
        );
      }

      // 5. Redirect to Step 1 (/create) and perform a hard reload
      const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
      if (currentPath === '/create') {
        window.location.reload();
      } else {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/create';
      }
    }
  } catch (err) {
    console.error('[clearDraft] Reset failed:', err);
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/create';
    }
  }
}
