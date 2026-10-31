import type { Booking, Listing } from '@/domain/types';
import { seeded, addDays, todayIso } from '@/lib/random';
import { seedIndex } from './catalog';
import { HOLDS_INVENTORY } from './bookings';

// ---------------------------------------------------------------------------------------------
// Partner analytics. Bookings, revenue, guest markets, party types, lead times and stay months
// are computed from actual bookings. Views, search appearances and enquiries need the tracking
// pipeline, so the demo generates stable sample numbers for them (always labelled in the UI).
// ---------------------------------------------------------------------------------------------

export interface MonthPoint { month: string; views: number; searches: number; enquiries: number; bookings: number; revenue: number }
export interface ListingStat { listing: Listing; views: number; bookings: number; revenue: number; conversion: number }
export interface Insight { key: string; params?: Record<string, string | number>; tone: 'good' | 'warn' | 'info'; href?: string }

const REVENUE_STATUSES = new Set(['confirmed', 'paid', 'partially_paid', 'completed']);
/** What the partner earns from a booking before commission: base price and extras, after any promotion. */
export const grossValue = (b: Booking) => b.price.base + b.price.extras - (b.price.discount ?? 0);
export const counts = (b: Booking) => REVENUE_STATUSES.has(b.status);

/** Last `n` months as YYYY-MM, oldest first. */
export function lastMonths(n: number, end = todayIso()): string[] {
  const [y, m] = end.split('-').map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

export function partnerAnalytics(partnerId: string, all: Booking[], months = 12) {
  const rnd = seeded(`analytics-${partnerId}`);
  const listings = seedIndex.listings.filter(l => l.partnerId === partnerId);
  const range = lastMonths(months);
  const valid = all.filter(counts);

  // Monthly series (bookings and revenue by booking date; interest metrics are sample data).
  const series: MonthPoint[] = range.map(month => {
    const made = all.filter(b => b.createdAt.slice(0, 7) === month);
    const bookingsN = made.filter(counts).length;
    const revenue = made.filter(counts).reduce((s, b) => s + grossValue(b), 0);
    const monthNo = Number(month.slice(5));
    const seasonal = 0.75 + 0.5 * Math.max(0, Math.cos(((monthNo - 7) / 12) * 2 * Math.PI)); // demand peaks mid-year
    const views = Math.round(rnd.jitter(900 * seasonal + bookingsN * 160, 0.12));
    return {
      month, views, searches: Math.round(rnd.jitter(views * 3.4, 0.1)), enquiries: Math.round(rnd.jitter(views * 0.035 + bookingsN * 0.6, 0.2)),
      bookings: bookingsN, revenue: Math.round(revenue)
    };
  });

  const totals = series.reduce((t, p) => ({ views: t.views + p.views, searches: t.searches + p.searches, enquiries: t.enquiries + p.enquiries, bookings: t.bookings + p.bookings, revenue: t.revenue + p.revenue }), { views: 0, searches: 0, enquiries: 0, bookings: 0, revenue: 0 });
  const half = Math.floor(months / 2);
  const sum = (from: number, to: number, k: keyof Omit<MonthPoint, 'month'>) => series.slice(from, to).reduce((s, p) => s + p[k], 0);
  const delta = (k: keyof Omit<MonthPoint, 'month'>) => { const prev = sum(0, half, k); const cur = sum(half, months, k); return prev ? (cur - prev) / prev : 0; };

  // Per listing.
  const byListing: ListingStat[] = listings.map(l => {
    const bs = valid.filter(b => b.listingId === l.id);
    const views = Math.round(totals.views * (bs.length + 2) / (valid.length + listings.length * 2));
    return { listing: l, views, bookings: bs.length, revenue: Math.round(bs.reduce((s, b) => s + grossValue(b), 0)), conversion: views ? bs.length / views : 0 };
  }).sort((a, b) => b.revenue - a.revenue);

  // Guests.
  const markets = tally(valid.map(b => b.lead.country)).slice(0, 6);
  const party = tally(valid.map(b => {
    const n = b.guests.adults + b.guests.children;
    return b.guests.children ? 'family' : n === 1 ? 'solo' : n === 2 ? 'couple' : 'group';
  }));
  const leadDays = valid.map(b => Math.max(0, Math.round((new Date(b.date).getTime() - new Date(b.createdAt).getTime()) / 86400000)));
  const leadBuckets = tally(leadDays.map(d => (d < 14 ? 'lt14' : d < 30 ? 'lt30' : d < 90 ? 'lt90' : 'gte90')));
  const stayMonths = Array.from({ length: 12 }, (_, i) => valid.filter(b => Number(b.date.slice(5, 7)) === i + 1).length);
  const weekdays = Array.from({ length: 7 }, (_, i) => valid.filter(b => new Date(b.createdAt).getUTCDay() === i).length);

  // Demand for the partner's destinations (sample interest index, shaped by each destination's best months).
  const destDemand = [...new Set(listings.map(l => l.destinationId))].map(id => {
    const d = seedIndex.destById.get(id)!;
    return { destination: d, values: Array.from({ length: 12 }, (_, i) => Math.round(rnd.jitter(d.bestMonths.includes(i + 1) ? 80 : 45, 0.15))) };
  });

  const ratingCount = listings.reduce((s, l) => s + l.reviewCount, 0);
  const rating = ratingCount ? listings.reduce((s, l) => s + (l.rating ?? 0) * l.reviewCount, 0) / ratingCount : 0;
  const avgLead = leadDays.length ? Math.round(leadDays.reduce((a, b) => a + b, 0) / leadDays.length) : 0;

  return {
    range, series, totals, rating, ratingCount, byListing, markets, party, leadBuckets, avgLead, stayMonths, weekdays, destDemand,
    conversion: totals.views ? totals.bookings / totals.views : 0,
    deltas: { views: delta('views'), bookings: delta('bookings'), revenue: delta('revenue'), enquiries: delta('enquiries') }
  };
}
export type PartnerAnalytics = ReturnType<typeof partnerAnalytics>;

/** Actionable suggestions derived from the numbers (rendered from translation keys). */
export function partnerInsights(a: PartnerAnalytics, ctx: { pending: number; unread: number; unanswered: number; noPano: Listing[]; promos: number }): Insight[] {
  const out: Insight[] = [];
  if (ctx.pending) out.push({ key: 'insight.pending', params: { count: ctx.pending }, tone: 'warn', href: '/business/bookings?status=pending' });
  if (ctx.unread) out.push({ key: 'insight.unread', params: { count: ctx.unread }, tone: 'warn', href: '/business/messages' });
  if (ctx.unanswered) out.push({ key: 'insight.reviews', params: { count: ctx.unanswered }, tone: 'info', href: '/business/reviews' });
  const peak = a.stayMonths.indexOf(Math.max(...a.stayMonths));
  if (a.stayMonths[peak]) out.push({ key: 'insight.peak', params: { month: peak + 1 }, tone: 'info', href: '/business/calendar' });
  const low = a.byListing.filter(s => s.views > 50).sort((x, y) => x.conversion - y.conversion)[0];
  if (low && a.byListing.length > 1) out.push({ key: 'insight.lowConversion', params: { listingId: low.listing.id }, tone: 'info', href: `/business/listings/${low.listing.id}` });
  if (ctx.noPano.length) out.push({ key: 'insight.vr', params: { count: ctx.noPano.length }, tone: 'info', href: '/business/vr' });
  if (!ctx.promos) out.push({ key: 'insight.promo', tone: 'info', href: '/business/marketing' });
  if (a.deltas.bookings > 0.1) out.push({ key: 'insight.growth', params: { pct: Math.round(a.deltas.bookings * 100) }, tone: 'good' });
  return out;
}

export function tally<T extends string>(items: T[]): { key: T; count: number }[] {
  const m = new Map<T, number>();
  items.forEach(i => m.set(i, (m.get(i) ?? 0) + 1));
  return [...m].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/** Upcoming arrivals and departures for the next `days` days. */
export function upcoming(all: Booking[], days = 7) {
  const today = todayIso();
  const end = addDays(today, days);
  return all.filter(b => HOLDS_INVENTORY.includes(b.status) && b.date >= today && b.date < end).sort((a, b) => a.date.localeCompare(b.date));
}
