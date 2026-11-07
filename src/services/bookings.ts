import type { Booking, BookingStatus, Listing, PaymentMethod } from '@/domain/types';
import { useMemo } from 'react';
import { createStore, nowIso, useStore } from '@/lib/store';
import { addDays, seeded, todayIso } from '@/lib/random';
import { demoLatency } from './http';
import { quote } from './pricing';
import { seedIndex } from './catalog';
import { notificationPrefsStore, pushNotification } from './account';
import { messaging } from './messaging';
import { depositRate } from './platform';

export function bookingId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `TMV-${s}`;
}

const seedBookings = (): Booking[] => {
  const mk = (id: string, listingId: string, date: string, endDate: string | undefined, adults: number, nights: number, status: BookingStatus, method: PaymentMethod, paidShare: number): Booking => {
    const listing = seedIndex.listingById.get(listingId)!;
    const price = quote({ listing, adults, children: 0, nights, units: 1, extras: [], date });
    return {
      id, listingId, partnerId: listing.partnerId, tripId: 'trip-sample', status, createdAt: '2026-09-10T10:00:00Z', date, endDate,
      guests: { adults, children: 0 }, units: 1, extras: [], startTime: listing.startTimes?.[0],
      lead: { firstName: 'Sample', lastName: 'Traveller', email: 'you@example.com', phone: '+255700000000', country: 'TZ' },
      travellers: [{ name: 'Sample Traveller' }, { name: 'Travel Companion' }], price,
      payment: { method, paidUsd: Math.round(price.total * paidShare * 100) / 100, reference: paidShare ? `PAY-${id.slice(4)}` : undefined, paidAt: paidShare ? '2026-09-10T10:05:00Z' : undefined },
      sample: true
    };
  };
  return [
    mk('TMV-S4MPL1', 'safari-northern-circuit-group', '2026-12-07', '2026-12-12', 2, 1, 'paid', 'card', 1),
    mk('TMV-S4MPL2', 'stay-zanzibar-pwani-retreat', '2026-12-13', '2026-12-16', 2, 3, 'partially_paid', 'mobile_money', 0.3),
    mk('TMV-S4MPL3', 'local-stone-town-heritage-walk', '2026-12-14', undefined, 2, 1, 'confirmed', 'pay_later', 0)
  ];
};

export const bookingStore = createStore<Booking[]>('tm.bookings', seedBookings);
export const useBookings = () => useStore(bookingStore);

/** Past, still-active bookings read as completed. */
export function effectiveStatus(b: Booking, today = new Date().toISOString().slice(0, 10)): BookingStatus {
  if ((b.status === 'paid' || b.status === 'confirmed' || b.status === 'partially_paid') && (b.endDate ?? b.date) < today) return 'completed';
  return b.status;
}

export interface BookingInput {
  listing: Listing;
  date: string;
  endDate?: string;
  startTime?: string;
  adults: number;
  children: number;
  nights: number;
  units: number;
  extras: string[];
  lead: Booking['lead'];
  travellers: { name: string }[];
  requests?: string;
  method: PaymentMethod;
  payDeposit: boolean;
  tripId?: string;
  /** Mobile money only: network and masked payer number. */
  network?: string;
  payerPhone?: string;
  /** Shilling amount approved on the phone, and the payment provider's reference. */
  amountTzs?: number;
  paymentRef?: string;
}

/** Deposit share, set in the Command Center. */
export { depositRate } from './platform';

