import type { Booking, Role, SupportTicket, TicketStatus } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { addDays, seeded, todayIso } from '@/lib/random';
import { downloadFile } from '@/lib/ics';
import { seedIndex } from './catalog';
import { pushNotification, sessionStore, ticketStore } from './account';
import { bookingStore, partnerBookingStore, HOLDS_INVENTORY } from './bookings';
import { applicationStore, campaignStore, featuredStore, packageStore, settingsStore } from './business';
import { boardCampaignStore } from './board';
import { partnerAdminStore } from './inventory';
import { messaging } from './messaging';
import { demoLatency } from './http';

// ---------------------------------------------------------------------------------------------
// TravelMateVR Command Center (demo layer). Role checks here shape the interface only; in
// production every admin endpoint enforces the same permissions server-side and writes the audit log.
// ---------------------------------------------------------------------------------------------

export const ADMIN_ROLES: Role[] = ['super_admin', 'admin', 'content_manager', 'support_agent', 'finance'];

export type AdminSection =
  | 'dashboard' | 'users' | 'partners' | 'destinations' | 'bookings' | 'vr' | 'ai' | 'reviews' | 'marketing'
  | 'promotions' | 'analytics' | 'sustainability' | 'support' | 'reports' | 'security' | 'settings';

/** Which roles can open a section, and which of them can change things there. */
export const ACCESS: Record<AdminSection, { read: Role[]; write: Role[] }> = {
  dashboard: { read: ADMIN_ROLES, write: [] },
  users: { read: ['super_admin', 'admin', 'support_agent'], write: ['super_admin', 'admin'] },
  partners: { read: ['super_admin', 'admin', 'finance', 'content_manager'], write: ['super_admin', 'admin'] },
  destinations: { read: ['super_admin', 'admin', 'content_manager'], write: ['super_admin', 'admin', 'content_manager'] },
  bookings: { read: ['super_admin', 'admin', 'support_agent', 'finance'], write: ['super_admin', 'admin', 'support_agent'] },
  vr: { read: ['super_admin', 'admin', 'content_manager'], write: ['super_admin', 'admin', 'content_manager'] },
  ai: { read: ['super_admin', 'admin', 'content_manager'], write: ['super_admin', 'admin'] },
  reviews: { read: ['super_admin', 'admin', 'content_manager', 'support_agent'], write: ['super_admin', 'admin', 'content_manager', 'support_agent'] },
  marketing: { read: ['super_admin', 'admin', 'content_manager'], write: ['super_admin', 'admin', 'content_manager'] },
  promotions: { read: ['super_admin', 'admin', 'content_manager', 'finance'], write: ['super_admin', 'admin', 'content_manager'] },
  analytics: { read: ['super_admin', 'admin', 'finance'], write: [] },
  sustainability: { read: ['super_admin', 'admin', 'content_manager'], write: [] },
  support: { read: ['super_admin', 'admin', 'support_agent'], write: ['super_admin', 'admin', 'support_agent'] },
  reports: { read: ['super_admin', 'admin', 'finance'], write: ['super_admin', 'admin', 'finance'] },
  security: { read: ['super_admin', 'admin'], write: ['super_admin'] },
  settings: { read: ['super_admin'], write: ['super_admin'] }
};
export const adminRoleOf = (roles: Role[] | undefined): Role | undefined => ADMIN_ROLES.find(r => roles?.includes(r));
export const canRead = (role: Role | undefined, s: AdminSection) => !!role && !!ACCESS[s]?.read.includes(role);
export const canWrite = (role: Role | undefined, s: AdminSection) => !!role && !!ACCESS[s]?.write.includes(role);

