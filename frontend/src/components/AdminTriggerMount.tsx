'use client';

import { useAdminTrigger } from '@/hooks/useAdminTrigger';

/**
 * AdminTriggerMount
 *
 * Invisible client component that mounts the global Ctrl+Shift+A admin trigger.
 * Placed in root layout.tsx so it works on every page.
 */
export function AdminTriggerMount() {
  useAdminTrigger();
  return null;
}
