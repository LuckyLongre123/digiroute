import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from './Navbar';

/**
 * (public) Layout
 *
 * Sticky glassmorphic header with dynamic login/dashboard states.
 * ROUTE-10: SOS must never be more than 1 tap away from home and create flow.
 * Responsive max width container for desktop and mobile utility.
 * Includes consistent public brand footer.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-screen flex-col font-sans antialiased">
      {/* Top Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Page content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
        {children}
      </main>

      {/* Public Brand Footer */}
      <footer className="border-border bg-card/40 mt-auto border-t px-4 py-8 font-sans">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link
              href="/"
              className="group flex cursor-pointer items-center"
              aria-label="DigiRoute Home"
            >
              <Image
                src="/logo-transparent.png"
                alt="DigiRoute Logo"
                width={150}
                height={40}
                quality={75}
                className="h-auto w-28 object-contain sm:w-32 dark:brightness-200 dark:invert"
              />
            </Link>
            <p className="text-muted-foreground text-center text-xs sm:text-left">
              Sovereign Micro-Addressing &amp; Spatial Navigation
            </p>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/why-join"
              className="hover:text-foreground transition-colors"
            >
              Why Register
            </Link>
            <Link
              href="/download-app"
              id="footer-download-pwa-link"
              className="text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Get Mobile App
            </Link>
            <Link
              href="/sos"
              className="text-destructive font-semibold hover:underline"
            >
              Emergency SOS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
