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
    <div className="space-y-10 pb-16 font-sans text-foreground">
      {/* Page Header */}
      <div className="space-y-3 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
          Why Register an Account?
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
          Guest micro-addresses are temporary by design. Register once to unlock permanent doorway
          anchors, resident passcodes, vector QR badges, and sovereign address management.
        </p>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tile 1: Permanent Anchors vs Expiring Links (Span 2) */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4px] p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Clock className="w-5 h-5" strokeWidth={2} />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                Permanent Lifespan
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Permanent Doorway Anchors
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Guest links automatically expire after 30 minutes, 1 hour, or 24 hours. Registered
              citizens create permanent sovereign URLs that never expire, ensuring friends,
              regular delivery agents, and emergency responders can always navigate to your doorstep.
            </p>
          </div>

          {/* Comparison Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-[4px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 font-mono">Guest Session</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-medium">
                  30m - 24h Expiry
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Temporary link designed for one-off parcels or short-term visitor navigation.
              </p>
            </div>

            <div className="p-3.5 bg-accent/5 dark:bg-accent/10 border border-accent/20 rounded-[4px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  Registered Account
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                  Never Expires
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                Permanent micro-address with fixed coordinates and custom door-side hints.
              </p>
            </div>
          </div>
        </div>

        {/* Tile 2: Resident Passcode Security (Span 1) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4px] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Lock className="w-5 h-5" strokeWidth={2} />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                Doorstep Privacy
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Resident Passcodes
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Protect your floor number, apartment unit, and doorway photo behind a 6-digit security
              code. Only couriers or guests with your passcode can resolve entrance specifics.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-[4px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                PIN-Protected
              </span>
            </div>
            <span className="font-mono text-xs text-zinc-400 tracking-widest">••••••</span>
          </div>
        </div>

        {/* Tile 3: Printable QR Badges (Span 1) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4px] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <QrCode className="w-5 h-5" strokeWidth={2} />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                Physical Utility
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Vector QR Badges
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Export high-resolution SVG and PNG badges ready for physical printing. Stick them on
              gate pillars, apartment buzzers, or parcel delivery drop boxes.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-[4px] flex items-center gap-3">
            <div className="w-9 h-9 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[2px] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
              Scan with any mobile camera. Works without proprietary apps.
            </div>
          </div>
        </div>

        {/* Tile 4: Sovereign Address Book Management (Span 2) */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4px] p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Building2 className="w-5 h-5" strokeWidth={2} />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                Multi-Address Hub
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Centralized Address Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Manage multiple properties from a single interface: your primary residence, weekend
              home, studio, or family premises. Update buzzer codes or delivery instructions
              without changing your printed QR badges or sharing new links.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Edit notes anytime</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Instant QR regeneration</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Doorway photo updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Conversion Action Card */}
      <div className="bg-zinc-950 text-white rounded-[4px] p-6 sm:p-8 space-y-6 shadow-md border border-zinc-800">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ready to Lock in Your Doorway Pin?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Create an account in 30 seconds. No phone spam, no tracking cookies, and zero
            proprietary lock-in.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/register"
            id="why-join-register-cta"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[4px] bg-[#FF6B00] text-white text-xs sm:text-sm font-semibold hover:bg-[#e05e00] active:scale-[0.98] transition-transform duration-100 ease-out shadow-xs cursor-pointer font-sans"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            id="why-join-login-cta"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[4px] border border-zinc-700 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs sm:text-sm font-semibold active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer font-sans"
          >
            <span>Sign In to Existing Account</span>
          </Link>
          <Link
            href="/create"
            id="why-join-try-guest-cta"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 sm:ml-2 py-2 transition-colors cursor-pointer"
          >
            <span>Try as guest first</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
