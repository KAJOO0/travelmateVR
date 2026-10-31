# TravelMateVR™

An immersive, AI-enabled tourism ecosystem by **Mates Technologies Limited** (Mbeya, Tanzania).
Progressive Web App built with React, TypeScript and Vite.

> Experience → Plan → Book → Travel → Connect. Experience before transaction.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build (dist/)
npm run preview      # serve the production build, incl. service worker
```

Other scripts:

| Script | What it does |
|---|---|
| `npm run typecheck` | TypeScript check only |
| `npm run i18n:check` | Verifies every language has the same keys as English |
| `npm run videos` | Transcodes the 360° videos listed in `assets-src/video360/credits.json` to H.264/MP4 plus a 360° poster frame in `public/video/`, and writes `src/data/videos.generated.json`. Needs ffmpeg on `PATH` (or `FFMPEG=/path/to/ffmpeg`); missing originals are downloaded from Wikimedia Commons |
| `npm run media` | Rebuilds responsive WebP images from `assets-src/` into `public/media/` (including card images for 360° photos and videos) and writes `src/data/media.generated.json`. Run it after `npm run videos` |

Portals: open `/business`, `/board` or `/admin` and choose the demo account (the Command Center lets you pick an admin role). The Command Center is not linked from public pages. Both demo organisations are fictional (Kijani Tented Camps; Demo Tourism Board · Tanzania).

Review links: append `?lng=fr|de|zh|it|en` and/or `?theme=light|dark|system` to any URL.

## Build plan

| Phase | Scope | Status |
|---|---|---|
| 1 | Design system and traveller app: home, explore, destinations, 360°/VR, AI TravelMate, itinerary builder, marketplace, booking, My TravelMate, PWA, i18n | **Done.** All traveller routes are live in five languages. Only the partner and tourism-board routes still show a labelled interim page. |
| 2 | Partner portal, storefronts, inventory, analytics; tourism board portal | **Done.** Partner portal at `/business`, tourism board portal at `/board`, public pages `/partners`, `/partners/join`, `/tourism-boards`. |
| 3 | Admin Command Center (users, partners, VR content, AI, bookings, payments, reports, security) | **Done.** `/admin`, 16 sections, role-based access for super administrator, administrator, content manager, support agent and finance. |
| 3.1 | 360° video first, global showcase, creator programme | **Done.** 360° video playback in the viewer (with 360° photo fallback), 9 destinations in Southeast Asia, the Middle East and Europe, `/creators` and `/creators/apply`, creator review in the Command Center. |

## Architecture

```
src/
  app/            routing, providers (preferences, wishlist, toasts), PWA lifecycle, nav model
  components/     layout (header, footer, drawers, mobile nav), cards, ui primitives, brand logo
  features/       feature modules (home showcase, smart search, VR viewer, trips, reviews, booking)
  pages/          route screens (lazy-loaded)
  services/       service boundaries: http client, catalogue, search, AI planner, pricing, bookings, trips,
                  account, messaging (UI never calls fetch directly)
  domain/         typed domain model
  data/seed/      realistic demo data (Tanzania first, then East and Southern Africa)
  i18n/           i18next setup; locales in src/locales/<lang>/<namespace>.json
  styles/         design tokens (dark canonical, light derived), base, layout, page styles
