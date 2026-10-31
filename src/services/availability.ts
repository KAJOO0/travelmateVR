import type { Booking, Listing } from '@/domain/types';
import { addDays } from '@/lib/random';
import { bookingStore, HOLDS_INVENTORY, partnerBookingStore } from './bookings';
import { blackoutStore, isBlackedOut, unitsFor } from './inventory';

/** Units a booking consumes on each day it covers: rooms, vehicles, groups, or guests for per-person items. */
export function unitsUsed(b: Booking, listing: Listing): number {
  switch (listing.price.unit) {
    case 'night': case 'vehicle': case 'group': return Math.max(1, b.units);
    case 'trip': return 1;
    default: return b.guests.adults + b.guests.children;
  }
}

/** Days a booking occupies: check-in to the night before check-out for stays, otherwise the start date (or the tour length). */
export function daysCovered(b: Booking, listing: Listing): string[] {
  if (b.endDate && listing.price.unit === 'night') {
    const out: string[] = [];
    for (let d = b.date; d < b.endDate && out.length < 60; d = addDays(d, 1)) out.push(d);
    return out.length ? out : [b.date];
  }
  if (listing.durationDays && listing.durationDays > 1) return Array.from({ length: listing.durationDays }, (_, i) => addDays(b.date, i));
  return [b.date];
}

export interface DayAvailability { date: string; capacity: number; booked: number; left: number; blackout: boolean; bookings: Booking[] }

/** Availability for a listing over a date range (inclusive start, exclusive end). */
export function availability(listing: Listing, from: string, to: string, all = [...bookingStore.get(), ...partnerBookingStore.get()]): DayAvailability[] {
  const capacity = unitsFor(listing);
  const blackouts = new Set(blackoutStore.get()[listing.id] ?? []);
  const byDay = new Map<string, Booking[]>();
  for (const b of all) {
    if (b.listingId !== listing.id || !HOLDS_INVENTORY.includes(b.status)) continue;
    for (const d of daysCovered(b, listing)) if (d >= from && d < to) byDay.set(d, [...(byDay.get(d) ?? []), b]);
  }
  const out: DayAvailability[] = [];
  for (let d = from; d < to && out.length < 400; d = addDays(d, 1)) {
    const bookings = byDay.get(d) ?? [];
    const booked = bookings.reduce((s, b) => s + unitsUsed(b, listing), 0);
    const blackout = blackouts.has(d);
    out.push({ date: d, capacity, booked, left: blackout ? 0 : Math.max(0, capacity - booked), blackout, bookings });
  }
  return out;
}

/**
 * Can this request be booked? Used by the listing page and checkout.
 * Returns the first problem date, if any: a blackout set by the partner, or not enough units left.
 */
export function checkAvailability(listing: Listing, date: string, nights: number, needed: number): { ok: true } | { ok: false; reason: 'blackout' | 'soldout'; date: string } {
  const span = listing.price.unit === 'night' ? Math.max(1, nights) : listing.durationDays ?? 1;
  for (let i = 0; i < span; i++) {
    const d = addDays(date, i);
    if (isBlackedOut(listing.id, d)) return { ok: false, reason: 'blackout', date: d };
  }
  const days = availability(listing, date, addDays(date, span));
  const short = days.find(x => x.left < needed);
  return short ? { ok: false, reason: 'soldout', date: short.date } : { ok: true };
}
