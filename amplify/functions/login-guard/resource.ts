import { defineFunction } from '@aws-amplify/backend';

// One Lambda, reused across all four Cognito custom-auth-flow trigger slots (see
// amplify/auth/resource.ts) — Amplify resolves a ConstructFactory once per backend scope, so
// referencing this export four times still provisions a single function.
export const loginGuardFn = defineFunction({
  name: 'login-guard',
  entry: './handler.ts',
  timeoutSeconds: 10, // AdminInitiateAuth round-trip + one DynamoDB read/write; verify against real latency once deployed
  // Must live in the same CloudFormation stack as auth, not its own nested stack: auth's
  // triggers reference this function (auth -> function) while this function's IAM policy
  // references the user pool ARN (function -> auth) — a cross-stack circular dependency
  // CloudFormation rejects. Within one stack, that's just normal same-template resource
  // ordering, which CloudFormation resolves fine.
  resourceGroupName: 'auth',
  // Default CloudWatch log retention is "never expire" — this function's invocation events
  // carry real email addresses (event.userName) once real password sign-ins happen, so
  // indefinite retention is an unnecessary, unbounded copy of that data (pre-launch audit,
  // Area 1). 3 months balances that against still having useful history to debug with.
  logging: { retention: '3 months' }
});