// ---------------- Audit log ----------------
export interface AuditEntry { id: string; at: string; actor: string; role: string; action: string; target: string; detail?: string; ip: string; sample?: boolean }
const seedAudit = (): AuditEntry[] => {
  const t = (d: number, h: number) => `${addDays(todayIso(), -d)}T${String(h).padStart(2, '0')}:12:00Z`;
  return [
    { id: 'au-1', at: t(1, 9), actor: 'Joseph Mwasomola', role: 'admin', action: 'partner.verify', target: 'mawingu-safaris', ip: '41.59.x.x', sample: true },
    { id: 'au-2', at: t(2, 14), actor: 'Grace Mbwambo', role: 'content_manager', action: 'experience.publish', target: 'table-mountain-summit', ip: '196.41.x.x', sample: true },
    { id: 'au-3', at: t(3, 11), actor: 'Daudi Kalinga', role: 'support_agent', action: 'booking.refund', target: 'TMV-8Q2LMR', detail: 'USD 410.00', ip: '41.75.x.x', sample: true },
    { id: 'au-4', at: t(5, 16), actor: 'Joseph Mwasomola', role: 'admin', action: 'review.hide', target: 'rv-spam-112', detail: 'Spam', ip: '41.59.x.x', sample: true }
  ];
};
export const auditStore = createStore<AuditEntry[]>('tm.admin.audit', seedAudit);
export const useAudit = () => useStore(auditStore);
/** Records an admin action with the signed-in admin as actor. */
export function audit(action: string, target: string, detail?: string) {
  const u = sessionStore.get().user;
  auditStore.set(list => [{ id: uid('au_'), at: nowIso(), actor: u?.name ?? 'unknown', role: adminRoleOf(u?.roles) ?? 'unknown', action, target, detail, ip: 'this device' }, ...list].slice(0, 1000));
}

// ---------------- Users ----------------
export interface DirectoryUser {
  id: string; name: string; email: string; role: Role; country: string; status: 'active' | 'suspended';
  createdAt: string; lastActive: string; bookings: number; mfa: boolean; orgId?: string;
}
const FIRST = ['Amina', 'Lucas', 'Chiara', 'Kenji', 'Fatma', 'Oliver', 'Zawadi', 'Mateo', 'Ingrid', 'Rahul', 'Halima', 'Julien', 'Sara', 'Yusuf', 'Emma', 'Baraka', 'Lin', 'Paolo', 'Nia', 'Felix'];
const LAST = ['Juma', 'Weber', 'Romano', 'Sato', 'Said', 'Smith', 'Mrema', 'López', 'Hansen', 'Iyer', 'Omar', 'Bernard', 'Conti', 'Ali', 'Taylor', 'Kimaro', 'Wang', 'Greco', 'Achieng', 'Braun'];
const COUNTRIES = ['TZ', 'DE', 'IT', 'JP', 'TZ', 'GB', 'TZ', 'ES', 'NO', 'IN', 'KE', 'FR', 'IT', 'TZ', 'US', 'TZ', 'CN', 'IT', 'KE', 'DE'];
const seedUsers = (): DirectoryUser[] => {
  const rnd = seeded('admin-users');
  const users: DirectoryUser[] = FIRST.map((f, i) => {
    const created = addDays(todayIso(), -rnd.int(5, 420));
    return {
      id: `u-${i + 1}`, name: `${f} ${LAST[i]}`, email: `${f}.${LAST[i]}`.toLowerCase().normalize('NFKD').replace(/[^a-z.]/g, '') + '@example.com',
      role: 'traveller', country: COUNTRIES[i]!, status: i === 7 ? 'suspended' : 'active', createdAt: `${created}T08:00:00Z`,
      lastActive: `${addDays(todayIso(), -rnd.int(0, 60))}T10:00:00Z`, bookings: rnd.int(0, 6), mfa: rnd.next() < 0.3
    };
  });
  return [
    ...users,
    { id: 'u_demo_partner', name: 'Asha Mollel', email: 'asha@kijani.example', role: 'partner', orgId: 'kijani-camps', country: 'TZ', status: 'active', createdAt: '2026-01-10T08:00:00Z', lastActive: `${todayIso()}T08:00:00Z`, bookings: 0, mfa: true },
    { id: 'u_demo_board', name: 'Demo Board Editor', email: 'editor@demo-board.example', role: 'tourism_board', orgId: 'demo-board-tz', country: 'TZ', status: 'active', createdAt: '2026-03-02T08:00:00Z', lastActive: `${addDays(todayIso(), -2)}T08:00:00Z`, bookings: 0, mfa: true },
    { id: 'u-adm-1', name: 'Joseph Mwasomola', email: 'joseph@travelmatevr.example', role: 'admin', country: 'TZ', status: 'active', createdAt: '2025-11-01T08:00:00Z', lastActive: `${todayIso()}T07:00:00Z`, bookings: 0, mfa: true },
    { id: 'u-adm-2', name: 'Grace Mbwambo', email: 'grace@travelmatevr.example', role: 'content_manager', country: 'TZ', status: 'active', createdAt: '2025-12-01T08:00:00Z', lastActive: `${addDays(todayIso(), -1)}T07:00:00Z`, bookings: 0, mfa: true },
    { id: 'u-adm-3', name: 'Daudi Kalinga', email: 'daudi@travelmatevr.example', role: 'support_agent', country: 'TZ', status: 'active', createdAt: '2026-02-01T08:00:00Z', lastActive: `${todayIso()}T06:00:00Z`, bookings: 0, mfa: true },
    { id: 'u-adm-4', name: 'Rehema Nnko', email: 'rehema@travelmatevr.example', role: 'finance', country: 'TZ', status: 'active', createdAt: '2026-02-15T08:00:00Z', lastActive: `${addDays(todayIso(), -3)}T07:00:00Z`, bookings: 0, mfa: false }
  ];
};
export const userDirectoryStore = createStore<DirectoryUser[]>('tm.admin.users', seedUsers);
export const useDirectory = () => useStore(userDirectoryStore);
export const usersAdmin = {
  setStatus(id: string, status: DirectoryUser['status']) {
    const u = userDirectoryStore.get().find(x => x.id === id);
    userDirectoryStore.set(list => list.map(x => (x.id === id ? { ...x, status } : x)));
    audit(status === 'suspended' ? 'user.suspend' : 'user.reactivate', u?.email ?? id);
  },
  setRole(id: string, role: Role) {
    const u = userDirectoryStore.get().find(x => x.id === id);
    userDirectoryStore.set(list => list.map(x => (x.id === id ? { ...x, role } : x)));
    audit('user.role', u?.email ?? id, role);
  },
  resetMfa(id: string) {
    const u = userDirectoryStore.get().find(x => x.id === id);
    userDirectoryStore.set(list => list.map(x => (x.id === id ? { ...x, mfa: false } : x)));
    audit('user.mfaReset', u?.email ?? id);
  },
  invite(name: string, email: string, role: Role) {
    userDirectoryStore.set(list => [{ id: uid('u_'), name, email, role, country: 'TZ', status: 'active', createdAt: nowIso(), lastActive: nowIso(), bookings: 0, mfa: false }, ...list]);
    audit('user.invite', email, role);
  }
};

