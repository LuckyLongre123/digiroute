'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { submitContactMessageAction } from '@/app/actions/contact';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  'General Inquiry',
  'Doorway Photo Takedown',
  'Bug / Technical Issue',
  'Feedback',
] as const;

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<string>('General Inquiry');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Please provide a message with at least 10 characters.');
      return;
    }

    startTransition(async () => {
      const res = await submitContactMessageAction({
        name,
        email,
        category,
        message,
      });

      if (res.success) {
        setSubmittedId(res.messageId || 'CONFIRMED');
      } else {
        setErrorMessage(res.error || 'Failed to send message. Please try again.');
      }
    });
  };

  if (submittedId) {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Message Received
          </h2>
          <p className="text-xs leading-relaxed text-zinc-400">
            Thank you for reaching out. Your transmission has been securely logged with our compliance and administrative team.
          </p>
          {category === 'Doorway Photo Takedown' && (
            <p className="mx-auto max-w-md rounded-[4px] border border-orange-500/20 bg-orange-950/20 p-3 text-xs text-orange-300">
              Doorway takedown requests are prioritized and processed within 24 business hours. If verified, imagery will be permanently purged across all cache layers.
            </p>
          )}
        </div>

        <div className="pt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setName('');
              setEmail('');
              setMessage('');
              setCategory('General Inquiry');
              setSubmittedId(null);
            }}
            className="w-full sm:w-auto rounded-[4px] border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Send Another Message
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500"
          >
            <span>Return Home</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-[4px] border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400"
        >
          {errorMessage}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="contact-name" className="block text-xs font-medium text-zinc-300">
          Full Name <span className="text-orange-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aditi Sharma"
          disabled={isPending}
          className="w-full rounded-[4px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="block text-xs font-medium text-zinc-300">
          Email Address <span className="text-orange-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. aditi@example.com"
          disabled={isPending}
          className="w-full rounded-[4px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        />
        <p className="text-[11px] text-zinc-500">
          Used solely to respond to your specific inquiry or request.
        </p>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="contact-category" className="block text-xs font-medium text-zinc-300">
          Topic / Category <span className="text-orange-500">*</span>
        </label>
        <select
          id="contact-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isPending}
          className="w-full rounded-[4px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="contact-message" className="block text-xs font-medium text-zinc-300">
            Message <span className="text-orange-500">*</span>
          </label>
          <span className="text-[11px] text-zinc-500">{message.length}/3000</span>
        </div>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            category === 'Doorway Photo Takedown'
              ? 'Please provide the address slug, URL, or DIGIPIN, and details proving residence or ownership of the property...'
              : 'Describe your inquiry, issue, or feedback in detail...'
          }
          disabled={isPending}
          maxLength={3000}
          className="w-full rounded-[4px] border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Transmitting Message...</span>
          </>
        ) : (
          <span>Submit Transmission</span>
        )}
      </button>

      {/* Legal Footer Note */}
      <p className="pt-2 text-center text-[11px] text-zinc-500">
        By submitting, you agree to DigiRoute&apos;s{' '}
        <Link href="/privacy" className="underline hover:text-zinc-300">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link href="/terms" className="underline hover:text-zinc-300">
          Terms of Service
        </Link>
        .
      </p>
    </form>
  );
}
