import { defineFunction } from '@aws-amplify/backend';

export const adminListUsersFn = defineFunction({
  name: 'admin-list-users',
  entry: './handler.ts',
  timeoutSeconds: 20 // loops ListUsers + ListUsersInGroup across pages
});
