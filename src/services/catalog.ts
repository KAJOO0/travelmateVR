import type { Category, Country, Destination, Experience, InterestTag, Listing, ListingType, Partner, Review } from '@/domain/types';
import { COUNTRIES } from '@/data/seed/countries';
import { DESTINATIONS } from '@/data/seed/destinations';
import { CATEGORIES, EXPERIENCES } from '@/data/seed/experiences';
import { LISTINGS } from '@/data/seed/listings';
import { PARTNERS } from '@/data/seed/partners';
import { REVIEWS } from '@/data/seed/reviews';
import { COUNTRY_INFO } from '@/data/seed/reference';
import { DATA_SOURCE, demoLatency, http } from './http';
import { byFormat, is360 } from '@/lib/immersive';

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

const qs = (o: object) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
const httpCatalog: CatalogService = {
  categories: () => http('/catalog/categories'),
  countries: () => http('/catalog/countries'),
  destinations: () => http('/catalog/destinations'),
  destination: (id) => http(`/catalog/destinations/${encodeURIComponent(id)}`),
  experiences: (f = {}) => http(`/experiences?${qs(f)}`),
  experience: (id) => http(`/experiences/${encodeURIComponent(id)}`),
  listings: (f = {}) => http(`/marketplace/listings?${qs({ ...f, tags: f.tags?.join(',') })}`),
  listing: (id) => http(`/marketplace/listings/${encodeURIComponent(id)}`),
  partner: (id) => http(`/partners/${encodeURIComponent(id)}`),
  partners: () => http('/partners'),
  reviews: (type, id) => http(`/reviews?targetType=${type}&targetId=${encodeURIComponent(id)}`)
};

export const catalog: CatalogService = DATA_SOURCE === 'http' ? httpCatalog : mockCatalog;

/** Synchronous lookups for the demo data (search suggestions, AI planner, offline trip views). */
export const seedIndex = {
  countries, destinations: DESTINATIONS, experiences: EXPERIENCES, listings: LISTINGS, partners: PARTNERS, reviews: REVIEWS,
  destById, listingById, partnerById, experienceById
};
