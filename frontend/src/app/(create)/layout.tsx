import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Micro-Address',
  description:
    'Generate a deterministic 10-character DIGIPIN from device GPS, capture a doorway visual lock photo, and create a shareable micro-address.',
  alternates: {
    canonical: '/create',
  },
};

export default function CreateRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