// ---------------- Partners ----------------
export const partnersAdmin = {
  setVerified(id: string, verified: boolean) { partnerAdminStore.set(all => ({ ...all, [id]: { ...all[id], verified } })); audit(verified ? 'partner.verify' : 'partner.unverify', id); },
  setSuspended(id: string, suspended: boolean, note?: string) { partnerAdminStore.set(all => ({ ...all, [id]: { ...all[id], suspended, note } })); audit(suspended ? 'partner.suspend' : 'partner.reinstate', id, note); },
  setCommission(id: string, rate: number) {
    settingsStore.set(all => ({ ...all, [id]: { ...(all[id] ?? { plan: 'starter', payout: { connected: false, schedule: 'monthly' }, notify: { newBooking: [], request: [], message: [], review: [] }, autoReply: true, defaultLang: 'en' }), commissionRate: rate } }));
    audit('partner.commission', id, `${Math.round(rate * 100)}%`);
  },
  decideApplication(id: string, decision: 'approved' | 'rejected' | 'in_review', note?: string) {
    applicationStore.set(list => list.map(a => (a.id === id ? { ...a, status: decision, decidedAt: nowIso(), decisionNote: note } : a)));
    audit(`application.${decision}`, id, note);
  }
};

// ---------------- Bookings ----------------
const patchBooking = (id: string, fn: (b: Booking) => Booking) => {
  if (bookingStore.get().some(b => b.id === id)) bookingStore.set(l => l.map(b => (b.id === id ? fn(b) : b)));
  else partnerBookingStore.set(l => l.map(b => (b.id === id ? fn(b) : b)));
};
export const bookingsAdmin = {
  /** Cancels on the platform's side with a full refund (e.g. partner can't deliver, payment dispute). */
  async cancelWithRefund(id: string, reason: string) {
    await demoLatency(300, 600);
    const all = [...bookingStore.get(), ...partnerBookingStore.get()];
    const b = all.find(x => x.id === id);
    patchBooking(id, x => ({ ...x, status: x.payment.paidUsd > 0 ? 'refunded' : 'cancelled' }));
    if (bookingStore.get().some(x => x.id === id)) pushNotification({ kind: 'booking', href: `/bookings/${id}`, i18n: { title: 'notif.cancelled.title', body: 'notif.cancelled.body', params: { id, amount: `USD ${(b?.payment.paidUsd ?? 0).toFixed(2)}` } } });
    audit('booking.refund', id, `${reason} · USD ${(b?.payment.paidUsd ?? 0).toFixed(2)}`);
  },
  async resendConfirmation(id: string) {
    const b = [...bookingStore.get(), ...partnerBookingStore.get()].find(x => x.id === id);
    if (!b) return;
    await messaging.send({ template: 'booking_confirmation', channels: ['email'], data: { bookingId: id, email: b.lead.email } });
    audit('booking.resend', id, b.lead.email);
  }
};

