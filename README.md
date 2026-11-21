# Highland Sanctuary

Curated experiential homestays, monastery retreats, eco-cottages, and living root trails across all eight states of North East India (**Assam, Meghalaya, Arunachal Pradesh, Nagaland, Sikkim, Manipur, Mizoram, and Tripura**).

---

## Key Features

- **8-State Sanctuary Discovery & Smart Filters**
  - Sticky filter bar with price range histogram & dual slider, property types (`Homestay`, `Cottage`, `Bamboo Hut`, `Houseboat (Loktak)`, `Treehouse`, `Tea Estate Bungalow`), rating filter, amenities, host craft/lineage types, multi-state filter, and URL-synced query parameters.
  - Natural-language Smart Search (e.g., `"cheap homestay in Kaziranga with bonfire under 4000"`) that automatically parses and applies filters.
- **12-Language North East Selector**
  - Switch UI copy across 12 languages with native scripts and transliteration support: English, Hindi, Assamese, Bengali, Nepali, Manipuri, Bodo, Mizo, Khasi, Garo, Nagamese, and Adi.
- **Interactive Booking Drawer, Calendar & Checkout**
  - Visual monthly availability calendar highlighting booked dates, guest/night breakdown, guided community trail add-ons, and full checkout flow (`PaymentView`).
- **Host Connect Direct Inquiry**
  - Direct inquiry chat inside each sanctuary detail view (`StayDetailView` → `HostConnectModal`) that attaches selected check-in/check-out dates, guest counts, and add-ons with persisted conversation history.
- **8-State Trail Atlas & Google Maps Grounding**
  - Interactive regional trail map with conditional `@vis.gl/react-google-maps` + Places API (New) integration (with interactive 8-State SVG fallback) plus server-side Maps grounding powered by Gemini.
- **AI Itinerary Planner & Live Voice Concierge**
  - Floating itinerary planner (`AIChatbox`) generating day-by-day North East routes and saving plans to the Itinerary page.
  - Real-time bidirectional voice concierge (`/live` WebSocket bridge) and voice search transcription (`/api/ai/transcribe`).
- **Authentication, Persistence & Admin Analytics**
  - Firebase Authentication (Google Sign-In) + demo account login, Firestore synchronization (`firestore.rules`), and optional Cloud SQL (PostgreSQL + Drizzle ORM) sync (`/api/sql/*`), with `localStorage` fallback for offline/guest browsing.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion
- **Backend:** Express (`server.ts`), Node.js WebSocket (`ws`), `@google/genai` SDK
- **Databases & Auth:** Firebase Auth + Cloud Firestore, PostgreSQL + Drizzle ORM (Cloud SQL)
- **Maps & Location:** `@vis.gl/react-google-maps` + Gemini Google Maps Grounding

---

## Prerequisites

- **Node.js** `>= 22` (required for native TypeScript execution with `node server.ts`)
- **npm** (or `bun`)

---

## Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server | Gemini API key for Maps grounding, audio transcription, and Live voice concierge |
| `VITE_GOOGLE_MAPS_API_KEY` | Client | Optional Google Maps JavaScript & Places API key (falls back to interactive SVG atlas if unset) |
| `APP_URL` | Server | Hosted application URL |
| `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD` | Server | Optional PostgreSQL / Cloud SQL connection details |

> **Firebase Configuration:** Client configuration lives in `firebase-applet-config.json` and security rules live in `firestore.rules`. Never commit `.env` files containing private keys.

---

## Local Development & Production Scripts

Install dependencies:

```bash
npm install
```

Run the full-stack development server (Express + Vite middleware on port `3000`):

```bash
npm run dev
```

Type-check and build for production:

```bash
npm run lint
npm run build
```

Run the compiled production server (`dist/` + API + WebSocket on port `3000`):

```bash
NODE_ENV=production npm start
```

---

## Project Structure

```text
├── server.ts                  # Express server, API routes, Gemini WS bridge, Vite/static serving
├── firestore.rules            # Firestore security rules
├── firebase-blueprint.json    # Firestore data schema blueprint
├── firebase-applet-config.json
├── public/                    # Static public assets
└── src/
    ├── App.tsx                # Main application state & screen routing
    ├── components/            # UI views, ExploreFilterBar, HostConnectModal, BookingDrawer, TrailMapView, AIChatbox
    ├── data/                  # 8-state sanctuaries catalog, itineraries, 12-language translations
    ├── db/                    # Drizzle ORM schema, queries, and PostgreSQL pool
    ├── lib/                   # Server-side Gemini & Firebase Admin helpers
    ├── middleware/            # Firebase ID token authentication middleware
    ├── services/              # Data store (Firestore + localStorage + SQL sync)
    └── utils/                 # Smart search parser & date availability helpers
```
