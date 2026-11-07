import { defineFunction } from '@aws-amplify/backend';

export const deleteAccountFn = defineFunction({
  name: 'delete-account',
  entry: './handler.ts'
});
