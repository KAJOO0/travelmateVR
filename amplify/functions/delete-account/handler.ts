// Self-service account deletion, server-side. src/services/account.ts used to call Cognito's
// deleteUser() directly from the browser using the signed-in user's own access token - that
// works for an email/password session, but Cognito's DeleteUser API requires the
// aws.cognito.signin.user.admin OAuth scope, and confirmed live (see amplify/auth/resource.ts):
// Cognito never grants that scope to a Google-federated access token, no matter what the user
// pool client's AllowedOAuthScopes allows. The old code's try/catch swallowed that failure and
// declared success anyway, so a Google-signed-in customer asking to delete their account got a
// false "done" while their real Cognito user was never removed.
//
// This runs as an AppSync custom-mutation resolver (amplify/data/resource.ts's
// deleteMyAccount), authorized to any signed-in user (allow.authenticated()). The identity to
// delete comes from event.identity.username - AppSync's own verified claim from the caller's
// token, never a client-supplied argument - so this can only ever delete the caller's own
// account, the same guarantee Cognito's own deleteUser() gave, just reachable for every sign-in
// method instead of only some.
import type { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda';
import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();

export const handler: AppSyncResolverHandler<Record<string, never>, { success: boolean }> = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined;
  if (!identity?.username) throw new Error('No authenticated identity on this request.');

  await cognito.send(new AdminDeleteUserCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: identity.username
  }));

  return { success: true };
};
