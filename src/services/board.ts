import type { Destination, InterestTag, Locale, LocalizedText } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { addDays, seeded, todayIso } from '@/lib/random';
import { DESTINATIONS } from '@/data/seed/destinations';

// ---------------------------------------------------------------------------------------------
// Tourism board / DMO portal (demo layer). The demo organisation is fictional and clearly labelled;
// it never speaks for a real authority. Production: board-scoped API endpoints with review workflows.
// ---------------------------------------------------------------------------------------------

export const DEMO_BOARD = { id: 'demo-board-tz', name: 'Demo Tourism Board · Tanzania', countryIds: ['tanzania', 'zanzibar'] };
export const boardDestinations = () => DESTINATIONS.filter(d => DEMO_BOARD.countryIds.includes(d.countryId));

// ---------------- Destination content (overlaid on public destination pages once published) ----------------
export interface DestinationEdit {
  summary?: Partial<LocalizedText>;
  overview?: Partial<LocalizedText>;
  safety?: Partial<LocalizedText>;
  sustainability?: Partial<LocalizedText>;
  bestMonths?: number[];
  status: 'draft' | 'published';
  updatedAt: string;
  /** Last published version, kept while a newer draft is being edited. */
  published?: Omit<DestinationEdit, 'status' | 'updatedAt' | 'published'>;
}
export const destinationEditStore = createStore<Record<string, DestinationEdit>>('tm.board.destEdits', () => ({}));
export const useDestinationEdits = () => useStore(destinationEditStore);

const ORIGINAL = new Map(DESTINATIONS.map(d => [d.id, structuredClone(d)]));
function applyEdits() {
  const all = destinationEditStore.get();
  for (const d of DESTINATIONS) {
    const base = ORIGINAL.get(d.id)!;
    Object.assign(d, structuredClone(base));
    for (const k of ['overview', 'safety', 'sustainability'] as const) if (!(k in base)) delete d[k];
    const live = all[d.id]?.status === 'published' ? all[d.id] : all[d.id]?.published;
    if (!live) continue;
    if (live.summary) d.summary = { ...d.summary, ...live.summary } as LocalizedText;
    if (live.overview) d.overview = { ...(d.overview ?? d.summary), ...live.overview } as LocalizedText;
    if (live.safety) d.safety = { ...(d.safety ?? { en: '' }), ...live.safety } as LocalizedText;
    if (live.sustainability) d.sustainability = { ...(d.sustainability ?? { en: '' }), ...live.sustainability } as LocalizedText;
    if (live.bestMonths?.length) d.bestMonths = live.bestMonths;
  }
}
applyEdits();
destinationEditStore.subscribe(applyEdits);

export const destinationContent = {
  saveDraft(id: string, patch: Omit<DestinationEdit, 'status' | 'updatedAt' | 'published'>) {
    destinationEditStore.set(all => {
      const prev = all[id];
      const published = prev?.status === 'published' ? stripMeta(prev) : prev?.published;
      return { ...all, [id]: { ...prev, ...patch, status: 'draft', updatedAt: nowIso(), published } };
    });
  },
  publish(id: string) {
    destinationEditStore.set(all => (all[id] ? { ...all, [id]: { ...all[id]!, status: 'published', updatedAt: nowIso(), published: undefined } } : all));
  },
  /** Discards board edits and returns to the TravelMateVR catalogue text. */
  revert(id: string) { destinationEditStore.set(all => { const n = { ...all }; delete n[id]; return n; }); }
};
const stripMeta = (e: DestinationEdit) => { const { status: _s, updatedAt: _u, published: _p, ...rest } = e; return rest; };

