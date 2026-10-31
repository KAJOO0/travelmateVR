import type { Locale, LocalizedText, MediaId, MessageThread, Partner } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { addDays, todayIso } from '@/lib/random';
import { PARTNERS } from '@/data/seed/partners';
import { demoLatency } from './http';
import { threadStore } from './account';
import { partnerAdminStore } from './inventory';

// ---------------------------------------------------------------------------------------------
// Partner portal (demo layer). Every store here is a stand-in for partner-scoped API endpoints;
// the server enforces that a partner only ever reads and writes its own records.
// ---------------------------------------------------------------------------------------------

/** The fictional business the demo partner account manages. Real partners never get invented data. */
export const DEMO_PARTNER_ID = 'kijani-camps';

// ---------------- Storefront (brand + profile), overlaid on the public partner page ----------------
export interface StorefrontEdit {
  tagline?: Partial<LocalizedText>;
  description?: Partial<LocalizedText>;
  cover?: MediaId;
  languages?: string[];
  responseHours?: number;
  /** Public contact shown on the storefront (business line, not a personal number). */
  phone?: string;
  website?: string;
  updatedAt?: string;
}
export const storefrontStore = createStore<Record<string, StorefrontEdit>>('tm.biz.storefront', () => ({}));
export const useStorefront = () => useStore(storefrontStore);

const ORIGINAL_PARTNERS = new Map(PARTNERS.map(p => [p.id, structuredClone(p)]));
function applyStorefronts() {
  const all = storefrontStore.get();
  const admin = partnerAdminStore.get();
  for (const p of PARTNERS) {
    Object.assign(p, structuredClone(ORIGINAL_PARTNERS.get(p.id)!));
    if (!('tagline' in ORIGINAL_PARTNERS.get(p.id)!)) delete p.tagline;
    if (admin[p.id]?.verified !== undefined) p.verified = admin[p.id]!.verified!;
    const e = all[p.id];
    if (!e) continue;
    if (e.tagline) p.tagline = e.tagline;
    if (e.description) p.description = { ...p.description, ...e.description } as LocalizedText;
    if (e.cover) p.cover = e.cover;
    if (e.languages) p.languages = e.languages;
    if (e.responseHours) p.responseHours = e.responseHours;
  }
}
applyStorefronts();
storefrontStore.subscribe(applyStorefronts);
partnerAdminStore.subscribe(applyStorefronts);
export const storefrontExtras = (partnerId: string) => storefrontStore.get()[partnerId] ?? {};

// ---------------- Team ----------------
export type TeamRole = 'owner' | 'manager' | 'reservations' | 'guide' | 'finance';
export interface TeamMember { id: string; name: string; email: string; role: TeamRole; status: 'active' | 'invited'; addedAt: string }
export const TEAM_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ['bookings', 'messages', 'listings', 'pricing', 'marketing', 'finance', 'team', 'settings'],
  manager: ['bookings', 'messages', 'listings', 'pricing', 'marketing'],
  reservations: ['bookings', 'messages'],
  guide: ['bookings'],
  finance: ['finance']
};
export const teamStore = createStore<Record<string, TeamMember[]>>('tm.biz.team', () => ({
  [DEMO_PARTNER_ID]: [
    { id: 'tm-1', name: 'Asha Mollel', email: 'asha@kijani.example', role: 'owner', status: 'active', addedAt: '2026-01-10T08:00:00Z' },
    { id: 'tm-2', name: 'Baraka Laizer', email: 'baraka@kijani.example', role: 'guide', status: 'active', addedAt: '2026-02-02T08:00:00Z' },
    { id: 'tm-3', name: 'Rehema Saning’o', email: 'rehema@kijani.example', role: 'reservations', status: 'active', addedAt: '2026-03-15T08:00:00Z' }
  ]
}));
export const useTeam = (partnerId: string) => useStore(teamStore, s => s[partnerId] ?? EMPTY_TEAM);
const EMPTY_TEAM: TeamMember[] = [];
export const team = {
  invite(partnerId: string, name: string, email: string, role: TeamRole) {
    teamStore.set(all => ({ ...all, [partnerId]: [...(all[partnerId] ?? []), { id: uid('tm_'), name, email, role, status: 'invited', addedAt: nowIso() }] }));
  },
  setRole(partnerId: string, id: string, role: TeamRole) { teamStore.set(all => ({ ...all, [partnerId]: (all[partnerId] ?? []).map(m => (m.id === id ? { ...m, role } : m)) })); },
  remove(partnerId: string, id: string) { teamStore.set(all => ({ ...all, [partnerId]: (all[partnerId] ?? []).filter(m => m.id !== id) })); }
};