```

- **Design system.** The visual language comes straight from *TravelMate Page Design*: tokens, pills, the category rail, hero, caption deck, chips, strip, feature cards and band. Dark is the default theme. Light is derived from the same blues, and System follows the device.
- **Data layer.** `VITE_DATA_SOURCE=mock` (the default) serves the seeded demo data through the same interfaces the real API will implement (`services/catalog.ts`). Set `VITE_DATA_SOURCE=http` and `VITE_API_BASE_URL` to call the backend. Auth is expected to use httpOnly session cookies; no tokens are kept in JavaScript.
- **Search.** `services/search.ts` reads free text in all five languages: places, trip length, group size, budget, travel style and what the traveller wants to book. It runs on the device, so it is instant and works offline. The AI service can refine the same `SearchIntent` on the server.
- **Sign-in security.** Inputs are normalised and cleaned (`lib/security.ts`), sign-in accepts an email or username and answers every wrong attempt with “Incorrect email, username or password.”, and 5 failures in a row pause sign-in for 2 hours (both values in System settings). The demo stores simulated accounts with a salted PBKDF2 hash, never the password. The server must enforce the same rules with Argon2id hashing and per-account and per-IP limits: see [docs/security/authentication.md](docs/security/authentication.md).
- **Payments (Tanzania).** Checkout offers mobile money (M-Pesa, Airtel Money, Mixx by Yas, HaloPesa: number entry, PIN prompt on the phone, USSD fallback) and Visa / Mastercard from any bank through the provider's hosted card page; direct bank payments (CRDB, NMB, NBC, Stanbic, TCB) are planned. Shilling amounts use an indicative rate from System settings. Bookings and payments are open only in the launch countries (default Tanzania and Zanzibar); elsewhere listings are “Preview only”. Partners connect a mobile-money or Tanzanian bank account for payouts. Server integration guide: [docs/payments/tanzania.md](docs/payments/tanzania.md).
- **AI, payments, messaging.** These are provider-agnostic service boundaries. No keys or credentials belong in the frontend (see `.env.example`). WhatsApp uses click-to-chat links only.
- **AI TravelMate (demo).** `services/ai.ts` is a transparent, rule-based planner over the seeded catalogue: it understands requests in all five languages, builds routes, stays, day plans and cost estimates, and explains its choices. A server-side model can replace it behind the same interface.
- **Bookings and payments (demo).** Pricing is itemised (base, extras, VAT, a 4% service fee, contributions) with no hidden fees. The checkout is a demo with no card fields; production hands off to a PCI-compliant payment provider. Bookings, trips and preferences are stored on the device until the API is connected.
- **Maps.** Leaflet, loaded only when a map scrolls into view. Tiles default to the keyless OpenStreetMap server, which suits previews and light traffic only. Set `VITE_MAP_TILES_LIGHT`/`VITE_MAP_TILES_DARK` to a provider with a domain-restricted key before launch.
- **VR viewer.** three.js, with drag, pinch, keyboard, device motion and WebXR headset mode. Formats, in order of priority (`lib/immersive.ts`): **360° video** (an equirectangular video on the sphere with play/pause, mute and seek; it starts muted, autoplays unless reduced motion or data saver is on, and pauses when the tab is hidden), **360° photo**, and **panoramic preview** of a regular photo. A video shows its 360° poster frame (or the experience’s panorama) first, so the scene can be explored at once and stays on screen if the video cannot play. Lists sort video first and can be filtered by format.
- **Global showcase and creators.** Countries in `GLOBAL_REGIONS` (Southeast Asia, Middle East, Europe) are shown in their own home-page section, not in “Explore Africa”. They have no partners and no reviews yet; their destination pages invite operators (`/partners/join?country=…&destination=…` prefills the form) and 360° creators. The creator programme (`/creators`) pays per 1,000 qualified views (default USD 1.50, views of 30 s or more) plus a share of subscription revenue split by watch time (default 20%); all three are draft terms set in System settings. Applications are reviewed under VR content in the Command Center.
- **Business portals.** A separate shell (`components/portal`) with role-gated routes (partner / partner staff; tourism board, DMO, conservation organisation). Role checks in the UI are for experience only; the API must enforce them. Partner edits (prices, seasonal rates, units, blackout dates, offers, pausing, storefront text) and board edits (destination text, best months, published updates) are stored by the demo service layer and overlaid on the catalogue at start-up (`services/overlays.ts`), so traveller pages, availability checks and checkout reflect them. Requests to book are confirmed or declined by the partner, and the traveller is notified.
- **Analytics honesty.** Bookings, revenue, markets, lead times and peak periods are computed from bookings. Views, searches, enquiries, visitor interest and campaign reach need tracking, so the demo generates stable sample values and labels them “Sample data”.
- **Command Center.** Admin decisions are applied through the same overlay layer: suspending a partner hides their listings, approving a partner draft publishes a marketplace listing, the VR workflow (draft → review → approved → published → archived) controls what travellers see, review moderation hides or publishes reviews, and System settings change the service fee, deposit, partner discount cap, feature switches (AI planner, headset mode, partner applications, reviews) and the maintenance banner. Every admin action is written to the audit log, and CSV reports neutralise spreadsheet formulas. System settings also hold the creator revenue share, attribution window and the creator applications switch.
- **AI telemetry.** Each AI TravelMate answer is logged with a redacted prompt, answer type, latency, safety flags and traveller feedback (👍/👎) for the AI section of the Command Center. The planner sits behind one service interface, so a hosted model can replace it on the server.
- **i18n.** English (default), French, German, Chinese (Mandarin) and Italian. Every interface string goes through translation keys, and each language loads as its own chunk. The language choice is saved on the device. Country names come from `Intl.DisplayNames`. Seed content carries per-language fields, with English as the fallback.
- **PWA.** Web app manifest, service worker (Workbox), install prompt, update prompt, offline banner and an offline fallback page. The app shell and locales are precached; photos, 360° photos and video posters are cached the first time they are viewed. 360° videos are streamed (range requests) and never precached.
- **Accessibility.** Semantic landmarks, skip link, keyboard-operable carousel and menus, combobox ARIA on search, visible focus, reduced-motion support.

## Media

- `assets-src/img`: photos supplied by TravelMateVR.
- `assets-src/stock`: openly licensed photos from Wikimedia Commons. `credits.json` holds author, licence and source, shown at `/credits`.
- `colosseum.png` and `mainImage.png` (Lake Braies, Italy) are kept in the source folder but not used, because the product leads with African destinations.
- `assets-src/pano`: 360° panoramas, used only where the capture really matches the place: CC0 from Poly Haven (Stone Town fort, Table Mountain, Mpumalanga, Drakensberg) and CC BY-SA 4.0 from Wikimedia Commons (Wadi Rum desert camp, Santorini caldera from Imerovigli). Run `npm run media` to rebuild `public/pano/`; the originals are git-ignored.
- `assets-src/video360`: openly licensed 360° sample videos from Wikimedia Commons (CC BY 3.0): Lake Bled shore path (Fabio Casati) and the Cabo Girão skywalk, Madeira (Vasco Marques). They are transcoded to H.264/MP4 for the web, which is noted on `/credits` as CC BY requires. No openly licensed 360° video of African destinations was found, so African experiences use 360° photos or panoramic previews until the team’s or creators’ own captures arrive. The originals are git-ignored; `npm run videos` downloads them again.
- Global showcase photos (Bali, Ha Long Bay, Angkor, Petra & Wadi Rum, Dubai, Muscat & Wahiba Sands, Santorini, Lake Bled, Madeira) come from Wikimedia Commons with credits in `assets-src/stock/credits.json`.
- Partners: Katavi Fahari Tours and Mpanda Safari’s are real founding partners. They show only their name, logo and area, with indicative prices and no ratings until verified bookings exist. All other businesses are fictional and labelled “Sample listing”.

## Contact (public)

info@travelmatevr.com · +255 767 523 749 · WhatsApp +255 740 014 863 · Mbeya CC, Mbeya, Tanzania
Instagram @travelmate_vr · X @mates_techn

© 2026 Mates Technologies Limited