// ---------------- Support ----------------
type AdminTicket = SupportTicket & { customer: string; email: string; sample?: boolean; priority: 'low' | 'normal' | 'high'; assignee?: string };
const seedTickets = (): AdminTicket[] => {
  const t = (d: number, h: number) => `${addDays(todayIso(), -d)}T${String(h).padStart(2, '0')}:05:00Z`;
  return [
    { id: 'TCK-482211', subject: 'Change dates for my Serengeti camp', topic: 'booking', status: 'open', createdAt: t(0, 8), customer: 'Ingrid Hansen', email: 'ingrid.hansen@example.com', priority: 'normal', sample: true,
      messages: [{ from: 'me', text: 'Hi, can I move my stay at Kijani Serengeti Tented Camp by two days? Booking TMV-K1074C.', at: t(0, 8) }] },
    { id: 'TCK-482198', subject: 'Mobile money payment not showing', topic: 'payment', status: 'open', createdAt: t(0, 6), customer: 'Zawadi Mrema', email: 'zawadi.mrema@example.com', priority: 'high', sample: true,
      messages: [{ from: 'me', text: 'I paid with M-Pesa an hour ago but the booking still says awaiting payment.', at: t(0, 6) }] },
    { id: 'TCK-482150', subject: 'Headset mode on Quest 3', topic: 'other', status: 'in_progress', createdAt: t(1, 15), customer: 'Lucas Weber', email: 'lucas.weber@example.com', priority: 'low', sample: true, assignee: 'Daudi Kalinga',
      messages: [{ from: 'me', text: 'The headset button does not appear on some experiences.', at: t(1, 15) }, { from: 'support', text: 'Headset mode is available on experiences with a full 360° capture. Which experience were you viewing?', at: t(1, 16) }] }
  ];
};
export const adminTicketStore = createStore<AdminTicket[]>('tm.admin.tickets', seedTickets);
/** Tickets from travellers on this device plus sample tickets. */
export function useSupportQueue() {
  const live = useStore(ticketStore);
  const sample = useStore(adminTicketStore);
  const u = useStore(sessionStore, s => s.user);
  return [...live.map(t => ({ ...t, customer: u?.name ?? 'Traveller', email: u?.email ?? '', priority: 'normal' as const })), ...sample]
    .sort((a, b) => (b.messages[b.messages.length - 1]?.at ?? b.createdAt).localeCompare(a.messages[a.messages.length - 1]?.at ?? a.createdAt));
}
export const supportAdmin = {
  reply(id: string, text: string, status: TicketStatus) {
    const msg = { from: 'support' as const, text, at: nowIso() };
    if (ticketStore.get().some(t => t.id === id)) {
      ticketStore.set(l => l.map(t => (t.id === id ? { ...t, status, messages: [...t.messages, msg] } : t)));
      pushNotification({ kind: 'support', href: `/help/tickets/${id}`, i18n: { title: 'notif.ticketReply.title', body: 'notif.ticketReply.body', params: { id } } });
    } else adminTicketStore.set(l => l.map(t => (t.id === id ? { ...t, status, messages: [...t.messages, msg] } : t)));
    audit('ticket.reply', id, status);
  },
  setStatus(id: string, status: TicketStatus) {
    if (ticketStore.get().some(t => t.id === id)) ticketStore.set(l => l.map(t => (t.id === id ? { ...t, status } : t)));
    else adminTicketStore.set(l => l.map(t => (t.id === id ? { ...t, status } : t)));
    audit('ticket.status', id, status);
  }
};

