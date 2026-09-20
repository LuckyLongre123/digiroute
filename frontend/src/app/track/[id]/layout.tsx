import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Radar - DigiRoute Creator Hub',
  description: 'Real-time telemetry and recipient tracking for your sovereign micro-address.',
};

/**
 * /track/[id]: Creator Live Radar Layout
 * Clean, light-mode utilitarian layout matching the DigiRoute design system.
 */
export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full bg-zinc-50 text-zinc-900 antialiased font-sans overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
