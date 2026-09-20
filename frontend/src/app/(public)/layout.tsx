import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from './Navbar';

/**
 * (public) Layout
 *
 * Sticky glassmorphic header with dynamic login/dashboard states.
 * ROUTE-10: SOS must never be more than 1 tap away from home and create flow.
 * Responsive max width container for desktop and mobile utility.
 * Includes consistent public brand footer.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans antialiased">
      {/* Top Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Page content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-10">
        {children}
      </main>

      {/* Public Brand Footer */}
      <footer className="border-t border-border bg-card/40 py-8 px-4 font-sans mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Link href="/" className="flex items-center group cursor-pointer" aria-label="DigiRoute Home">
              <Image
                src="/logo-transparent.png"
                alt="DigiRoute Logo"
                width={150}
                height={40}
                quality={75}
                className="w-28 sm:w-32 h-auto object-contain dark:invert dark:brightness-200"
              />
            </Link>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Sovereign Micro-Addressing &amp; Spatial Navigation
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground font-medium">
            <Link href="/about" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/why-join" className="hover:text-foreground transition-colors">
              Why Register
            </Link>
            <Link href="/sos" className="text-destructive hover:underline font-semibold">
              Emergency SOS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
