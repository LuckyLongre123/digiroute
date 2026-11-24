import { ArrowLeft, ShieldCheck } from 'lucide-react';
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

const codeClass =
  'bg-muted border-border text-foreground rounded border px-1.5 py-0.5 font-mono text-[0.9em] font-medium';

const linkClass =
  'pressable text-primary font-semibold underline underline-offset-2 transition-colors hover:text-primary/80';

const accentLinkClass =
  'pressable text-accent font-semibold underline underline-offset-2 transition-colors hover:text-accent/80';

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          Last updated:{' '}
          <time dateTime="2026-11-24" className="text-foreground font-semibold">
            24 November 2026
          </time>
          . Effective immediately for all DigiRoute users and API consumers.
        </p>
      </header>

      {/* Takedown SLA Highlight */}
      <section className="bg-accent/5 border-accent/40 rounded border p-5 md:p-6">
        <div className="text-accent mb-2 text-xs font-semibold tracking-wider uppercase">
          Doorway Photo Takedown &amp; Resident Protection Policy
        </div>
        <p className="text-foreground text-sm leading-relaxed md:text-base">
          DigiRoute operates a strict 24-hour takedown guarantee. If an
          unauthorized doorway photo of your home or property was mapped without
          your permission, submit a takedown report through our{' '}
          <Link href="/contact" className={accentLinkClass}>
            Contact Form
          </Link>{' '}
          selecting the &quot;Doorway Photo Takedown&quot; category. Once
          verified, our compliance team purges the imagery across all CDN caches
          and database storage within{' '}
          <strong className="font-semibold">24 business hours</strong>.
        </p>
      </section>

      {/* Terms Clauses */}
      <div className="space-y-8 md:space-y-10">
        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">1.</span> Age Requirement &amp;
            Eligibility
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            By accessing or using DigiRoute, you represent and warrant that you
            are at least{' '}
            <strong className="text-foreground font-semibold">
              13 years of age
            </strong>{' '}
            (or the legal age of digital consent in your jurisdiction), or that
            you are using the platform under the direct supervision and
            authorization of a parent or legal guardian. If you are under 13,
            you may not register for an account or publish micro-addresses.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">2.</span> Acceptable Use for Doorway
            Visual Lock
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            The Visual Lock feature is engineered strictly to guide delivery
            couriers, visitors, and emergency responders to legitimate pedestrian
            entryways. When capturing and publishing doorway photos:
          </p>
          <ul className="text-muted-foreground marker:text-primary list-disc space-y-2 pl-5 text-sm leading-relaxed md:text-base">
            <li>
              <strong className="text-foreground font-semibold">
                Authorized Properties Only:
              </strong>{' '}
              You may only capture entryways for premises you own, lease, or
              have explicit permission from the resident or property owner to
              map.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                Live Hardware Camera Mandatory:
              </strong>{' '}
              All doorway captures must originate from a live device camera
              session. The creation wizard strictly blocks pre-existing gallery
              uploads and file pickers to prevent spoofing.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                No Human Faces or Sensitive Media:
              </strong>{' '}
              Capturing people&apos;s faces, vehicle license plates,
              financial/personal documents, or interior private living quarters
              is strictly prohibited.
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                Zero Tolerance for Abusive Imagery:
              </strong>{' '}
              Uploading defamatory, obscene, or fraudulent media will result in
              immediate micro-address revocation and permanent account
              termination.
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">3.</span> Account Responsibilities
            &amp; Passcode Security
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            You are responsible for maintaining the confidentiality of your
            account credentials and any access passcodes you attach to your
            micro-address cards. DigiRoute cannot recover lost passcodes for
            private recipient cards. You agree to notify us immediately if you
            suspect any unauthorized access to your account.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">4.</span> Emergency SOS Disclaimer
            &amp; Limitation of Liability
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            DigiRoute provides geographical coordinate calculation, India Post
            DIGIPIN geocodes, and 1-tap dialer triggers to assist in locating
            physical doorsteps.
          </p>
          <div className="bg-destructive/5 border-destructive/30 rounded border p-4 md:p-5">
            <div className="text-destructive mb-1.5 text-xs font-semibold tracking-wider uppercase">
              Critical Safety Notice
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
              DigiRoute is not an official public safety answering point (PSAP)
              and is not a substitute for official government emergency dispatch
              services. In any life-threatening situation, always dial{' '}
              <strong className="text-foreground font-semibold">
                112 (National Emergency Number of India)
              </strong>{' '}
              or your local emergency authority directly. DigiRoute disclaims
              all liability for dispatch delays, telecommunications
              interruptions, device battery exhaustion, or GPS satellite
              inaccuracies.
            </p>
          </div>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">5.</span> Intellectual Property
            &amp; Sovereign Geocodes
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            DIGIPIN is a sovereign addressing standard established by the
            Department of Posts, Government of India. DigiRoute implements
            mathematical calculation algorithms strictly compliant with the
            national specification. You retain ownership of personal photos and
            delivery routing notes you upload, granting DigiRoute a non-exclusive
            license solely to serve those assets to invited recipients of your
            address cards.
          </p>
        </section>

        {/* 6 */}
        <section className="border-border space-y-3 border-t pt-8">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            <span className="text-primary">6.</span> Inquiries &amp; Takedown
            Submissions
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            DigiRoute does not process inquiries via unmonitored email inboxes.
            To submit a doorway photo takedown notice, report copyright
            infringement, or request assistance, use our official{' '}
            <Link href="/contact" className={linkClass}>
              Contact Form
            </Link>
            .
          </p>
        </section>
      </div>

      {/* Closing CTA */}
      <section className="bg-card border-border space-y-4 rounded border p-6 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex h-10 w-10 items-center justify-center rounded-full">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="mx-auto max-w-md space-y-1">
          <h3 className="text-foreground text-lg font-bold tracking-tight">
            Need to submit a takedown notice?
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed md:text-sm">
            Takedown requests, copyright reports, and assistance are handled
            through our secure contact form.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/contact"
            className="pressable bg-primary text-primary-foreground inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-semibold shadow-sm transition-transform duration-75 ease-out active:scale-[0.98]"
          >
            <span>Contact the team</span>
          </Link>
        </div>
      </section>
    </div>
  );
}