// ---------------- Marketing approvals ----------------
export const marketingAdmin = {
  decideCampaign(id: string, approve: boolean) {
    const today = todayIso();
    campaignStore.set(l => l.map(c => (c.id === id ? { ...c, status: !approve ? 'draft' : c.from <= today ? 'live' : 'scheduled' } : c)));
    audit(approve ? 'campaign.approve' : 'campaign.reject', id);
  },
  decideFeatured(listingId: string, approve: boolean) {
    featuredStore.set(all => { const n = { ...all }; if (approve) n[listingId] = { status: 'active', at: nowIso() }; else delete n[listingId]; return n; });
    audit(approve ? 'featured.approve' : 'featured.reject', listingId);
  },
  /** Approved packages go live; rejected ones return to the partner as drafts. */
  decidePackage(id: string, approve: boolean) {
    packageStore.set(l => l.map(p => (p.id === id ? { ...p, status: approve ? 'live' : 'draft' } : p)));
    audit(approve ? 'package.approve' : 'package.reject', id);
  }
};

// ---------------- Security & privacy ----------------
export interface SecurityEvent { id: string; at: string; kind: 'failed_login' | 'rate_limit' | 'new_device' | 'mfa_disabled' | 'permission_denied'; who: string; ip: string; severity: 'low' | 'medium' | 'high' }
export const securityEvents = (): SecurityEvent[] => {
  const rnd = seeded('sec-events');
  const kinds: SecurityEvent['kind'][] = ['failed_login', 'rate_limit', 'new_device', 'permission_denied', 'failed_login', 'mfa_disabled'];
  return Array.from({ length: 14 }, (_, i): SecurityEvent => {
    const kind = kinds[i % kinds.length]!;
    return { id: `se-${i}`, at: `${addDays(todayIso(), -rnd.int(0, 10))}T${String(rnd.int(0, 23)).padStart(2, '0')}:${String(rnd.int(0, 59)).padStart(2, '0')}:00Z`, kind,
      who: kind === 'rate_limit' ? 'api / search' : `${FIRST[rnd.int(0, 19)]!.toLowerCase()}@example.com`, ip: `${rnd.int(41, 197)}.${rnd.int(1, 254)}.x.x`,
      severity: kind === 'mfa_disabled' || kind === 'permission_denied' ? 'high' : kind === 'failed_login' ? 'medium' : 'low' };
  }).sort((a, b) => b.at.localeCompare(a.at));
};
export interface DataRequest { id: string; at: string; email: string; kind: 'export' | 'erase' | 'correct'; status: 'new' | 'in_progress' | 'done'; due: string }
export const dataRequestStore = createStore<DataRequest[]>('tm.admin.dsr', () => [
  { id: 'DSR-1031', at: `${addDays(todayIso(), -6)}T09:00:00Z`, email: 'oliver.smith@example.com', kind: 'export', status: 'new', due: addDays(todayIso(), 24) },
  { id: 'DSR-1027', at: `${addDays(todayIso(), -12)}T09:00:00Z`, email: 'emma.taylor@example.com', kind: 'erase', status: 'in_progress', due: addDays(todayIso(), 18) }
]);
export const privacyAdmin = {
  setStatus(id: string, status: DataRequest['status']) { dataRequestStore.set(l => l.map(r => (r.id === id ? { ...r, status } : r))); audit('dsr.status', id, status); }
};

// ---------------- Platform metrics ----------------
export function allBookings(): (Booking & { sample?: boolean })[] {
  return [...bookingStore.get(), ...partnerBookingStore.get().map(b => ({ ...b, sample: true }))];
}
const LIVE = new Set(['confirmed', 'paid', 'partially_paid', 'completed']);