// ---------------- Settings ----------------
export type PlanTier = 'starter' | 'growth' | 'enterprise';
export interface PartnerSettings {
  plan: PlanTier;
  /** Commission on base price and extras, as agreed in the partner agreement (sample value in the demo). */
  commissionRate: number;
  /** provider: mobile-money network name or bank name. Full numbers stay with the payment partner; only a masked form is kept. */
  payout: { connected: boolean; method?: 'bank' | 'mobile_money'; provider?: string; masked?: string; schedule: 'weekly' | 'monthly' };
  notify: { newBooking: string[]; request: string[]; message: string[]; review: string[] };
  autoReply: boolean;
  defaultLang: Locale;
}
const DEFAULT_SETTINGS: PartnerSettings = {
  plan: 'starter', commissionRate: 0.1, payout: { connected: false, schedule: 'monthly' },
  notify: { newBooking: ['email', 'whatsapp'], request: ['email', 'whatsapp', 'sms'], message: ['email'], review: ['email'] },
  autoReply: true, defaultLang: 'en'
};
export const settingsStore = createStore<Record<string, PartnerSettings>>('tm.biz.settings', () => ({
  [DEMO_PARTNER_ID]: { ...DEFAULT_SETTINGS, plan: 'growth', payout: { connected: true, method: 'mobile_money', provider: 'M-Pesa', masked: '•••• 4417', schedule: 'monthly' } }
}));
export const useSettings = (partnerId: string) => useStore(settingsStore, s => s[partnerId] ?? DEFAULT_SETTINGS);
export const settings = {
  update(partnerId: string, patch: Partial<PartnerSettings>) {
    settingsStore.set(all => ({ ...all, [partnerId]: { ...(all[partnerId] ?? DEFAULT_SETTINGS), ...patch } }));
  }
};

// ---------------- Review replies (shown under the review on the public listing) ----------------
export const replyStore = createStore<Record<string, { text: string; at: string; partnerId: string }>>('tm.biz.replies', () => ({}));
export const useReplies = () => useStore(replyStore);
export const reviewReplies = {
  save(reviewId: string, partnerId: string, text: string) { replyStore.set(all => ({ ...all, [reviewId]: { text, at: nowIso(), partnerId } })); },
  remove(reviewId: string) { replyStore.set(all => { const n = { ...all }; delete n[reviewId]; return n; }); }
};

// ---------------- Messages (partner side) ----------------
/** A conversation as the partner sees it. Traveller threads come from the in-app inbox; sample ones are fictional. */
export type PartnerThread = MessageThread & { guest: string; country?: string; sample?: boolean; readByPartner?: boolean };

const seedPartnerThreads = (): PartnerThread[] => {
  const t = (days: number, h: number) => `${addDays(todayIso(), -days)}T${String(h).padStart(2, '0')}:15:00Z`;
  return [
    { id: 'pt-1', partnerId: DEMO_PARTNER_ID, guest: 'Lena Fischer', country: 'DE', sample: true, readByPartner: false, updatedAt: t(0, 9), messages: [
      { from: 'me', text: 'Hello! Is it possible to add a third bed to a tent for our 10-year-old in February?', at: t(0, 9) }
    ] },
    { id: 'pt-2', partnerId: DEMO_PARTNER_ID, guest: 'Wei Zhang', country: 'CN', sample: true, readByPartner: false, updatedAt: t(1, 14), messages: [
      { from: 'me', text: 'Do you offer airport pick-up from Seronera airstrip?', at: t(1, 13) },
      { from: 'partner', text: 'Asante for asking! Yes, our guides meet every scheduled flight at Seronera at no extra cost.', at: t(1, 14) },
      { from: 'me', text: 'Great, we land at 11:40 on our arrival day.', at: t(1, 14) }
    ] },
    { id: 'pt-3', partnerId: DEMO_PARTNER_ID, guest: 'Marco Rossi', country: 'IT', sample: true, readByPartner: true, updatedAt: t(4, 18), messages: [
      { from: 'me', text: 'Can the bush dinner be vegetarian for the whole group?', at: t(4, 17) },
      { from: 'partner', text: 'Of course. Our chef prepares a full vegetarian menu on request; just note it in your booking.', at: t(4, 18) }
    ] }
  ];
};
export const partnerThreadStore = createStore<PartnerThread[]>('tm.biz.threads', seedPartnerThreads);
export const partnerReadStore = createStore<Record<string, string>>('tm.biz.threadsRead', () => ({}));

export const partnerInbox = {
  reply(threadId: string, text: string) {
    const msg = { from: 'partner' as const, text, at: nowIso() };
    if (threadStore.get().some(t => t.id === threadId)) threadStore.set(list => list.map(t => (t.id === threadId ? { ...t, updatedAt: msg.at, messages: [...t.messages, msg] } : t)));
    else partnerThreadStore.set(list => list.map(t => (t.id === threadId ? { ...t, updatedAt: msg.at, messages: [...t.messages, msg] } : t)));
    partnerReadStore.set(r => ({ ...r, [threadId]: msg.at }));
  },
  markRead(threadId: string) { partnerReadStore.set(r => ({ ...r, [threadId]: nowIso() })); }
};

