import type { ItineraryDay, ItineraryItem, Slot, Trip } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { seedIndex } from './catalog';

const SLOTS: Slot[] = ['morning', 'afternoon', 'evening'];
const emptyDay = (destinationId: string, date?: string): ItineraryDay => ({ destinationId, date, slots: { morning: [], afternoon: [], evening: [] } });

function itemFromListing(listingId: string, time: string, extra: Partial<ItineraryItem> = {}): ItineraryItem {
  const l = seedIndex.listingById.get(listingId)!;
  return {
    id: uid('it_'), listingId, title: l.title.en, kind: l.type, time, durationHours: l.durationHours ?? (l.durationDays ? 8 : 2),
    priceUsd: l.price.amountUsd, perPerson: !['night', 'vehicle', 'group', 'trip'].includes(l.price.unit), destinationId: l.destinationId, media: l.media[0], ...extra
  };
}

/** A sample upcoming trip so the Trip Control Center has something to show on first visit. */
const seedTrips = (): Trip[] => {
  const days: ItineraryDay[] = [];
  const start = new Date('2026-12-07');
  const dest = ['tarangire', 'serengeti', 'serengeti', 'ngorongoro', 'ngorongoro', 'ngorongoro', 'zanzibar', 'zanzibar', 'zanzibar', 'zanzibar'];
  dest.forEach((d, i) => {
    const date = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    days.push(emptyDay(d, date));
  });
  days[0]!.slots.morning.push(itemFromListing('safari-northern-circuit-group', '07:00', { bookingId: 'TMV-S4MPL1', title: 'Northern Circuit Group Safari, 6 days', priceUsd: 0, note: 'Included in safari package' }));
  days[0]!.slots.evening.push({ id: uid('it_'), title: 'Sundowner at the lodge', kind: 'free', time: '18:00', durationHours: 1, priceUsd: 0, perPerson: false });
  days[1]!.slots.afternoon.push({ id: uid('it_'), title: 'Seronera game drive', kind: 'safari', time: '15:00', durationHours: 3, priceUsd: 0, perPerson: false, note: 'Included in safari package', destinationId: 'serengeti' });
  days[2]!.slots.evening.push(itemFromListing('restaurant-kijani-bush-dinner', '19:00'));
  days[4]!.slots.morning.push({ id: uid('it_'), title: 'Ngorongoro crater descent', kind: 'safari', time: '06:30', durationHours: 6, priceUsd: 0, perPerson: false, note: 'Included in safari package', destinationId: 'ngorongoro' });
  days[6]!.slots.morning.push(itemFromListing('transport-serengeti-flight', '09:00', { title: 'Flight Arusha → Zanzibar', transport: 'flight', priceUsd: 140, perPerson: true }));
  days[6]!.stayListingId = 'stay-zanzibar-pwani-retreat';
  days[7]!.slots.morning.push(itemFromListing('local-stone-town-heritage-walk', '08:30', { bookingId: 'TMV-S4MPL3' }));
  days[7]!.slots.evening.push(itemFromListing('restaurant-stone-town-swahili', '19:00'));
  days[8]!.slots.morning.push(itemFromListing('activity-zanzibar-snorkel', '08:00'));
  days[8]!.stayListingId = 'stay-zanzibar-pwani-retreat';
  days[9]!.slots.afternoon.push(itemFromListing('event-full-moon-dhow', '18:00', { time: '18:00' }));
  return [{
    id: 'trip-sample', name: 'Northern Tanzania & Zanzibar', destinationIds: ['tarangire', 'serengeti', 'ngorongoro', 'zanzibar'],
    startDate: '2026-12-07', endDate: '2026-12-16', adults: 2, children: 0, budgetUsd: 9000, interests: ['wildlife', 'beach', 'culture'],
    days, source: 'manual', notes: 'Sample trip — edit, delete or plan your own.', createdAt: '2026-09-10T10:00:00Z', updatedAt: '2026-09-10T10:00:00Z', sample: true
  }];
};

export const tripStore = createStore<Trip[]>('tm.trips', seedTrips);
export const useTrips = () => useStore(tripStore);

const touch = (t: Trip): Trip => ({ ...t, updatedAt: nowIso() });
const mapTrip = (id: string, fn: (t: Trip) => Trip) => tripStore.set(list => list.map(t => (t.id === id ? touch(fn(t)) : t)));

export interface ItemPos { day: number; slot: Slot; index: number }

