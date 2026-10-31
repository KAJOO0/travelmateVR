// One-time migration: loads the project's existing seed/demo content (src/data/seed/*) into
// the real AWS backend (Amplify Data), so real mode launches already populated instead of
// empty. Run with `npm run migrate:seed` against a sandbox backend first, then once against
// production after the Amplify Hosting app's backend connection is verified working.
//
// Requires AMPLIFY_MIGRATION_API_KEY (a short-lived, write-scoped Amplify Data API key — see
// amplify/data/resource.ts) and a deployed amplify_outputs.json at the repo root. Never used
// by the running app — this script is the only consumer of that API key.
//
// Insert order follows the FK graph: Country -> Destination -> Partner -> Listing ->
// Experience -> Review. Every created record reuses the seed's own id (not an
// auto-generated one), so cross-references keep working exactly as they do in mock mode.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { isEquirectangular } from '../src/lib/media360';

import { COUNTRIES } from '../src/data/seed/countries';
import { COUNTRY_INFO } from '../src/data/seed/reference';
import { DESTINATIONS } from '../src/data/seed/destinations';
import { PARTNERS } from '../src/data/seed/partners';
import { LISTINGS } from '../src/data/seed/listings';
import { CATEGORIES as _CATEGORIES, EXPERIENCES } from '../src/data/seed/experiences'; // CATEGORIES is a fixed UI constant, not migrated
import { REVIEWS } from '../src/data/seed/reviews';
import panosManifest from '../src/data/panos.generated.json';
import videosManifest from '../src/data/videos.generated.json';

const repoRoot = path.dirname(fileURLToPath(import.meta.url)) + '/..';

// ---------------- Setup ----------------

const outputsPath = path.resolve(repoRoot, 'amplify_outputs.json');
if (!fs.existsSync(outputsPath)) {
  console.error(`Missing ${outputsPath}. Run "npx ampx sandbox" (or deploy the backend) first — this file is generated from that, not committed to git.`);
  process.exit(1);
}
const apiKey = process.env.AMPLIFY_MIGRATION_API_KEY;
if (!apiKey) {
  console.error('Missing AMPLIFY_MIGRATION_API_KEY. Set it to the short-lived Amplify Data API key before running this script.');
  process.exit(1);
}

Amplify.configure(JSON.parse(fs.readFileSync(outputsPath, 'utf8')));
const client = generateClient<Schema>({ authMode: 'apiKey', apiKey });

// ---------------- 360° content guard (decision 12 — see src/lib/media360.ts) ----------------

type PanosManifest = Record<string, { widths: number[] }>;
type VideosManifest = Record<string, { width: number; height: number }>;

async function panoDimensions(panoId: string): Promise<{ width: number; height: number } | undefined> {
  const entry = (panosManifest as PanosManifest)[panoId];
  if (!entry?.widths?.length) return undefined;
  const width = Math.max(...entry.widths);
  const file = path.resolve(repoRoot, 'public/pano', `${panoId}-${width}.jpg`);
  if (!fs.existsSync(file)) return undefined;
  const meta = await sharp(file).metadata();
  return meta.width && meta.height ? { width: meta.width, height: meta.height } : undefined;
}

function videoDimensions(videoId: string): { width: number; height: number } | undefined {
  const entry = (videosManifest as VideosManifest)[videoId];
  return entry ? { width: entry.width, height: entry.height } : undefined;
}

/** Rejects (returns a reason string) a record whose pano/video id isn't a real 2:1 equirectangular asset. */
async function reject360(panoId?: string, videoId?: string): Promise<string | undefined> {
  if (panoId) {
    const dim = await panoDimensions(panoId);
    if (!dim) return `pano "${panoId}" has no measurable asset (missing from panos.generated.json or public/pano/)`;
    if (!isEquirectangular(dim.width, dim.height)) return `pano "${panoId}" is ${dim.width}x${dim.height}, not 2:1 equirectangular`;
  }
  if (videoId) {
    const dim = videoDimensions(videoId);
    if (!dim) return `video "${videoId}" has no measurable asset (missing from videos.generated.json)`;
    if (!isEquirectangular(dim.width, dim.height)) return `video "${videoId}" is ${dim.width}x${dim.height}, not 2:1 equirectangular`;
  }
  return undefined;
}

// ---------------- Mapping + run helpers ----------------

type Counts = Record<string, { ok: number; failed: number; expected: number }>;
const counts: Counts = {};

/** `create` is the already-bound client.models.X.create for one specific model — passed in
 *  explicitly (rather than looked up by name) so each call keeps its real, checked input type. */
