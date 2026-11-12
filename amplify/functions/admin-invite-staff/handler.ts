// See amplify/functions/admin-list-users/handler.ts for why this is its own function rather
// than sharing one Lambda with the other admin-user operations.
// Every invited staff account lands in the 'admin' group - there's no second real Cognito
// group yet for a finer-grained staff tier (the demo's 7-role taxonomy has no real backing).
import type { AppSyncResolverHandler } from 'aws-lambda';
import { AdminAddUserToGroupCommand, AdminCreateUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();
const USER_POOL_ID = process.env.USER_POOL_ID;

interface Args { email: string; name?: string | null }

export const handler: AppSyncResolverHandler<Args, { success: boolean; tempUsername: string }> = async (event) => {
  const { email, name } = event.arguments;
  const attrs = [{ Name: 'email', Value: email }, { Name: 'email_verified', Value: 'true' }];
  if (name) attrs.push({ Name: 'name', Value: name });
  const created = await cognito.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: attrs
    // No MessageAction override: Cognito sends its normal invitation email with a temporary
    // password, same as any other admin-created user.
  }));
  await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: email, GroupName: 'admin' }));
  return { success: true, tempUsername: created.User?.Username ?? email };
};
