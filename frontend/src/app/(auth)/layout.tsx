import Link from 'next/link';
import Image from 'next/image';

/**
 * (auth) Layout - Authentication Route Group (ROUTE-06)
 *
 * Centered card layout on high-performance static map screenshot background.
 * Optimized with Next.js Image component (priority fill) for instant page load times.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 font-sans antialiased overflow-hidden select-none">
      {/* Static Map Screenshot Background - Instant Zero-JS Load */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden">
        <Image
          src="/bg-image.png"
          alt="DigiRoute Map Background"
          fill
          priority={true}
          quality={60}
          sizes="100vw"
          className="object-cover -z-10"
        />
        {/* Subtle ambient wash to guarantee AAA text legibility without GPU blur lag */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none" />
      </div>

      {/* Brand Header */}
      <div className="mb-6 text-center z-10 flex flex-col items-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center font-sans cursor-pointer group"
          aria-label="DigiRoute Home"
        >
          <Image
            src="/logo-transparent.png"
            alt="DigiRoute Logo"
            width={150}
            height={40}
            priority={true}
            quality={75}
            className="w-36 sm:w-40 h-auto object-contain dark:invert dark:brightness-200"
          />
        </Link>
        <p className="text-xs text-zinc-600 mt-2 font-medium tracking-wide font-sans">
          Sovereign Micro-Addressing &amp; Spatial Navigation
        </p>
      </div>

      {/* Centered Auth Card Container */}
      <div className="w-full max-w-sm z-10 font-sans">
        {children}
      </div>

      {/* Footer Back link */}
      <div className="mt-6 text-center z-10">
        <Link
          href="/"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 bg-white px-3 py-1.5 rounded-[4px] border border-zinc-300 shadow-xs font-sans"
        >
          &larr; Return to DigiRoute Home
        </Link>
      </div>
    </div>
  );
}
