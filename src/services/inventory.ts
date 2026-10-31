import type { Cancellation, ListingType, Locale, Listing, LocalizedText, PriceUnit } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { LISTINGS } from '@/data/seed/listings';
import { DESTINATIONS } from '@/data/seed/destinations';
import { PARTNERS } from '@/data/seed/partners';
import { seedIndex } from './catalog';

// ---------------------------------------------------------------------------------------------
// Partner inventory (demo layer).
// Partners edit their listings in the portal; the changes are stored here and overlaid on the
// catalogue, so the marketplace, listing pages and checkout show what the partner published.
// Production: the same edits are API calls, and the catalogue service returns the updated listings.
// ---------------------------------------------------------------------------------------------

export interface ListingOverride {
  priceUsd?: number;
  /** Guests per room (stays) or maximum group size. */
  capacity?: number;
  /** Bookable units per day: rooms, vehicles, tables or places. */
  units?: number;
  instantBook?: boolean;
  paused?: boolean;
  title?: Partial<LocalizedText>;
  summary?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  amenities?: string[];
  cancellation?: Cancellation;
  startTimes?: string[];
  closedMonths?: number[];
  updatedAt?: string;
}

export interface SeasonalRate { id: string; listingId: string; from: string; to: string; priceUsd: number; label?: string }

export interface Promotion {
  id: string;
  partnerId: string;
  name: string;
  listingIds: string[];
  /** Percentage off base price and extras, e.g. 15. */
  percent: number;
  /** Stay / activity dates the promotion applies to (inclusive). */
  from: string;
  to: string;
  active: boolean;
  createdAt: string;
}

export interface ListingDraft {
  id: string;
  partnerId: string;
  type: ListingType;
  subtype: string;
  title: string;
  summary: string;
  description: string;
  destinationId: string;
  priceUsd: number;
  unit: PriceUnit;
  capacity: number;
  units: number;
  lang: Locale;
  /** draft → in_review (partner submits) → published or rejected (TravelMateVR review). */
  status: 'draft' | 'in_review' | 'published' | 'rejected';
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const overrideStore = createStore<Record<string, ListingOverride>>('tm.inv.overrides', () => ({}));
export const seasonalStore = createStore<SeasonalRate[]>('tm.inv.seasonal', () => [
  // Sample peak-season rate for the demo partner, so the calendar has something to show.
  { id: 'sr-migration', listingId: 'stay-serengeti-kijani-camp', from: '2027-07-01', to: '2027-09-30', priceUsd: 760, label: 'Migration season' }
]);
export const blackoutStore = createStore<Record<string, string[]>>('tm.inv.blackouts', () => ({}));
export const promotionStore = createStore<Promotion[]>('tm.inv.promotions', () => [
  { id: 'promo-green', partnerId: 'kijani-camps', name: 'Green season stay', listingIds: ['stay-tarangire-eco-lodge'], percent: 15, from: '2027-04-01', to: '2027-05-31', active: true, createdAt: '2026-09-01T09:00:00Z' }
]);
export const draftStore = createStore<ListingDraft[]>('tm.inv.drafts', () => []);
/** Set by TravelMateVR admins: suspended partners' listings are hidden; verification and commission overrides. */
export const partnerAdminStore = createStore<Record<string, { suspended?: boolean; verified?: boolean; commissionRate?: number; note?: string }>>('tm.admin.partners', () => ({}));

export const useOverrides = () => useStore(overrideStore);
export const useSeasonal = () => useStore(seasonalStore);
export const useBlackouts = () => useStore(blackoutStore);
export const usePromotions = () => useStore(promotionStore);
export const useDrafts = () => useStore(draftStore);

/** Default bookable units per day when the partner hasn't set them. */
export function defaultUnits(l: Pick<Listing, 'type' | 'capacity' | 'price'>): number {
  switch (l.type) {
    case 'stay': return 8;
    case 'restaurant': return 40;
    case 'event': return 200;
    case 'transport': return l.price.unit === 'seat' ? 12 : 3;
    case 'safari': return l.price.unit === 'person' ? (l.capacity ?? 6) * 2 : 3;
    default: return l.capacity ?? 12;
  }
}
export const unitsFor = (l: Listing) => overrideStore.get()[l.id]?.units ?? defaultUnits(l);

// ---------------- overlay onto the catalogue ----------------
const ORIGINAL = new Map(LISTINGS.map(l => [l.id, structuredClone(l)]));
const SEED_COUNT = LISTINGS.length;
/** The catalogue's id → listing index follows the overlay (partner-published listings included). */
const listingIndex: Map<string, Listing> = seedIndex.listingById;

/** A partner draft approved by TravelMateVR, as a marketplace listing (starts as request-to-book). */
function draftToListing(d: ListingDraft): Listing {
  const dest = DESTINATIONS.find(x => x.id === d.destinationId);
  const partner = PARTNERS.find(x => x.id === d.partnerId);
  const text = (v: string) => ({ en: v, [d.lang]: v }) as LocalizedText;
  const slug = d.title.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 48) || 'listing';
  return {
    id: d.id, slug: `${slug}-${d.id.slice(-4)}`, type: d.type, subtype: d.subtype, title: text(d.title), summary: text(d.summary), description: text(d.description),
    partnerId: d.partnerId, destinationId: d.destinationId, media: [partner?.cover ?? dest?.media ?? 'serengeti-herds'],
    price: { amountUsd: d.priceUsd, unit: d.unit }, taxRate: 0.18, capacity: d.capacity, amenities: [], reviewCount: 0, sustainability: {},
    coordinates: dest?.coordinates ?? [-6.3, 34.8], cancellation: 'moderate', instantBook: false, sample: partner ? !partner.real : true
  };
}

