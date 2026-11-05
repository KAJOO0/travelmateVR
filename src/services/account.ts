import type { AppNotification, LocalizedText, MessageThread, Review, Role, SupportTicket, TravelDocument, TravellerProfile, User } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { AppError, DATA_SOURCE, REAL_BACKEND, demoLatency, http } from './http';
import { cleanText, hashPassword, isAcceptablePassword, isEmail, isUsername, normalizeEmail, normalizeUsername, verifyPassword } from '@/lib/security';
import { platformStore } from './platform';
import type { Channel } from './messaging';
import {
  confirmSignIn as cognitoConfirmSignIn,
  confirmSignUp as cognitoConfirmSignUp,
  deleteUser as cognitoDeleteUser,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn as cognitoSignIn,
  signInWithRedirect,
  signOut as cognitoSignOut,
  signUp as cognitoSignUp
} from 'aws-amplify/auth';

// ---------------- Session and sign-in ----------------
// Production: the backend validates and normalises every field, hashes passwords with Argon2id,
// limits sign-in attempts per account and per IP, answers wrong credentials with one generic error,
// and issues an httpOnly, Secure, SameSite session cookie (docs/security/authentication.md).
// Demo mode simulates the same rules on this device: accounts are stored with a PBKDF2 password
// hash (never the password itself), and the attempt limit is kept in local storage.
export const sessionStore = createStore<{ user: User | null }>('tm.session', () => ({ user: null }));

/** Sign-in and registration failures. Messages never say which field was wrong. */
export class AuthError extends Error {
  constructor(public code: 'invalid_credentials' | 'locked' | 'register_failed' | 'invalid_input' | 'confirmation_required', public lockedUntil?: string, public attemptsLeft?: number) {
    super(code);
    this.name = 'AuthError';
  }
}

interface DemoAccount { id: string; name: string; email: string; username?: string; passwordHash: string; createdAt: string }
const accountStore = createStore<DemoAccount[]>('tm.auth.accounts', () => []);
/** Failed attempts on this device; a successful sign-in resets them. */
const guardStore = createStore<{ failures: number; lockedUntil?: string }>('tm.auth.guard', () => ({ failures: 0 }));

export const loginGuard = {
  // Real mode's actual lockout thresholds (15/30/1440min escalation) are enforced server-side
  // by amplify/functions/login-guard/ — this '3' is only the number SignInPage.tsx's
  // "N attempts left" display counts down from, cosmetic, not enforcement.
  maxAttempts: () => (REAL_BACKEND ? 3 : platformStore.get().security.maxLoginAttempts),
  lockoutMinutes: () => platformStore.get().security.lockoutMinutes, // demo-mode only
  /** ISO time until which sign-in is blocked, or undefined. Expired locks are cleared. */
  lockedUntil(): string | undefined {
    const g = guardStore.get();
    if (!g.lockedUntil) return undefined;
    if (Date.parse(g.lockedUntil) > Date.now()) return g.lockedUntil;
    guardStore.set({ failures: 0 });
    return undefined;
  },
  fail(): AuthError {
    const failures = guardStore.get().failures + 1;
    if (failures >= loginGuard.maxAttempts()) {
      const lockedUntil = new Date(Date.now() + loginGuard.lockoutMinutes() * 60_000).toISOString();
      guardStore.set({ failures, lockedUntil });
      return new AuthError('locked', lockedUntil);
    }
    guardStore.set({ failures });
    return new AuthError('invalid_credentials', undefined, loginGuard.maxAttempts() - failures);
  },
  reset() { guardStore.set({ failures: 0 }); },
  /** Real mode only: mirrors the login-guard Lambda's verdict into this local store so
   *  SignInPage.tsx's existing banner/countdown/disabled-inputs UI (which reads guardStore
   *  directly, not the thrown error) keeps working unchanged. This is a UX cache, not the
   *  enforcement — the server re-checks on every real attempt regardless of what this says. */
  syncLock(lockedUntil: string | undefined) {
    guardStore.set({ failures: lockedUntil ? loginGuard.maxAttempts() : 0, lockedUntil });
  }
};
export const useLoginGuard = () => useStore(guardStore);

const startSession = (user: User) => { loginGuard.reset(); sessionStore.set({ user }); return user; };

