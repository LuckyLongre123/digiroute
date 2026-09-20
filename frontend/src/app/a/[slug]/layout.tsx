import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DigiRoute - Sovereign Doorway Navigation',
  description:
    'Verified micro-address navigation direct to the doorway with sovereign accuracy.',
};

/**
 * /a/[slug]: Recipient Navigation Layout (ROUTE-09)
 * Full-bleed app viewport designed for mobile-first turn-by-turn navigation.
 */
export default function RecipientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex h-[100dvh] w-full flex-col items-center justify-start overflow-hidden font-sans antialiased">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden md:max-w-lg">
        {children}
      </div>
    </div>
  );
}