function applyOverrides() {
  // Approved partner drafts join the catalogue (then get the same overrides as any listing).
  LISTINGS.splice(SEED_COUNT, LISTINGS.length - SEED_COUNT, ...draftStore.get().filter(d => d.status === 'published').map(draftToListing));
  for (const l of LISTINGS.slice(SEED_COUNT)) if (!ORIGINAL.has(l.id)) ORIGINAL.set(l.id, structuredClone(l));
  const all = overrideStore.get();
  const admin = partnerAdminStore.get();
  for (const l of LISTINGS) {
    const base = ORIGINAL.get(l.id)!;
    const o = all[l.id];
    Object.assign(l, structuredClone(base));
    if (!o) { if (admin[l.partnerId]?.suspended) l.paused = true; else delete l.paused; continue; }
    if (o.priceUsd !== undefined) l.price = { ...l.price, amountUsd: o.priceUsd };
    if (o.capacity !== undefined) l.capacity = o.capacity;
    if (o.instantBook !== undefined) l.instantBook = o.instantBook;
    if (o.paused || admin[l.partnerId]?.suspended) l.paused = true; else delete l.paused;
    if (o.title) l.title = { ...l.title, ...o.title } as LocalizedText;
    if (o.summary) l.summary = { ...l.summary, ...o.summary } as LocalizedText;
    if (o.description) l.description = { ...l.description, ...o.description } as LocalizedText;
    if (o.amenities) l.amenities = o.amenities;
    if (o.cancellation) l.cancellation = o.cancellation;
    if (o.startTimes) l.startTimes = o.startTimes;
    if (o.closedMonths) l.closedMonths = o.closedMonths;
  }
  listingIndex.clear();
  for (const l of LISTINGS) listingIndex.set(l.id, l);
}
applyOverrides();
overrideStore.subscribe(applyOverrides);
draftStore.subscribe(applyOverrides);
partnerAdminStore.subscribe(applyOverrides);

// ---------------- pricing helpers (used by services/pricing.ts) ----------------
/** Nightly / unit price on a given date: seasonal rate if one covers the date, else the listing price. */
export function priceOn(listing: Listing, date?: string): number {
  if (!date) return listing.price.amountUsd;
  const rate = seasonalStore.get().find(r => r.listingId === listing.id && r.from <= date && date <= r.to);
  return rate?.priceUsd ?? listing.price.amountUsd;
}

/** Active promotion covering this listing on the given date (the best one if several). */
export function promotionFor(listing: Listing, date?: string): Promotion | undefined {
  const d = date ?? new Date().toISOString().slice(0, 10);
  return promotionStore.get()
    .filter(p => p.active && p.listingIds.includes(listing.id) && p.from <= d && d <= p.to)
    .sort((a, b) => b.percent - a.percent)[0];
}

/** Any active or upcoming promotion on a listing (for "offer" badges on cards). */
export function currentOffer(listing: Listing): Promotion | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return promotionStore.get().filter(p => p.active && p.listingIds.includes(listing.id) && p.to >= today).sort((a, b) => b.percent - a.percent)[0];
}

export const isBlackedOut = (listingId: string, date: string) => (blackoutStore.get()[listingId] ?? []).includes(date);

// ---------------- partner actions ----------------
export const inventory = {
  update(listingId: string, patch: ListingOverride) {
    overrideStore.set(all => ({ ...all, [listingId]: { ...all[listingId], ...patch, updatedAt: nowIso() } }));
  },
  /** Reverts a listing to its published catalogue version. */
  reset(listingId: string) {
    overrideStore.set(all => { const next = { ...all }; delete next[listingId]; return next; });
  },
  toggleBlackout(listingId: string, dates: string[], on: boolean) {
    blackoutStore.set(all => {
      const set = new Set(all[listingId] ?? []);
      dates.forEach(d => (on ? set.add(d) : set.delete(d)));
      return { ...all, [listingId]: [...set].sort() };
    });
  },
  addSeasonal(rate: Omit<SeasonalRate, 'id'>) { seasonalStore.set(list => [...list, { ...rate, id: uid('sr_') }]); },
  removeSeasonal(id: string) { seasonalStore.set(list => list.filter(r => r.id !== id)); },
  savePromotion(p: Omit<Promotion, 'id' | 'createdAt'> & { id?: string }) {
    promotionStore.set(list => p.id
      ? list.map(x => (x.id === p.id ? { ...x, ...p, id: x.id } : x))
      : [{ ...p, id: uid('promo_'), createdAt: nowIso() }, ...list]);
  },
  removePromotion(id: string) { promotionStore.set(list => list.filter(p => p.id !== id)); },
  saveDraft(d: Omit<ListingDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const id = d.id ?? uid('draft_');
    draftStore.set(list => list.some(x => x.id === id)
      ? list.map(x => (x.id === id ? { ...x, ...d, id, updatedAt: nowIso() } : x))
      : [{ ...d, id, createdAt: nowIso(), updatedAt: nowIso() }, ...list]);
    return id;
  },
  removeDraft(id: string) { draftStore.set(list => list.filter(x => x.id !== id)); }
};
