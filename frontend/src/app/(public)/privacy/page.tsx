import type { Metadata } from 'next';
import Link from 'next/link';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'DigiRoute Privacy Policy: client-side EXIF stripping, NanoID URL cloaking, zero session tracking, and user consent management.',
  alternates: {
    canonical: `${BASE_URL}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 font-sans text-zinc-300 sm:py-16">
      {/* Header */}
      <div className="mb-10 space-y-3 border-b border-zinc-800 pb-8">
        <div className="inline-flex items-center rounded-[3px] border border-orange-500/30 bg-orange-950/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-orange-400">
          Sovereign Privacy Architecture · v1.1
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-xs text-zinc-400 sm:text-sm">
          Last updated: 24 November 2026 · Effective immediately for all DigiRoute services
        </p>
      </div>

      {/* Core Privacy Stance */}
      <div className="mb-10 rounded-[4px] border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
          Foundational Privacy Principle
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
          DigiRoute exists to guide delivery personnel, visitors, and emergency responders to exact physical doorways without compromising digital sovereignty. We do not sell personal data, do not serve behavioral advertisements, and do not deploy invasive session recording scripts. Personal coordinates and doorway imagery remain under citizen control.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-10 text-xs leading-relaxed sm:text-sm sm:leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            1. Information Handled
          </h2>
          <p className="text-zinc-400">
            When you register, create a micro-address, or browse public cards, DigiRoute processes:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Account Credentials:</strong> Name, email address, phone number (optional), and securely salted password hash when an account is registered.
            </li>
            <li>
              <strong className="text-zinc-200">Spatial Micro-Address Coordinates:</strong> High-precision WGS84 coordinates, 10-character India Post DIGIPIN geocodes, and user-refined entrance pin offsets.
            </li>
            <li>
              <strong className="text-zinc-200">Doorway Visual Lock Imagery:</strong> Compressed WebP photos of building doorways captured exclusively through the live device camera.
            </li>
            <li>
              <strong className="text-zinc-200">Legal Consent Audit Logs:</strong> Normalized timestamp, consent action (<code className="font-mono text-zinc-300">ACCEPTED</code> or <code className="font-mono text-zinc-300">REVOKED</code>), policy version, and source recorded when confirming or toggling terms consent.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            2. How Data is Used
          </h2>
          <p className="text-zinc-400">
            Collected data is utilized strictly for technical functionality and direct doorstep navigation:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>Resolving exact 4m × 4m geographical cells via mathematical DIGIPIN calculation.</li>
            <li>Displaying verified doorway visual proof and entrance landmark notes to authorized visitors.</li>
            <li>Facilitating 1-tap 112 emergency service dispatch with exact location beacons.</li>
            <li>Enforcing account security, session persistence, and anti-abuse limits.</li>
          </ul>
          <p className="text-zinc-400">
            We never sell, rent, monetize, or profile your personal data or navigation histories.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            3. Client-Side EXIF Stripping &amp; Media Privacy
          </h2>
          <p className="text-zinc-400">
            Before any doorway photograph leaves your browser, it is processed entirely on the client side using the HTML5 Canvas API. All EXIF metadata — including camera manufacturer, hardware serial numbers, device model, and GPS coordinate tags embedded by the mobile operating system — is permanently stripped. Imagery is converted directly to optimized WebP format (max 250 KB) without metadata headers.
          </p>
          <p className="text-zinc-400">
            Furthermore, the creation wizard only operates with live hardware cameras (<code className="font-mono text-zinc-300">facingMode: &apos;environment&apos;</code>). Gallery pickers and file system uploads are strictly blocked to prevent spoofing or transmission of pre-existing photo collections.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            4. NanoID URL Cloaking &amp; Spatial Obfuscation
          </h2>
          <p className="text-zinc-400">
            Public sharing URLs do not expose raw 10-character DIGIPIN geocodes or decimal coordinates in path strings. Micro-addresses are assigned a cryptographically random, collision-resistant NanoID slug (<code className="rounded-[3px] border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-200">/a/[slug]</code>). This design prevents automated web crawlers and scrapers from indexing physical addresses or mapping residential identities.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            5. Ephemeral Addresses &amp; TTL Auto-Expiry
          </h2>
          <p className="text-zinc-400">
            Users have the option to publish temporary micro-addresses with an explicit Time-To-Live (TTL) duration (e.g., 2 hours, 24 hours, or 7 days). When the expiration timestamp is reached, the server immediately severs public access, marking the link inactive and preventing further viewing of the doorway photo or directions.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            6. Search Engine Indexing &amp; Privacy Guardrails
          </h2>
          <p className="text-zinc-400">
            DigiRoute enforces strict crawl boundaries:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Private &amp; Ephemeral Routes:</strong> All personal micro-address cards (<code className="font-mono text-zinc-300">/a/*</code>), user dashboards (<code className="font-mono text-zinc-300">/dashboard/*</code>), authentication screens (<code className="font-mono text-zinc-300">/login</code>, <code className="font-mono text-zinc-300">/register</code>), and administrative paths are explicitly served with <code className="font-mono text-zinc-300">robots: &#123; index: false, follow: false &#125;</code> and disallowed in <code className="font-mono text-zinc-300">/robots.txt</code>.
            </li>
            <li>
              <strong className="text-zinc-200">Public Indexes:</strong> Only static, non-personalized pages (<code className="font-mono text-zinc-300">/</code>, <code className="font-mono text-zinc-300">/about</code>, <code className="font-mono text-zinc-300">/download-app</code>, <code className="font-mono text-zinc-300">/privacy</code>, <code className="font-mono text-zinc-300">/terms</code>, <code className="font-mono text-zinc-300">/contact</code>) are registered in the canonical sitemap.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            7. User Consent &amp; Revocation Controls
          </h2>
          <p className="text-zinc-400">
            DigiRoute provides transparent, continuous control over your legal consents. You can review your active consent status or revoke consent at any time directly in your account settings at{' '}
            <Link href="/dashboard/settings" className="font-medium text-orange-400 underline hover:text-orange-300">
              Dashboard &gt; Settings
            </Link>
            . Revocation is recorded instantaneously without disrupting access to previously saved address book records.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3 border-t border-zinc-800 pt-8">
          <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
            8. Inquiries &amp; Doorway Photo Takedown
          </h2>
          <p className="text-zinc-400">
            DigiRoute does not operate unmonitored email mailboxes. All privacy inquiries, data deletion requests, and doorway photo takedown notices must be submitted directly through our secure{' '}
            <Link href="/contact" className="font-semibold text-orange-400 underline hover:text-orange-300">
              Contact Form
            </Link>
            .
          </p>
          <p className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400 sm:text-sm">
            <strong className="text-zinc-200">24-Hour Takedown SLA:</strong> If an unauthorized doorway photo of your property was published without consent, select the &quot;Doorway Photo Takedown&quot; category on the contact form and provide the address slug or URL. Our compliance team verifies resident authorization and permanently purges reported imagery across all edge caches and database storage within <strong>24 business hours</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
