import { defineBackend } from '@aws-amplify/backend';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { loginGuardFn } from './functions/login-guard/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  loginGuardFn
});

// Match src/lib/security.ts's isAcceptablePassword exactly (length 8–128, no composition
// rules) so client-side and Cognito-side password validation never disagree.
const { cfnUserPool, cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: false,
    requireUppercase: false,
    requireNumbers: false,
    requireSymbols: false
  }
};

// ---------------- Progressive login lockout (amplify/functions/login-guard/) ----------------

// Airtight lockout requires that the browser's app client cannot authenticate any way except
// through the CUSTOM_AUTH flow login-guard's triggers gate. ALLOW_USER_SRP_AUTH,
// ALLOW_USER_PASSWORD_AUTH, and the newer unified ALLOW_USER_AUTH flow are intentionally
// absent — any of them would let a client reach Cognito's password check without ever going
// through VerifyAuthChallengeResponse. ALLOW_ADMIN_USER_PASSWORD_AUTH is for login-guardFn
// itself (via AdminInitiateAuth, IAM-gated, never reachable from a browser).
cfnUserPoolClient.explicitAuthFlows = ['ALLOW_CUSTOM_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_ADMIN_USER_PASSWORD_AUTH'];
// A nonexistent email takes the identical CUSTOM_CHALLENGE path as a real one — no shape or
// timing difference an attacker could use to enumerate accounts.
cfnUserPoolClient.preventUserExistenceErrors = 'ENABLED';

// These live directly in the root backend stack (backend.stack) — not nested inside auth's own
// stack, and not in a second new nested stack either. Both of those were tried and both hit
// CloudformationStackCircularDependencyError: nesting inside auth entangled these resources
// with the Cognito trigger wiring; a separate new nested stack (via backend.createStack(...))
// still got flagged in a circular set alongside auth AND data, even though neither references
// these resources at all — CloudFormation's "circular dependency between nested stacks" check
// appears to reason about nested-stack ordering more broadly than just direct references. The
// root stack isn't a nested stack, so resources placed here don't participate in that check;
// this is a plain nested-stack -> root-stack output reference, the ordinary direction.
const loginAttemptsTable = new dynamodb.Table(backend.stack, 'LoginAttempts', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }, // id = normalized email
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
});
loginAttemptsTable.grantReadWriteData(backend.loginGuardFn.resources.lambda);

backend.loginGuardFn.addEnvironment('LOGIN_ATTEMPTS_TABLE', loginAttemptsTable.tableName);
// Deliberately NOT adding USER_POOL_ID/USER_POOL_CLIENT_ID as environment variables here: the
// Lambda's own Environment property referencing the user pool/client, combined with the user
// pool's LambdaConfig referencing this Lambda's ARN (since it's wired as a trigger below), is a
// direct 2-resource CloudFormation cycle — confirmed as the actual root cause of the circular
// dependency across every earlier attempt at fixing this via resource placement (Google
// federation was never the cause; removing it changed nothing). The handler reads both values
// off the trigger event instead (every Cognito trigger event carries userPoolId and
// callerContext.clientId) — see amplify/functions/login-guard/handler.ts.
//
// A wildcard-within-account-region ARN, not the exact pool's token-referenced ARN — referencing
// the pool resource's own .userPoolArn here (even from the Lambda's own stack scope) re-creates
// the same circular-dependency class of issue, since the Lambda is itself a trigger ON that
// pool. This stays scoped to this account/region/service either way; there's only one user
// pool in this app, so the practical difference is nil, and it breaks the cycle.
backend.loginGuardFn.resources.lambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['cognito-idp:AdminInitiateAuth'],
  resources: [`arn:aws:cognito-idp:${backend.stack.region}:${backend.stack.account}:userpool/*`]
}));

// IP-based rate limiting: enforced at the edge by WAF, in front of Cognito's own
// InitiateAuth/RespondToAuthChallenge APIs — not inside a Lambda trigger, which never
// receives the caller's IP (confirmed: Cognito's trigger events expose userName/
// userAttributes/challengeAnswer, not sourceIp). WAFv2-on-Cognito-User-Pool association is
// an AWS-documented supported resource type for exactly this brute-force-protection purpose.
// Cost note: this is a real, ongoing AWS cost (~$5/month base + ~$1/rule + per-request), unlike
// everything else built so far which sits in the free tier at this traffic level.
const webAcl = new wafv2.CfnWebACL(backend.stack, 'LoginGuardWaf', {
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'LoginGuardWaf' },
  rules: [
    {
      name: 'RateLimitPerIp',
      priority: 0,
      statement: { rateBasedStatement: { limit: 100, aggregateKeyType: 'IP' } }, // per 5-minute window — placeholder, tune after observing real traffic (see docs/security/pending-implementation.md)
      action: { block: {} },
      visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'RateLimitPerIp' }
    }
  ]
});
// This DOES need the exact pool ARN (WAF associations can't target a wildcard) — placed in the
// root stack, this is a one-directional reference to auth's nested-stack output, not part of
// auth's own internal template, so it doesn't re-introduce the cycle.
new wafv2.CfnWebACLAssociation(backend.stack, 'LoginGuardWafAssoc', {
  resourceArn: backend.auth.resources.userPool.userPoolArn,
  webAclArn: webAcl.attrArn
});

