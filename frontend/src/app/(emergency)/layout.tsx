import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emergency SOS - DigiRoute',
  description: 'Emergency dispatch channel and community responder navigation.',
};

/**
 * (emergency) Layout: SOS & Responder Route Group
 *
 * Full viewport wrapper designed for outdoor clarity and crisis response.
 * Individual routes control full-bleed canvas or focused mobile containers.
 */
export default function EmergencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full font-sans antialiased select-none">
      {children}
    </div>
  );
}
