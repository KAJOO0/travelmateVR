// See amplify/functions/admin-list-users/handler.ts for why this is its own function rather
// than sharing one Lambda with the other admin-user operations.
import type { AppSyncResolverHandler } from 'aws-lambda';
import { AdminDisableUserCommand, AdminEnableUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();
const USER_POOL_ID = process.env.USER_POOL_ID;

interface Args { username: string; enabled: boolean }

export const handler: AppSyncResolverHandler<Args, { success: boolean }> = async (event) => {
  const { username, enabled } = event.arguments;
  await cognito.send(enabled
    ? new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
    : new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: username }));
  return { success: true };
};
