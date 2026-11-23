# DigiRoute 📍

> **Sovereign 4m-Precision Doorstep Navigation & Digital Address Infrastructure for India**

[![Live Demo](https://img.shields.io/badge/Live%20Web%20App-digiroute.antideploy.com-ea580c?style=for-the-badge&logo=globe)](https://digiroute.antideploy.com)
[![Android APK](https://img.shields.io/badge/Download-Android%20APK-16a34a?style=for-the-badge&logo=android)](https://digiroute.antideploy.com/download)
[![YouTube Video](https://img.shields.io/badge/YouTube-Watch%20Official%20Demo-dc2626?style=for-the-badge&logo=youtube)](https://youtu.be/_AtHaqphT30)
[![Technical Spec](https://img.shields.io/badge/Technical%20Docs-DIGIROUTE__MASTER__DOC.md-2563eb?style=for-the-badge&logo=readme)](./DIGIROUTE_MASTER_DOC.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

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
| 🎥 **YouTube Video** | Full 60s feature showcase & architecture demo | [https://youtu.be/_AtHaqphT30](https://youtu.be/_AtHaqphT30) |
| 📖 **Technical Master Doc** | Comprehensive engineering specification & architecture | [DIGIROUTE_MASTER_DOC.md](./DIGIROUTE_MASTER_DOC.md) |
| 📦 **GitHub Releases** | Official distribution packages, releases & release notes | [GitHub Releases](https://github.com/LuckyLongre123/digiroute/releases) |

---

## 🚀 The Last-50-Meters Problem

Traditional GPS mapping and commercial navigation stop at the street or boundary curb. In India's dense cities, gated colonies, multi-unit buildings, and rural sectors:
- **Couriers and visitors get stranded in alleys and ambiguous gates.**
- **Doorway photos and entrance details are lost in unstructured phone calls.**
- **Personal phone numbers are exposed on delivery packaging, leading to harassment and data leaks.**

**DigiRoute** completely eliminates last-mile delivery friction by bridging the gap between national cartographic data and the physical doorstep. It combines India's official **DIGIPIN standard (Department of Posts)** with decoupled pedestrian entrance pins, privacy cloaking, high-contrast QR badges, and an offline-capable native Android app.

---

## ✨ Core Capabilities

### 1. 5-Step Sovereign Address Creation Flow
* **Step 1: Base Location Lock** – High-accuracy GPS lock within sovereign WGS84 bounding coordinates.
* **Step 2: Doorway Visual Lock** – EXIF-stripped, authenticated doorstep photo upload to eliminate visual ambiguity.
* **Step 3: Entrance Pinning** – Micro-calibrated pedestrian entryway coordinates decoupled from building centroids.
* **Step 4: Details & Privacy Cloaking** – Strict access windows, custom delivery notes, and phone number cloaking against scraping.
* **Step 5: Review & Instant Publish** – Instant live digital address card with verifiable cryptographic badges.

### 2. DIGIPIN Integration (4m × 4m Grid)
* Generates sovereign 10-character alphanumeric geocodes under India's national addressing grid.
* Hierarchical alphanumeric lattice with deterministic mathematical encoding/decoding that functions **completely offline**.

### 3. Printable QR Doorway Badges
* Generates high-contrast physical doorway plaques with embedded 10-character DIGIPINs and central DigiRoute emblems.
* Suitable for physical gates, apartment lobbies, parcel drops, and boundary walls.

### 4. Native Android Companion App
* **Zero-Latency ML Kit QR Scanner**: Instant hardware-accelerated code capture.
* **Offline-First Routing**: Local mathematical DIGIPIN resolution with OpenStreetMap & OpenRouteService vectors.
* **Compass HUD**: Live directional orientation guiding delivery agents straight to the doorway lock.

### 5. Emergency 112 SOS & Live Radar Tracking
* One-tap emergency broadcast transmitting the exact doorstep DIGIPIN directly to emergency response teams.
* Real-time distance and vector tracking for emergency responders and field units.

---

## 🛠️ Architecture & Tech Stack

```
digiroute-workspace/
├── frontend/               # Next.js 16 Web Dashboard & Address Creator
│   ├── app/                # App Router (Pages, API routes, Layouts)
│   ├── components/         # Utilitarian UI components & map widgets
│   ├── lib/                # DIGIPIN math, database clients, utilities
│   └── brag-output/        # Showcase video (intro.mp4) & posters
├── backend/                # Backend services & database persistence
└── digiroutes_app/         # Flutter Android Native Application
    ├── lib/core/           # Offline DIGIPIN engine & location service
    └── lib/ui/             # ML Kit scanner HUD, Map screens, SOS radar
```

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Web Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Data & Persistence** | Prisma ORM, PostgreSQL / MongoDB, Dexie.js (Offline Cache), Zustand 5 |
| **Media & Assets** | Cloudinary CDN (Signed uploads with automated EXIF stripping) |
| **Mobile App (Android)** | Flutter 3.x, Dart, Riverpod 2.6, Google ML Kit Barcode Scanning |
| **Geospatial & Maps** | OpenStreetMap (OSM), Leaflet / flutter_map, OpenRouteService API, DIGIPIN Engine |
| **Aesthetics** | Refined Utilitarian Design System (Zinc/Amber palette, 4px geometry) |

---

## 💻 Quick Start & Local Setup

### Web Application (`frontend/`)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (npm or bun)
npm install
# or
bun install

# 3. Set environment variables in .env
cp .env.example .env

# 4. Push database schema
npx prisma db push

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the web application.

### Native Android App (`digiroutes_app/`)

```bash
# 1. Navigate to mobile directory
cd digiroutes_app

# 2. Get dependencies
flutter pub get

# 3. Launch on connected Android device or emulator
flutter run
```

---

## 👥 Minor Project-I Team Credits

This project was developed for **Minor Project-I** by:

| Name | Roll Number | Role |
| :--- | :--- | :--- |
| **Lucky** | **24107037** | Full-Stack & System Architecture |
| **Kush Kumar** | **24107035** | Core Development & Integration |
| **Karan Kumar** | **24107030** | Geospatial Engine & Mobile UI |
| **Namish Kaushik** | **24107042** | Research, QA & Documentation |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
