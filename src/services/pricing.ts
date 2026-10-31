import type { Listing, PriceBreakdown } from '@/domain/types';
import { priceOn, promotionFor } from './inventory';
import { serviceFeeRate } from './platform';

/** TravelMateVR service fee charged to travellers (transparent, shown on every booking). Set in the Command Center. */
export { serviceFeeRate } from './platform';

export interface PriceInput {
  listing: Listing;
  adults: number;
  children: number;
  /** Nights for stays, days for daily hires; 1 otherwise. */
  nights: number;
  units: number;
  extras: string[];
  /** Start date: picks up seasonal rates and partner promotions. */
  date?: string;
}

/** Number of travellers a per-person price applies to (children at 50% on safaris and activities). */
export function chargeableGuests(adults: number, children: number, listing: Listing): number {
  const childRate = listing.type === 'safari' || listing.type === 'activity' || listing.type === 'local' ? 0.5 : 1;
  return adults + children * childRate;
}

export function quote({ listing, adults, children, nights, units, extras, date }: PriceInput): PriceBreakdown {
  const p = priceOn(listing, date);
  let base: number;
  switch (listing.price.unit) {
    case 'night': base = p * Math.max(1, nights) * Math.max(1, units); break;
    case 'vehicle': base = p * Math.max(1, units) * Math.max(1, nights); break;
    case 'group': base = p * Math.max(1, units); break;
    case 'trip': base = p; break;
    default: base = p * chargeableGuests(adults, children, listing);
  }
  const guests = adults + children;
  const extrasTotal = (listing.extras ?? []).filter(x => extras.includes(x.id)).reduce((s, x) => s + x.priceUsd * (x.per === 'person' ? guests : 1), 0);
  const promo = promotionFor(listing, date);
  const discount = promo ? round((base + extrasTotal) * promo.percent / 100) : 0;
  const subtotal = base + extrasTotal - discount;
  const taxes = round(subtotal * listing.taxRate);
  const serviceFee = round(subtotal * serviceFeeRate());
  const contribution = (listing.sustainability.contributionUsd ?? 0) * (listing.price.unit === 'night' ? Math.max(1, nights) : guests);
  return {
    base: round(base), extras: round(extrasTotal), taxes, serviceFee, contribution: round(contribution),
    ...(discount ? { discount, promotion: promo!.name } : {}),
    total: round(subtotal + taxes + serviceFee + contribution), currency: 'USD'
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Rough per-item cost used by itineraries before a booking is made. */
export function estimateItem(listing: Listing, travellers: number, nights = 1): number {
  return quote({ listing, adults: travellers, children: 0, nights, units: listing.price.unit === 'night' ? Math.ceil(travellers / Math.max(1, listing.capacity ?? 2)) : 1, extras: [] }).total;
}
