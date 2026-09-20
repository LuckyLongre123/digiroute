import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DigiRoute - Sovereign Doorway Navigation',
  description: 'Verified micro-address navigation direct to the doorway with sovereign accuracy.',
};

/**
 * /a/[slug]: Recipient Navigation Layout (ROUTE-09)
 * Full-bleed app viewport designed for mobile-first turn-by-turn navigation.
 */
export default function RecipientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full bg-background text-foreground flex flex-col items-center justify-start antialiased font-sans overflow-hidden">
      <div className="w-full max-w-md md:max-w-lg h-full flex flex-col relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
