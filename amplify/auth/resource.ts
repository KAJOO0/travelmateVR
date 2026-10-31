import { defineAuth } from '@aws-amplify/backend';

/**
 * Real traveller accounts (email + password). Username sign-in is not supported here —
 * the demo mode's username-or-email sign-in stays local-only for now; real-mode sign-in
 * is email-only (see src/services/account.ts).
 *
 * The 'admin' group backs Data's write-authorization rules in amplify/data/resource.ts.
 * Nothing assigns users to it yet this phase — it exists so the schema's write rules are
 * correct from day one instead of temporarily wide open.
 *
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true
  },
  groups: ['admin']
});