// ---------------- Marketing: campaigns, packages, featured placement ----------------
export type CampaignChannel = 'homepage' | 'destination' | 'newsletter' | 'social' | 'ai';
export interface Campaign {
  id: string; partnerId: string; name: string; goal: 'bookings' | 'awareness' | 'low_season';
  listingIds: string[]; channels: CampaignChannel[]; from: string; to: string; budgetUsd: number;
  status: 'draft' | 'in_review' | 'scheduled' | 'live' | 'ended'; createdAt: string;
}
export interface PackageOffer {
  id: string; partnerId: string; name: string; listingIds: string[]; nights: number; priceUsd: number;
  description: string; status: 'draft' | 'in_review' | 'live'; createdAt: string;
}
export const campaignStore = createStore<Campaign[]>('tm.biz.campaigns', () => [
  { id: 'cmp-1', partnerId: DEMO_PARTNER_ID, name: 'Migration season 2027', goal: 'bookings', listingIds: ['stay-serengeti-kijani-camp'], channels: ['destination', 'ai'], from: addDays(todayIso(), -20), to: addDays(todayIso(), 40), budgetUsd: 600, status: 'live', createdAt: '2026-09-01T09:00:00Z' }
]);
export const packageStore = createStore<PackageOffer[]>('tm.biz.packages', () => []);
export const featuredStore = createStore<Record<string, { status: 'requested' | 'active'; at: string }>>('tm.biz.featured', () => ({}));
export const marketing = {
  saveCampaign(c: Omit<Campaign, 'id' | 'createdAt' | 'status'> & { id?: string; submit: boolean }) {
    const { submit, ...rest } = c;
    const status: Campaign['status'] = submit ? 'in_review' : 'draft';
    campaignStore.set(list => c.id ? list.map(x => (x.id === c.id ? { ...x, ...rest, id: x.id, status } : x)) : [{ ...rest, id: uid('cmp_'), status, createdAt: nowIso() }, ...list]);
  },
  removeCampaign(id: string) { campaignStore.set(list => list.filter(c => c.id !== id)); },
  savePackage(p: Omit<PackageOffer, 'id' | 'createdAt'>) { packageStore.set(list => [{ ...p, id: uid('pkg_'), createdAt: nowIso() }, ...list]); },
  removePackage(id: string) { packageStore.set(list => list.filter(p => p.id !== id)); },
  requestFeatured(listingId: string) { featuredStore.set(all => ({ ...all, [listingId]: { status: 'requested', at: nowIso() } })); },
  cancelFeatured(listingId: string) { featuredStore.set(all => { const n = { ...all }; delete n[listingId]; return n; }); }
};

// ---------------- VR content ----------------
export interface VrRequest {
  id: string; partnerId: string; listingId: string; kind: 'upload' | 'capture';
  /** Requested 360° format: video is recommended; photo suits rooms and static views. */
  format?: 'video' | 'photo360';
  fileName?: string; notes: string; preferredDate?: string;
  status: 'submitted' | 'scheduled' | 'processing' | 'live'; createdAt: string;
}
export const vrRequestStore = createStore<VrRequest[]>('tm.biz.vr', () => [
  { id: 'vr-1', partnerId: DEMO_PARTNER_ID, listingId: 'stay-tarangire-eco-lodge', kind: 'capture', notes: 'Pool deck at sunset and one chalet interior.', preferredDate: addDays(todayIso(), 24), status: 'scheduled', createdAt: '2026-09-20T10:00:00Z' }
]);
export const vrContent = {
  /** Uploads go to TravelMateVR's content team for stitching checks before publishing; files are not stored in the browser. */
  async submit(r: Omit<VrRequest, 'id' | 'createdAt' | 'status'>) {
    await demoLatency(500, 900);
    vrRequestStore.set(list => [{ ...r, id: uid('vr_'), status: 'submitted', createdAt: nowIso() }, ...list]);
  },
  cancel(id: string) { vrRequestStore.set(list => list.filter(r => r.id !== id)); }
};

// ---------------- Partner applications (public "List your business" form) ----------------
export interface PartnerApplication {
  id: string; businessName: string; kind: Partner['kind']; countryId: string; area: string; destinations: string[];
  services: string[]; licence?: string; registration?: string; website?: string;
  contact: { name: string; email: string; phone: string; role: string };
  languages: string[]; communityOwned: boolean; ecoCertification?: string; about: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected'; createdAt: string; decidedAt?: string; decisionNote?: string;
}
export const applicationStore = createStore<PartnerApplication[]>('tm.biz.applications', () => []);
export const applications = {
  async submit(a: Omit<PartnerApplication, 'id' | 'createdAt' | 'status'>): Promise<PartnerApplication> {
    await demoLatency(700, 1200);
    const app: PartnerApplication = { ...a, id: `APP-${Date.now().toString(36).toUpperCase().slice(-6)}`, status: 'submitted', createdAt: nowIso() };
    applicationStore.set(list => [app, ...list]);
    return app;
  }
};
