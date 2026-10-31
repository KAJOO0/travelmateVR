import type { Category, Country, Destination, Experience, Hotspot, InterestTag, Listing, ListingType, LocalizedText, Partner, Review } from '@/domain/types';
import { COUNTRIES } from '@/data/seed/countries';
import { DESTINATIONS } from '@/data/seed/destinations';
import { CATEGORIES, EXPERIENCES } from '@/data/seed/experiences';
import { LISTINGS } from '@/data/seed/listings';
import { PARTNERS } from '@/data/seed/partners';
import { REVIEWS } from '@/data/seed/reviews';
import { COUNTRY_INFO } from '@/data/seed/reference';
import { REAL_BACKEND, demoLatency } from './http';
import { byFormat, is360 } from '@/lib/immersive';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

export interface CountrySummary extends Country {
  destinationCount: number;
  experienceCount: number;
}

export interface ExperienceFilter {
  featured?: boolean;
  countryId?: string;
  destinationId?: string;
  only360?: boolean;
  limit?: number;
}

export interface ListingFilter {
  type?: ListingType;
  destinationId?: string;
  countryId?: string;
  partnerId?: string;
  subtype?: string;
  maxPriceUsd?: number;
  eco?: boolean;
  community?: boolean;
  instantBook?: boolean;
  tags?: InterestTag[];
  q?: string;
  limit?: number;
}

/** Catalogue service boundary: countries, destinations, immersive experiences, marketplace listings, partners, reviews. */
export interface CatalogService {
  categories(): Promise<Category[]>;
  countries(): Promise<CountrySummary[]>;
  destinations(): Promise<Destination[]>;
  destination(idOrSlug: string): Promise<Destination | undefined>;
  experiences(filter?: ExperienceFilter): Promise<Experience[]>;
  experience(idOrSlug: string): Promise<Experience | undefined>;
  listings(filter?: ListingFilter): Promise<Listing[]>;
  listing(idOrSlug: string): Promise<Listing | undefined>;
  partner(idOrSlug: string): Promise<Partner | undefined>;
  partners(): Promise<Partner[]>;
  reviews(targetType: Review['targetType'], targetId: string): Promise<Review[]>;
}

const destById = new Map(DESTINATIONS.map(d => [d.id, d]));
const listingById = new Map(LISTINGS.map(l => [l.id, l]));
const partnerById = new Map(PARTNERS.map(p => [p.id, p]));
const experienceById = new Map(EXPERIENCES.map(e => [e.id, e]));
const countries: Country[] = COUNTRIES.map(c => ({ ...c, ...(COUNTRY_INFO[c.id] ? { entry: COUNTRY_INFO[c.id]!.entry, emergency: COUNTRY_INFO[c.id]!.emergency, timezone: COUNTRY_INFO[c.id]!.timezone, languages: COUNTRY_INFO[c.id]!.languages } : {}) }));

/** Pure filter, shared by the demo service and the UI (instant client-side filtering). */
export function filterListings(list: Listing[], f: ListingFilter = {}): Listing[] {
  const q = f.q?.toLowerCase().trim();
  let out = list.filter(l => {
    const d = destById.get(l.destinationId);
    return !l.paused
      && (!f.type || l.type === f.type)
      && (!f.destinationId || l.destinationId === f.destinationId)
      && (!f.countryId || d?.countryId === f.countryId)
      && (!f.partnerId || l.partnerId === f.partnerId)
      && (!f.subtype || l.subtype === f.subtype)
      && (f.maxPriceUsd === undefined || l.price.amountUsd <= f.maxPriceUsd)
      && (!f.eco || !!l.sustainability.ecoCertified)
      && (!f.community || !!l.sustainability.communityLed || !!l.sustainability.localOwned)
      && (!f.instantBook || l.instantBook)
      && (!f.tags?.length || f.tags.some(tag => d?.tags.includes(tag)))
      && (!q || l.title.en.toLowerCase().includes(q) || l.summary.en.toLowerCase().includes(q) || (d?.name.toLowerCase().includes(q) ?? false));
  });
  if (f.limit) out = out.slice(0, f.limit);
  return out;
}

