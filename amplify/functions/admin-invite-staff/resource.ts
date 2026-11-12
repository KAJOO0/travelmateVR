import { defineFunction } from '@aws-amplify/backend';

export const adminInviteStaffFn = defineFunction({
  name: 'admin-invite-staff',
  entry: './handler.ts'
});
