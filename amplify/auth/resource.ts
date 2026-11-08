import { defineAuth, secret } from '@aws-amplify/backend';
import { loginGuardFn } from '../functions/login-guard/resource';
import { blockDisposableEmailFn } from '../functions/block-disposable-email/resource';

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
        scopes: ['profile', 'email', 'openid'],
        // Without this, Cognito's default Google mapping leaves the 'name' standard attribute
        // (and so the ID token's `name` claim) unmapped - confirmed live: a real Google
        // sign-in's ID token had `email` populated but `name` was simply undefined, which is
        // why the UI fell back to "Welcome Google" with no initials instead of a real name.
        // 'email' needed no explicit mapping here because Cognito maps it by default; 'name'
        // (CDK's `fullname`) does not have that default.
        attributeMapping: { fullname: 'name' }
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
      // Missing 'COGNITO_ADMIN' (-> aws.cognito.signin.user.admin) is why a federated Google
      // session's access token worked for the OAuth round-trip itself but then failed with
      // NotAuthorizedException: Access Token does not have required scopes on the very next
      // call (fetchUserAttributes() -> Cognito's GetUser) - confirmed live. Email/password
      // sign-in never hit this because it doesn't go through this OAuth scopes list at all.
      scopes: ['EMAIL', 'OPENID', 'PROFILE', 'COGNITO_ADMIN']
    }
  },
  groups: ['admin'],
  // OPTIONAL, not ON: travellers are unaffected unless/until they enroll. Enforcement for the
  // admin group specifically is an app-layer rule (src/components/portal/PortalLayout.tsx
  // blocks the dashboard until an admin-group member enrolls), not a pool-wide requirement -
  // Cognito has no native per-group MFA requirement. Once a user's TOTP preference is set to
  // PREFERRED (via updateMFAPreference, during enrollment), amplify/functions/login-guard/
  // picks this up automatically: its internal AdminInitiateAuth call starts returning a
  // SOFTWARE_TOKEN_MFA challenge instead of tokens for that user, which the Lambda now handles
  // as a second custom-auth round (see handler.ts) - non-enrolled users see no change at all.
  multifactor: { mode: 'OPTIONAL', totp: true },
  triggers: {
    preSignUp: blockDisposableEmailFn,
    preAuthentication: loginGuardFn,
    defineAuthChallenge: loginGuardFn,
    createAuthChallenge: loginGuardFn,
    verifyAuthChallengeResponse: loginGuardFn
  }
});