export const bookings = {
  /**
   * Demo checkout. Production: the backend re-prices the booking, creates a payment intent with the
   * payment provider (card / mobile money / bank), and confirms via webhook. No card data touches this app.
   */
  async create(input: BookingInput): Promise<Booking> {
    await demoLatency(900, 1500);
    const price = quote({ listing: input.listing, adults: input.adults, children: input.children, nights: input.nights, units: input.units, extras: input.extras, date: input.date });
    // Requests are never charged up front: the traveller pays once the partner confirms.
    const paid = !input.listing.instantBook || input.method === 'pay_later' || input.method === 'bank_transfer' ? 0 : input.payDeposit ? Math.round(price.total * depositRate() * 100) / 100 : price.total;
    const status: BookingStatus = !input.listing.instantBook ? 'pending' : paid === 0 ? 'confirmed' : paid < price.total ? 'partially_paid' : 'paid';
    const b: Booking = {
      id: bookingId(), listingId: input.listing.id, partnerId: input.listing.partnerId, tripId: input.tripId, status, createdAt: nowIso(),
      date: input.date, endDate: input.endDate, startTime: input.startTime, guests: { adults: input.adults, children: input.children }, units: input.units,
      extras: input.extras, lead: input.lead, travellers: input.travellers, requests: input.requests, price,
      payment: {
        method: input.method, paidUsd: paid, reference: paid ? input.paymentRef ?? `PAY-${Date.now().toString(36).toUpperCase()}` : undefined, paidAt: paid ? nowIso() : undefined,
        network: input.network, payerPhone: input.payerPhone, amountTzs: paid ? input.amountTzs : undefined
      }
    };
    bookingStore.set(list => [b, ...list]);
    pushNotification({
      kind: 'booking', href: `/bookings/${b.id}`,
      i18n: { title: status === 'pending' ? 'notif.requested.title' : 'notif.booked.title', body: 'notif.booked.body', params: { id: b.id, title: input.listing.title.en } }
    });
    if (paid) pushNotification({ kind: 'booking', href: `/bookings/${b.id}`, i18n: { title: 'notif.paid.title', body: 'notif.paid.body', params: { id: b.id, amount: `USD ${paid.toFixed(2)}` } } });
    void messaging.send({ template: 'booking_confirmation', channels: notificationPrefsStore.get().booking, data: { bookingId: b.id, email: b.lead.email } });
    return b;
  },

  /** Refund owed under the listing's cancellation policy. */
  refundFor(b: Booking, today = new Date()): number {
    const listing = seedIndex.listingById.get(b.listingId);
    const days = (new Date(b.date).getTime() - today.getTime()) / 86400000;
    const share = !listing ? 0
      : listing.cancellation === 'flexible' ? (days >= 1 ? 1 : 0)
        : listing.cancellation === 'moderate' ? (days >= 7 ? 1 : days >= 2 ? 0.5 : 0)
          : days >= 30 ? 1 : days >= 14 ? 0.5 : 0;
    return Math.round(b.payment.paidUsd * share * 100) / 100;
  },

  async cancel(id: string): Promise<number> {
    await demoLatency(500, 900);
    const b = bookingStore.get().find(x => x.id === id);
    if (!b) return 0;
    const refund = bookings.refundFor(b);
    bookingStore.set(list => list.map(x => (x.id === id ? { ...x, status: refund > 0 ? 'refunded' : 'cancelled' } : x)));
    pushNotification({ kind: 'booking', href: `/bookings/${id}`, i18n: { title: 'notif.cancelled.title', body: 'notif.cancelled.body', params: { id, amount: `USD ${refund.toFixed(2)}` } } });
    return refund;
  },

  async payBalance(id: string): Promise<void> {
    await demoLatency(700, 1200);
    bookingStore.set(list => list.map(x => (x.id === id ? { ...x, status: 'paid', payment: { ...x.payment, paidUsd: x.price.total, paidAt: nowIso(), reference: x.payment.reference ?? `PAY-${Date.now().toString(36).toUpperCase()}` } } : x)));
    pushNotification({ kind: 'booking', href: `/bookings/${id}`, i18n: { title: 'notif.paid.title', body: 'notif.paid.body', params: { id, amount: '' } } });
  },

  attachReview(id: string, reviewId: string) {
    bookingStore.set(list => list.map(x => (x.id === id ? { ...x, reviewId } : x)));
  },

  /** Removes the record entirely — unlike cancel(), which only changes status. For a traveller
   *  who wants a booking gone from their account without using the nuclear "erase my data"
   *  option (src/pages/account/AccountPage.tsx). */
  remove(id: string) {
    bookingStore.set(list => list.filter(x => x.id !== id));
  }
};