const mockCatalog: CatalogService = {
  async categories() { await demoLatency(0, 60); return CATEGORIES; },
  async countries() {
    await demoLatency();
    return countries.map(c => ({
      ...c,
      destinationCount: DESTINATIONS.filter(d => d.countryId === c.id).length,
      experienceCount: EXPERIENCES.filter(e => destById.get(e.destinationId)?.countryId === c.id).length
    }));
  },
  async destinations() { await demoLatency(); return DESTINATIONS; },
  async destination(idOrSlug) { await demoLatency(); return DESTINATIONS.find(d => d.id === idOrSlug || d.slug === idOrSlug); },
  async experiences(filter = {}) {
    await demoLatency();
    let list = EXPERIENCES.filter(e => {
      const d = destById.get(e.destinationId);
      return (!filter.featured || e.featured)
        && (!filter.only360 || is360(e))
        && (!filter.destinationId || e.destinationId === filter.destinationId)
        && (!filter.countryId || d?.countryId === filter.countryId);
    }).sort(byFormat);
    if (filter.limit) list = list.slice(0, filter.limit);
    return list;
  },
  async experience(idOrSlug) { await demoLatency(80, 200); return EXPERIENCES.find(e => e.id === idOrSlug || e.slug === idOrSlug); },
  async listings(filter = {}) { await demoLatency(); return filterListings(LISTINGS, filter); },
  async listing(idOrSlug) { await demoLatency(); return LISTINGS.find(l => l.id === idOrSlug || l.slug === idOrSlug); },
  async partner(idOrSlug) { await demoLatency(); return PARTNERS.find(p => p.id === idOrSlug || p.slug === idOrSlug); },
  async partners() { await demoLatency(); return PARTNERS; },
  async reviews(targetType, targetId) { await demoLatency(60, 200); return REVIEWS.filter(r => r.targetType === targetType && r.targetId === targetId); }
};

// ---------------- Real backend (AWS Amplify Data) ----------------
// Reads the catalogue models defined in amplify/data/resource.ts. Each model's `id` is the
// same stable, human-readable id the seed data already uses (set explicitly on create by
// scripts/migrate-seed-to-amplify.ts), so cross-references (destinationId, partnerId, …)
// keep working exactly like the mock catalog's Maps above.
const client = generateClient<Schema>({ authMode: 'identityPool' });

/** null -> undefined; Amplify Data returns null for unset optional fields, the domain types use undefined. */
const nn = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

type RawLocalized = { en?: string | null; fr?: string | null; de?: string | null; zh?: string | null; it?: string | null } | null | undefined;
const toLocalized = (v: RawLocalized): LocalizedText | undefined =>
  v ? { en: v.en ?? '', ...(v.fr ? { fr: v.fr } : {}), ...(v.de ? { de: v.de } : {}), ...(v.zh ? { zh: v.zh } : {}), ...(v.it ? { it: v.it } : {}) } : undefined;
const toLocalizedReq = (v: RawLocalized): LocalizedText => toLocalized(v) ?? { en: '' };

type RawCoords = { lat: number; lng: number } | null | undefined;
const toCoords = (v: RawCoords): [number, number] => [v?.lat ?? 0, v?.lng ?? 0];

/** Follows nextToken pagination so list() callers always get every record, not just one page. */
async function listAll<T>(page: (nextToken?: string) => Promise<{ data: T[]; nextToken?: string | null }>): Promise<T[]> {
  const out: T[] = [];
  let token: string | undefined;
  do {
    const res = await page(token);
    out.push(...res.data);
    token = res.nextToken ?? undefined;
  } while (token);
  return out;
}

function toCountry(c: Schema['Country']['type']): Country {
  return {
    id: c.id, iso: c.iso, name: nn(c.name), region: c.region as Country['region'], phase: c.phase as Country['phase'],
    media: c.media, tagline: toLocalizedReq(c.tagline), entry: toLocalized(c.entry), emergency: nn(c.emergency),
    timezone: nn(c.timezone), languages: nn(c.languages)?.filter((l): l is string => l != null)
  };
}

