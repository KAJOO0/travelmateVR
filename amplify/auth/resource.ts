import { defineAuth, secret } from '@aws-amplify/backend';
import { loginGuardFn } from '../functions/login-guard/resource';

/**
 * Real traveller accounts (email + password). Username sign-in is not supported here —
 * the demo mode's username-or-email sign-in stays local-only for now; real-mode sign-in
 * is email-only (see src/services/account.ts).
 *
 * The 'admin' group backs Data's write-authorization rules in amplify/data/resource.ts.
 * Nothing assigns users to it yet this phase — it exists so the schema's write rules are
 * correct from day one instead of temporarily wide open.
 *
 * Sign-in runs through a CUSTOM_AUTH flow (all four triggers below), not the default SRP
 * flow, so that login-guard's VerifyAuthChallengeResponse trigger is the sole judge of
 * password correctness — the only way progressive lockout (15min/30min/24h escalation,
 * amplify/functions/login-guard/) can be enforced server-side and not bypassed by a direct
 * SDK call. See amplify/backend.ts for the CDK override that locks the user pool client to
 * this flow only (SRP/USER_PASSWORD_AUTH explicitly excluded).
 *
 * Google sign-in: Cognito's built-in federation (not hand-rolled OIDC token verification —
 * Cognito does the issuer/audience/expiry checks and issues the app's own session the same
 * way email sign-in does). The client secret is a sandbox/deployed-environment secret (set
 * via `npx ampx sandbox secret set GOOGLE_CLIENT_SECRET`, or the Console's Secrets page for
 * production), never committed in plaintext. The client ID isn't sensitive (it's embedded in
 * every redirect URL anyway) but Amplify's config type still requires it as a BackendSecret.
 *
 * Isolation test confirmed the earlier circular-dependency failures were never caused by
 * Google federation (job #16 failed identically with Google fully removed) — the real cause
 * was loginGuardFn's environment variables referencing the user pool/client (fixed in
 * amplify/backend.ts + handler.ts instead).
 *
 * `scopes` below (on `externalProviders` itself) sets the user pool APP CLIENT's
 * AllowedOAuthScopes — confirmed via deploy this was already correct. It does NOT control
 * what Cognito asks Google for. That's `google.scopes`, a separate property this type
 * inherits from CDK's `UserPoolIdentityProviderGoogleProps`, defaulting to `['profile']`
 * alone if omitted — which is exactly what happened here: Google never granted an email,
 * so Cognito's attributeMapping (email -> email) had nothing to map, federation silently
 * failed to produce a usable account, and the app's Hub listener (only handling
 * 'signInWithRedirect', not 'signInWithRedirect_failure') never surfaced an error. Must be
 * explicit.
 *
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['profile', 'email', 'openid']
      },
      // domainPrefix isn't configurable at this level (confirmed: omitted from the factory's
      // own type) — Amplify auto-generates the Cognito Hosted UI domain, now overridden onto
      // auth.travelmatevr.com (see amplify/backend.ts). www.travelmatevr.com and the apex are
      // the real cut-over site's URLs — confirmed missing live via a direct /oauth2/authorize
      // test, which Cognito rejected with redirect_mismatch because only the old
      // amplifyapp.com URL was registered here. The old URLs stay too: amplifyapp.com remains
      // reachable directly, and localhost is for local dev.
      callbackUrls: [
        'https://www.travelmatevr.com/',
        'https://travelmatevr.com/',
        'https://main.d1tgxuxxng291h.amplifyapp.com/',
        'http://localhost:5173/'
      ],
      logoutUrls: [
        'https://www.travelmatevr.com/',
        'https://travelmatevr.com/',
        'https://main.d1tgxuxxng291h.amplifyapp.com/',
        'http://localhost:5173/'
      ],
      scopes: ['EMAIL', 'OPENID', 'PROFILE']
    }
  },
  groups: ['admin'],
  triggers: {
    preAuthentication: loginGuardFn,
    defineAuthChallenge: loginGuardFn,
    createAuthChallenge: loginGuardFn,
    verifyAuthChallengeResponse: loginGuardFn
  }
});
