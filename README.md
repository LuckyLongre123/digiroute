# DigiRoute 📍

> **Sovereign 4m-Precision Doorstep Navigation & Digital Address Infrastructure for India**

[![Live Demo](https://img.shields.io/badge/Live%20Web%20App-digiroute.antideploy.com-ea580c?style=for-the-badge&logo=globe)](https://digiroute.antideploy.com)
[![Android APK](https://img.shields.io/badge/Download-Android%20APK-16a34a?style=for-the-badge&logo=android)](https://digiroute.antideploy.com/download)
[![YouTube Video](https://img.shields.io/badge/YouTube-Watch%20Official%20Demo-dc2626?style=for-the-badge&logo=youtube)](https://youtu.be/_AtHaqphT30)
[![Technical Spec](https://img.shields.io/badge/Technical%20Docs-DIGIROUTE__MASTER__DOC.md-2563eb?style=for-the-badge&logo=readme)](./DIGIROUTE_MASTER_DOC.md)

---

## 🎬 Project Showcase & Demo Video

[![DigiRoute Promo Video](https://img.youtube.com/vi/_AtHaqphT30/maxresdefault.jpg)](https://youtu.be/_AtHaqphT30)

<p align="center">
  <a href="https://youtu.be/_AtHaqphT30">▶️ <b>Watch the 60-Second Official Demo Video on YouTube</b></a> &nbsp;|&nbsp;
  <a href="frontend/brag-output/intro.mp4">📥 <b>Download Local 1080p Video (MP4)</b></a>
</p>

---

## 🔗 Quick Links & Live Services

| Resource | Description | Direct Link |
| :--- | :--- | :--- |
| 🌐 **Live Web Platform** | Production web dashboard & 5-step address generator | [https://digiroute.antideploy.com](https://digiroute.antideploy.com) |
| 📱 **Android APK Download** | Production mobile client build for Android devices | [https://digiroute.antideploy.com/download](https://digiroute.antideploy.com/download) |
| 🎥 **YouTube Video** | Full 60s feature showcase & architecture walkthrough | [https://youtu.be/_AtHaqphT30](https://youtu.be/_AtHaqphT30) |
| 📖 **Technical Master Doc** | Comprehensive engineering specification & data model | [DIGIROUTE_MASTER_DOC.md](./DIGIROUTE_MASTER_DOC.md) |
| 📦 **GitHub Releases** | Official distribution packages & release notes | [GitHub Releases](https://github.com/LuckyLongre123/digiroute/releases) |

---

## 🚀 The Last-50-Meters Problem

Standard GPS mapping platforms stop at the road or building boundary. In India's dense urban sectors, multi-unit housing societies, and rural layouts:
- Couriers, emergency personnel, and visitors get stranded in unnamed alleys and ambiguous compound gates.
- Doorway photos and entrance directions are lost in unstructured phone calls.
- Personal phone numbers on delivery parcels lead to unwanted contact and data scraping.

**DigiRoute** resolves last-mile friction by bridging national cartographic grids with physical doorsteps. It pairs India's official **DIGIPIN standard (Department of Posts)** with decoupled pedestrian entrance coordinates, strict live-camera verification, dynamic privacy cloaking, high-contrast QR doorway plaques, and offline geospatial decoding.

---

## ✨ Core Capabilities

### 1. 5-Step Sovereign Address Creation Flow
* **Step 1: Base Location Lock** – High-accuracy GPS lock within sovereign Indian WGS84 bounding coordinates.
* **Step 2: Doorway Visual Lock (Live Camera Only)** – Live web camera doorway capture strictly enforced (gallery and file uploads blocked to eliminate spoofing). Images undergo client-side HTML5 Canvas EXIF stripping and WebP compression (≤250 KB) before direct cloud storage.
* **Step 3: Entrance Pinning** – Micro-calibrated pedestrian entryway coordinates decoupled from building centroid markers.
* **Step 4: Details & Privacy Cloaking** – Configurable access time windows, custom delivery guidance, and phone number cloaking against scraping.
* **Step 5: Review & Instant Publish** – Instant digital address card generation with cryptographic verification badges.

### 2. DIGIPIN Integration (4m × 4m Grid)
* Encodes locations into sovereign 10-character alphanumeric geocodes under India's national addressing standard.
* Pure mathematical hierarchical lattice algorithm that operates **100% offline** with zero external API dependencies.

### 3. Mappls Sovereign Vector Maps & Resilient Fallbacks
* **Primary**: Mappls (MapmyIndia) vector SDK providing rich Indian land parcels, building footprints, and localized road networks.
* **Fallback**: Automatic client fallback to **Leaflet + OpenStreetMap (OSM)** tiles and OpenRouteService if vector map quotas or networks throttle.

### 4. Printable High-Contrast QR Doorway Badges
* Physical doorway signage generated with embedded 10-character DIGIPINs and central DigiRoute emblems.
* Optimized for high-contrast scanning on gates, apartment entrances, parcel lockers, and boundary walls.

### 5. Civic Defect Reporting (`/report`)
* Anonymous civic issue reporting (potholes, damaged streetlights, waterlogging, or blocked pathways).
* Defects are anchored directly to exact 4m × 4m DIGIPIN coordinates accompanied by live Visual Lock camera evidence.

### 6. Admin Portal & Visual Node Graph (`/admin`)
* Protected administration console secured by signed JWT tokens and session cookies.
* Interactive **ReactFlow** visual graph mapping live relationships between registered Users and Addresses.
* Comprehensive data management with inline metadata editing and cascade deletion.

### 7. Emergency 112 SOS Dispatch
* Instant one-tap emergency broadcast transmitting the exact doorstep DIGIPIN directly to emergency response services.
* Eliminates verbal location misunderstandings during critical rescue situations.

---

## 🔮 Roadmap & Future Scope

The following features represent active development tracks:
* **Live Tracking Radar**: Real-time vector orientation and proximity tracking for field couriers and emergency responders.
* **100m Community SOS Dispatch**: Ultra-local peer notification network alerting verified nearby neighbors in emergency situations.

---

## 🛡️ SEO, Accessibility & Production Engineering

DigiRoute is engineered to strict technical SEO, Core Web Vitals, and WCAG AA accessibility standards:

* **Search Engine Indexing & Privacy**: Dynamic `sitemap.xml` indexing public routes (`/`, `/download-app`, `/create`, `/scan`, `/sos`, `/report`). Privacy-first `robots.txt` and explicit `noindex, nofollow` shielding on ephemeral and private routes (`/a/[slug]`, `/dashboard/*`, `/admin/*`, `/api/*`).
* **Structured Data**: XSS-safe native Schema.org JSON-LD markup for `WebApplication`, `SoftwareApplication` (Android APK), and `Organization`.
* **Social Previews**: Dynamic 1200×630 Open Graph and Twitter summary cards generated via `next/og` using the Refined Utilitarian theme.
* **Semantic Accessibility (WCAG AA)**: Single `<h1>` hierarchy across all 35 routes, keyboard-accessible skip-to-content landmark, explicit ARIA labels on map controls, calibrated mobile touch targets across key navigation and interactive controls, and contrast ratios ≥4.5:1 on Zinc (#09090b) backgrounds.
* **Performance & Core Web Vitals**: Automatic AVIF/WebP image optimization, `next/font` zero-shift typography, and dynamic lazy loading with skeleton fallbacks for heavy map and graph components.
* **Security & Headers**: Production HTTP headers including strict HSTS, nosniff, Referrer-Policy, SAMEORIGIN, and explicit Permissions-Policy (`camera=(self), geolocation=(self)`).
* **Search Console Ready**: Native Google Search Console token verification hook via environment configuration.

---

## 🛠️ Architecture & Tech Stack

```
digiroute-workspace/
├── frontend/               # Next.js 16 Monolith (App Router)
│   ├── src/
│   │   ├── actions/        # Server actions (media management, address claims)
│   │   ├── app/            # App Router pages, layouts, and route handlers
│   │   ├── components/     # UI components, Mappls/Leaflet maps, dialogs
│   │   ├── hooks/          # Custom hooks (GPS lock, admin triggers)
│   │   ├── lib/            # Offline DIGIPIN engine, Prisma client, auth
│   │   ├── services/       # Client API service abstraction
│   │   └── store/          # Zustand state stores (camera, map, address)
│   └── brag-output/        # Verified promo media (intro.mp4, posters)
└── DIGIROUTE_MASTER_DOC.md # Comprehensive engineering specification
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Web Framework** | Next.js 16.3.4 (App Router, Turbopack) | Monolithic full-stack web application & route handlers |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide Icons | Responsive Refined Utilitarian interface (#09090b / #f97316) |
| **Database & ORM** | Prisma 8 ORM + Neon PostgreSQL | Relational persistence with local JSON fallback for offline dev |
| **State Management** | Zustand 5 & Dexie.js (IndexedDB) | Reactive UI stores and persistent client-side address cache |
| **Media Pipeline** | Cloudinary CDN | Direct client-side unsigned WebP uploads (EXIF stripped) |
| **Maps & Routing** | Mappls SDK, Leaflet / OSM, OpenRouteService | Vector map display, fallback raster tiles, and routing engine |
| **Graph Visualization** | @xyflow/react (ReactFlow) | Visual node and edge mapping in the admin dashboard |
| **Offline Addressing** | digipinjs-lib & In-House DIGIPIN Engine | 4m × 4m deterministic mathematical lattice resolution |

---

## 💻 Quick Start & Local Setup

### Prerequisites
- Node.js 20+ or [Bun](https://bun.sh) (recommended)
- PostgreSQL database (or Neon connection string)

### 0. Clone Repository
```bash
git clone https://github.com/LuckyLongre123/digiroute.git
cd digiroute/frontend
```

### 1. Setup & Installation (Bun Primary)
```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example .env

# Synchronize database schema
bunx prisma db push

# Launch development server
bun run dev
```

> **Note:** Bun is recommended for the fastest setup and parity with production. If you don't have Bun installed, you can run the equivalent `npm install`, `npx prisma db push`, and `npm run dev` commands.

Visit [http://localhost:3000](http://localhost:3000) to open the application.

---

## 👥 Core Team

| Member | Engineering Focus |
| :--- | :--- |
| **Lucky** | System Architecture, Full-Stack Development & Production Engineering |
| **Kush Kumar** | Core Systems, Database Architecture & API Integration |
| **Karan Kumar** | Geospatial Engine, Mappls/OSM Integration & Mobile UI |
| **Namish Kaushik** | Quality Assurance, Security Auditing & Technical Documentation |