// ---------------------------------------------------------------------------------------------
// Partner side. The partner portal sees bookings made by travellers in this app (bookingStore) plus
// a set of fictional sample guests for the demo partner, so the dashboards aren't empty.
// ---------------------------------------------------------------------------------------------
const SAMPLE_GUESTS: [first: string, last: string, country: string][] = [
  ['Lena', 'Fischer', 'DE'], ['Marco', 'Rossi', 'IT'], ['Chloé', 'Martin', 'FR'], ['Wei', 'Zhang', 'CN'], ['James', 'Okafor', 'NG'],
  ['Emily', 'Carter', 'US'], ['Sofia', 'García', 'ES'], ['Aiko', 'Tanaka', 'JP'], ['Neema', 'Mwakyusa', 'TZ'], ['Daniel', 'Kimani', 'KE'],
  ['Olivia', 'Brown', 'GB'], ['Pieter', 'de Vries', 'NL'], ['Isabella', 'Costa', 'BR'], ['Arjun', 'Mehta', 'IN'], ['Hannah', 'Schmidt', 'DE'],
  ['Luca', 'Bianchi', 'IT'], ['Grace', 'Wanjiru', 'KE'], ['Thomas', 'Dubois', 'FR'], ['Mei', 'Chen', 'CN'], ['Noah', 'Williams', 'US']
];