// ---------------- Content publishing: notices, events, stories ----------------
export interface BoardPost {
  id: string;
  destinationId: string;
  kind: 'news' | 'event' | 'alert' | 'story';
  title: Partial<LocalizedText>;
  body: Partial<LocalizedText>;
  lang: Locale;
  /** Event date or the date a notice becomes visible. */
  date?: string;
  expires?: string;
  status: 'draft' | 'published';
  createdAt: string;
  publishedAt?: string;
}
// Only drafts are seeded: nothing appears on public pages until someone publishes it.
export const postStore = createStore<BoardPost[]>('tm.board.posts', () => [
  { id: 'post-1', destinationId: 'ngozi', kind: 'event', lang: 'en', title: { en: 'Crater lake clean-up walk' }, body: { en: 'Join local guides for a morning litter pick along the Ngozi trail. Free; bring water and good shoes.' }, date: addDays(todayIso(), 30), status: 'draft', createdAt: '2026-09-25T08:00:00Z' }
]);
export const usePosts = () => useStore(postStore);
export const posts = {
  save(p: Omit<BoardPost, 'id' | 'createdAt'> & { id?: string }) {
    postStore.set(list => p.id
      ? list.map(x => (x.id === p.id ? { ...x, ...p, id: x.id, publishedAt: p.status === 'published' ? x.publishedAt ?? nowIso() : undefined } : x))
      : [{ ...p, id: uid('post_'), createdAt: nowIso(), publishedAt: p.status === 'published' ? nowIso() : undefined }, ...list]);
  },
  remove(id: string) { postStore.set(list => list.filter(p => p.id !== id)); }
};
/** Published, current posts for a destination page. */
export function livePosts(destinationId: string, all = postStore.get()): BoardPost[] {
  const today = todayIso();
  return all.filter(p => p.destinationId === destinationId && p.status === 'published' && (!p.expires || p.expires >= today))
    .sort((a, b) => (a.kind === 'alert' ? -1 : 0) - (b.kind === 'alert' ? -1 : 0) || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

// ---------------- Campaigns ----------------
export interface BoardCampaign {
  id: string; name: string; destinationIds: string[]; markets: string[]; interests: InterestTag[];
  channels: ('homepage' | 'explore' | 'ai' | 'newsletter' | 'partners')[]; from: string; to: string; budgetUsd: number;
  status: 'draft' | 'scheduled' | 'live' | 'ended'; createdAt: string;
}
export const boardCampaignStore = createStore<BoardCampaign[]>('tm.board.campaigns', () => [
  { id: 'bc-1', name: 'Southern circuit green season', destinationIds: ['ruaha', 'ngozi'], markets: ['DE', 'GB', 'US'], interests: ['wildlife', 'eco'], channels: ['explore', 'ai', 'newsletter'], from: addDays(todayIso(), -15), to: addDays(todayIso(), 75), budgetUsd: 12000, status: 'live', createdAt: '2026-09-10T08:00:00Z' },
  { id: 'bc-2', name: 'Western parks discovery', destinationIds: ['katavi', 'lake-tanganyika'], markets: ['FR', 'IT'], interests: ['wildlife', 'adventure'], channels: ['explore', 'partners'], from: addDays(todayIso(), 40), to: addDays(todayIso(), 130), budgetUsd: 8000, status: 'scheduled', createdAt: '2026-09-28T08:00:00Z' }
]);
export const useBoardCampaigns = () => useStore(boardCampaignStore);
export const boardCampaigns = {
  save(c: Omit<BoardCampaign, 'id' | 'createdAt'> & { id?: string }) {
    boardCampaignStore.set(list => c.id ? list.map(x => (x.id === c.id ? { ...x, ...c, id: x.id } : x)) : [{ ...c, id: uid('bc_'), createdAt: nowIso() }, ...list]);
  },
  remove(id: string) { boardCampaignStore.set(list => list.filter(c => c.id !== id)); }
};
/** Sample performance for a campaign (impressions, clicks, saves, bookings), stable per campaign. */
export function campaignMetrics(c: { id: string; budgetUsd: number; from: string; to: string }) {
  const rnd = seeded(`camp-${c.id}`);
  const today = todayIso();
  const total = Math.max(1, (new Date(c.to).getTime() - new Date(c.from).getTime()) / 86400000);
  const done = Math.min(total, Math.max(0, (new Date(today).getTime() - new Date(c.from).getTime()) / 86400000));
  const progress = done / total;
  const impressions = Math.round(rnd.jitter(c.budgetUsd * 42, 0.2) * progress);
  const clicks = Math.round(impressions * rnd.jitter(0.028, 0.25));
  const saves = Math.round(clicks * rnd.jitter(0.18, 0.3));
  const bookings = Math.round(clicks * rnd.jitter(0.022, 0.4));
  return { progress, impressions, clicks, saves, bookings, ctr: impressions ? clicks / impressions : 0 };
}

// ---------------- Board analytics ----------------
export const SOURCE_MARKETS = ['US', 'GB', 'DE', 'FR', 'IT', 'CN', 'KE', 'NL', 'ZA', 'IN'];
const TOP_QUERIES = [
  'serengeti migration july', 'zanzibar beach family', 'kilimanjaro machame 7 days', 'safari tanzania 5 jours',
  'sansibar strand', 'katavi safari', 'ngorongoro crater day trip', '坦桑尼亚 野生动物', 'safari economico tanzania', 'stone town food tour'
];

export function boardAnalytics(destinations: Destination[], months: string[]) {
  const rnd = seeded('board-tz');
  const interest = destinations.map(d => {
    const weight = Math.log10(d.reviewCount + 10);
    const values = months.map(m => {
      const mo = Number(m.slice(5));
      return Math.round(rnd.jitter((d.bestMonths.includes(mo) ? 1600 : 900) * weight, 0.12));
    });
    return { destination: d, values, total: values.reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.total - a.total);

  const monthly = months.map((_, i) => interest.reduce((s, x) => s + x.values[i]!, 0));
  const marketsShare = SOURCE_MARKETS.map(c => ({ key: c, count: Math.round(rnd.jitter(c === 'US' ? 22 : c === 'GB' ? 16 : c === 'DE' ? 13 : 8, 0.2)) })).sort((a, b) => b.count - a.count);
  const interests = (['wildlife', 'beach', 'culture', 'mountain', 'adventure', 'eco', 'family', 'luxury'] as InterestTag[])
    .map(tag => ({ key: tag, count: Math.round(rnd.jitter(tag === 'wildlife' ? 40 : tag === 'beach' ? 28 : 14, 0.25)) })).sort((a, b) => b.count - a.count);
  const queries = TOP_QUERIES.map(q => ({ query: q, count: rnd.int(180, 2400) })).sort((a, b) => b.count - a.count);

  const attractions = interest.map(x => {
    const vrViews = Math.round(x.total * rnd.jitter(0.22, 0.2));
    return {
      destination: x.destination, pageViews: x.total, vrViews, avgVrSeconds: rnd.int(48, 140), saves: Math.round(x.total * rnd.jitter(0.05, 0.3)),
      bookings: Math.round(x.total * rnd.jitter(0.012, 0.3)), rating: x.destination.rating
    };
  });

  const trends = {
    avgStayDays: Math.round(rnd.jitter(7.4, 0.05) * 10) / 10,
    avgLeadDays: rnd.int(62, 84),
    avgPartySize: Math.round(rnd.jitter(2.6, 0.05) * 10) / 10,
    repeatShare: Math.round(rnd.jitter(14, 0.2)),
    lengthOfStay: [{ key: '1-3', count: 18 }, { key: '4-7', count: 41 }, { key: '8-14', count: 33 }, { key: '15+', count: 8 }],
    seasonality: Array.from({ length: 12 }, (_, i) => Math.round(destinations.filter(d => d.bestMonths.includes(i + 1)).length / Math.max(1, destinations.length) * 100))
  };

  return { interest, monthly, marketsShare, interests, queries, attractions, trends };
}
