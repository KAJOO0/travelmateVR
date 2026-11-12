// See amplify/functions/admin-list-users/handler.ts for why this is its own function rather
// than sharing one Lambda with the other admin-user operations.
import type { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda';
import { AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();
const USER_POOL_ID = process.env.USER_POOL_ID;

interface Args { username: string; isAdmin: boolean }

export const handler: AppSyncResolverHandler<Args, { success: boolean }> = async (event) => {
  const { username, isAdmin } = event.arguments;
  const identity = event.identity as AppSyncIdentityCognito | undefined;
  // Never let an admin remove their own admin membership - the only way back in would be
  // another admin doing it for them, or a console-level fix. Easy mistake to guard against.
  if (!isAdmin && identity?.username === username) {
    throw new Error('You cannot remove your own admin access.');
  }
  await cognito.send(isAdmin
    ? new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: 'admin' })
    : new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: 'admin' }));
  return { success: true };
};