/** Platform metrics: bookings, GMV, commission, markets and partner/destination performance come from booking data; users, sessions and non-commission revenue streams are sample values. */
export function platformMetrics(bookings: Booking[], months: string[]) {
  const rnd = seeded('platform');
  const live = bookings.filter(b => LIVE.has(b.status));
  const rateOf = (partnerId: string) => settingsStore.get()[partnerId]?.commissionRate ?? 0.1;
  const gmv = live.reduce((s, b) => s + b.price.total, 0);
  const commission = live.reduce((s, b) => s + (b.price.base + b.price.extras - (b.price.discount ?? 0)) * rateOf(b.partnerId), 0);
  const fees = live.reduce((s, b) => s + b.price.serviceFee, 0);
  const adRevenue = [...campaignStore.get(), ...boardCampaignStore.get()].filter(c => c.status === 'live' || c.status === 'scheduled' || c.status === 'ended').reduce((s, c) => s + c.budgetUsd, 0);
  const subscriptions = Object.values(settingsStore.get()).filter(s => s.plan === 'growth').length * 49 * 12 + rnd.int(2400, 3600);

  const series = months.map((m, i) => {
    const bs = live.filter(b => b.createdAt.slice(0, 7) === m);
    const growth = 1 + i * 0.09;
    return {
      month: m,
      newUsers: Math.round(rnd.jitter(320 * growth, 0.15)),
      activeUsers: Math.round(rnd.jitter(2100 * growth, 0.1)),
      bookings: bs.length,
      gmv: Math.round(bs.reduce((s, b) => s + b.price.total, 0)),
      commission: Math.round(bs.reduce((s, b) => s + (b.price.base + b.price.extras - (b.price.discount ?? 0)) * rateOf(b.partnerId), 0)),
      subscription: Math.round(rnd.jitter(subscriptions / 12, 0.05)),
      advertising: Math.round(rnd.jitter(adRevenue / 12, 0.3)),
      enterprise: Math.round(rnd.jitter(1500 + i * 120, 0.1))
    };
  });
  const totalUsers = series.reduce((s, p) => s + p.newUsers, 0) + 4200;
  const markets = new Map<string, number>();
  live.forEach(b => markets.set(b.lead.country, (markets.get(b.lead.country) ?? 0) + 1));
  const byPartner = seedIndex.partners.map(p => {
    const bs = live.filter(b => b.partnerId === p.id);
    const ls = seedIndex.listings.filter(l => l.partnerId === p.id);
    const rc = ls.reduce((s, l) => s + l.reviewCount, 0);
    return { partner: p, bookings: bs.length, gmv: Math.round(bs.reduce((s, b) => s + b.price.total, 0)), listings: ls.length, rating: rc ? ls.reduce((s, l) => s + (l.rating ?? 0) * l.reviewCount, 0) / rc : 0 };
  }).sort((a, b) => b.gmv - a.gmv || b.listings - a.listings);
  const byDestination = seedIndex.destinations.map(d => {
    const bs = live.filter(b => seedIndex.listingById.get(b.listingId)?.destinationId === d.id);
    return { destination: d, bookings: bs.length, gmv: Math.round(bs.reduce((s, b) => s + b.price.total, 0)), interest: Math.round(rnd.jitter(Math.log10(d.reviewCount + 10) * 9000, 0.2)) };
  }).sort((a, b) => b.interest - a.interest);
  const contributions = live.reduce((s, b) => s + b.price.contribution, 0);
  return {
    series, totalUsers, activeUsers: series[series.length - 1]!.activeUsers, gmv, commission, fees, adRevenue, subscriptions,
    enterprise: series.reduce((s, p) => s + p.enterprise, 0), bookings: live.length, holds: bookings.filter(b => HOLDS_INVENTORY.includes(b.status)).length,
    conversion: 0.021 + rnd.next() * 0.006, markets: [...markets].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    byPartner, byDestination, contributions
  };
}

// ---------------- Reports ----------------
const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  // Neutralise spreadsheet formula injection and quote when needed.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
}
export function downloadCsv(name: string, header: string[], rows: unknown[][]) {
  downloadFile(name, '﻿' + toCsv(header, rows), 'text/csv;charset=utf-8');
  audit('report.export', name, `${rows.length} rows`);
}
