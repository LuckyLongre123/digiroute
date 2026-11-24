import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digiroute.antideploy.com';
const BASE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact DigiRoute for general inquiries, bug reports, user feedback, and doorway photo takedown requests. All requests are routed securely to our team.',
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 font-sans sm:py-16">
      {/* Header */}
      <div className="mb-8 space-y-2 border-b border-zinc-800 pb-6">
        <div className="inline-flex items-center rounded-[3px] border border-orange-500/30 bg-orange-950/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-orange-400">
          Direct Transmission
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          Contact DigiRoute
        </h1>
        <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
          Submit general inquiries, feedback, bug reports, or doorway photo takedown requests. Verified takedown requests are processed within 24 business hours.
        </p>
      </div>

      {/* Form Container */}
      <div className="rounded-[4px] border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
