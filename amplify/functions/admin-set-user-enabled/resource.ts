import { defineFunction } from '@aws-amplify/backend';

export const adminSetUserEnabledFn = defineFunction({
  name: 'admin-set-user-enabled',
  entry: './handler.ts'
});
