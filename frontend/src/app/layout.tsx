import { AdminTriggerMount } from '@/components/AdminTriggerMount';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DigiRoute — Sovereign Micro-Addressing',
  description:
    'Solve the last 50 meters. Create a precise 4-factor micro-address using DIGIPIN, doorway photo, map pin, and floor details. Shareable in seconds.',
  keywords: [
    'DIGIPIN',
    'micro-address',
    'India Post',
    'last mile',
    'delivery',
    'navigation',
  ],
  authors: [{ name: 'DigiRoute' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'DigiRoute — Sovereign Micro-Addressing',
    description:
      'Solve the last 50 meters with a precise, shareable micro-address.',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1A3A6B',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
        {/* Global Toast — top-center for non-intrusive feedback */}
        <Toaster
          position="bottom-center"
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast:
                'bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl rounded-xl',
              title: 'text-base font-medium',
              description: 'text-zinc-400',
              actionButton: 'bg-orange-600 text-white hover:bg-orange-700',
              cancelButton: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
              closeButton:
                'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300',
            },
          }}
        />
        {/* Admin Keyboard Trigger — Ctrl+Shift+A → /admin/login (invisible) */}
        <AdminTriggerMount />
      </body>
    </html>
  );
}