/** After a Cognito signIn()/confirmSignUp()+signIn() call has already succeeded: read the
 *  authenticated user's attributes and land them in the app's session, same shape as every
 *  other sign-in path.
 *
 *  Admin access: real Cognito group membership (amplify/auth/resource.ts's 'admin' group,
 *  read from the ID token's standard `cognito:groups` claim — not the app's own session
 *  object, which can't be trusted for this) maps to the 'super_admin' role. This is the only
 *  real group that exists today, so there's no finer-grained mapping yet. This is what makes
 *  a real signed-in admin distinct from the PortalGate demo button (src/services/account.ts's
 *  signInPortal()), which only ever sets a local session and is disabled entirely in real-mode
 *  (see PortalGate.tsx) — real admin access requires actually being in this Cognito group,
 *  checked server-side by every Amplify Data write already (allow.group('admin')), not just
 *  this client-side role label, which exists only to drive which UI the app shows. */
async function finishRealSignIn(fallbackEmail: string, provider: 'email' | 'google' = 'email'): Promise<User> {
  const [{ userId }, attrs, session] = await Promise.all([getCurrentUser(), fetchUserAttributes(), fetchAuthSession()]);
  const groups = (session.tokens?.idToken?.payload['cognito:groups'] as string[] | undefined) ?? [];
  const roles: Role[] = groups.includes('admin') ? ['super_admin'] : ['traveller'];
  return startSession({ id: userId, name: attrs.name ?? fallbackEmail, email: attrs.email ?? fallbackEmail, provider, roles, createdAt: nowIso() });
}

/** Call once on app load (see src/main.tsx's Hub 'auth' listener), only ever in response to
 *  the Hub 'signInWithRedirect' event — Amplify itself has already confirmed a redirect
 *  sign-in completed by the time that event fires, so (unlike a blind call on every page
 *  load) a failure here is a real problem worth logging, not an expected no-session case.
 *  A Google sign-in is a full browser redirect to accounts.google.com and back — the click
 *  handler that started it never gets to finish running, so this is how the app notices a
 *  redirect sign-in actually landed and populates sessionStore accordingly. Returns whether
 *  it actually signed someone in, so the caller can navigate them to their account — the
 *  OAuth round-trip always lands back on the bare registered callback URL (the homepage),
 *  never wherever the user actually meant to end up. */
export async function syncSessionFromRedirect(): Promise<boolean> {
  if (!REAL_BACKEND) return false;
  try {
    await finishRealSignIn('', 'google');
    return true;
  } catch (e) {
    console.error('Google sign-in completed the redirect but finishing the session failed:', e);
    return false;
  }
}

/** Translates the login-guard Lambda's smuggled error text (thrown from a Cognito trigger,
 *  surfaced here as a rejected confirmSignIn()) back into the existing AuthError contract
 *  SignInPage.tsx already understands. Falls back to a generic invalid_credentials on
 *  anything unparseable — never reveals more than today's code already does. */