function toDestination(d: Schema['Destination']['type']): Destination {
  return {
    id: d.id, slug: d.slug, name: d.name, countryId: d.countryId, area: toLocalizedReq(d.area), media: d.media,
    gallery: nn(d.gallery)?.filter((g): g is string => g != null), summary: toLocalizedReq(d.summary), overview: toLocalized(d.overview),
    tags: (nn(d.tags)?.filter((t): t is string => t != null) ?? []) as InterestTag[], coordinates: toCoords(d.coordinates),
    bestMonths: nn(d.bestMonths)?.filter((m): m is number => m != null) ?? [], fromPriceUsd: d.fromPriceUsd, rating: d.rating,
    reviewCount: d.reviewCount, aliases: nn(d.aliases)?.filter((a): a is string => a != null), ecoCertified: nn(d.ecoCertified),
    climate: d.climate as Destination['climate'], typicalDays: [d.typicalDaysMin, d.typicalDaysMax], accessible: nn(d.accessible),
    familyFriendly: nn(d.familyFriendly), safety: toLocalized(d.safety), sustainability: toLocalized(d.sustainability),
    nearby: nn(d.nearby)?.filter((x): x is string => x != null)
  };
}

function toPartner(p: Schema['Partner']['type']): Partner {
  return {
    id: p.id, slug: p.slug, name: p.name, kind: p.kind as Partner['kind'], logo: nn(p.logo), cover: p.cover,
    destinationIds: nn(p.destinationIds)?.filter((x): x is string => x != null) ?? [], description: toLocalizedReq(p.description),
    verified: p.verified, founding: nn(p.founding), real: p.real, languages: nn(p.languages)?.filter((l): l is string => l != null) ?? [],
    responseHours: nn(p.responseHours), whatsapp: nn(p.whatsapp), since: nn(p.since), tagline: toLocalized(p.tagline)
  };
}

function toListing(l: Schema['Listing']['type']): Listing {
  return {
    id: l.id, slug: l.slug, type: l.type as ListingType, subtype: l.subtype, title: toLocalizedReq(l.title),
    summary: toLocalizedReq(l.summary), description: toLocalizedReq(l.description), partnerId: l.partnerId, destinationId: l.destinationId,
    media: nn(l.media)?.filter((m): m is string => m != null) ?? [], pano: nn(l.pano),
    price: { amountUsd: l.priceAmountUsd, unit: l.priceUnit as Listing['price']['unit'], indicative: nn(l.priceIndicative) },
    taxRate: l.taxRate, capacity: nn(l.capacity), durationHours: nn(l.durationHours), durationDays: nn(l.durationDays),
    amenities: nn(l.amenities)?.filter((a): a is string => a != null) ?? [], rating: nn(l.rating), reviewCount: l.reviewCount,
    sustainability: {
      ecoCertified: nn(l.sustainability?.ecoCertified), certification: nn(l.sustainability?.certification),
      communityLed: nn(l.sustainability?.communityLed), localOwned: nn(l.sustainability?.localOwned),
      contributionUsd: nn(l.sustainability?.contributionUsd), note: toLocalized(l.sustainability?.note)
    },
    coordinates: toCoords(l.coordinates), cancellation: l.cancellation as Listing['cancellation'],
    closedMonths: nn(l.closedMonths)?.filter((m): m is number => m != null), date: nn(l.date),
    startTimes: nn(l.startTimes)?.filter((s): s is string => s != null), instantBook: l.instantBook, sample: nn(l.sample),
    extras: nn(l.extras)?.filter((e): e is NonNullable<typeof e> => e != null)
      .map(e => ({ id: e.id, label: toLocalizedReq(e.label), priceUsd: e.priceUsd, per: e.per as 'booking' | 'person' })),
    paused: nn(l.paused)
  };
}

function toExperience(e: Schema['Experience']['type']): Experience {
  return {
    id: e.id, slug: e.slug, title: toLocalizedReq(e.title), tagline: toLocalizedReq(e.tagline), destinationId: e.destinationId,
    kind: e.kind as Experience['kind'], media: e.media, video: nn(e.video), pano: nn(e.pano), startYaw: nn(e.startYaw),
    durationMin: e.durationMin, hasNarration: e.hasNarration, narration: toLocalized(e.narration),
    facts: nn(e.facts)?.filter((f): f is NonNullable<typeof f> => f != null).map(toLocalizedReq),
    hotspots: nn(e.hotspots)?.filter((h): h is NonNullable<typeof h> => h != null)
      .map((h): Hotspot => ({ yaw: h.yaw, pitch: h.pitch, kind: h.kind as Hotspot['kind'], title: toLocalizedReq(h.title), text: toLocalizedReq(h.text) })),
    rating: e.rating, reviewCount: e.reviewCount, featured: nn(e.featured),
    listingIds: nn(e.listingIds)?.filter((x): x is string => x != null)
  };
}

