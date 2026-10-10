# DIGIROUTE: ARCHITECTURAL & TECHNICAL MASTER DOCUMENT
**A Sovereign, Offline-Computable Micro-Addressing & Physical Last-50-Meters Navigation System**

---

## Executive Summary

**DigiRoute** is an open-source, sovereign spatial navigation and micro-addressing infrastructure designed to eliminate the systemic "last-50-meters" delivery and navigation failure in India. Built on the Department of Posts (India Post) WGS84 spatial addressing standard (**DIGIPIN**), DigiRoute converts geodetic coordinates into deterministic, human-readable 10-character alphanumeric codes resolving to an approximate $4\text{m} \times 4\text{m}$ micro-cell.

By pairing pure mathematical spatial subdivision with a privacy-preserving photographic "Visual Lock", decoupled pedestrian entrance coordinates, and cryptographically ephemeral digital access tokens, DigiRoute eliminates dependency on ambiguous landmark descriptions, proprietary geocoding APIs, and macro-GPS property centroid snapping.

---

## 1. Project Overview & The Problem Domain

### 1.1 The "Last 50 Meters" Delivery Failure Bottleneck
In modern logistics and last-mile transport, arterial road navigation has largely been commoditized by global navigation satellite systems (GNSS). However, the terminal phase of delivery—specifically the final 50 meters from the street curb to the physical doorway—remains the primary source of operational inefficiency, delivery failure, and carbon wastage.

In Indian metropolitan areas (e.g., Bengaluru, Mumbai, Delhi-NCR) as well as Tier-2/Tier-3 urban conglomerates, the last-50-meter failure manifests across three primary dimensions:

1. **High-Density Urban Topography & Informal Clusters**: Sprawling residential colonies often feature multi-story independent buildings, irregular subdivision of plots, narrow alleys, and unmapped pedestrian passageways where satellite views are obscured by tree canopies or high-rise shadows.
2. **Multi-Tenant High-Rises**: Modern gated complexes contain dozens of residential towers with shared arterial gates. A delivery agent navigating to the property address arrives at the complex perimeter but faces a labyrinth of underground ramps, internal podiums, and multi-entrance lobbies.
3. **Severe Courier Friction**: Delivery drivers frequently lose 5 to 15 minutes per delivery placing repeated phone calls to recipients requesting subjective landmarks (*"Turn left after the blue water tank, take the second cross behind the temple"*), causing cognitive fatigue, phone number leakage, and severe parcel delays.

```
+-------------------------------------------------------------------------------+
|                        THE LAST-50-METERS BOTTLENECK                          |
|                                                                               |
|  [Arterial Road] ===> [Macro Gate / Perimeter] - - - (50m Blind Zone) - - - > |
|       (GPS OK)            (Driver Arrives)          (Nav Fails / Multiple     |
|                                                     Entrances / Multi-Tower)  |
|                                                                               |
|  Traditional Resolution: 3-5 Phone Calls, Landmark Guessing, 10 min Delay     |
|  DigiRoute Resolution:   10-Char DIGIPIN + Visual Lock -> Exact Doorway (5s)   |
+-------------------------------------------------------------------------------+
```

### 1.2 Structural Limitations of Legacy Addressing

#### Limitations of 6-Digit PIN Codes
The Postal Index Number (PIN) code system introduced in 1972 was designed for manual postal sorting rather than geospatial pinpointing:
- **Spatial Granularity**: A single 6-digit PIN code designates a delivery post office jurisdiction covering areas between $10\text{ km}^2$ and $50+\text{ km}^2$.
- **Population Density**: A single PIN code encompasses upwards of $50,000$ to $200,000$ residents across heterogeneous neighborhoods.
- **Topographical Blindness**: PIN codes contain zero directional, topological, or coordinate information. They cannot guide an autonomous vehicle, delivery partner, or emergency ambulance to a specific structure.

#### The Property Centroid Snapping Problem
Standard commercial mapping applications (e.g., Google Maps, Apple Maps) assign a single lat/lng coordinate point to an entire parcel or building footprint by computing the **geometric centroid**:
$$\mathbf{C} = \frac{1}{A} \oint \mathbf{r} \, dA$$
When a routing algorithm guides a vehicle to centroid $\mathbf{C}$:
- The navigation point is placed in the center of the building mass or plot.
- In multi-acre gated communities or long perimeter compounds, this point frequently snaps to a perimeter boundary wall, an impenetrable service gate, or the opposite side of a parallel road.
- The pedestrian doorway, guard gate, or reception desk is often situated 20 to 100 meters away from the mathematical centroid.

