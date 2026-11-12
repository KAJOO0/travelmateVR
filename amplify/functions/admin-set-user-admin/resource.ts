import { defineFunction } from '@aws-amplify/backend';

export const adminSetUserAdminFn = defineFunction({
  name: 'admin-set-user-admin',
  entry: './handler.ts'
});
