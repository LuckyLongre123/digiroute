import type { Metadata } from 'next';
import Link from 'next/link';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'DigiRoute Terms of Service: age verification (13+), acceptable use for doorway captures, emergency SOS limitations, and our 24-hour doorway photo takedown policy.',
  alternates: {
    canonical: `${BASE_URL}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 font-sans text-zinc-300 sm:py-16">
      {/* Header */}
      <div className="mb-10 space-y-3 border-b border-zinc-800 pb-8">
        <div className="inline-flex items-center rounded-[3px] border border-orange-500/30 bg-orange-950/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-orange-400">
          Terms of Service · v1.1
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="text-xs text-zinc-400 sm:text-sm">
          Last updated: 24 November 2026 · Effective immediately for all DigiRoute users and API consumers
        </p>
      </div>

      {/* Takedown SLA Highlight Box */}
      <div className="mb-10 rounded-[4px] border border-orange-500/30 bg-orange-950/10 p-5">
        <h2 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">
          Doorway Photo Takedown &amp; Resident Protection Policy
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
          DigiRoute operates a strict 24-hour takedown guarantee. If an unauthorized doorway photo of your home or property was mapped without your permission, submit a takedown report through our{' '}
          <Link href="/contact" className="font-semibold text-orange-400 underline hover:text-orange-300">
            Contact Form
          </Link>{' '}
          selecting the &quot;Doorway Photo Takedown&quot; category. Once verified, our compliance team purges the imagery across all CDN caches and database storage within <strong>24 business hours</strong>.
        </p>
      </div>

      {/* Terms Clauses */}
      <div className="space-y-10 text-xs leading-relaxed sm:text-sm sm:leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            1. Age Requirement &amp; Eligibility
          </h2>
          <p className="text-zinc-400">
            By accessing or using DigiRoute, you represent and warrant that you are at least <strong>13 years of age</strong> (or the legal age of digital consent in your jurisdiction), or that you are using the platform under the direct supervision and authorization of a parent or legal guardian. If you are under 13, you may not register for an account or publish micro-addresses.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            2. Acceptable Use for Doorway Visual Lock
          </h2>
          <p className="text-zinc-400">
            The Visual Lock feature is engineered strictly to guide delivery couriers, visitors, and emergency responders to legitimate pedestrian entryways. When capturing and publishing doorway photos:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Authorized Properties Only:</strong> You may only capture entryways for premises you own, lease, or have explicit permission from the resident or property owner to map.
            </li>
            <li>
              <strong className="text-zinc-200">Live Hardware Camera Mandatory:</strong> All doorway captures must originate from a live device camera session. The creation wizard strictly blocks pre-existing gallery uploads and file pickers to prevent spoofing.
            </li>
            <li>
              <strong className="text-zinc-200">No Human Faces or Sensitive Media:</strong> Capturing people&apos;s faces, vehicle license plates, financial/personal documents, or interior private living quarters is strictly prohibited.
            </li>
            <li>
              <strong className="text-zinc-200">Zero Tolerance for Abusive Imagery:</strong> Uploading defamatory, obscene, or fraudulent media will result in immediate micro-address revocation and permanent account termination.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            3. Account Responsibilities &amp; Passcode Security
          </h2>
          <p className="text-zinc-400">
            You are responsible for maintaining the confidentiality of your account credentials and any access passcodes you attach to your micro-address cards. DigiRoute cannot recover lost passcodes for private recipient cards. You agree to notify us immediately if you suspect any unauthorized access to your account.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            4. Emergency SOS Disclaimer &amp; Limitation of Liability
          </h2>
          <p className="text-zinc-400">
            DigiRoute provides geographical coordinate calculation, India Post DIGIPIN geocodes, and 1-tap dialer triggers to assist in locating physical doorsteps.
          </p>
          <div className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300 sm:text-sm">
            <strong className="text-zinc-100">CRITICAL SAFETY NOTICE:</strong> DigiRoute is not an official public safety answering point (PSAP) and is not a substitute for official government emergency dispatch services. In any life-threatening situation, always dial <strong>112 (National Emergency Number of India)</strong> or your local emergency authority directly. DigiRoute disclaims all liability for dispatch delays, telecommunications interruptions, device battery exhaustion, or GPS satellite inaccuracies.
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            5. Intellectual Property &amp; Sovereign Geocodes
          </h2>
          <p className="text-zinc-400">
            DIGIPIN is a sovereign addressing standard established by the Department of Posts, Government of India. DigiRoute implements mathematical calculation algorithms strictly compliant with the national specification. You retain ownership of personal photos and delivery routing notes you upload, granting DigiRoute a non-exclusive license solely to serve those assets to invited recipients of your address cards.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 border-t border-zinc-800 pt-8">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            6. Inquiries &amp; Takedown Submissions
          </h2>
          <p className="text-zinc-400">
            DigiRoute does not process inquiries via unmonitored email inboxes. To submit a doorway photo takedown notice, report copyright infringement, or request assistance, use our official{' '}
            <Link href="/contact" className="font-semibold text-orange-400 underline hover:text-orange-300">
              Contact Form
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
