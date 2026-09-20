import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-background text-foreground selection:bg-accent/20 flex min-h-screen flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="bg-card border-border w-full max-w-md space-y-5 rounded-2xl border p-6 text-center shadow-xl sm:p-8">
        {/* Brand Logo Header */}
        <div className="flex justify-center">
          <Link href="/" className="inline-block cursor-pointer">
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
        </div>

        {/* Title and Clean Description */}
        <div className="space-y-2 pt-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed sm:text-sm">
            The address link or route you are looking for does not exist, has
            been removed, or has expired.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1A3A6B] px-5 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#152e55] active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
