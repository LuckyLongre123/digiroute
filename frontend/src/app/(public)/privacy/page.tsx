import { ArrowLeft, ShieldCheck } from 'lucide-react';
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

const codeClass =
  'bg-muted border-border text-foreground rounded border px-1.5 py-0.5 font-mono text-[0.9em] font-medium';

const linkClass =
  'pressable text-primary font-semibold underline underline-offset-2 transition-colors hover:text-primary/80';

export default function PrivacyPolicyPage() {
  return (
    <div className="animate-in fade-in space-y-10 py-6 duration-150 md:py-10">
      {/* Back nav */}
      <div>
        <Link
          href="/"
          className="pressable text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium transition-colors md:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-foreground text-2xl leading-tight font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          Last updated:{' '}
          <time dateTime="2026-11-24" className="text-foreground font-semibold">
            24 November 2026
          </time>
          . Effective immediately for all DigiRoute services.
        </p>
      </header>

      {/* Foundational Principle */}
      <section className="bg-primary/5 border-primary/20 rounded border p-5 md:p-6">
        <div className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
          Foundational Privacy Principle
        </div>
        <p className="text-foreground text-sm leading-relaxed md:text-base">
          DigiRoute exists to guide delivery personnel, visitors, and emergency
          responders to exact physical doorways without compromising digital
          sovereignty. We do not sell personal data, do not serve behavioral
          advertisements, and do not deploy invasive session recording scripts.
          Personal coordinates and doorway imagery remain under citizen control.
        </p>
      </section>

      {/* Policy Sections */}
      <div className="space-y-8 md:space-y-10">
        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">1.</span> Information Handled
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            When you register, create a micro-address, or browse public cards,
            DigiRoute processes:
          </p>
          <ul className="text-muted-foreground marker:text-primary list-disc space-y-2 pl-5 text-sm leading-relaxed md:text-base">
            <li>
              <strong className="text-foreground font-semibold">
                Account Credentials:
              </strong>{' '}
              Name, email address, phone number (optional), and securely salted
              password hash when an account is registered.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                Spatial Micro-Address Coordinates:
              </strong>{' '}
              High-precision WGS84 coordinates, 10-character India Post DIGIPIN
              geocodes, and user-refined entrance pin offsets.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                Doorway Visual Lock Imagery:
              </strong>{' '}
              Compressed WebP photos of building doorways captured exclusively
              through the live device camera.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                Legal Consent Audit Logs:
              </strong>{' '}
              Normalized timestamp, consent action (
              <code className={codeClass}>ACCEPTED</code> or{' '}
              <code className={codeClass}>REVOKED</code>), policy version, and
              source recorded when confirming or toggling terms consent.
            </li>
          </ul>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">2.</span> How Data is Used
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            Collected data is utilized strictly for technical functionality and
            direct doorstep navigation:
          </p>
          <ul className="text-muted-foreground marker:text-primary list-disc space-y-2 pl-5 text-sm leading-relaxed md:text-base">
            <li>
              Resolving exact 4m x 4m geographical cells via mathematical DIGIPIN
              calculation.
            </li>
            <li>
              Displaying verified doorway visual proof and entrance landmark
              notes to authorized visitors.
            </li>
            <li>
              Facilitating 1-tap 112 emergency service dispatch with exact
              location beacons.
            </li>
            <li>
              Enforcing account security, session persistence, and anti-abuse
              limits.
            </li>
          </ul>
          <p className="text-foreground text-sm leading-relaxed font-medium md:text-base">
            We never sell, rent, monetize, or profile your personal data or
            navigation histories.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">3.</span> Client-Side EXIF Stripping
            &amp; Media Privacy
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            Before any doorway photograph leaves your browser, it is processed
            entirely on the client side using the HTML5 Canvas API. All EXIF
            metadata, including camera manufacturer, hardware serial numbers,
            device model, and GPS coordinate tags embedded by the mobile
            operating system, is permanently stripped. Imagery is converted
            directly to optimized WebP format (max 250 KB) without metadata
            headers.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            Furthermore, the creation wizard only operates with live hardware
            cameras (
            <code className={codeClass}>
              facingMode: &apos;environment&apos;
            </code>
            ). Gallery pickers and file system uploads are strictly blocked to
            prevent spoofing or transmission of pre-existing photo collections.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">4.</span> NanoID URL Cloaking &amp;
            Spatial Obfuscation
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            Public sharing URLs do not expose raw 10-character DIGIPIN geocodes
            or decimal coordinates in path strings. Micro-addresses are assigned
            a cryptographically random, collision-resistant NanoID slug (
            <code className={codeClass}>/a/[slug]</code>). This design prevents
            automated web crawlers and scrapers from indexing physical addresses
            or mapping residential identities.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">5.</span> Ephemeral Addresses &amp;
            TTL Auto-Expiry
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            Users have the option to publish temporary micro-addresses with an
            explicit Time-To-Live (TTL) duration (for example, 2 hours, 24 hours,
            or 7 days). When the expiration timestamp is reached, the server
            immediately severs public access, marking the link inactive and
            preventing further viewing of the doorway photo or directions.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">6.</span> Search Engine Indexing
            &amp; Privacy Guardrails
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            DigiRoute enforces strict crawl boundaries:
          </p>
          <ul className="text-muted-foreground marker:text-primary list-disc space-y-2 pl-5 text-sm leading-relaxed md:text-base">
            <li>
              <strong className="text-foreground font-semibold">
                Private &amp; Ephemeral Routes:
              </strong>{' '}
              All personal micro-address cards (
              <code className={codeClass}>/a/*</code>), user dashboards (
              <code className={codeClass}>/dashboard/*</code>), authentication
              screens (<code className={codeClass}>/login</code>,{' '}
              <code className={codeClass}>/register</code>), and administrative
              paths are explicitly served with{' '}
              <code className={codeClass}>
                robots: &#123; index: false, follow: false &#125;
              </code>{' '}
              and disallowed in <code className={codeClass}>/robots.txt</code>.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                Public Indexes:
              </strong>{' '}
              Only static, non-personalized pages (
              <code className={codeClass}>/</code>,{' '}
              <code className={codeClass}>/about</code>,{' '}
              <code className={codeClass}>/download-app</code>,{' '}
              <code className={codeClass}>/privacy</code>,{' '}
              <code className={codeClass}>/terms</code>,{' '}
              <code className={codeClass}>/contact</code>) are registered in the
              canonical sitemap.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">7.</span> User Consent &amp;
            Revocation Controls
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            DigiRoute provides transparent, continuous control over your legal
            consents. You can review your active consent status or revoke consent
            at any time directly in your account settings at{' '}
            <Link href="/dashboard/settings" className={linkClass}>
              Dashboard &gt; Settings
            </Link>
            . Revocation is recorded instantaneously without disrupting access
            to previously saved address book records.
          </p>
        </section>

        {/* 8 */}
        <section className="border-border space-y-3 border-t pt-8">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">8.</span> Inquiries &amp; Doorway
            Photo Takedown
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            DigiRoute does not operate unmonitored email mailboxes. All privacy
            inquiries, data deletion requests, and doorway photo takedown notices
            must be submitted directly through our secure{' '}
            <Link href="/contact" className={linkClass}>
              Contact Form
            </Link>
            .
          </p>
          <div className="bg-card border-accent/40 rounded border p-4 md:p-5">
            <div className="text-accent mb-1.5 text-xs font-semibold tracking-wider uppercase">
              24-Hour Takedown SLA
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
              If an unauthorized doorway photo of your property was published
              without consent, select the &quot;Doorway Photo Takedown&quot;
              category on the contact form and provide the address slug or URL.
              Our compliance team verifies resident authorization and permanently
              purges reported imagery across all edge caches and database storage
              within{' '}
              <strong className="text-foreground font-semibold">
                24 business hours
              </strong>
              .
            </p>
          </div>
        </section>
      </div>

      {/* Closing CTA */}
      <section className="bg-card border-border space-y-4 rounded border p-6 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex h-10 w-10 items-center justify-center rounded-full">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="mx-auto max-w-md space-y-1">
          <h3 className="text-foreground text-lg font-bold tracking-tight">
            Questions about your data?
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed md:text-sm">
            Privacy inquiries and deletion requests are handled through our
            secure contact form.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/contact"
            className="pressable bg-accent text-accent-foreground inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-semibold shadow-sm transition-transform duration-75 ease-out active:scale-[0.98]"
          >
            <span>Contact the team</span>
          </Link>
        </div>
      </section>
    </div>
  );
}