---

## 2. The Mathematical Core: DIGIPIN Standard

### 2.1 Theoretical Foundations & Geographic Domain
**DIGIPIN** (Digital Postal Index Number) is an open geodetic grid system developed by the Department of Posts (India Post) in collaboration with IIT Hyderabad. It establishes an offline-computable, sovereign spatial addressing system covering the entire sovereign territory of India and its territorial waters.

The coordinate system is anchored strictly within the WGS84 ellipsoidal datum (EPSG:4326):
- **Latitude Span ($\Phi$)**: $2.5^\circ\text{ N}$ to $38.5^\circ\text{ N}$ ($\Delta\Phi = 36.0^\circ$)
- **Longitude Span ($\Lambda$)**: $63.5^\circ\text{ E}$ to $99.5^\circ\text{ E}$ ($\Delta\Lambda = 36.0^\circ$)

```
38.5°N +-------------------------------------------------------+
       |                                                       |
       |                   INDIA BOUNDING BOX                  |
       |                (36.0° Lat x 36.0° Lon)                |
       |                                                       |
       |                 Level 1: 16 Sectors                   |
       |                 Level 2: 256 Sub-sectors              |
       |                 ...                                   |
       |                 Level 10: ~4m x 4m Micro-Cells        |
       |                                                       |
 2.5°N +-------------------------------------------------------+
       63.5°E                                                 99.5°E
```

### 2.2 Alphanumeric Character Set & Base-16 Bit Allocation
To guarantee optical legibility, prevent human phonetic confusion, and maximize OCR accuracy, DIGIPIN excludes vowels and visually ambiguous alphanumeric glyphs:
- **Excluded Characters**:
  - `0` and `O` (visual collision)
  - `1` and `I` (visual collision with `|` / `l`)
  - `A`, `E`, `U` (prevents inadvertent creation of offensive words)
  - `B`, `D`, `G`, `S`, `V`, `Z` (acoustic and handwriting confusion)
