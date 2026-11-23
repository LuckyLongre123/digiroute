import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Radar',
  description:
    'Real-time telemetry and recipient tracking for your sovereign micro-address.',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * /track/[id]: Creator Live Radar Layout
 * Clean, light-mode utilitarian layout matching the DigiRoute design system.
 */
export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased"
    >
      {children}
    </main>
  );
}
