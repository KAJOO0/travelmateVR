import { defineFunction } from '@aws-amplify/backend';

// One Lambda, reused across all four admin-user AppSync operations (see
// amplify/data/resource.ts) by branching on event.info.fieldName - same pattern as
// login-guard being reused across its four Cognito triggers.
export const adminUsersFn = defineFunction({
  name: 'admin-users',
  entry: './handler.ts',
  timeoutSeconds: 20 // adminListUsers loops ListUsers + ListUsersInGroup across pages
});
