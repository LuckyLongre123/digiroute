'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * useAdminTrigger
 *
 * Listens for Ctrl + Shift + A on the document.
 * When detected, navigates to /admin/login.
 * Mounted globally in root layout via AdminTriggerMount.
 */
export function useAdminTrigger() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        router.push('/admin/login');
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