function toReview(r: Schema['Review']['type']): Review {
  return {
    id: r.id, targetType: r.targetType as Review['targetType'], targetId: r.targetId, author: r.author, countryIso: r.countryIso,
    rating: r.rating, title: r.title, text: r.text, date: r.date, verifiedBooking: r.verifiedBooking, lang: r.lang as Review['lang'],
    status: nn(r.status)
  };
}

const amplifyCatalog: CatalogService = {
  async categories() { return CATEGORIES; }, // small fixed UI constant, not a persisted model either way
  async countries() {
    const [raw, dests, exps] = await Promise.all([
      listAll(nextToken => client.models.Country.list({ nextToken })),
      listAll(nextToken => client.models.Destination.list({ nextToken })),
      listAll(nextToken => client.models.Experience.list({ nextToken }))
    ]);
    const destToCountry = new Map(dests.map(d => [d.id, d.countryId]));
    return raw.map(c => ({
      ...toCountry(c),
      destinationCount: dests.filter(d => d.countryId === c.id).length,
      experienceCount: exps.filter(e => destToCountry.get(e.destinationId) === c.id).length
    }));
  },
  async destinations() { return (await listAll(nextToken => client.models.Destination.list({ nextToken }))).map(toDestination); },
  async destination(idOrSlug) {
    const bySlug = await client.models.Destination.list({ filter: { slug: { eq: idOrSlug } }, limit: 1 });
    const d = bySlug.data[0] ?? (await client.models.Destination.get({ id: idOrSlug })).data;
    return d ? toDestination(d) : undefined;
  },
  async experiences(filter = {}) {
    let list = (await listAll(nextToken => client.models.Experience.list({ nextToken }))).map(toExperience);
    if (filter.destinationId) list = list.filter(e => e.destinationId === filter.destinationId);
    if (filter.featured) list = list.filter(e => e.featured);
    if (filter.only360) list = list.filter(is360);
    if (filter.countryId) {
      const dests = await listAll(nextToken => client.models.Destination.list({ nextToken, filter: { countryId: { eq: filter.countryId } } }));
      const ids = new Set(dests.map(d => d.id));
      list = list.filter(e => ids.has(e.destinationId));
    }
    list = list.sort(byFormat);
    return filter.limit ? list.slice(0, filter.limit) : list;
  },
  async experience(idOrSlug) {
    const bySlug = await client.models.Experience.list({ filter: { slug: { eq: idOrSlug } }, limit: 1 });
    const e = bySlug.data[0] ?? (await client.models.Experience.get({ id: idOrSlug })).data;
    return e ? toExperience(e) : undefined;
  },
  async listings(filter = {}) { return filterListings((await listAll(nextToken => client.models.Listing.list({ nextToken }))).map(toListing), filter); },
  async listing(idOrSlug) {
    const bySlug = await client.models.Listing.list({ filter: { slug: { eq: idOrSlug } }, limit: 1 });
    const l = bySlug.data[0] ?? (await client.models.Listing.get({ id: idOrSlug })).data;
    return l ? toListing(l) : undefined;
  },
  async partner(idOrSlug) {
    const bySlug = await client.models.Partner.list({ filter: { slug: { eq: idOrSlug } }, limit: 1 });
    const p = bySlug.data[0] ?? (await client.models.Partner.get({ id: idOrSlug })).data;
    return p ? toPartner(p) : undefined;
  },
  async partners() { return (await listAll(nextToken => client.models.Partner.list({ nextToken }))).map(toPartner); },
  async reviews(targetType, targetId) {
    const raw = await listAll(nextToken => client.models.Review.list({ nextToken, filter: { targetType: { eq: targetType }, targetId: { eq: targetId }, status: { eq: 'approved' } } }));
    return raw.map(toReview);
  }
};

export const catalog: CatalogService = REAL_BACKEND ? amplifyCatalog : mockCatalog;

/** Synchronous lookups for the demo data (search suggestions, AI planner, offline trip views). */
export const seedIndex = {
  countries, destinations: DESTINATIONS, experiences: EXPERIENCES, listings: LISTINGS, partners: PARTNERS, reviews: REVIEWS,
  destById, listingById, partnerById, experienceById
};
