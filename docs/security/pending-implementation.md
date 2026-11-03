# Pending security work — implementation directives

Concrete enough to execute directly when you're ready, without re-deriving the approach.
Each needs something only you can provide (a new external account, or a go-ahead on new
infrastructure) — that's why these weren't done automatically.

## A. Progressive server-side login lockout (directive §10)

**Why client-side isn't enough:** today's `loginGuard` (`src/services/account.ts`) tracks
failures in the browser's `localStorage` — trivially bypassed by clearing storage or using a
different device. Real enforcement needs server-side state.

**The right architecture, using what's already in place:**
1. Add a `LoginAttempt` model to `amplify/data/resource.ts` (or a dedicated DynamoDB table via
   a new `amplify/storage`-style resource) keyed by `identifier` (email/username) with fields:
   `failureCount`, `lockedUntil`, `escalationStage` (0/1/2), `lastAttemptAt`, plus a secondary
   index on source IP for the IP-based limiting the directive also asks for.
2. Add a **Cognito PreAuthentication Lambda trigger** (`amplify/auth/resource.ts` supports
   `triggers: { preAuthentication: defineFunction(...) }`). This Lambda runs server-side,
   before Cognito evaluates the password, and:
   - Reads the attempt record for this identifier.
   - If `lockedUntil` is in the future, throws (Cognito surfaces this as a rejected sign-in,
     without revealing *why* to the client — map it to the same generic `AuthError` the app
     already uses).
3. Add a **PostAuthentication trigger** to reset the counter on success, and a
   **PostConfirmation**/custom logic path to increment `failureCount` and compute the
   15/30/1440-minute escalation on failure (Cognito's triggers don't fire on failed
   auth the same way — the increment logic more practically belongs in `account.ts`'s
   `auth.signIn` real-mode branch, calling a new AppSync mutation that does the increment
   **server-side** via a resolver, not by trusting the client to report its own failures).
4. Reuse the exact escalation math already written in `loginGuard` (`src/services/account.ts`)
   — the 15/30/1440-minute cumulative logic doesn't need to be redesigned, just moved
   server-side.

**Cost/complexity:** one new Lambda (free tier covers this easily at current traffic), one new
DynamoDB table (pennies). Moderate implementation effort — a few hours of focused work, not
major infrastructure.

## B. Google Sign-In (directive §9)

**Use Cognito's built-in Google federation — don't hand-build custom OIDC token verification.**
Cognito User Pools support Google as a first-class federated identity provider, which means
Amplify Auth's existing `signInWithRedirect({ provider: 'Google' })` does the whole OAuth
dance, token verification, and session creation for you — far less work than implementing
Google Identity Services + manual token verification from scratch, and it's what the directive's
own technical requirements (verify issuer/audience/expiry, CSRF protection, HTTPS) actually
describe Cognito doing out of the box.

**What you need to do (external, only you can do this):**
1. Go to **https://console.cloud.google.com** → create a project (or use an existing one for
   Mates Technologies Limited).
2. **APIs & Services → OAuth consent screen** — configure it (app name, support email, scopes:
   `email`, `profile`, `openid`).
3. **APIs & Services → Credentials → Create OAuth client ID** → type **Web application**.
4. Add an **Authorized redirect URI**: Cognito will give you the exact one once the User Pool
   domain exists — it's `https://<your-cognito-domain>/oauth2/idpresponse`. (I can give you the
   exact value once we set up the Cognito side.)
5. Copy the **Client ID** and **Client Secret** — bring them back, same as the AWS access key
   earlier: paste them here, I write them straight into the backend config, never echoed back.

**What I'd then do (once you have the above):**
1. Add a Cognito domain + Google identity provider to `amplify/auth/resource.ts`
   (`externalProviders: { google: { clientId, clientSecret, scopes: [...] } }`).
2. Wire `auth.signInWithGoogle()` in `src/services/account.ts` (currently a demo stub) to call
   `signInWithRedirect({ provider: 'Google' })` in real mode, same pattern as email sign-in.
3. **Account linking:** Cognito's default behavior links by verified email automatically if you
   enable it — the directive explicitly says *not* to auto-link on unverified email alone, so
   this needs the "verified email as the linking key" setting specifically, not the loosest
   option. Flag this explicitly during setup so it's configured correctly, not just left on a
   default.

## C. MFA for admins (directive §12G)

**Blocked on the admin backend existing for real** — right now `/admin` runs on mock/demo
auth (`auth.signInPortal`), not real Cognito accounts, so there's no real admin account to
attach MFA to yet. Once admin accounts are real (a separate, larger phase — wiring the admin
Command Center to the real backend, not a security task on its own):

1. Cognito supports TOTP MFA natively — `amplify/auth/resource.ts`'s `defineAuth` accepts
   `multifactor: { mode: 'OPTIONAL' | 'REQUIRED', totp: true }`.
2. Scope it to admin roles specifically (not all travellers) via a Cognito group-based policy
   or a post-login check that redirects ungated admin accounts to an MFA-setup flow.
3. Needs a small UI addition: a QR-code enrollment screen (the project already has
   `src/components/ui/QrCode.tsx` available to reuse for this).

Not started — correctly sequenced behind the admin backend work, not forgotten.
