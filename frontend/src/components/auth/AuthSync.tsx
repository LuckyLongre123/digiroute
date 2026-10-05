'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/app/actions/auth';

/**
 * AuthSync - Lightweight client component that keeps client Zustand auth state
 * synchronized with active server session.
 */
export function AuthSync() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      getSessionAction().then((res) => {
        if (res.user) {
          useAuthStore.getState().setUser(res.user);
        }
      });
    }
  }, [user]);

  return null;
}
