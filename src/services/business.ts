import { useEffect, useState } from 'react';
import type { Locale, LocalizedText, MediaId, MessageThread, Partner } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { addDays, todayIso } from '@/lib/random';
import { PARTNERS } from '@/data/seed/partners';
import { demoLatency } from './http';
import { threadStore } from './account';
import { partnerAdminStore } from './inventory';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

const dataClient = () => generateClient<Schema>({ authMode: 'userPool' });

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

// ---------------- Real, publicly-visible partner logo/cover/social ----------------
// Unlike storefrontStore above (a local-only overlay nobody else ever sees), this writes
// through updatePartnerProfile (amplify/functions/update-partner-profile/) onto the actual
// Partner row everyone reads - see that mutation's authorization() comment in
// amplify/data/resource.ts for why this couldn't just be a direct model write.
export type PartnerSocialLinks = NonNullable<Partner['social']>;

export const partnerProfile = {
  async uploadLogo(file: File): Promise<string> { return uploadPartnerMedia(file); },
  async uploadCover(file: File): Promise<string> { return uploadPartnerMedia(file); },
  /** Only the fields you pass are changed — omit logo/cover to leave them as-is. Throws if
   *  this Cognito user isn't this Partner row's registered owner (Partner.ownerSub, admin-set
   *  by hand) - expected for today's demo/seed partner sessions, which have no real backend
   *  row at all yet (see src/components/portal/PortalLayout.tsx: the portal's "who am I"
   *  always resolves from static seed data, not a real Partner row). */
  async save(partnerId: string, patch: { logo?: string; cover?: string; social?: PartnerSocialLinks }): Promise<void> {
    const res = await dataClient().mutations.updatePartnerProfile({ partnerId, logo: patch.logo, cover: patch.cover, ...patch.social });
    if (res.errors?.length) throw new Error(res.errors.map(e => e.message).join('; '));
  }
};

async function uploadPartnerMedia(file: File): Promise<string> {
  const identityId = (await fetchAuthSession()).identityId;
  if (!identityId) throw new Error('Sign in to upload a photo.');
  const key = `profile-media/${identityId}/${Date.now()}-${file.name}`;
  await uploadData({ path: key, data: file }).result;
  return key;
}

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
  fileName?: string;
  /** S3 key under vr-media/{identityId}/... — set only for kind:'upload'. Private; nothing
   *  renders it back in-app. Publishing to the real static pano/video pipeline stays a
   *  manual ops step. */
  mediaKey?: string;
  notes: string; preferredDate?: string;
  status: 'submitted' | 'scheduled' | 'processing' | 'live'; createdAt: string;
}
export const vrRequestStore = createStore<VrRequest[]>('tm.biz.vr', () => [
  { id: 'vr-1', partnerId: DEMO_PARTNER_ID, listingId: 'stay-tarangire-eco-lodge', kind: 'capture', notes: 'Pool deck at sunset and one chalet interior.', preferredDate: addDays(todayIso(), 24), status: 'scheduled', createdAt: '2026-09-20T10:00:00Z' }
]);
export const vrContent = {
  /** For kind:'upload', really uploads the file now (src/pages/business/VrPage.tsx already
   *  validates it's genuinely 360° and meets the quality bar before calling this) — it used
   *  to discard the File object and only keep its name, so nothing ever actually reached
   *  TravelMateVR's content team. */
  async submit(r: Omit<VrRequest, 'id' | 'createdAt' | 'status' | 'mediaKey' | 'fileName'> & { file?: File }) {
    const { file, ...rest } = r;
    let mediaKey: string | undefined;
    if (file) {
      const identityId = (await fetchAuthSession()).identityId;
      if (!identityId) throw new Error('Sign in to upload 360° media.');
      mediaKey = `vr-media/${identityId}/${Date.now()}-${file.name}`;
      await uploadData({ path: mediaKey, data: file }).result;
    } else {
      await demoLatency(500, 900);
    }
    vrRequestStore.set(list => [{ ...rest, fileName: file?.name, mediaKey, id: uid('vr_'), status: 'submitted', createdAt: nowIso() }, ...list]);
  },
  cancel(id: string) { vrRequestStore.set(list => list.filter(r => r.id !== id)); }
};

// ---------------- Partner applications (public "List your business" form) ----------------
// Real backend now (Amplify Data's PartnerApplication model + the submitPartnerApplication
// custom mutation, amplify/functions/submit-partner-application/) — not the localStorage mock
// this used to be. The only way to create a row is that mutation, which rejects a submission
// with zero certification documents server-side; see its handler for why that enforcement
// can't just live in this form's own validation.
export interface PartnerApplication {
  id: string; businessName: string; kind: Partner['kind']; countryId: string; area: string; destinations: string[];
  services: string[]; licence?: string; registration?: string; website?: string;
  contact: { name: string; email: string; phone: string; role: string };
  languages: string[]; communityOwned: boolean; ecoCertification?: string; about: string;
  certificationDocs: string[];
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'revoked'; createdAt: string; decidedAt?: string; decisionNote?: string;
  revokedAt?: string; revokedReason?: string; linkedPartnerId?: string;
}

