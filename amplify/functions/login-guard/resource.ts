import { defineFunction } from '@aws-amplify/backend';

// One Lambda, reused across all four Cognito custom-auth-flow trigger slots (see
// amplify/auth/resource.ts) — Amplify resolves a ConstructFactory once per backend scope, so
// referencing this export four times still provisions a single function.
export const loginGuardFn = defineFunction({
  name: 'login-guard',
  entry: './handler.ts',
  timeoutSeconds: 10 // AdminInitiateAuth round-trip + one Data read/write; verify against real latency in the sandbox
});
