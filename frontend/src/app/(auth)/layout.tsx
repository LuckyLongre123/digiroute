import Link from 'next/link';
import Image from 'next/image';

/**
 * (auth) Layout - Authentication Route Group (ROUTE-06)
 *
 * Centered card layout on high-performance static map screenshot background.
 * Optimized with Next.js Image component (priority fill) for instant page load times.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 font-sans antialiased select-none">
      {/* Static Map Screenshot Background - Instant Zero-JS Load */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
        <Image
          src="/bg-image.png"
          alt="DigiRoute Map Background"
          fill
          priority={true}
          quality={60}
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Subtle ambient wash to guarantee AAA text legibility without GPU blur lag */}
        <div className="pointer-events-none absolute inset-0 bg-white/60" />
      </div>

      {/* Brand Header */}
      <div className="z-10 mb-6 flex flex-col items-center text-center">
        <Link
          href="/"
          className="group inline-flex cursor-pointer items-center justify-center font-sans"
          aria-label="DigiRoute Home"
        >
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="h-auto w-36 object-contain sm:w-40 dark:brightness-200 dark:invert"
          />
        </Link>
        <p className="mt-2 font-sans text-xs font-medium tracking-wide text-zinc-600">
          Sovereign Micro-Addressing &amp; Spatial Navigation
        </p>
      </div>

      {/* Centered Auth Card Container */}
      <div className="z-10 w-full max-w-sm font-sans">{children}</div>

      {/* Footer Back link */}
      <div className="z-10 mt-6 text-center">
        <Link
          href="/"
          className="rounded-[4px] border border-zinc-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-zinc-600 shadow-xs hover:text-zinc-950"
        >
          &larr; Return to DigiRoute Home
        </Link>
      </div>
    </div>
  );
}
