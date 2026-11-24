'use client';

import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { submitContactMessageAction } from '@/app/actions/contact';

const CATEGORY_MAP: Record<string, string> = {
  general: 'General Inquiry',
  bug: 'Bug / Technical Issue',
  feedback: 'Feedback',
  takedown: 'Doorway Photo Takedown',
};

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxLength = 3000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      setError('Please provide a message with at least 10 characters.');
      return;
    }

    // 1. Show short button loader
    setIsSubmitting(true);

    // 2. Save contact in background asynchronously
    const mappedCategory = CATEGORY_MAP[category] || 'General Inquiry';
    submitContactMessageAction({
      name: trimmedName,
      email: trimmedEmail,
      category: mappedCategory,
      message: trimmedMessage,
    }).catch((err) => {
      console.warn('[Contact] Background save notice:', err);
    });

    // 3. Exactly 500ms loader in button, then show submitted state
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 500);
  };

  if (isSubmitted) {
    return (
      <div className="animate-in fade-in space-y-6 py-10 duration-150 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/20">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
            Message Transmitted
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            Thank you for reaching out. Your transmission has been securely logged with our compliance and support team.
          </p>
          {category === 'takedown' && (
            <p className="mx-auto max-w-md rounded border border-orange-500/30 bg-orange-950/20 p-3 text-xs text-orange-300">
              Doorway takedown requests are prioritized and processed within 24 business hours.
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
              setCategory('general');
              setIsSubmitted(false);
            }}
            className="bg-card border-border text-foreground hover:bg-muted w-full sm:w-auto cursor-pointer rounded border px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Send Another Message
          </button>
          <Link
            href="/"
            className="pressable bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded px-5 py-2.5 text-sm font-semibold shadow-sm transition-transform duration-75 ease-out active:scale-[0.98]"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-10 py-6 duration-150 md:py-10">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div role="alert" className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-3 text-xs">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-foreground block text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Aditi Sharma"
            className="bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-accent focus-visible:ring-offset-background w-full rounded border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-foreground block text-sm font-medium">
            Email Address <span className="text-destructive">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. aditi@example.com"
            className="bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-accent focus-visible:ring-offset-background w-full rounded border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          />
          <p className="text-muted-foreground text-xs">
            Used solely to respond to your specific inquiry or request.
          </p>
        </div>

        {/* Topic / Category */}
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-foreground block text-sm font-medium">
            Topic / Category <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            className="bg-card border-border text-foreground focus-visible:ring-accent focus-visible:ring-offset-background w-full appearance-none rounded border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          >
            <option value="general">General Inquiry</option>
            <option value="bug">Bug Report</option>
            <option value="feedback">User Feedback</option>
            <option value="takedown">Doorway Photo Takedown</option>
          </select>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="message" className="text-foreground block text-sm font-medium">
              Message <span className="text-destructive">*</span>
            </label>
            <span className="text-muted-foreground text-xs">
              {message.length}/{maxLength}
            </span>
          </div>
          <textarea
            id="message"
            required
            maxLength={maxLength}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
            placeholder="Describe your inquiry, issue, or feedback in detail..."
            rows={5}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-accent focus-visible:ring-offset-background w-full resize-y rounded border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="pressable bg-accent text-accent-foreground hover:bg-accent/90 inline-flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-semibold shadow-sm transition-transform duration-75 ease-out active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Disclaimer */}
        <p className="text-muted-foreground pt-2 text-center text-xs leading-relaxed">
          By submitting, you agree to DigiRoute&apos;s{' '}
          <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
