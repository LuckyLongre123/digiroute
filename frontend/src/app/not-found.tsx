import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-accent/20">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
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
              className="w-36 sm:w-40 h-auto object-contain dark:invert dark:brightness-200"
            />
          </Link>
        </div>

        {/* Title and Clean Description */}
        <div className="space-y-2 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            The address link or route you are looking for does not exist, has been removed, or has expired.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1A3A6B] hover:bg-[#152e55] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold py-3 px-5 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
