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
 * every redirect URL anyway) so it's a plain string here.
 *
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
// TEMPORARILY DISABLED: externalProviders.google, to isolate a CloudFormation circular
// dependency that appeared only once both this AND the triggers below were configured
// together (confirmed: our own added resources — the lockout Lambda's IAM policy, the WAF
// association — were successfully extracted from the cycle already; what's left is a cycle
// purely among auth-construct's own auto-generated resources: UserPool, its 4 trigger
// permissions, UserPoolDomain, GoogleIdP, IdentityPool, IAM roles). Re-enabling this is
// tracked as a follow-up once isolated from the trigger wiring — see
// docs/security/pending-implementation.md.
export const auth = defineAuth({
  loginWith: {
    email: true
  },
  groups: ['admin'],
  triggers: {
    preAuthentication: loginGuardFn,
    defineAuthChallenge: loginGuardFn,
    createAuthChallenge: loginGuardFn,
    verifyAuthChallengeResponse: loginGuardFn
  }
});
