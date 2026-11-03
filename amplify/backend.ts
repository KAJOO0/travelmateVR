import { defineBackend } from '@aws-amplify/backend';
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
backend.loginGuardFn.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);
backend.loginGuardFn.addEnvironment('USER_POOL_CLIENT_ID', backend.auth.resources.userPoolClient.userPoolClientId);
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
