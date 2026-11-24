import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, AlertTriangle, ShieldCheck, Mail, Camera, UserCheck } from 'lucide-react';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'DigiRoute Terms of Service: age verification (13+), acceptable use for doorway captures, limitation of liability, and our 24-hour doorway photo takedown policy.',
  alternates: {
    canonical: `${BASE_URL}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 font-sans text-zinc-900 sm:py-16 dark:text-zinc-100">
      {/* Header */}
      <div className="mb-10 space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <div className="inline-flex items-center gap-1.5 rounded-[3px] border border-amber-600/30 bg-amber-950/20 px-2.5 py-1 font-mono text-xs font-semibold text-amber-500">
          <FileText className="h-3.5 w-3.5" />
          <span>Terms of Service · v1.0</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          DigiRoute Terms of Service
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Last updated: 24 November 2026 · Effective immediately for all DigiRoute users and API consumers
        </p>
      </div>

      {/* Doorway Takedown Policy Callout Banner */}
      <div className="mb-12 rounded-[4px] border border-amber-500/40 bg-amber-950/20 p-5 dark:border-amber-600/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-400">
              Doorway Photo Takedown &amp; Abuse Reporting Policy
            </h2>
            <p className="text-xs leading-relaxed text-zinc-300">
              If an unauthorized doorway visual lock photo of your residence or property was captured or published without your permission, you may submit a takedown request to{' '}
              <a href="mailto:takedown@digiroute.antideploy.com" className="font-mono font-semibold text-amber-400 underline hover:text-amber-300">
                takedown@digiroute.antideploy.com
              </a>
              . Our compliance team verifies property ownership or resident authorization and purges reported imagery across all CDNs within <strong>24 business hours</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Clauses */}
      <div className="space-y-8 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <UserCheck className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold">1. Age Requirement &amp; Eligibility</h2>
          </div>
          <p>
            By accessing or using DigiRoute, you represent and warrant that you are at least <strong>13 years of age</strong> (or the legal age of digital consent in your jurisdiction), or that you are accessing the service with the explicit authorization and supervision of a parent or legal guardian. If you are under 13, you may not register for an account or publish micro-addresses.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Camera className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold">2. Acceptable Use for Doorway Visual Lock</h2>
          </div>
          <p>
            The Visual Lock feature is engineered strictly to guide delivery couriers, visitors, and emergency responders to legitimate pedestrian entryways. When capturing and uploading doorway photos:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Authorized Locations Only:</strong> You may only capture entryways for properties you own, lease, or have explicit permission from the resident/owner to map.
            </li>
            <li>
              <strong>No Human Faces or Sensitive Imagery:</strong> Capturing people&apos;s faces, vehicle license plates, personal documents, or interior private living quarters is strictly prohibited.
            </li>
            <li>
              <strong>No Misleading or Obscene Media:</strong> Uploading stock photography, spoofed locations, abusive material, or defaced markers will result in immediate address termination and account suspension.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            3. Account Responsibilities &amp; Passcode Security
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and any access passcodes you attach to your micro-address cards. You agree to notify DigiRoute immediately of any unauthorized use or security compromise.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold">4. Emergency SOS Disclaimer &amp; Limitation of Liability</h2>
          </div>
          <p>
            DigiRoute provides spatial coordinate calculation, India Post DIGIPIN geocodes, and 1-tap dialer triggers to assist in locating physical doorsteps.
          </p>
          <p className="rounded-[3px] border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <strong>CRITICAL NOTICE:</strong> DigiRoute is not a replacement for official government emergency dispatch or public safety answering points. In any life-threatening situation or emergency, dial <strong>112 (National Emergency Number of India)</strong> or your local emergency authority directly. DigiRoute disclaims all liability for dispatch delays, network connectivity failures, or inaccurate device GPS readings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            5. Intellectual Property &amp; Sovereign Geocodes
          </h2>
          <p>
            DIGIPIN is a sovereign addressing standard established by the Department of Posts, Government of India. DigiRoute implements mathematical calculation algorithms compliant with the national specification. You retain ownership of personal photos and delivery notes you upload, granting DigiRoute a non-exclusive license solely to serve those assets to invited recipients of your address cards.
          </p>
        </section>

        <section className="space-y-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Mail className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold">6. Takedown Requests &amp; Contact Information</h2>
          </div>
          <p>
            For legal notices, terms inquiries, or doorway photo takedown reports, contact:
          </p>
          <div className="mt-2 rounded-[3px] border border-zinc-200 bg-zinc-50 p-3.5 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
            <div>DigiRoute Legal &amp; Compliance Team</div>
            <div>Takedown &amp; Abuse: <a href="mailto:takedown@digiroute.antideploy.com" className="text-amber-500 underline">takedown@digiroute.antideploy.com</a></div>
            <div>General Support: <a href="mailto:contact@digiroute.antideploy.com" className="text-amber-500 underline">contact@digiroute.antideploy.com</a></div>
            <div>Official Portal: <Link href="/" className="text-amber-500 underline">https://digiroute.antideploy.com</Link></div>
          </div>
        </section>
      </div>
    </div>
  );
}