// ---------------- AppSync rate limiting (pre-launch audit, Area 5) ----------------

// The catalogue's GraphQL API had zero rate limiting of any kind — AWS's blanket
// account-level service quotas exist for scaling headroom, not abuse prevention, so any
// client could hit it at whatever rate it could sustain. A dedicated WebACL, not the
// LoginGuardWaf above: that one's 100-req/5min limit is tuned tight for login attempts
// specifically, and WAF rate-based rules count per-IP across every resource one WebACL is
// associated with — sharing it would mean heavy (legitimate) catalogue browsing from one
// IP could exhaust the same budget meant to stop password-guessing from that IP, or the
// reverse. Separate WebACL, independently tunable, same reasoning otherwise.
const dataApiWebAcl = new wafv2.CfnWebACL(backend.stack, 'DataApiWaf', {
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'DataApiWaf' },
  rules: [
    {
      name: 'RateLimitPerIp',
      priority: 0,
      // Higher than the login limit on purpose — normal catalogue browsing fans out into
      // many GraphQL requests per page (nested model reads). Placeholder, tune after
      // observing real traffic, same as LoginGuardWaf's rule.
      statement: { rateBasedStatement: { limit: 500, aggregateKeyType: 'IP' } },
      action: { block: {} },
      visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'DataApiRateLimitPerIp' }
    }
  ]
});
new wafv2.CfnWebACLAssociation(backend.stack, 'DataApiWafAssoc', {
  resourceArn: backend.data.resources.graphqlApi.arn,
  webAclArn: dataApiWebAcl.attrArn
});

// ---------------- Custom Hosted UI domain (auth.travelmatevr.com) ----------------

// Flip to true only once BOTH of these are true — deploying while either is false fails the
// build (ACM rejects an unissued cert on a Cognito domain) and would take down the
// currently-working Google sign-in in the process:
//   1. AUTH_DOMAIN_CERT_ARN's certificate status is ISSUED (currently PENDING_VALIDATION —
//      requires the DNS CNAME below to be added at whichever provider ends up hosting
//      travelmatevr.com's DNS).
//   2. That same DNS provider has auth.travelmatevr.com CNAME'd to this user pool's Hosted UI
//      CloudFront target (get the exact target from the deploy's own output after enabling,
//      same two-step process as the travelmatevr.com Amplify domain association).
//
// Validation CNAME (add this first, independent of the above — safe, doesn't affect anything
// live): _7f80b09ad32b8d9d3812296386f985d0.auth.travelmatevr.com ->
// _d950fb3babd052845d3e0f6b76e86f8b.wzccmgtwzk.acm-validations.aws
const ENABLE_CUSTOM_AUTH_DOMAIN = true; // cert ISSUED 2026-11-04 — confirmed via ACM
const AUTH_DOMAIN_CERT_ARN = 'arn:aws:acm:us-east-1:946769780520:certificate/d064de2e-45e2-40bd-9afb-9a4c16f3fe69';

if (ENABLE_CUSTOM_AUTH_DOMAIN) {
  // defineAuth exposes no way to configure the Hosted UI domain at all (confirmed earlier:
  // `domainPrefix` is explicitly omitted from its type — the wrapper always generates one
  // itself once externalProviders is set). Replacing it with a custom domain therefore means
  // reaching the UserPoolDomain CfnResource the construct creates internally, which isn't
  // exposed via backend.auth.resources.cfnResources either. The lookup below isn't a blind
  // guess: it mirrors the exact lookup auth-construct's OWN code uses internally to produce
  // the oauthCognitoDomain output (@aws-amplify/auth-construct/lib/construct.js, around line
  // 974: `this.resources.userPool.node.tryFindChild(`${this.name}UserPoolDomain`)`), where
  // `this.name` is '' because we never set defineAuth's `name` option — so the construct ID
  // is exactly 'UserPoolDomain', a direct child of the userPool L2 construct.
  const userPoolDomain = backend.auth.resources.userPool.node.tryFindChild('UserPoolDomain');
  if (!(userPoolDomain instanceof cognito.UserPoolDomain)) {
    throw new Error('Expected to find the auth construct\'s UserPoolDomain child — its internal naming must have changed.');
  }
  // CDK's standard escape hatch: the L2's own `resource` field is private, but its single L1
  // child is reachable as the construct's default child (CfnUserPoolDomain, created with the
  // fixed id 'Resource' — aws-cdk-lib/aws-cognito/lib/user-pool-domain.js).
  const cfnUserPoolDomain = userPoolDomain.node.defaultChild as cognito.CfnUserPoolDomain;
  cfnUserPoolDomain.domain = 'auth.travelmatevr.com';
  cfnUserPoolDomain.customDomainConfig = { certificateArn: AUTH_DOMAIN_CERT_ARN };
}
