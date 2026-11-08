import { defineFunction } from '@aws-amplify/backend';

// Wired as the user pool's PreSignUp trigger (amplify/auth/resource.ts) — must live in auth's
// stack for the same reason login-guard does (see login-guard/resource.ts): the trigger
// reference would otherwise form a cross-stack cycle with the user pool.
export const blockDisposableEmailFn = defineFunction({
  name: 'block-disposable-email',
  entry: './handler.ts',
  resourceGroupName: 'auth'
});
