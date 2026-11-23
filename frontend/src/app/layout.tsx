import { AdminTriggerMount } from '@/components/AdminTriggerMount';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader';
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

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'DigiRoute — Sovereign Micro-Addressing & DIGIPIN Navigation',
    template: '%s | DigiRoute',
  },
  description:
    'Resolve last-50-meter delivery failures in India with 2-factor micro-addresses pairing India Post DIGIPIN codes with verified doorway visual lock photos.',
  keywords: [
    'DIGIPIN',
    'micro-address',
    'India Post',
    'last mile navigation',
    'doorway visual lock',
    'spatial addressing India',
    'delivery coordinates',
    'offline navigation',
  ],
  authors: [{ name: 'DigiRoute' }],
  manifest: '/manifest.webmanifest',
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DigiRoute',
  },
  openGraph: {
    title: 'DigiRoute — Sovereign Micro-Addressing & DIGIPIN Navigation',
    description:
      'Resolve last-50-meter delivery failures in India with 2-factor micro-addresses pairing India Post DIGIPIN codes with verified doorway visual lock photos.',
    url: BASE_URL,
    siteName: 'DigiRoute',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigiRoute — Sovereign Micro-Addressing & DIGIPIN Navigation',
    description:
      'Resolve last-50-meter delivery failures in India with 2-factor micro-addresses pairing India Post DIGIPIN codes with verified doorway visual lock photos.',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
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
        {/* WCAG AAA Keyboard Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100000] focus:px-4 focus:py-2.5 focus:bg-orange-600 focus:text-white focus:rounded-md focus:shadow-xl focus:outline-none font-sans text-xs font-bold uppercase tracking-wider"
        >
          Skip to main content
        </a>

        <NextTopLoader
          color="#ea580c"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="none"
          zIndex={99999}
        />
        {children}
        {/* Global Toast — bottom-center for non-intrusive feedback */}
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
        {/* PWA Service Worker Registration */}
        <ServiceWorkerRegister />
        {/* Admin Keyboard Trigger — Ctrl+Shift+A → /admin/login (invisible) */}
        <AdminTriggerMount />
      </body>
    </html>
  );
}