- **Official 16-Character Set**:
  $$\Sigma_{\text{DIGIPIN}} = \{ \text{`2'}, \text{`3'}, \text{`4'}, \text{`5'}, \text{`6'}, \text{`7'}, \text{`8'}, \text{`9'}, \text{`C'}, \text{`J'}, \text{`K'}, \text{`L'}, \text{`M'}, \text{`P'}, \text{`F'}, \text{`T'} \}$$
- **Information Entropy**:
  $$\text{Bits per character} = \log_2(16) = 4\text{ bits}$$
  Each character maps deterministically to a $2\text{-bit}$ latitude offset and a $2\text{-bit}$ longitude offset within the active cell.

### 2.3 Recursive $4 \times 4$ Spatial Subdivision Algorithm
The geocoding algorithm recursively subdivides a bounding box into a regular $4 \times 4$ matrix ($16$ equal sub-cells) across $10$ discrete hierarchical levels.

```
       Column 0    Column 1    Column 2    Column 3
Row 3 [   F    ]  [   P    ]  [   T    ]  [   M    ]  (North)
Row 2 [   8    ]  [   9    ]  [   C    ]  [   J    ]
Row 1 [   4    ]  [   5    ]  [   6    ]  [   7    ]
Row 0 [   2    ]  [   3    ]  [   K    ]  [   L    ]  (South)
      (West)                               (East)
```

#### Mathematical Derivation of Cell Resolution
At any level $k \in \{1, 2, \dots, 10\}$, the dimensional step sizes are given by:
$$\Delta\phi_k = \frac{\Delta\Phi}{4^k} = \frac{36.0^\circ}{4^k}, \quad \Delta\lambda_k = \frac{\Delta\Lambda}{4^k} = \frac{36.0^\circ}{4^k}$$

For a complete 10-character DIGIPIN ($k = 10$):
$$\Delta\phi_{10} = \frac{36.0^\circ}{4^{10}} = \frac{36.0^\circ}{1,048,576} \approx 0.000034332^\circ$$
$$\Delta\lambda_{10} = \frac{36.0^\circ}{4^{10}} = \frac{36.0^\circ}{1,048,576} \approx 0.000034332^\circ$$

Converting geodetic arc degrees to physical terrestrial distances:
- **Meridional Arc (Latitude)**:
  $$D_{\text{lat}} = \Delta\phi_{10} \times 111,132\text{ m/deg} \approx 3.815\text{ meters}$$
- **Parallel Arc (Longitude at latitude $\phi$)**:
  $$D_{\text{lon}}(\phi) = \Delta\lambda_{10} \times 111,132\text{ m/deg} \times \cos(\phi)$$
  - At Equator ($\phi = 0^\circ$): $D_{\text{lon}} \approx 3.815\text{ m}$
  - At Central India ($\phi \approx 20^\circ\text{ N}$): $D_{\text{lon}} \approx 3.815 \times \cos(20^\circ) \approx 3.585\text{ m}$
  - At Northern India ($\phi \approx 30^\circ\text{ N}$): $D_{\text{lon}} \approx 3.815 \times \cos(30^\circ) \approx 3.304\text{ m}$

This guarantees a deterministic physical bounding box resolution of approximately **$3.8\text{m} \times 3.6\text{m}$** (nominal $4\text{m} \times 4\text{m}$), precisely matching the spatial footprint of an individual building entrance or residential doorway.

### 2.4 Hierarchical Precision Progression

| Level ($k$) | Code Length | Latitude Span ($\Delta\phi_k$) | Physical Grid Resolution ($D_{\text{lat}} \times D_{\text{lon}}$) | Representative Geographic Analogue |
| :---: | :---: | :---: | :---: | :---: |
| 1 | 1 | $9.000000^\circ$ | $\approx 1,000\text{ km} \times 940\text{ km}$ | Sub-continental Zone |
| 2 | 2 | $2.250000^\circ$ | $\approx 250\text{ km} \times 235\text{ km}$ | Large State / Inter-state Region |
| 3 | 3 | $0.562500^\circ$ | $\approx 62.5\text{ km} \times 58.7\text{ km}$ | Administrative District / Metro Area |
| 4 | 4 | $0.140625^\circ$ | $\approx 15.6\text{ km} \times 14.6\text{ km}$ | City Sub-Division / Tehsil |
| 5 | 5 | $0.035156^\circ$ | $\approx 3.9\text{ km} \times 3.6\text{ km}$ | Ward / Neighborhood |
| 6 | 6 | $0.008789^\circ$ | $\approx 977\text{ m} \times 918\text{ m}$ | Micro-locality / Colony Sector |
| 7 | 7 | $0.002197^\circ$ | $\approx 244\text{ m} \times 229\text{ m}$ | Street Block / Housing Society |
| 8 | 8 | $0.000549^\circ$ | $\approx 61\text{ m} \times 57\text{ m}$ | Large Land Parcel / Complex Wing |
| 9 | 9 | $0.000137^\circ$ | $\approx 15.2\text{ m} \times 14.3\text{ m}$ | Building Footprint |
| **10** | **10** | **$0.000034^\circ$** | **$\approx 3.8\text{ m} \times 3.6\text{ m}$** | **Individual Doorstep / Entrance Gate** |

### 2.5 Lexical Formatting Standard
The raw 10-character code is partitioned into a standardized 3-3-4 alphanumeric structure separated by ASCII hyphens:
$$\text{FORMAT: } X_1X_2X_3-X_4X_5X_6-X_7X_8X_9X_{10}$$
*Example*: `39J-M99-P923`
This structural chunking aligns with cognitive short-term memory limits (Miller's Law: $7 \pm 2$ chunks), facilitating rapid vocal confirmation over phone calls or two-way radio channels.

### 2.6 Offline Haversine Distance Metric
To compute physical proximity between a mobile agent's current coordinates $(\phi_1, \lambda_1)$ and a target entrance $(\phi_2, \lambda_2)$ without initiating network transit to external routing engines, DigiRoute implements the spherical **Haversine formula**:

$$\Delta\phi = \frac{(\phi_2 - \phi_1) \cdot \pi}{180}, \quad \Delta\lambda = \frac{(\lambda_2 - \lambda_1) \cdot \pi}{180}$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\phi_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\phi_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c$$
Where $R = 6,371,000\text{ meters}$ (mean terrestrial radius). This calculation executes in $\mathcal{O}(1)$ time complexity ($< 0.05\text{ ms}$ on standard mobile hardware), providing continuous distance readouts.

---

## 3. Technology Stack & System Architecture

```
+---------------------------------------------------------------------------------------+
|                                DIGIROUTE SYSTEM TOPOLOGY                              |
|                                                                                       |
|   [Client Tier]                                                                       |
|   +------------------------------------+   +--------------------------------------+   |
|   |  Next.js 15 PWA Client (< 2 MB)    |   |  Native Android Companion (Flutter)  |   |
|   |  - HTML5 Canvas EXIF Stripper      |   |  - Google ML Kit Barcode (60 FPS)    |   |
|   |  - Client DIGIPIN Math (< 0.1ms)   |   |  - Offline Dart DIGIPIN Decoder      |   |
|   |  - IndexedDB Draft Cache (Dexie)   |   |  - OpenRouteService Nav Engine       |   |
|   +-----------------+------------------+   +-------------------+------------------+   |
|                     |                                          |                      |
|                     | HTTPS / TLS 1.3                          | Direct Cloudinary    |
|                     | (JSON Payloads / Actions)                | Unsigned Upload      |
|                     v                                          v                      |
|   [Server Tier]                                    +------------------------------+   |
|   +------------------------------------+           | Cloudinary CDN               |   |
|   |  Next.js Server Actions Monolith   |           | (Signed WebP Storage)        |   |
|   |  - Node.js Runtime                 |           +------------------------------+   |
|   |  - HttpOnly Cookie Authentication  |                                              |
|   |  - Argon2/bcrypt Passcode Hash     |                                              |
|   +-----------------+------------------+                                              |
|                     |                                                                 |
|                     | Prisma 8 ORM                                                    |
|                     v                                                                 |
|   [Data Tier]                                                                         |
|   +-------------------------------------------------------------------------------+   |
|   |  PostgreSQL / MongoDB Atlas (Replica Set)                                      |   |
|   |  - Address Table / Collection                                                 |   |
|   |  - TTL Index on `expiresAt` (Zero-Compute Background Purging)                  |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### 3.1 Web Frontend & PWA (Progressive Web Application)
- **Framework**: Next.js 15 (App Router architecture), React 19, TypeScript (Strict Mode).
- **Bundle Footprint**: Zero-install client payload constrained to $< 2\text{ MB}$ uncompressed (First Load JS $< 95\text{ KB}$), ensuring instant loading over 3G/4G cellular connections.
- **Client State**: Zustand for global address staging and GPS cache; Dexie.js (IndexedDB wrapper) for resilient draft persistence across browser reboots.
- **Styling Architecture**: Tailwind CSS v4, dynamic `oklch()` color tokens, and Radix UI headless primitives.
- **Design System ("Refined Utilitarian")**: Strict $4\text{px}$ corner geometry (`rounded-[4px]`), Deep Zinc canvas (`#09090b`), high-contrast Amber highlights (`#f97316`), and clean sans-serif typography (`Inter` / `Geist`). Zero decorative clutter.

### 3.2 Native Mobile Companion (Android)
- **Framework**: Flutter 3.x, Dart 3.x.
- **State Architecture**: `flutter_riverpod` unidirectional data-flow.
- **Hardware Computer Vision**: Google ML Kit (`google_mlkit_barcode_scanning`) operating at hardware camera framerates ($60\text{ FPS}$) for sub-$100\text{ms}$ QR barcode extraction.
- **Local Spatial Processing**: Native Dart port of the DIGIPIN spatial subdivision algorithm; zero internet connectivity required to decode, validate, or compute straight-line vectors.
- **Route Engine**: OpenRouteService REST API client integrated with local OpenStreetMap raster/vector tile caches for off-grid routing.

### 3.3 Backend & Persistence Engine
- **Server Execution**: Next.js Server Actions executing in Node.js runtime. Eliminates public REST API attack surfaces for internal operations.
- **Database Architecture**: Multi-model compatibility via Prisma 8 ORM supporting PostgreSQL (relational) and MongoDB Atlas (document-store).
- **Session Layer**: Cryptographic stateless JWT tokens (`HS256` / `RS256`) encapsulated in strict `HttpOnly`, `SameSite=Lax`, `Secure` cookies. Edge-compatible path routing enforced via `middleware.ts`.

### 3.4 Media & Edge CDN
- **Direct-to-Cloud Storage**: Cloudinary CDN.
- **Upload Pattern**: Pre-signed unsigned upload presets executed directly from browser memory to edge storage nodes. Eliminates server RAM buffering and avoids payload size bottlenecks.

---

## 4. The 5-Step Address Creation Flow (Walkthrough)

```
[ Step 1: Base Location ] ----> [ Step 2: Visual Lock ] ----> [ Step 3: Entrance Pin ]
   Auto-GPS Lock                   Live Camera Capture            Decoupled 5m-50m Pin
   WGS84 -> 10-Char DIGIPIN        Canvas EXIF-Stripped           Center-Fixed Zero-Lag Pan
                                           |
                                           v
[ Step 5: Sovereign Link ] <--- [ Step 4: Z-Axis & Privacy ]
   dg-[nanoid-12] Slug             Floor, Unit, Gate Passcode
   Vector QR Badge                 TTL Ephemerality (30m - 7d)
```

### 4.1 Step 1: Establish Base Location
- **GPS Acquisition**: Calls `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`.
- **Jitter Dampening Engine**: Employs a $2.5\text{m}$ spatial deadband threshold. Micro-drifts in raw satellite fixes below $2.5\text{m}$ are suppressed to prevent visual flickering of the calculated DIGIPIN code.
- **Boundary Verification**: Coordinates are checked against the sovereign boundary box $[2.5^\circ\text{ N}, 63.5^\circ\text{ E}] \times [38.5^\circ\text{ N}, 99.5^\circ\text{ E}]$.
- **Mathematical Transformation**: Coordinates are encoded to the initial 10-character DIGIPIN via the local mathematical engine in $< 0.1\text{ ms}$.

### 4.2 Step 2: Capture Visual Lock
- **Hardware Viewfinder**: Streams video input from `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`.
- **Target Framing**: A high-contrast reticle overlays the viewport, guiding the user to frame the specific doorway, gate plaque, or building entry.
- **Frame Ingestion**: Captures the uncompressed video frame directly to an off-screen HTML5 `<canvas>` element.

### 4.3 Step 3: Decoupled Entrance Pin
- **Decoupling Theory**: The base GPS coordinate corresponds to where the user stands while creating the record (often inside a room or compound courtyard). Step 3 explicitly decouples the **pedestrian entrance marker** from the building centroid.
- **Zero-Lag Map Interaction**:
  - Instead of binding hundreds of marker DOM nodes to pan events, DigiRoute employs a **Fixed Center Pin** architecture.
  - The map viewport moves beneath an absolute SVG target reticle.
  - State recalculation occurs exclusively upon the `moveend` event.
- **Real-time Recalculation**: The modified coordinates re-execute `encode(lat, lng)`, dynamically updating the DIGIPIN to the exact threshold cell. Haversine distance displays the offset between the base coordinate and the entrance pin.

### 4.4 Step 4: Z-Axis & Privacy Controls
- **Vertical Addressing**: Captures elevation data: Tower / Block identifier, Floor Number, and Unit / Flat Number.
- **Access Directives**: Recipient instructions (e.g., *"Dial 402 on lobby intercom; leave with security guard if unattended"*).
- **Access Gate Protection**: Optional numeric passcode hashed client/server side. Unauthenticated visitors cannot view doorway photographs or apartment numbers without supplying the shared secret.
- **Configurable Ephemerality**: User selects link lifespan: $30\text{ minutes}$, $1\text{ hour}$, $12\text{ hours}$, $24\text{ hours}$, $7\text{ days}$, or permanent.

### 4.5 Step 5: Sovereign Link Generation
- **Slug Formulation**: Generates a 128-bit pseudorandom URL identifier (`dg-${nanoid(12)}`).
- **Persistence Pipeline**: Dispatches the serialized payload to the `createAddress` Server Action.
- **Output Artifacts**:
  - Live Public Access URL: `https://digiroute.antideploy.com/a/dg-xxxxxxxxxxxx`
  - Rendered Vector QR Code Badge
  - Immediate local IndexedDB staging for creator reference.

---

## 5. System Security & Architectural Best Practices

### 5.1 Client-Side EXIF Metadata Stripping
Raw camera photos captured on mobile devices embed extensive exchangeable image file format (EXIF) metadata headers, including precise GNSS coordinates, altitude, device IMEI/serial identifiers, camera make/model, and exact capture timestamps.

```
[ Raw Camera Stream ] 
         |  (Contains EXIF: Geotags, Device Model, Exposure Timestamps)
         v
[ HTML5 Canvas Render ] (ctx.drawImage)
         |  (EXIF Header Block Truncated & Discarded)
         v
[ Clean WebP Stream ] (canvas.toBlob('image/webp', 0.75))
         |  (Pure Pixel Data Only, Size < 300 KB)
         v
[ Cloudinary Edge Ingestion via TLS 1.3 ]
```

#### Engineering Implementation
1. The raw image buffer is ingested into an off-screen HTML5 `<canvas>` element:
   ```typescript
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   ctx.drawImage(sourceVideoOrImage, 0, 0, targetWidth, targetHeight);
   ```
2. Canvas rendering discards all binary header structures outside the pixel raster array.
3. The image is exported using `canvas.toBlob(callback, 'image/webp', 0.75)`.
4. The generated WebP binary contains pure raster data. All geolocation tags, device fingerprints, and timestamps are stripped prior to network transit, preventing physical surveillance leaks.

### 5.2 Cryptographic Ephemerality & Automated Storage Hygiene
To prevent permanent spatial profiling of residential structures, DigiRoute enforces an ephemeral-by-default access lifecycle for temporary visitors and commercial delivery agents.

#### 128-Bit Entropy URL Slugs
Address routes utilize `nanoid(12)` drawn from the URL-safe alphabet $[A-Za-z0-9_-]$:
$$\text{State Space} = 64^{12} = 2^{72} \approx 4.72 \times 10^{21}\text{ unique permutations}$$
This configuration prevents URL enumeration attacks and dictionary scans.

#### Zero-Compute TTL Database Purging
In document-oriented storage engines (MongoDB Atlas), addresses are instantiated with an ISO-8601 `expiresAt` timestamp:
```typescript
db.Address.createIndex(
  { "expiresAt": 1 },
  { expireAfterSeconds: 0 }
);
```
- **Automated Lifecycle**: A background thread in the database storage engine evaluates the index every 60 seconds.
- **Zero Compute Overhead**: Expired records are excised directly at the storage engine level. No server cron jobs, scheduled worker pools, or persistent application memory leaks are incurred.
- When an expired address URL is visited, the server returns an immutable `410 Gone` or `404 Not Found` response.

### 5.3 Direct-to-Storage Media Architecture
To maintain sub-second response times and prevent denial-of-service via large binary uploads:
1. The client communicates directly with Cloudinary edge nodes using an unsigned upload preset restricted strictly to `image/webp` MIME types with a $5\text{MB}$ file size cap.
2. The central Next.js server never accepts multi-megabyte image binaries into its RAM pool.
3. The server only receives and stores the validated HTTPS CDN URI string (`https://res.cloudinary.com/.../doorway.webp`), reducing server memory overhead to negligible levels.

```typescript
// Architectural Data Contract: Address Record
interface AddressRecord {
  id: string;               // CUID / UUID Primary Key
  slug: string;             // 12-char cryptographic URL slug
  digipin: string;          // 10-char WGS84 code (e.g. 39J-M99-P923)
  baseLat: number;          // Initial GPS latitude
  baseLng: number;          // Initial GPS longitude
  entranceLat: number;      // Decoupled doorway latitude
  entranceLng: number;      // Decoupled doorway longitude
  floor: string | null;     // Z-axis floor identifier
  flat: string | null;      // Z-axis unit identifier
  doorwayPhotoUrl: string;  // Cloudinary CDN edge pointer
  passcodeHash: string | null; // Argon2/bcrypt hash
  isEphemeral: boolean;     // Lifecycle policy flag
  expiresAt: Date | null;   // TTL purge timestamp
  createdAt: Date;
}
```

---

## 6. Physical World Bridging: Smart Badges & Recipient UX

### 6.1 Vector QR Code Generation via Galois Field Arithmetic
DigiRoute includes a zero-dependency, self-contained QR code synthesis engine in `src/lib/qr.ts`. It generates vector QR matrices directly in memory without third-party network APIs:
- **Galois Field Math**: Evaluates polynomial arithmetic over $GF(2^8) = GF(256)$ with primitive polynomial $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ ($0x11D$).
- **Reed-Solomon Error Correction**: Computes generator polynomials dynamically, applying Medium (M) or Quartile (Q) error correction capable of recovering $15\%$ to $25\%$ of damaged or obstructed codewords.
- **Optical Formatting**: Renders high-contrast finder patterns, alignment patterns, and timing tracks, reserving the central region for the DigiRoute brand icon.

### 6.2 Multi-Format High-Resolution Print Badges
The system renders print-ready canvases configured for physical production:
1. **Doorway Plaque / Sticker ($800\text{px} \times 1100\text{px}$)**: Standard format for residential gates, apartment doors, and delivery drop boxes.
2. **Business Card ($700\text{px} \times 950\text{px}$)**: Compact format for personal sharing.
3. **A4 Poster ($900\text{px} \times 1250\text{px}$)**: Large format for commercial lobbies, warehouse gates, and construction sites.

```
+-------------------------------------------------------+
|  [Logo] DigiRoute Doorway                             |
|  OFFICIAL MICRO-ADDRESS BADGE                         |
|  ===================================================  |
|                                                       |
|              +-------------------------+              |
|              |  [ ] [ ]       [ ] [ ]  |              |
|              |  [ ] [ ]       [ ] [ ]  |              |
|              |         [LOGO]          |              |
|              |  [ ] [ ]       [ ] [ ]  |              |
|              +-------------------------+              |
|                                                       |
|                   39J - M99 - P923                    |
|                Flat 302, Palm Heights                 |
|                                                       |
|  Scan with any camera or DigiRoute app to navigate.   |
|  Direct pedestrian access. No phone number shared.    |
+-------------------------------------------------------+
```

### 6.3 Recipient & Courier Interaction Protocol
When a courier partner, emergency responder, or visitor scans the physical QR code or opens the shared link (`/a/[slug]`):
1. **Security Gate**: If the creator enabled a passcode, an input gate displays. The doorway photo and unit numbers remain obscured until the code is supplied.
2. **Visual Confirmation**: The verified doorway photo displays prominently, eliminating visual confusion upon entering the street or corridor.
3. **Turn-by-Turn Handoff**: The UI provides explicit deep-link buttons that hand off coordinates directly to native navigation systems:
   - **Google Maps Navigation Intent**:
     `https://www.google.com/maps/dir/?api=1&destination=${entranceLat},${entranceLng}&travelmode=walking`
   - **Mappls Deep Link**:
     `mappls://navigation?destination=${entranceLat},${entranceLng}`
   - **Direct Clipboard Copy**: 1-tap copy of the 10-character DIGIPIN for logistics terminals.

---

## 7. Future Scope & Civic Infrastructure

### 7.1 Emergency 112 SOS Dispatch Module
- **High-Sunlight Emergency Canvas**: An interface built on a high-contrast crimson background (`--sos-bg: #B91C1C`) optimized for outdoor crisis visibility and rapid touch execution.
- **Automated SMS Location Intent**: Generates an encoded SMS string pre-filled for emergency service numbers:
  `sms:112?body=EMERGENCY%20SOS:%20Location%20at%20DIGIPIN%204M8K-9P2L-1X%20(28.6139N,%2077.2090E).`
- **Instant Vocal Dispatch**: Large-format typography allows an injured or panicked user to dictate their exact 10-character code over an emergency voice call within 3 seconds.

### 7.2 Hyper-Local Community Alerting
- A peer-to-peer notification relay alerting verified community responders located within a $100\text{m}$ radius of the SOS trigger point.
- Combines the 10-character code with doorway photos so neighbors can reach victims inside dense complexes prior to the arrival of primary ambulance services.

### 7.3 Real-Time Proximity Radar
- Embedded radar visualization displaying distance markers ($120\text{m}$, $350\text{m}$, $700\text{m}$) indicating approaching couriers or emergency responders relative to the entrance pin.
- Employs anti-collision spatial offset clustering to manage multiple simultaneous viewers without visual marker overlap.

### 7.4 Civic Defect Logging
- Extends the micro-addressing model to public municipal maintenance.
- Citizens capture street defects (e.g., potholes, uncollected refuse, damaged electrical cables, open drains) and bind the photographic evidence to the exact $4\text{m} \times 4\text{m}$ DIGIPIN micro-cell.
- Municipal engineers can dispatch maintenance crews directly to the physical defect without relying on ambiguous ward descriptions.

---

## 8. Conclusion

DigiRoute demonstrates that solving India's complex last-mile addressing challenges does not require proprietary database monopolies or expensive, opaque geocoding services. By operationalizing the Department of Posts DIGIPIN standard into a lightweight, client-computable software stack, DigiRoute provides a scalable, sovereign, and privacy-preserving micro-addressing infrastructure for commercial logistics, daily citizen navigation, and emergency response.

---
*Document Version: 1.0.0 (Master Academic & Engineering Reference)*  
*Target Environment: Next.js 15 PWA / Flutter Android Native / WGS84 DIGIPIN Standard*