function mapCognitoLockoutError(e: unknown): AuthError {
  const message = e instanceof Error ? e.message : '';
  // Cognito wraps the Lambda's thrown message in UserLambdaValidationException and appends a
  // trailing period — confirmed live. \S+ would capture that period as part of the ISO
  // timestamp and make every downstream Date.parse() return Invalid Date, so match the ISO
  // shape precisely instead of "everything non-whitespace".
  const lockedMatch = message.match(/LOCKED:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
  if (lockedMatch) {
    loginGuard.syncLock(lockedMatch[1]);
    return new AuthError('locked', lockedMatch[1]);
  }
  const leftMatch = message.match(/ATTEMPTS_LEFT:(\d+)/);
  if (leftMatch) return new AuthError('invalid_credentials', undefined, Number(leftMatch[1]));
  return new AuthError('invalid_credentials');
}

/** The only way a real sign-in attempt happens now — the user pool client's auth flows are
 *  locked to CUSTOM_AUTH only (see amplify/backend.ts), so every real-mode sign-in (and the
 *  post-signup sign-in inside register()/confirmRegistration()) must go through this, not a
 *  direct cognitoSignIn(username, password) call. See amplify/functions/login-guard/handler.ts
 *  for the server side — that Lambda is the sole judge of password correctness, via
 *  VerifyAuthChallengeResponse, which is what makes progressive lockout enforceable
 *  server-side rather than just cosmetic. */
async function attemptCustomAuthSignIn(email: string, password: string): Promise<void> {
  try {
    // Confirmed live: for an email with no account at all, Cognito's own
    // preventUserExistenceErrors protection throws NotAuthorizedException straight out of
    // this very first call — it never even reaches a nextStep — contrary to this flow's
    // original design assumption that existing and non-existing users took an identical
    // path all the way to the password-challenge step. Without this try/catch, that
    // exception (not an AuthError) fell all the way through signIn() as an unhandled
    // "something went wrong" instead of the normal "wrong email or password" message.
    const { isSignedIn, nextStep } = await cognitoSignIn({ username: email, options: { authFlowType: 'CUSTOM_WITHOUT_SRP' } });
    if (isSignedIn) return;
    // An unconfirmed account surfaces here, on the initial call, same as it did under SRP —
    // Amplify's CUSTOM_WITHOUT_SRP path reuses the same UserNotConfirmedException -> nextStep
    // mapping. Must be checked before the lockout-relevant CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE
    // branch below, since an unconfirmed account never reaches the password-challenge step at all.
    if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') throw new AuthError('confirmation_required');
    if (nextStep?.signInStep !== 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') throw loginGuard.fail(); // unexpected state — fail generically
    const { isSignedIn: done } = await cognitoConfirmSignIn({ challengeResponse: password });
    if (!done) throw loginGuard.fail();
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw mapCognitoLockoutError(e);
  }
}

export const auth = {
  /** Sign in with an email address or a username. Wrong credentials always produce the same error. */
  async signIn(identifier: string, password: string): Promise<User> {
    const locked = loginGuard.lockedUntil();
    if (locked) throw new AuthError('locked', locked);
    const id = identifier.includes('@') ? normalizeEmail(identifier) : normalizeUsername(identifier);
    const wellFormed = (isEmail(id) || isUsername(id)) && password.length > 0 && password.length <= 128;
    if (DATA_SOURCE === 'http') {
      try {
        return startSession(await http<User>('/auth/login', { method: 'POST', json: { identifier: id, password } }));
      } catch (e) {
        if (e instanceof AppError && e.code === 'rate_limited') {
          const until = (e.details as { lockedUntil?: string } | undefined)?.lockedUntil;
          throw new AuthError('locked', until);
        }
        if (e instanceof AppError && (e.code === 'unauthorized' || e.code === 'validation')) throw loginGuard.fail();
        throw e;
      }
    }
    if (REAL_BACKEND) {
      // Real mode is email-only this phase — a username identifier fails the same generic
      // way as a wrong password, never revealing that usernames aren't supported yet.
      if (!isEmail(id)) throw loginGuard.fail();
      await attemptCustomAuthSignIn(id, password);
      loginGuard.syncLock(undefined); // success — clear any stale local lock mirror
      return finishRealSignIn(id);
    }
    await demoLatency(400, 800);
    const account = wellFormed ? accountStore.get().find(a => a.email === id || a.username === id) : undefined;
    // verifyPassword always does the full hashing work, so an unknown account takes as long as a wrong password.
    const ok = await verifyPassword(password, account?.passwordHash);
    if (!account || !ok) throw loginGuard.fail();
    return startSession({ id: account.id, name: account.name, email: account.email, username: account.username, provider: 'email', roles: ['traveller'], createdAt: account.createdAt });
  },
  async register(name: string, email: string, password: string, username?: string): Promise<User> {
    const clean = { name: cleanText(name, 80), email: normalizeEmail(email), username: username ? normalizeUsername(username) : undefined };
    if (clean.name.length < 2 || !isEmail(clean.email) || (clean.username && !isUsername(clean.username)) || !isAcceptablePassword(password)) throw new AuthError('invalid_input');
    if (DATA_SOURCE === 'http') {
      try {
        const user = await http<User>('/auth/register', { method: 'POST', json: { ...clean, password } });
        pushNotification({ kind: 'support', i18n: { title: 'notif.welcome.title', body: 'notif.welcome.body' }, href: '/account/preferences' });
        return startSession(user);
      } catch (e) {
        if (e instanceof AppError && (e.code === 'validation' || e.status === 409)) throw new AuthError('register_failed');
        throw e;
      }
    }
    if (REAL_BACKEND) {
      try {
        const { nextStep } = await cognitoSignUp({ username: clean.email, password, options: { userAttributes: { email: clean.email, name: clean.name } } });
        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') throw new AuthError('confirmation_required');
        // A pool configured to skip confirmation lands here directly — sign in immediately.
        // Mechanical fix, not a feature change: SRP is pool-wide disabled (amplify/backend.ts),
        // so this must go through the same custom-auth path real sign-in uses.
        await attemptCustomAuthSignIn(clean.email, password);
        const user = await finishRealSignIn(clean.email);
        pushNotification({ kind: 'support', i18n: { title: 'notif.welcome.title', body: 'notif.welcome.body' }, href: '/account/preferences' });
        return user;
      } catch (e) {
        if (e instanceof AuthError) throw e;
        throw new AuthError('register_failed');
      }
    }
    await demoLatency(500, 900);
    const passwordHash = await hashPassword(password);
    // Generic failure when the email or username is taken, so registration cannot be used to discover accounts.
    if (accountStore.get().some(a => a.email === clean.email || (clean.username && a.username === clean.username))) throw new AuthError('register_failed');
    const account: DemoAccount = { id: uid('u_'), name: clean.name, email: clean.email, username: clean.username, passwordHash, createdAt: nowIso() };
    accountStore.set(list => [...list, account]);
    pushNotification({ kind: 'support', i18n: { title: 'notif.welcome.title', body: 'notif.welcome.body' }, href: '/account/preferences' });
    return startSession({ id: account.id, name: account.name, email: account.email, username: account.username, provider: 'email', roles: ['traveller'], createdAt: account.createdAt });
  },
  async signInWithGoogle(): Promise<User> {
    if (REAL_BACKEND) {
      // Full browser redirect to accounts.google.com — this call doesn't resolve in the
      // normal sense (the tab navigates away before it could). The session gets populated
      // after the user lands back, via syncSessionFromRedirect() (src/main.tsx's Hub listener).
      await signInWithRedirect({ provider: 'Google' });
      return new Promise<User>(() => {}); // intentionally never resolves — see above
    }
    await demoLatency(600, 1000);
    const user: User = { id: uid('u_'), name: 'Google Traveller', email: 'traveller@gmail.example', provider: 'google', roles: ['traveller'], createdAt: nowIso() };
    sessionStore.set({ user });
    return user;
  },
  /** One-click preview of the full traveller experience, no sign-up required — a sales tool
   *  (let a prospective traveller, partner or board see the platform themselves rather than
   *  have to request a demo), so unlike signInPortal('admin', ...) this stays available
   *  regardless of REAL_BACKEND, alongside the real sign-up/sign-in form right next to it. */
  async signInDemoClient(): Promise<User> {
    await demoLatency(400, 800);
    const user: User = { id: 'u_demo_client', name: 'Demo Traveller', email: 'traveller@travelmatevr.example', provider: 'email', roles: ['traveller'], createdAt: nowIso() };
    sessionStore.set({ user });
    return user;
  },
  /**
   * Demo business accounts. Production: the user signs in normally and the backend returns the roles and
   * organisations they belong to; portal routes are also enforced server-side, never only in the UI.
   */
  async signInPortal(kind: 'partner' | 'board' | 'admin', adminRole: Role = 'super_admin'): Promise<User> {
    await demoLatency(400, 800);
    const user: User = kind === 'admin'
      ? { id: `u_demo_${adminRole}`, name: 'Demo Administrator', email: 'admin@travelmatevr.example', provider: 'email', roles: [adminRole], createdAt: nowIso() }
      : kind === 'partner'
      ? { id: 'u_demo_partner', name: 'Asha Mollel', email: 'asha@kijani.example', provider: 'email', roles: ['partner'], orgId: 'kijani-camps', createdAt: nowIso() }
      : { id: 'u_demo_board', name: 'Demo Board Editor', email: 'editor@demo-board.example', provider: 'email', roles: ['tourism_board'], orgId: 'demo-board-tz', createdAt: nowIso() };
    sessionStore.set({ user });
    return user;
  },
  /** Completes registration after the "enter the code we emailed you" step (real mode only). */
  async confirmRegistration(email: string, password: string, code: string): Promise<User> {
    await cognitoConfirmSignUp({ username: email, confirmationCode: code });
    // Mechanical fix, not a feature change: SRP is pool-wide disabled (amplify/backend.ts),
    // so this must go through the same custom-auth path real sign-in uses.
    await attemptCustomAuthSignIn(email, password);
    const user = await finishRealSignIn(email);
    pushNotification({ kind: 'support', i18n: { title: 'notif.welcome.title', body: 'notif.welcome.body' }, href: '/account/preferences' });
    return user;
  },
  async signOut() {
    if (REAL_BACKEND) { try { await cognitoSignOut(); } catch { /* best-effort: clear the local session regardless */ } }
    sessionStore.set({ user: null });
  },
  /** Self-service account deletion — Cognito's own deleteUser() API, which only ever
   *  deletes the CURRENTLY AUTHENTICATED user's own account (no admin privilege needed or
   *  usable here), separate from scripts/delete-user-account.ts's admin-run runbook for
   *  cases where the user can't sign in themselves to do this. A demo session (its id
   *  always starts with 'u_demo_') was never a real Cognito user, so there's nothing on
   *  the backend to delete — just the local session and device data. Also clears every
   *  tm.*-prefixed localStorage key, same as the account page's existing "erase my data"
   *  action, since deleting the account should leave nothing behind either way. */
  async deleteAccount() {
    const isDemo = sessionStore.get().user?.id.startsWith('u_demo_');
    if (REAL_BACKEND && !isDemo) {
      try { await cognitoDeleteUser(); } catch { /* best-effort: clear the local session regardless */ }
    }
    Object.keys(localStorage).filter(k => k.startsWith('tm.') && k !== 'tm.lang' && k !== 'tm.theme').forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    sessionStore.set({ user: null });
  },
  update(patch: Partial<Pick<User, 'name' | 'email'>>) {
    const clean: Partial<Pick<User, 'name' | 'email'>> = {};
    if (patch.name !== undefined) { const n = cleanText(patch.name, 80); if (n.length >= 2) clean.name = n; }
    if (patch.email !== undefined && isEmail(patch.email)) clean.email = normalizeEmail(patch.email);
    sessionStore.set(s => (s.user ? { user: { ...s.user, ...clean } } : s));
  }
};
export const useSession = () => useStore(sessionStore, s => s.user);

// ---------------- Traveller profile (personalisation) ----------------
export const DEFAULT_PROFILE: TravellerProfile = {
  interests: [], adventure: 3, luxury: 3, adults: 2, children: 0, accessibility: [], pace: 'balanced',
  sustainabilityFirst: false, preferredDestinations: [], consentPersonalisation: true
};
export const profileStore = createStore<TravellerProfile & { setAt?: string }>('tm.profile', () => ({ ...DEFAULT_PROFILE }));
export const useProfile = () => useStore(profileStore);
export const hasProfile = (p: TravellerProfile & { setAt?: string }) => !!p.setAt;

// ---------------- Notifications ----------------
const seedNotifications = (): AppNotification[] => [
  { id: 'n-welcome', kind: 'ai', createdAt: '2026-10-01T08:00:00Z', read: false, href: '/ai', title: { en: 'Plan a trip in one sentence', fr: 'Planifiez un voyage en une phrase', de: 'Eine Reise in einem Satz planen', zh: '一句话规划旅程', it: 'Pianifica un viaggio in una frase' }, body: { en: 'Tell AI TravelMate your dates, budget and interests to get a draft itinerary.', fr: 'Indiquez vos dates, budget et envies à l’IA TravelMate pour obtenir un itinéraire.', de: 'Nennen Sie KI TravelMate Daten, Budget und Interessen und erhalten Sie einen Reiseplan.', zh: '告诉 AI 旅伴您的日期、预算和兴趣，获取行程草案。', it: 'Indica all’IA TravelMate date, budget e interessi per ricevere un itinerario.' } },
  { id: 'n-season', kind: 'alert', createdAt: '2026-09-28T09:00:00Z', read: false, href: '/destinations/serengeti-national-park', title: { en: 'Short rains begin in November', fr: 'Les petites pluies commencent en novembre', de: 'Die kleine Regenzeit beginnt im November', zh: '短雨季将于十一月开始', it: 'Le piccole piogge iniziano a novembre' }, body: { en: 'Northern Tanzania gets afternoon showers from November. Game viewing stays good and prices drop.', fr: 'Le nord de la Tanzanie connaît des averses l’après-midi dès novembre. L’observation reste bonne et les prix baissent.', de: 'Ab November gibt es im Norden Tansanias Nachmittagsschauer. Die Tierbeobachtung bleibt gut, die Preise sinken.', zh: '坦桑尼亚北部从十一月起午后多阵雨，观赏动物依然很好，价格也会下降。', it: 'Da novembre nel nord della Tanzania piove nel pomeriggio. L’osservazione resta buona e i prezzi scendono.' } }
];
export const notificationStore = createStore<AppNotification[]>('tm.notifications', seedNotifications);
export const useNotifications = () => useStore(notificationStore);

export const notificationPrefsStore = createStore<Record<AppNotification['kind'], Channel[]>>('tm.notificationPrefs', () => ({
  booking: ['inapp', 'email', 'whatsapp'], reminder: ['inapp', 'push'], itinerary: ['inapp'], partner: ['inapp', 'email'],
  promotion: [], price: ['inapp'], alert: ['inapp', 'push'], ai: ['inapp'], support: ['inapp', 'email']
}));

export function pushNotification(n: { kind: AppNotification['kind']; title?: LocalizedText; body?: LocalizedText; i18n?: AppNotification['i18n']; href?: string }) {
  notificationStore.set(list => [{ id: uid('n_'), createdAt: nowIso(), read: false, ...n }, ...list].slice(0, 100));
}

// ---------------- Reviews written by the traveller ----------------
export const myReviewsStore = createStore<Review[]>('tm.reviews', () => []);
export const useMyReviews = () => useStore(myReviewsStore);

// ---------------- Support tickets ----------------
export const ticketStore = createStore<SupportTicket[]>('tm.tickets', () => []);
export const useTickets = () => useStore(ticketStore);
export const support = {
  async open(t: Pick<SupportTicket, 'subject' | 'topic' | 'bookingId'> & { message: string }): Promise<SupportTicket> {
    await demoLatency(400, 700);
    const ticket: SupportTicket = {
      id: `TCK-${Math.floor(100000 + Math.random() * 900000)}`, subject: t.subject, topic: t.topic, bookingId: t.bookingId, status: 'open', createdAt: nowIso(),
      messages: [{ from: 'me', text: t.message, at: nowIso() }, { from: 'support', text: 'ticket.autoAck', at: nowIso() }]
    };
    ticketStore.set(list => [ticket, ...list]);
    pushNotification({ kind: 'support', i18n: { title: 'notif.ticket.title', body: 'notif.ticket.body', params: { id: ticket.id, subject: ticket.subject } }, href: `/help/tickets/${ticket.id}` });
    return ticket;
  },
  reply(id: string, text: string) {
    ticketStore.set(list => list.map(t => (t.id === id ? { ...t, status: 'waiting', messages: [...t.messages, { from: 'me', text, at: nowIso() }] } : t)));
  },
  close(id: string) { ticketStore.set(list => list.map(t => (t.id === id ? { ...t, status: 'closed' } : t))); }
};

// ---------------- Travel documents ----------------
// Metadata only (type, label, expiry, last characters of a number). Files picked in demo mode stay in memory
// for this session and are never written to browser storage. Production: encrypted object storage, signed URLs,
// access control and audit logging on the documents service.
export const documentStore = createStore<TravelDocument[]>('tm.documents', () => []);
export const useDocuments = () => useStore(documentStore);
const sessionFiles = new Map<string, File>();
export const documents = {
  add(doc: Omit<TravelDocument, 'id' | 'addedAt'>, file?: File) {
    const id = uid('doc_');
    if (file) sessionFiles.set(id, file);
    documentStore.set(list => [{ ...doc, id, addedAt: nowIso(), fileName: file?.name }, ...list]);
  },
  remove(id: string) { sessionFiles.delete(id); documentStore.set(list => list.filter(d => d.id !== id)); },
  fileFor(id: string) { return sessionFiles.get(id); }
};

// ---------------- Messages with partners ----------------
export const threadStore = createStore<MessageThread[]>('tm.threads', () => []);
export const useThreads = () => useStore(threadStore);
export const messages = {
  ensure(partnerId: string, bookingId?: string): string {
    const existing = threadStore.get().find(t => t.partnerId === partnerId && (!bookingId || t.bookingId === bookingId));
    if (existing) return existing.id;
    const id = uid('th_');
    threadStore.set(list => [{ id, partnerId, bookingId, updatedAt: nowIso(), messages: [{ from: 'system', text: 'thread.started', at: nowIso() }] }, ...list]);
    return id;
  },
  send(threadId: string, text: string) {
    threadStore.set(list => list.map(t => (t.id === threadId ? { ...t, updatedAt: nowIso(), messages: [...t.messages, { from: 'me', text, at: nowIso() }] } : t)));
    // Demo: an automatic acknowledgement stands in for the partner's reply.
    setTimeout(() => threadStore.set(list => list.map(t => (t.id === threadId ? { ...t, updatedAt: nowIso(), messages: [...t.messages, { from: 'system', text: 'thread.autoAck', at: nowIso() }] } : t))), 1500);
  }
};

// ---------------- Roles ----------------
export const PARTNER_ROLES: Role[] = ['partner', 'partner_staff'];
export const BOARD_ROLES: Role[] = ['tourism_board', 'government_dmo', 'conservation_org'];
export const hasRole = (user: User | null | undefined, roles: Role[]) => !!user && user.roles.some(r => roles.includes(r));
