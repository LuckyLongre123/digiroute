import Link from 'next/link';
import {
  Shield,
  Clock,
  QrCode,
  Lock,
  Building2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Why Register - Benefits of a DigiRoute Account',
  description:
    'Discover the advantages of registered micro-addresses: permanent doorway links, resident passcodes, vector QR badges, and multi-address management.',
};

/**
 * /why-join - Benefits of Login Static Page
 *
 * Refined Utilitarian Design Contract:
 * 1. Asymmetric Bento Grid layout with high-contrast Light-Mode Saffron/Zinc palette.
 * 2. Functional, grounded copy with zero AI buzzwords and zero em-dashes.
 * 3. 4px precision radius (rounded-sm / rounded-[4px]) across all cards and CTAs.
 */
export default function WhyJoinPage() {
  return (
    <div className="text-foreground space-y-10 pb-16 font-sans">
      {/* Page Header */}
      <div className="max-w-2xl space-y-3">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl md:text-4xl dark:text-zinc-50">
          Why Register an Account?
        </h1>
        <p className="font-sans text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          Guest micro-addresses are temporary by design. Register once to unlock
          permanent doorway anchors, resident passcodes, vector QR badges, and
          sovereign address management.
        </p>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Tile 1: Permanent Anchors vs Expiring Links (Span 2) */}
        <div className="flex flex-col justify-between space-y-6 rounded-[4px] border border-zinc-200 bg-white p-6 shadow-xs md:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <div className="text-accent flex items-center gap-2">
              <Clock className="h-5 w-5" strokeWidth={2} />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                Permanent Lifespan
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 sm:text-xl dark:text-zinc-50">
              Permanent Doorway Anchors
            </h2>
            <p className="max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
              Guest links automatically expire after 30 minutes, 1 hour, or 24
              hours. Registered citizens create permanent sovereign URLs that
              never expire, ensuring friends, regular delivery agents, and
              emergency responders can always navigate to your doorstep.
            </p>
          </div>

          {/* Comparison Strip */}
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <div className="space-y-1 rounded-[4px] border border-zinc-200/80 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-500">
                  Guest Session
                </span>
                <span className="rounded-[2px] bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  30m - 24h Expiry
                </span>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Temporary link designed for one-off parcels or short-term
                visitor navigation.
              </p>
            </div>

            <div className="bg-accent/5 dark:bg-accent/10 border-accent/20 space-y-1 rounded-[4px] border p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Registered Account
                </span>
                <span className="rounded-[2px] bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  Never Expires
                </span>
              </div>
              <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                Permanent micro-address with fixed coordinates and custom
                door-side hints.
              </p>
            </div>
          </div>
        </div>

        {/* Tile 2: Resident Passcode Security (Span 1) */}
        <div className="flex flex-col justify-between space-y-4 rounded-[4px] border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <div className="text-accent flex items-center gap-2">
              <Lock className="h-5 w-5" strokeWidth={2} />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                Doorstep Privacy
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Resident Passcodes
            </h2>
            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
              Protect your floor number, apartment unit, and doorway photo
              behind a 6-digit security code. Only couriers or guests with your
              passcode can resolve entrance specifics.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-[4px] border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                PIN-Protected
              </span>
            </div>
            <span className="font-mono text-xs tracking-widest text-zinc-400">
              ••••••
            </span>
          </div>
        </div>

        {/* Tile 3: Printable QR Badges (Span 1) */}
        <div className="flex flex-col justify-between space-y-4 rounded-[4px] border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <div className="text-accent flex items-center gap-2">
              <QrCode className="h-5 w-5" strokeWidth={2} />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                Physical Utility
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Vector QR Badges
            </h2>
            <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
              Export high-resolution SVG and PNG badges ready for physical
              printing. Stick them on gate pillars, apartment buzzers, or parcel
              delivery drop boxes.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[4px] border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <QrCode className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="text-[11px] leading-tight text-zinc-600 dark:text-zinc-400">
              Scan with any mobile camera. Works without proprietary apps.
            </div>
          </div>
        </div>

        {/* Tile 4: Sovereign Address Book Management (Span 2) */}
        <div className="flex flex-col justify-between space-y-5 rounded-[4px] border border-zinc-200 bg-white p-6 shadow-xs md:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <div className="text-accent flex items-center gap-2">
              <Building2 className="h-5 w-5" strokeWidth={2} />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                Multi-Address Hub
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 sm:text-xl dark:text-zinc-50">
              Centralized Address Dashboard
            </h2>
            <p className="max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
              Manage multiple properties from a single interface: your primary
              residence, weekend home, studio, or family premises. Update buzzer
              codes or delivery instructions without changing your printed QR
              badges or sharing new links.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Edit notes anytime</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Instant QR regeneration</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Doorway photo updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Conversion Action Card */}
      <div className="space-y-6 rounded-[4px] border border-zinc-800 bg-zinc-950 p-6 text-white shadow-md sm:p-8">
        <div className="max-w-xl space-y-2">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Ready to Lock in Your Doorway Pin?
          </h2>
          <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Create an account in 30 seconds. No phone spam, no tracking cookies,
            and zero proprietary lock-in.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link
            href="/register"
            id="why-join-register-cta"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-[#FF6B00] px-5 py-3 font-sans text-xs font-semibold text-white shadow-xs transition-transform duration-100 ease-out hover:bg-[#e05e00] active:scale-[0.98] sm:text-sm"
          >
            <span>Create Free Account</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            id="why-join-login-cta"
            className="hover:bg-zinc-850 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-zinc-700 bg-zinc-900 px-5 py-3 font-sans text-xs font-semibold text-zinc-200 transition-transform duration-100 ease-out active:scale-[0.98] sm:text-sm"
          >
            <span>Sign In to Existing Account</span>
          </Link>
          <Link
            href="/create"
            id="why-join-try-guest-cta"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200 sm:ml-2"
          >
            <span>Try as guest first</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
