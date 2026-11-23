import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Responder Navigation',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResponderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
