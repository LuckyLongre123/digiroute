import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emergency SOS Dispatch',
  description:
    'Trigger rapid emergency dispatch with pre-populated DIGIPIN coordinates and one-tap direct dialing to emergency services at 112.',
  alternates: {
    canonical: '/sos',
  },
};

/**
 * (emergency) Layout: SOS & Responder Route Group
 *
 * Full viewport wrapper designed for outdoor clarity and crisis response.
 * Individual routes control full-bleed canvas or focused mobile containers.
 */
export default function EmergencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="min-h-[100dvh] w-full font-sans antialiased select-none">
      {children}
    </main>
  );
}