type ApplicationRecord = NonNullable<Schema['PartnerApplication']['type']>;

function fromRecord(r: ApplicationRecord): PartnerApplication {
  return {
    id: r.id,
    businessName: r.businessName,
    kind: r.kind as Partner['kind'],
    countryId: r.countryId,
    area: r.area,
    destinations: [...(r.destinations ?? [])].filter((d): d is string => d !== null),
    services: [...(r.services ?? [])].filter((s): s is string => s !== null),
    licence: r.licence ?? undefined,
    registration: r.registration ?? undefined,
    website: r.website ?? undefined,
    contact: { name: r.contactName, email: r.contactEmail, phone: r.contactPhone, role: r.contactRole ?? '' },
    languages: [...(r.languages ?? [])].filter((l): l is string => l !== null),
    communityOwned: r.communityOwned,
    ecoCertification: r.ecoCertification ?? undefined,
    about: r.about,
    certificationDocs: [...(r.certificationDocs ?? [])].filter((d): d is string => d !== null),
    status: (r.status ?? 'submitted') as PartnerApplication['status'],
    createdAt: r.createdAt,
    decidedAt: r.decidedAt ?? undefined,
    decisionNote: r.decisionNote ?? undefined,
    revokedAt: r.revokedAt ?? undefined,
    revokedReason: r.revokedReason ?? undefined,
    linkedPartnerId: r.linkedPartnerId ?? undefined
  };
}

export const applications = {
  /** Uploads one certification/licence file to the caller's own prefix
   *  (partner-docs/{identityId}/..., amplify/storage/resource.ts) and returns the S3 key to
   *  pass into submit(). identityId here is the Cognito Identity Pool id the storage access
   *  rule's {entity_id} token resolves to — the same signed-in session also has a separate
   *  User Pool sub used for the application's own ownership, but both trace back to the one
   *  authenticated user. */
  async uploadCertDoc(file: File): Promise<string> {
    const session = await fetchAuthSession();
    const identityId = session.identityId;
    if (!identityId) throw new Error('Sign in to upload documents.');
    const path = `partner-docs/${identityId}/${Date.now()}-${file.name}`;
    await uploadData({ path, data: file }).result;
    return path;
  },
  async submit(a: Omit<PartnerApplication, 'id' | 'createdAt' | 'status' | 'decidedAt' | 'decisionNote' | 'revokedAt' | 'revokedReason' | 'linkedPartnerId'>): Promise<PartnerApplication> {
    const res = await dataClient().mutations.submitPartnerApplication({
      businessName: a.businessName,
      kind: a.kind,
      countryId: a.countryId,
      area: a.area,
      destinations: a.destinations,
      services: a.services,
      licence: a.licence,
      registration: a.registration,
      website: a.website,
      contactName: a.contact.name,
      contactEmail: a.contact.email,
      contactPhone: a.contact.phone,
      contactRole: a.contact.role,
      languages: a.languages,
      communityOwned: a.communityOwned,
      ecoCertification: a.ecoCertification,
      about: a.about,
      certificationDocs: a.certificationDocs
    });
    if (res.errors?.length) throw new Error(res.errors.map(e => e.message).join('; '));
    if (!res.data) throw new Error('The application was not created.');
    return fromRecord(res.data as ApplicationRecord);
  },
  /** Every application, for the admin PartnersPage — authorized by allow.group('admin') on
   *  the model itself, same as every other admin-only read in this app. */
  async listAll(): Promise<PartnerApplication[]> {
    const res = await dataClient().models.PartnerApplication.list();
    return res.data.map(fromRecord);
  },
  async decide(id: string, decision: 'approved' | 'rejected' | 'in_review', note?: string): Promise<void> {
    const res = await dataClient().models.PartnerApplication.update({ id, status: decision, decidedAt: nowIso(), decisionNote: note });
    if (res.errors?.length) throw new Error(res.errors.map(e => e.message).join('; '));
  }
};

/** Live, admin-only view of every application (src/pages/admin/PartnersPage.tsx) — updates
 *  automatically as applications are decided or revoked, instead of needing a manual refetch. */
export function useApplications(): PartnerApplication[] {
  const [list, setList] = useState<PartnerApplication[]>([]);
  useEffect(() => {
    const sub = dataClient().models.PartnerApplication.observeQuery().subscribe({
      next: ({ items }) => setList(items.map(fromRecord))
    });
    return () => sub.unsubscribe();
  }, []);
  return list;
}
