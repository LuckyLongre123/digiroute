import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, EyeOff, Lock, Clock, FileCheck, HardDrive } from 'lucide-react';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    "Learn about DigiRoute's sovereign privacy architecture: client-side EXIF stripping, NanoID URL cloaking, zero session tracking, and user consent management.",
  alternates: {
    canonical: `${BASE_URL}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 font-sans text-zinc-900 sm:py-16 dark:text-zinc-100">
      {/* Header */}
      <div className="mb-10 space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <div className="inline-flex items-center gap-1.5 rounded-[3px] border border-amber-600/30 bg-amber-950/20 px-2.5 py-1 font-mono text-xs font-semibold text-amber-500">
          <Shield className="h-3.5 w-3.5" />
          <span>Sovereign Privacy Architecture · v1.0</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          DigiRoute Privacy Policy
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Last updated: 24 November 2026 · Effective immediately for all DigiRoute services
        </p>
      </div>

      {/* Core Privacy Philosophy */}
      <div className="mb-12 rounded-[4px] border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
          Our Privacy Commitment
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          DigiRoute was built on a foundational principle: physical navigation to your doorstep must never compromise your digital privacy. We do not sell personal data, do not use behavioral ad trackers, and do not employ invasive session recording scripts. Our architecture guarantees that personal coordinates and doorway imagery remain under citizen control.
        </p>
      </div>

      {/* Privacy Pillars Grid */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[4px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 text-amber-500">
            <EyeOff className="h-4 w-4" />
            <h3 className="text-sm font-bold">Client-Side EXIF Stripping</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Every doorway photo captured in DigiRoute is processed entirely inside your browser via the HTML5 Canvas API before transmission. All EXIF metadata — including device serial numbers, camera lens data, and hardware timestamps — is permanently stripped.
          </p>
        </div>

        <div className="rounded-[4px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 text-amber-500">
            <Lock className="h-4 w-4" />
            <h3 className="text-sm font-bold">NanoID URL Cloaking</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Raw 10-character DIGIPIN codes and geographical coordinates are never exposed in public share URLs. Public cards use cryptographically collision-resistant NanoID slugs (<code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">/a/[slug]</code>) to shield spatial addresses from web scrapers and crawlers.
          </p>
        </div>

        <div className="rounded-[4px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4" />
            <h3 className="text-sm font-bold">Ephemeral TTL Auto-Expiry</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Users can generate temporary micro-addresses with an automatic Time-To-Live (TTL) expiry window. Once expired, access to the doorway visual lock and directions is immediately severed and flagged inactive.
          </p>
        </div>

        <div className="rounded-[4px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 text-amber-500">
            <HardDrive className="h-4 w-4" />
            <h3 className="text-sm font-bold">Zero Third-Party Trackers</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            DigiRoute uses zero session replay tools (e.g. Hotjar, FullStory), zero cross-site advertising pixels, and zero third-party font network CDNs. Typography is bundled and self-hosted via Next.js for complete GDPR compliance.
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-8 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            1. Information We Collect
          </h2>
          <p>
            When you create an account or generate a micro-address, DigiRoute processes:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Account Data:</strong> Name, email address, and securely salted password hash when you register.
            </li>
            <li>
              <strong>Spatial Micro-Address Data:</strong> WGS84 coordinates, 10-character India Post DIGIPIN geocodes, and user-specified entryway coordinates.
            </li>
            <li>
              <strong>Doorway Visual Lock Imagery:</strong> Compressed WebP photos of doorway entrances captured via live web camera.
            </li>
            <li>
              <strong>Legal Consent Audit Logs:</strong> Normalized timestamp, action (<code className="font-mono">ACCEPTED</code> or <code className="font-mono">REVOKED</code>), source, and policy version recorded when you confirm or update your Terms and Age consent.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            2. How Information is Used
          </h2>
          <p>
            We process collected information strictly for:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Facilitating precise doorstep navigation for delivery personnel, emergency responders, and invited visitors.</li>
            <li>Authenticating your account and authorizing management of your saved addresses.</li>
            <li>Complying with statutory audit requirements and maintaining an immutable consent ledger.</li>
            <li>Preventing abuse, duplicate submissions, and unauthorized doorway imagery.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            3. Search Engine Shielding &amp; Crawlability
          </h2>
          <p>
            DigiRoute maintains strict privacy-first indexing policies. Public marketing pages (<code className="font-mono">/</code>, <code className="font-mono">/download-app</code>, <code className="font-mono">/scan</code>) are indexed for public discoverability. In contrast, all personal routes (<code className="font-mono">/a/[slug]</code>), user dashboards (<code className="font-mono">/dashboard/*</code>), administration portals (<code className="font-mono">/admin/*</code>), and authentication screens are strictly shielded using <code className="font-mono">noindex, nofollow</code> headers and <code className="font-mono">robots.txt</code> exclusions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            4. Managing Your Consent &amp; Data Rights
          </h2>
          <p>
            You have full sovereignty over your data and consent preferences:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Instant Revocation:</strong> You can toggle or revoke your legal consent at any time inside{' '}
              <Link href="/dashboard/settings" className="text-amber-500 font-semibold underline hover:text-amber-400">
                Dashboard Settings
              </Link>
              . Revocation is recorded in our audit ledger immediately.
            </li>
            <li>
              <strong>Address Deletion:</strong> You can delete any saved micro-address at any time from your address book, which permanently deletes associated records and purges CDN imagery.
            </li>
            <li>
              <strong>Data Inquiries:</strong> To request account deletion or audit reports, contact{' '}
              <a href="mailto:privacy@digiroute.antideploy.com" className="text-amber-500 font-semibold underline hover:text-amber-400">
                privacy@digiroute.antideploy.com
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="space-y-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <FileCheck className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold">5. Contact &amp; Grievance Officer</h2>
          </div>
          <p>
            For privacy grievances, compliance inquiries, or data protection questions, please reach out to our privacy office:
          </p>
          <div className="mt-2 rounded-[3px] border border-zinc-200 bg-zinc-50 p-3.5 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
            <div>DigiRoute Privacy &amp; Legal Operations</div>
            <div>Email: <a href="mailto:privacy@digiroute.antideploy.com" className="text-amber-500 underline">privacy@digiroute.antideploy.com</a></div>
            <div>Platform: <Link href="/" className="text-amber-500 underline">https://digiroute.antideploy.com</Link></div>
          </div>
        </section>
      </div>
    </div>
  );
}
