# Pending security work — implementation directives

Concrete enough to execute directly when you're ready, without re-deriving the approach.
Each needs something only you can provide (a new external account, or a go-ahead on new
infrastructure) — that's why these weren't done automatically.

## A. Progressive server-side login lockout (directive §10) — DONE

**Status: Already implemented, this doc entry was stale.** Confirmed live during the
2026-11-08 audit (see `audit-2026-11.md`): `amplify/functions/login-guard/` wires all four
CUSTOM_AUTH Cognito triggers (`PreAuthentication`, `DefineAuthChallenge`,
`CreateAuthChallenge`, `VerifyAuthChallengeResponse`) to one Lambda, backed by a dedicated
DynamoDB table (`amplify/functions/login-guard/escalation.ts`) implementing the 15/30/1440-
minute escalation. The app client's `ExplicitAuthFlows` excludes `USER_PASSWORD_AUTH`/
`USER_SRP_AUTH`, so every real sign-in is forced through this custom flow — it can't be
bypassed by calling a different Cognito auth API from the browser. No further action needed
here; left in this file only as a record that it's resolved, not pending.

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

## C. MFA for admins (directive §12G) — no longer blocked, now actionable

**Correction (2026-11-08 audit): the premise above was stale.** `/admin` is NOT mock-gated —
confirmed live: `src/services/account.ts`'s `finishRealSignIn()` reads the real ID token's
`cognito:groups` claim and maps `admin` membership to `roles: ['super_admin']`;
`PortalLayout.tsx`/`PortalGate.tsx` gate the actual `/admin` route tree on that real role, and
`PortalGate.tsx` explicitly disables the mock one-click admin demo button whenever
`REAL_BACKEND` is true. A real admin (`gerald@matestechnologies.com`) already exists in the
Cognito `admin` group. `GetUserPoolMfaConfig` shows MFA is entirely unconfigured on the pool
(`MfaConfiguration: OFF`, no SMS/TOTP block at all) — nobody can enroll even voluntarily today.

**Status: Done (2026-11-08).** TOTP MFA is enabled pool-wide as `OPTIONAL`
(`amplify/auth/resource.ts`), and the admin group specifically is blocked from `/admin`
(`src/components/portal/PortalLayout.tsx` + `AdminMfaSetup.tsx`) until they enroll. Server-side
enforcement is in `amplify/functions/login-guard/handler.ts` (a second custom-auth round for
enrolled users). Live-tested end-to-end — see `audit-2026-11-08.md` finding #3. Optional/
mandatory for non-admin travellers remains an open product decision, not implemented.
