# DigiRoute

[![DigiRoute Promo Video](brag-output/intro.mp4)](brag-output/intro.mp4)

DigiRoute solves the last-50-meters navigation problem in India. It converts any exact doorstep location into a sovereign, highly accurate 10-character DIGIPIN, wrapping it in a shareable digital address card with entrance photos, routing notes, and printable QR badges.

---

## 📌 Core Features

* **5-Step Address Creation Flow**: Structured address generation workflow:
  1. **Base Location**: GPS coordinate lock with automatic WGS84 bounding.
  2. **Visual Lock**: Doorway and building facade capture to eliminate visual ambiguity.
  3. **Entrance Pin**: Decoupled pedestrian entrance marker separate from the building center.
  4. **Details & Privacy**: Access control configuration, delivery instructions, and contact cloaking.
  5. **Review & Publish**: Instant generation of the live sovereign address card and verifiable badge.
* **Privacy & Access Control**: Generate temporary guest and delivery passes with strict expiry windows (e.g., 15 minutes, 4 hours). Contact phone numbers remain cloaked to prevent data harvesting by third parties.
* **Printable QR Badges**: High-contrast physical door plaques featuring a central brand emblem and embedded 10-character code for gate, lobby, or parcel locker placement.
* **Native Android Companion App**: Offline-capable mobile client with a millisecond QR scanner HUD, local mathematical DIGIPIN decoding, and turn-by-turn route planning powered by OpenRouteService and OpenStreetMap.

---

## 🛠 Tech Stack

* **Web Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
* **Backend & Persistence**: Next.js Server Actions, MongoDB / PostgreSQL via Prisma ORM
* **Media Storage**: Cloudinary (signed uploads for verified doorway photographs)
* **Mobile Application**: Flutter (Android), `flutter_riverpod`, OpenStreetMap / Leaflet, OpenRouteService API
* **Design System**: Refined Utilitarian (Zinc/Slate palette, strict 4px `rounded-sm` geometry, zero extraneous visual clutter)

---

## 🚀 Quick Start & Installation

### Prerequisites

* Node.js 20.x or higher (or Bun 1.1+)
* Git
* A MongoDB connection string or PostgreSQL instance
* A Cloudinary account for photo storage

### 1. Clone the Repository

```bash
git clone https://github.com/LuckyLongre123/digiroute.git
cd digiroute/frontend
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using Bun:
```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database Connection (Prisma)
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/digiroute"

# Authentication
JWT_SECRET="your-secure-jwt-secret-key"

# Cloudinary (Media Storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Optional: Map Provider Keys
NEXT_PUBLIC_MAPPLS_API_KEY=""
```

### 4. Run Database Migrations / Sync

```bash
npx prisma db push
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🔗 Downloads & Live Links

* **Live Web Dashboard**: [https://digiroute.antideploy.com](https://digiroute.antideploy.com)
* **Android APK Download**: [https://digiroute.antideploy.com/download](https://digiroute.antideploy.com/download)
* **GitHub Releases**: [DigiRoute Releases](https://github.com/LuckyLongre123/digiroute/releases)

---

## 🗺 Future Roadmap

* **Emergency SOS Live Tracking**: Real-time beacon broadcast enabling users to transmit their precise 10-character doorstep DIGIPIN directly to first responders and emergency networks with live distance tracking.
* **Multi-Carrier Dispatch Integrations**: Standardized API webhooks for commercial delivery fleets (couriers, food delivery, and logistics providers) to query doorstep entrance pins programmatically.
* **Offline-First Mesh Relay**: Peer-to-peer BLE relay for sharing route vectors in connectivity-constrained basements and rural valleys.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
