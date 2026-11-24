import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import { AndroidIcon } from '@/components/icons/AndroidIcon';
import { GithubIcon } from '@/components/icons/GithubIcon';

/**
 * (public) Layout
 *
 * Sticky glassmorphic header with dynamic login/dashboard states.
 * ROUTE-10: SOS must never be more than 1 tap away from home and create flow.
 * Responsive max width container for desktop and mobile utility.
 * Includes consistent public brand footer linking internally to the /download landing page
 * and highlighting project contributors and platform resources.
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
      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
        {children}
      </main>

      {/* Public Brand Footer */}
      <footer className="border-border bg-card/40 mt-auto border-t px-4 py-10 font-sans">
        <div className="mx-auto max-w-4xl">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
            {/* Column 1: Brand & Mission (Span 4) */}
            <div className="flex flex-col items-start gap-3 md:col-span-4">
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
                  className="h-auto w-32 object-contain sm:w-36 dark:brightness-200 dark:invert"
                />
              </Link>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Sovereign Micro-Addressing &amp; Spatial Navigation. Powered by India Post DIGIPIN open geo-standards for high-precision doorstep resolution.
              </p>
            </div>

            {/* Link Columns (Span 8) */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:col-span-8">
              {/* Column 2: Platform */}
              <div className="flex flex-col gap-2.5">
                <span className="text-foreground text-xs font-semibold uppercase tracking-wider">
                  Platform
                </span>
                <nav aria-label="Platform Links" className="flex flex-col gap-2 text-xs">
                  <Link
                    href="/create"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Create Address
                  </Link>
                  <Link
                    href="/scan"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Scan QR
                  </Link>
                  <Link
                    href="/report"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Report Issue
                  </Link>
                  <Link
                    href="/download-app"
                    id="footer-download-app-link"
                    className="inline-flex items-center gap-1.5 text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    <AndroidIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Download App</span>
                  </Link>
                  <Link
                    href="/sos"
                    className="text-destructive inline-flex items-center font-medium hover:underline"
                  >
                    Emergency SOS
                  </Link>
                </nav>
              </div>

              {/* Column 3: Resources & Legal */}
              <div className="flex flex-col gap-2.5">
                <span className="text-foreground text-xs font-semibold uppercase tracking-wider">
                  Resources
                </span>
                <nav aria-label="Resources & Legal Links" className="flex flex-col gap-2 text-xs">
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/why-join"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Why Register
                  </Link>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </nav>
              </div>

              {/* Column 4: Contributors */}
              <div className="col-span-2 flex flex-col gap-2.5 sm:col-span-1">
                <span className="text-foreground text-xs font-semibold uppercase tracking-wider">
                  Contributors
                </span>
                <div className="flex flex-col gap-2 text-xs">
                  <a
                    href="https://github.com/LuckyLongre123"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                  >
                    <GithubIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>Lucky</span>
                  </a>
                  <a
                    href="https://github.com/buildingkaran"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                  >
                    <GithubIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>Karan Kumar</span>
                  </a>
                  <a
                    href="https://github.com/kushkumarkashyap7280"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                  >
                    <GithubIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>Kush Kumar</span>
                  </a>
                  <a
                    href="https://github.com/Namishkaushik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                  >
                    <GithubIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>Namish Kaushik</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sub-bar */}
          <div className="border-border/60 mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} DigiRoute. Sovereign Micro-Addressing &amp; Spatial Navigation.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
