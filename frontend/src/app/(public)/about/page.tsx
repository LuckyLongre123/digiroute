import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Layers,
  Navigation,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

/**
 * /about - Editorial Educational Guide
 *
 * Benefit-driven, empathetic copy addressing the real-world frustration of
 * Indian urban addressing ("the last 50 meters").
 * Strict Refined Utilitarian aesthetics: 4px radii, eye-care palette, clean typography.
 * Anti-slop verified: zero em-dashes, zero numbered eyebrows.
 */
export default function AboutPage() {
  const factors = [
    {
      title: 'Precise to 4 Metres',
      subtitle: '10-Character Sovereign DIGIPIN',
      icon: Navigation,
      tag: 'India Post Grid',
      desc: "Unlike 6-digit postal codes that cover whole neighbourhoods, DIGIPIN divides India into 4m x 4m cells. It mathematically locks your building's footprint with zero satellite drift.",
    },
    {
      title: 'Instant Doorway Recognition',
      subtitle: 'Visual Lock Photo',
      icon: Camera,
      tag: 'On-Site Camera Only',
      desc: 'A live photo of your actual doorway and nameplate. Couriers see exactly what they are looking for before knocking, eliminating door-to-door guessing in identical corridors.',
    },
    {
      title: 'The Right Entry Gate',
      subtitle: 'Entrance Pin Correction',
      icon: MapPin,
      tag: 'Zero Back-Alley Routing',
      desc: 'GPS navigation often directs drivers to a sealed perimeter wall or service gate. You manually drop the pin at the gate visitors should actually walk through.',
    },
    {
      title: 'Tower, Floor and Flat',
      subtitle: 'Z-Axis Vertical Context',
      icon: Layers,
      tag: 'High-Rise Ready',
      desc: 'Standard GPS only sees a flat 2D map. DigiRoute adds vertical depth (tower block, elevator bank, floor level, and flat number) to solve the high-rise maze.',
    },
  ];

  const faqs = [
    {
      q: 'Do delivery drivers need to install an app?',
      a: 'Never. When you share your DigiRoute link or stick a QR badge on your parcel, it opens immediately in any mobile browser. It gives the courier instant 1-tap navigation and shows your door photo.',
    },
    {
      q: 'What if I live in a multi-tower society or high-rise?',
      a: 'That is precisely what DigiRoute was built for. Conventional GPS marks the center of your apartment complex. DigiRoute guides drivers to your specific tower gate, then tells them your floor, unit, and exact entrance door.',
    },
    {
      q: 'Does this work when mobile data is slow or offline?',
      a: "Yes. DIGIPIN calculation runs 100% on your device's browser using GPS satellites, without needing an active internet connection. Your saved addresses and QR codes remain stored on your phone.",
    },
    {
      q: 'Is my doorway photo private?',
      a: 'Completely. Guest links automatically expire after 30 minutes. We never index your private doorway to public search engines. Only people you send the link to can see your micro-address.',
    },
    {
      q: 'Is DigiRoute free to use?',
      a: 'Yes, 100% free and open-source. No mandatory signup, no credit card, and zero advertisement trackers.',
    },
  ];

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

      {/* Hero Header */}
      <section className="space-y-3">
        <div className="bg-accent/10 text-accent inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold tracking-wide">
          <Zap className="h-3.5 w-3.5" />
          <span>Sovereign Indian Navigation</span>
        </div>
        <h1 className="text-foreground text-2xl leading-tight font-bold tracking-tight md:text-4xl">
          Stop explaining your address on phone calls.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed md:text-base">
          No more cold food deliveries, confused couriers wandering colony
          lanes, or stepping out to the main road to wave someone down.
          DigiRoute solves the notorious &ldquo;last 50 meters&rdquo; in Indian
          cities.
        </p>
      </section>

      {/* Before / After Comparison */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pain Point */}
        <div className="bg-card border-border space-y-3 rounded border p-5">
          <div className="text-destructive flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <XCircle className="h-4 w-4" />
            <span>The Status Quo: Frustration</span>
          </div>
          <p className="text-muted-foreground bg-muted border-border rounded border p-3 font-mono text-xs leading-relaxed">
            &ldquo;3rd right after mother dairy, opposite blue water tank,
            yellow building, call me when you reach gate 2...&rdquo;
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1.5 text-xs">
            <li>3+ frantic phone calls during dinner</li>
            <li>GPS leads to a locked boundary wall</li>
            <li>Couriers get lost in identical corridors</li>
          </ul>
        </div>

        {/* The DigiRoute Solution */}
        <div className="bg-card border-accent/40 ring-accent/20 space-y-3 rounded border p-5 ring-1">
          <div className="text-accent flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <CheckCircle2 className="h-4 w-4" />
            <span>The DigiRoute Way: Doorway Lock</span>
          </div>
          <p className="text-foreground bg-accent/5 border-accent/20 rounded border p-3 font-mono text-xs leading-relaxed">
            One clean link with 4m GPS pin + Live Doorway Photo + Gate Entrance
            + Floor 4, Flat 402.
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1.5 text-xs">
            <li>Zero phone calls needed</li>
            <li>Couriers recognize your doorway in 2 seconds</li>
            <li>Works instantly in any mobile browser</li>
          </ul>
        </div>
      </section>

      {/* The 4-Factor Micro-Address Grid - No Numbered Eyebrows */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            How DigiRoute Locks Your Doorstep
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Every sovereign micro-address is formed by four deterministic
            factors that leave zero room for error.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {factors.map((factor) => {
            const Icon = factor.icon;
            return (
              <div
                key={factor.title}
                className="bg-card border-border hover:border-primary/40 flex flex-col justify-between space-y-3 rounded border p-5 transition-colors"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-accent text-[11px] font-semibold tracking-wider uppercase">
                      {factor.tag}
                    </span>
                  </div>

                  <h3 className="text-foreground text-base font-bold">
                    {factor.title}
                  </h3>
                  <p className="text-muted-foreground mb-2 text-xs font-medium">
                    {factor.subtitle}
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {factor.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Conversational FAQs */}
      <section className="space-y-4 pt-2">
        <div className="space-y-1">
          <div className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Common Questions</span>
          </div>
          <h2 className="text-foreground text-lg font-bold tracking-tight md:text-xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid gap-3">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="bg-card border-border space-y-1.5 rounded border p-4"
            >
              <h3 className="text-foreground text-sm font-semibold">{faq.q}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-card border-border space-y-4 rounded border p-6 text-center">
        <div className="bg-accent/10 text-accent mx-auto flex h-10 w-10 items-center justify-center rounded-full">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="mx-auto max-w-md space-y-1">
          <h3 className="text-foreground text-lg font-bold tracking-tight">
            Ready to ditch confusing directions?
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Create your sovereign micro-address in under 60 seconds. No app
            install or registration required.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/create"
            className="pressable bg-accent text-accent-foreground inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-semibold shadow-sm transition-transform duration-75 ease-out active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4 fill-current" />
            <span>Share your location now</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