async function run<T extends { id: string }>(
  model: string,
  records: T[],
  map: (r: T) => Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Amplify's create() is strictly typed per-model; `any` here avoids fighting contravariance for this internal glue function.
  create: (input: any) => Promise<{ errors?: { message: string }[] | null }>
) {
  counts[model] = { ok: 0, failed: 0, expected: records.length };
  for (const r of records) {
    const mapped = await map(r);
    if (!mapped) { counts[model]!.failed++; continue; } // map() already logged why
    // Retries transient network errors (the connection here has been flaky); a rerun hitting
    // a record this script already created successfully is treated as success too, so the
    // whole script is safe to simply run again after a partial failure.
    let errors: { message: string }[] | null | undefined;
    for (let attempt = 1; attempt <= 4; attempt++) {
      ({ errors } = await create({ id: r.id, ...mapped }));
      if (!errors?.length) break;
      if (errors.some(e => /already exists|conditional/i.test(e.message))) { errors = undefined; break; }
      if (attempt < 4) await new Promise(res => setTimeout(res, attempt * 1000));
    }
    if (errors?.length) { console.error(`[${model}] ${r.id}: ${errors.map(e => e.message).join('; ')}`); counts[model]!.failed++; }
    else counts[model]!.ok++;
  }
  console.log(`${model}: ${counts[model]!.ok}/${counts[model]!.expected} migrated${counts[model]!.failed ? `, ${counts[model]!.failed} FAILED` : ''}`);
}

const coords = (c: [number, number]) => ({ lat: c[0], lng: c[1] });

// ---------------- Migration ----------------

async function main() {
  await run('Country', COUNTRIES, c => {
    const info = COUNTRY_INFO[c.id];
    return {
      iso: c.iso, name: c.name, region: c.region, phase: c.phase, media: c.media, tagline: c.tagline,
      entry: info?.entry ?? c.entry, emergency: info?.emergency ?? c.emergency, timezone: info?.timezone ?? c.timezone,
      languages: info?.languages ?? c.languages, currency: info?.currency
    };
  }, client.models.Country.create);

  await run('Destination', DESTINATIONS, d => ({
    slug: d.slug, name: d.name, countryId: d.countryId, area: d.area, media: d.media, gallery: d.gallery,
    summary: d.summary, overview: d.overview, tags: d.tags, coordinates: coords(d.coordinates), bestMonths: d.bestMonths,
    fromPriceUsd: d.fromPriceUsd, rating: d.rating, reviewCount: d.reviewCount, aliases: d.aliases, ecoCertified: d.ecoCertified,
    climate: d.climate, typicalDaysMin: d.typicalDays[0], typicalDaysMax: d.typicalDays[1], accessible: d.accessible,
    familyFriendly: d.familyFriendly, safety: d.safety, sustainability: d.sustainability, nearby: d.nearby
  }), client.models.Destination.create);

  await run('Partner', PARTNERS, p => ({
    slug: p.slug, name: p.name, kind: p.kind, logo: p.logo, cover: p.cover, destinationIds: p.destinationIds,
    description: p.description, verified: p.verified, founding: p.founding, real: p.real, languages: p.languages,
    responseHours: p.responseHours, whatsapp: p.whatsapp, since: p.since, tagline: p.tagline
  }), client.models.Partner.create);

  await run('Listing', LISTINGS, async l => {
    const reason = await reject360(l.pano, undefined);
    if (reason) { console.error(`[Listing] ${l.id}: ${reason}`); return undefined; }
    return {
      slug: l.slug, type: l.type, subtype: l.subtype, title: l.title, summary: l.summary, description: l.description,
      partnerId: l.partnerId, destinationId: l.destinationId, media: l.media, pano: l.pano,
      priceAmountUsd: l.price.amountUsd, priceUnit: l.price.unit, priceIndicative: l.price.indicative, taxRate: l.taxRate,
      capacity: l.capacity, durationHours: l.durationHours, durationDays: l.durationDays, amenities: l.amenities,
      rating: l.rating, reviewCount: l.reviewCount, sustainability: l.sustainability, coordinates: coords(l.coordinates),
      cancellation: l.cancellation, closedMonths: l.closedMonths, date: l.date, startTimes: l.startTimes,
      instantBook: l.instantBook, sample: l.sample, extras: l.extras
    };
  }, client.models.Listing.create);

  await run('Experience', EXPERIENCES, async e => {
    const reason = await reject360(e.pano, e.video);
    if (reason) { console.error(`[Experience] ${e.id}: ${reason}`); return undefined; }
    return {
      slug: e.slug, title: e.title, tagline: e.tagline, destinationId: e.destinationId, kind: e.kind, media: e.media,
      video: e.video, pano: e.pano, startYaw: e.startYaw, durationMin: e.durationMin, hasNarration: e.hasNarration,
      narration: e.narration, facts: e.facts, hotspots: e.hotspots, rating: e.rating, reviewCount: e.reviewCount,
      featured: e.featured, listingIds: e.listingIds
    };
  }, client.models.Experience.create);

  await run('Review', REVIEWS, r => ({
    targetType: r.targetType, targetId: r.targetId, author: r.author, countryIso: r.countryIso, rating: r.rating,
    title: r.title, text: r.text, date: r.date, verifiedBooking: r.verifiedBooking, lang: r.lang, status: 'approved'
    // 'mine' is a client-only UI flag — intentionally dropped, never persisted.
  }), client.models.Review.create);

  const failed = Object.entries(counts).filter(([, c]) => c.failed > 0);
  if (failed.length) {
    console.error(`\nMigration finished with failures: ${failed.map(([m, c]) => `${m} (${c.failed})`).join(', ')}`);
    process.exit(1);
  }
  console.log('\nMigration complete — all records migrated.');
}

main().catch(e => { console.error(e); process.exit(1); });
