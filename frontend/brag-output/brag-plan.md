# Brag Plan: DigiRoute (60-Second Showcase)

## What is this app?

DigiRoute solves India's chaotic "last 50 meters" delivery problem by turning any doorway into a verified, sovereign 10-character micro-address — combining an official WGS84 DIGIPIN, a real-time doorway photo Visual Lock (with EXIF stripping), doorway map pin calibration, building routing hints, and privacy-first ephemeral sharing with printable QR badges and a native offline Android app.

## The angle: Refined Utilitarian

Addresses in India are complicated. 1.4 billion people describe their location as "near the temple, opposite tea stall, call when you reach." DigiRoute replaces guesswork with sovereign spatial precision: turning raw GPS coordinates into a sovereign 10-character DIGIPIN micro-address in a rapid 5-step flow.

## Design System & Theme
- **Vibe**: Premium, fast-paced, and minimalist ('Refined Utilitarian').
- **Canvas / Background**: Dark mode Zinc `#09090b` with subtle spatial grid lines.
- **Highlights**: Energetic Orange / Amber highlights (`#f97316` / `#fb923c`).
- **Accent Tokens**: Saffron `#FF7A1A`, Emerald `#22C55E`, Crimson `#DC2626`.
- **UI Elements**: Sharp edges (4px border-radius), clean sans-serif typography (Geist / Inter), monospace codes (Geist Mono), zero cluttered graphics.
- **Duration**: Exactly 60.0 seconds.
- **Format**: Landscape — 1920x1080, 30fps.

---

## 60-Second Storyboard & Script Breakdown

### Scene 1: The Hook & Problem (0:00 - 0:10 | 10.0s)
- **Visual**:
  - Fast typewriter text on dark Zinc `#09090b` screen: *"Addresses in India are complicated."*
  - Camera zooms into a chaotic street map with confused navigation pins (*"Near the temple?"*, *"Behind the blue gate?"*, *"Opposite tea stall?"*).
  - Fast transition to the DigiRoute brand logo glowing in energetic amber, revealing the official 10-character sovereign DIGIPIN: `39J-M99-P9CJ`.
- **Text Overlay**: "Turn any doorstep into a precise 10-character DIGIPIN."
- **Voiceover / Captions**: "Finding the exact door is a nightmare. DigiRoute solves this by turning your exact GPS coordinates into a highly accurate, 10-character sovereign micro-address."
- **Audio / SFX**: Rapid typewriter keypress ticks -> spatial whoosh -> heavy impact chime at DIGIPIN lock.

### Scene 2: The 5-Step Creation Flow (0:10 - 0:28 | 18.0s)
- **Visual**: Rapid, smooth fast-forwarded UI mockup showing the 5-step creation process with quick dynamic cuts:
  - **Step 1 (10.0s – 13.5s)**: *Establish Base Location* (`step1_base_location.png`). GPS Auto-Fix (±4m) & immediate WGS84 DIGIPIN calculation.
  - **Step 2 (13.5s – 17.0s)**: *Visual Lock* (`step2_visual_lock.png`). Real doorway photo capture with EXIF privacy stripping.
  - **Step 3 (17.0s – 20.5s)**: *Entrance Pin Refinement* (`step3_entrance_pin.png`). Doorway map pin micro-calibration.
  - **Step 4 (20.5s – 24.0s)**: *Details & Security* (`step4_details_security.png`). Floor/unit hints, 30-min guest link expiry, passcode lock.
  - **Step 5 (24.0s – 28.0s)**: *Review & Sovereign Link Ready* (Rendered directly from codebase `src/app/(create)/create/share/page.tsx` + `step5_address_live.png`). Sovereign micro-address link `digiroute.antideploy.com/a/dg-1bjh95u93Yuk` ready in seconds.
- **Text Overlay**: "5-Step Precision. Fast & Secure."
- **Voiceover / Captions**: "Creating your address is a seamless 5-step process. Pin your base location, add an optional visual lock photo, fine-tune the entrance pin, set your security details, and review. Your permanent digital address is ready in seconds."
- **Audio / SFX**: Dynamic interface clicks, camera shutter tick, pin snap, and bell hit on completion.