export const trips = {
  create(t: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Trip {
    const trip: Trip = { ...t, id: uid('trip_'), createdAt: nowIso(), updatedAt: nowIso() };
    tripStore.set(list => [trip, ...list]);
    return trip;
  },
  update(id: string, patch: Partial<Trip>) { mapTrip(id, t => ({ ...t, ...patch })); },
  remove(id: string) { tripStore.set(list => list.filter(t => t.id !== id)); },
  duplicate(id: string): Trip | undefined {
    const src = tripStore.get().find(t => t.id === id);
    if (!src) return undefined;
    return trips.create({ ...structuredClone(src), name: `${src.name} (copy)` });
  },
  addItem(id: string, day: number, slot: Slot, item: Omit<ItineraryItem, 'id'>) {
    mapTrip(id, t => {
      const days = structuredClone(t.days);
      days[day]?.slots[slot].push({ ...item, id: uid('it_') });
      return { ...t, days };
    });
  },
  removeItem(id: string, pos: ItemPos) {
    mapTrip(id, t => {
      const days = structuredClone(t.days);
      days[pos.day]?.slots[pos.slot].splice(pos.index, 1);
      return { ...t, days };
    });
  },
  moveItem(id: string, from: ItemPos, to: Omit<ItemPos, 'index'> & { index?: number }) {
    mapTrip(id, t => {
      const days = structuredClone(t.days);
      const [item] = days[from.day]?.slots[from.slot].splice(from.index, 1) ?? [];
      if (!item) return t;
      const target = days[to.day]?.slots[to.slot];
      if (!target) return t;
      target.splice(to.index ?? target.length, 0, item);
      return { ...t, days };
    });
  },
  updateItem(id: string, pos: ItemPos, patch: Partial<ItineraryItem>) {
    mapTrip(id, t => {
      const days = structuredClone(t.days);
      const it = days[pos.day]?.slots[pos.slot][pos.index];
      if (it) Object.assign(it, patch);
      return { ...t, days };
    });
  },
  setDays(id: string, count: number) {
    mapTrip(id, t => {
      const days = structuredClone(t.days);
      while (days.length < count) {
        const last = days[days.length - 1];
        const date = last?.date ? new Date(new Date(last.date).getTime() + 86400000).toISOString().slice(0, 10) : undefined;
        days.push(emptyDay(last?.destinationId ?? t.destinationIds[0] ?? 'zanzibar', date));
      }
      days.length = Math.max(1, count);
      return { ...t, days, endDate: days[days.length - 1]?.date ?? t.endDate };
    });
  },
  updateDay(id: string, day: number, patch: Partial<ItineraryDay>) {
    mapTrip(id, t => ({ ...t, days: t.days.map((d, i) => (i === day ? { ...d, ...patch } : d)) }));
  }
};

export { SLOTS, emptyDay };

export interface TripTotals { stays: number; activities: number; transport: number; meals: number; other: number; total: number }

/** Estimated trip cost from itinerary items and nightly stays (before taxes and fees). */
export function tripTotals(trip: Trip): TripTotals {
  const travellers = trip.adults + trip.children;
  const totals: TripTotals = { stays: 0, activities: 0, transport: 0, meals: 0, other: 0, total: 0 };
  for (const day of trip.days) {
    if (day.stayListingId) {
      const stay = seedIndex.listingById.get(day.stayListingId);
      if (stay) totals.stays += stay.price.amountUsd * Math.ceil(travellers / Math.max(1, stay.capacity ?? 2));
    }
    for (const slot of SLOTS) {
      for (const it of day.slots[slot]) {
        const cost = it.priceUsd * (it.perPerson ? travellers : 1);
        if (it.kind === 'transport' || it.kind === 'travel') totals.transport += cost;
        else if (it.kind === 'restaurant' || it.kind === 'meal') totals.meals += cost;
        else if (it.kind === 'stay') totals.stays += cost;
        else if (it.kind === 'free') totals.other += cost;
        else totals.activities += cost;
      }
    }
  }
  totals.total = totals.stays + totals.activities + totals.transport + totals.meals + totals.other;
  return totals;
}

export function tripStatus(trip: Trip, today = new Date().toISOString().slice(0, 10)): 'upcoming' | 'ongoing' | 'past' | 'draft' {
  if (!trip.startDate) return 'draft';
  if (trip.endDate && trip.endDate < today) return 'past';
  if (trip.startDate <= today) return 'ongoing';
  return 'upcoming';
}
