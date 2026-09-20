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
      desc: "A live photo of your actual doorway and nameplate. Couriers see exactly what they are looking for before knocking, eliminating door-to-door guessing in identical corridors.",
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
    <div className="py-6 md:py-10 animate-in fade-in duration-150 space-y-10">
      {/* Back nav */}
      <div>
        <Link
          href="/"
          className="pressable inline-flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Header */}
      <section className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 text-accent text-xs font-semibold tracking-wide">
          <Zap className="w-3.5 h-3.5" />
          <span>Sovereign Indian Navigation</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
          Stop explaining your address on phone calls.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          No more cold food deliveries, confused couriers wandering colony lanes, or stepping out to the main road to wave someone down. DigiRoute solves the notorious &ldquo;last 50 meters&rdquo; in Indian cities.
        </p>
      </section>

      {/* Before / After Comparison */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pain Point */}
        <div className="p-5 rounded bg-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold text-xs uppercase tracking-wider">
            <XCircle className="w-4 h-4" />
            <span>The Status Quo: Frustration</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground bg-muted p-3 rounded leading-relaxed border border-border">
            &ldquo;3rd right after mother dairy, opposite blue water tank, yellow building, call me when you reach gate 2...&rdquo;
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>3+ frantic phone calls during dinner</li>
            <li>GPS leads to a locked boundary wall</li>
            <li>Couriers get lost in identical corridors</li>
          </ul>
        </div>

        {/* The DigiRoute Solution */}
        <div className="p-5 rounded bg-card border border-accent/40 space-y-3 ring-1 ring-accent/20">
          <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>The DigiRoute Way: Doorway Lock</span>
          </div>
          <p className="font-mono text-xs text-foreground bg-accent/5 p-3 rounded leading-relaxed border border-accent/20">
            One clean link with 4m GPS pin + Live Doorway Photo + Gate Entrance + Floor 4, Flat 402.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Zero phone calls needed</li>
            <li>Couriers recognize your doorway in 2 seconds</li>
            <li>Works instantly in any mobile browser</li>
          </ul>
        </div>
      </section>

      {/* The 4-Factor Micro-Address Grid - No Numbered Eyebrows */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
            How DigiRoute Locks Your Doorstep
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Every sovereign micro-address is formed by four deterministic factors that leave zero room for error.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {factors.map((factor) => {
            const Icon = factor.icon;
            return (
              <div
                key={factor.title}
                className="bg-card border border-border rounded p-5 flex flex-col justify-between hover:border-primary/40 transition-colors space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                      {factor.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground">
                    {factor.title}
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {factor.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Common Questions</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid gap-3">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="bg-card border border-border rounded p-4 space-y-1.5"
            >
              <h3 className="text-sm font-semibold text-foreground">
                {faq.q}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-card border border-border rounded p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Ready to ditch confusing directions?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create your sovereign micro-address in under 60 seconds. No app install or registration required.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/create"
            className="pressable inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold text-sm px-6 py-3 rounded active:scale-[0.98] transition-transform duration-75 ease-out shadow-sm"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Share your location now</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