### Scene 3: Security & QR Codes (0:28 - 0:40 | 12.0s)
- **Visual**:
  - **Part A (28.0s – 34.0s)**: 3D address card flip revealing the clean, high-contrast Doorway QR Badge (`printable_qr_badge.png`) with verified DIGIPIN `8Z7X-6C5V-4B` and central DigiRoute badge.
  - **Part B (34.0s – 40.0s)**: Smooth transition to the Address Book Dashboard (`dashboard_address_book.png`) showcasing guest access controls with prominent "Expired", "Expires in 16m", and "Expires in 4h" security tags.
- **Text Overlay**: "Printable QR Badges. Expiring Links. 100% Privacy."
- **Voiceover / Captions**: "Print your Doorway QR Badge for visitors. Share temporary guest links that expire automatically, keeping your permanent details secure and completely private."
- **Audio / SFX**: 3D card flip whoosh -> QR scan chirp -> subtle UI click on security badges.

### Scene 4: The Native Android App (0:40 - 0:50 | 10.0s)
- **Visual**:
  - 3D modern smartphone frame with sleek zinc bezel showcasing the Flutter Android application:
  - **Part A (40.0s – 45.0s)**: *Native Scanner* (`android_qr_scanner.png`). Glowing amber viewfinder corners and animated laser scan HUD resolving doorway plates instantly with zero latency.
  - **Part B (45.0s – 50.0s)**: *Offline Route Planner* (`android_route_planner.png`). All-India interactive map with "Get My DIGIPIN" button and offline math coordinate decoding without internet.
- **Text Overlay**: "Native Power. Offline Math. Built-in Scanner."
- **Voiceover / Captions**: "Take it to the next level with our Native Android App. Experience built-in QR scanning, offline DIGIPIN decoding, and precise route planning without needing the internet."
- **Audio / SFX**: Laser scanner sweep SFX -> GPS target lock beep.

### Scene 5: The Future Roadmap & CTA (0:50 - 1:00 | 10.0s)
- **Visual**:
  - **Part A (50.0s – 55.5s)**: Direct code-rendered Emergency SOS & Live Radar Tracking UI from `src/app/(emergency)/sos/page.tsx` and `src/app/track/[id]/page.tsx`:
    - Crimson and zinc tactical HUD
    - Pulsating red SOS beacon at DIGIPIN `4M8K-9P2L-1X`
    - Live concentric radar waves with real-time responder telemetry: "Alert broadcast to 4 nearby helpers within 100m"
    - High-visibility "DIAL 112 NOW" thumb CTA & SMS intent
    - Floating roadmap pill: `THE FUTURE • EMERGENCY SOS LIVE TRACKING`
  - **Part B (55.5s – 60.0s)**: Transition to Grand Finale Call To Action:
    - Glowing amber DigiRoute wordmark with status beacon
    - Tagline: "Your exact location, simplified."
    - Final URL CTA: `digiroute.antideploy.com/download`
    - Subtitle: "Download the latest app from our official website"
- **Text Overlay**: "The Future: Emergency SOS Live Tracking."
- **Final Screen Text**: "Download the latest app from our official website: digiroute.antideploy.com/download"
- **Voiceover / Captions**: "We aren't stopping here. Next up: Emergency SOS live tracking for critical response. DigiRoute: Your exact location, simplified. Download the latest app from our official website."
- **Audio / SFX**: Emergency sonar pulse -> swell transition -> resonant brand chime; electronic music fades out gracefully to 60.0s.

---

## Audio Architecture
- **Track**: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (driving tech synth-wave, ~110 BPM).
- **Volume**: 0.35 baseline volume throughout, dipping gently under key impact cues, smooth fade-out from 58.0s to 60.0s.
- **SFX**: Multi-channel audio layer for keyboard typing, scene transitions, QR badge snaps, scanner sweeps, radar pings, and final brand chime.