const seedPartnerBookings = (): Booking[] => {
  const rnd = seeded('kijani-camps-bookings');
  const today = todayIso();
  const listings = LISTINGS_FOR_SAMPLE.map(id => seedIndex.listingById.get(id)).filter((l): l is Listing => !!l);
  const out: Booking[] = [];
  for (let i = 0; i < 42; i++) {
    const listing = listings[i % 5 === 4 ? 2 : i % 3 === 0 ? 1 : 0] ?? listings[0]!;
    const [first, last, country] = SAMPLE_GUESTS[i % SAMPLE_GUESTS.length]!;
    // Requests (the first three) are always for future dates; everything else spans the past ~7 and next ~5 months.
    const offset = i < 3 ? rnd.int(12, 90) : rnd.int(-200, 160);
    const date = addDays(today, offset);
    const nights = listing.price.unit === 'night' ? rnd.int(1, 4) : 1;
    const adults = rnd.int(1, 4);
    const children = rnd.next() < 0.2 ? rnd.int(1, 2) : 0;
    const units = listing.price.unit === 'night' ? Math.max(1, Math.ceil((adults + children) / Math.max(1, listing.capacity ?? 2))) : 1;
    const extras = listing.extras?.length && rnd.next() < 0.35 ? [listing.extras[0]!.id] : [];
    const price = quote({ listing, adults, children, nights, units, extras, date });
    const past = offset < 0;
    const roll = rnd.next();
    const status: BookingStatus = past
      ? (roll < 0.08 ? 'cancelled' : 'paid')
      : i < 3 ? 'pending' : roll < 0.45 ? 'paid' : roll < 0.75 ? 'partially_paid' : roll < 0.95 ? 'confirmed' : 'cancelled';
    const paid = status === 'paid' ? price.total : status === 'partially_paid' ? Math.round(price.total * depositRate() * 100) / 100 : 0;
    // Booked 1–17 weeks before the stay, and never later than today.
    const madeOn = [addDays(date, -rnd.int(7, 120)), addDays(today, -rnd.int(0, 28))].sort()[0]!;
    const createdAt = `${madeOn}T${String(rnd.int(6, 21)).padStart(2, '0')}:${String(rnd.int(0, 59)).padStart(2, '0')}:00Z`;
    out.push({
      id: `TMV-K${String(1000 + i * 37).slice(-4)}${'ABCDEFGHJK'[i % 10]}`, listingId: listing.id, partnerId: listing.partnerId, status, createdAt,
      date, endDate: listing.price.unit === 'night' ? addDays(date, nights) : undefined, startTime: listing.startTimes?.[0],
      guests: { adults, children }, units, extras,
      lead: { firstName: first, lastName: last, email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@example.com', phone: '+000 000 0000', country },
      travellers: [{ name: `${first} ${last}` }], price,
      requests: i === 0 ? 'Celebrating an anniversary, any small surprise welcome.' : i === 1 ? 'One vegetarian, one nut allergy.' : undefined,
      payment: { method: rnd.pick(['card', 'mobile_money', 'bank_transfer', 'card'] as const), paidUsd: paid, reference: paid ? `PAY-K${i}` : undefined, paidAt: paid ? createdAt : undefined }
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
const LISTINGS_FOR_SAMPLE = ['stay-serengeti-kijani-camp', 'stay-tarangire-eco-lodge', 'restaurant-kijani-bush-dinner'];

/** Fictional guests of the demo partner (never shown to travellers). */
export const partnerBookingStore = createStore<Booking[]>('tm.partnerBookings', seedPartnerBookings);

/** All bookings a partner can see: real in-app bookings for its listings plus its sample guests. */
export function bookingsForPartner(partnerId: string, own = bookingStore.get(), sample = partnerBookingStore.get()): (Booking & { sample?: boolean })[] {
  return [...own.filter(b => b.partnerId === partnerId), ...sample.filter(b => b.partnerId === partnerId).map(b => ({ ...b, sample: true }))]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function usePartnerBookings(partnerId: string | undefined) {
  const own = useStore(bookingStore);
  const sample = useStore(partnerBookingStore);
  return useMemo(() => (partnerId ? bookingsForPartner(partnerId, own, sample) : []), [partnerId, own, sample]);
}

/** Booking statuses that hold inventory. */
export const HOLDS_INVENTORY: BookingStatus[] = ['pending', 'confirmed', 'paid', 'partially_paid'];

const patchAny = (id: string, fn: (b: Booking) => Booking) => {
  if (bookingStore.get().some(b => b.id === id)) bookingStore.set(list => list.map(b => (b.id === id ? fn(b) : b)));
  else partnerBookingStore.set(list => list.map(b => (b.id === id ? fn(b) : b)));
};

export const partnerBookings = {
  /** Accept a booking request. The traveller is notified (in production: email/WhatsApp via the backend). */
  async confirm(id: string) {
    await demoLatency(300, 600);
    patchAny(id, b => ({ ...b, status: b.payment.paidUsd >= b.price.total - 0.005 ? 'paid' : b.payment.paidUsd > 0 ? 'partially_paid' : 'confirmed' }));
    if (bookingStore.get().some(b => b.id === id)) pushNotification({ kind: 'booking', href: `/bookings/${id}`, i18n: { title: 'notif.partnerConfirmed.title', body: 'notif.partnerConfirmed.body', params: { id } } });
  },
  /** Decline a request (or cancel on the partner side): anything paid is refunded in full. */
  async decline(id: string) {
    await demoLatency(300, 600);
    patchAny(id, b => ({ ...b, status: b.payment.paidUsd > 0 ? 'refunded' : 'cancelled' }));
    if (bookingStore.get().some(b => b.id === id)) pushNotification({ kind: 'booking', href: `/bookings/${id}`, i18n: { title: 'notif.partnerDeclined.title', body: 'notif.partnerDeclined.body', params: { id } } });
  },
  /** Mark a past stay or activity as completed (it then becomes reviewable). */
  complete(id: string) { patchAny(id, b => ({ ...b, status: 'completed' })); }
};
