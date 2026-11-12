// Real Cognito user directory for the admin dashboard (src/pages/admin/UsersPage.tsx,
// DashboardPage.tsx's "Total users" KPI) - replaces the local-browser demo seed
// (src/services/admin.ts's userDirectoryStore) with the real user pool, for a real admin only.
// One Lambda, reused across four AppSync operations (amplify/data/resource.ts), dispatched on
// event.info.fieldName - same reuse pattern as amplify/functions/login-guard/handler.ts.
import type { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type UserType
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();
const USER_POOL_ID = process.env.USER_POOL_ID;

interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  enabled: boolean;
  createdAt: string;
  isAdmin: boolean;
}

function attr(u: UserType, name: string): string | null {
  return u.Attributes?.find(a => a.Name === name)?.Value ?? null;
}

async function listAllUsers(): Promise<UserType[]> {
  const out: UserType[] = [];
  let token: string | undefined;
  do {
    const res = await cognito.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID, PaginationToken: token }));
    out.push(...(res.Users ?? []));
    token = res.PaginationToken;
  } while (token);
  return out;
}

async function listAdminUsernames(): Promise<Set<string>> {
  const out = new Set<string>();
  let token: string | undefined;
  do {
    const res = await cognito.send(new ListUsersInGroupCommand({ UserPoolId: USER_POOL_ID, GroupName: 'admin', NextToken: token }));
    for (const u of res.Users ?? []) if (u.Username) out.add(u.Username);
    token = res.NextToken;
  } while (token);
  return out;
}

export const handler: AppSyncResolverHandler<Record<string, unknown>, unknown> = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined;

  switch (event.info.fieldName) {
    case 'adminListUsers': {
      const [users, admins] = await Promise.all([listAllUsers(), listAdminUsernames()]);
      const summaries: AdminUserSummary[] = users.map(u => ({
        id: u.Username!,
        email: attr(u, 'email') ?? '',
        name: attr(u, 'name'),
        enabled: !!u.Enabled,
        createdAt: (u.UserCreateDate ?? new Date()).toISOString(),
        isAdmin: admins.has(u.Username!)
      }));
      return summaries;
    }

    case 'adminSetUserEnabled': {
      const { username, enabled } = event.arguments as { username: string; enabled: boolean };
      await cognito.send(enabled
        ? new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
        : new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: username }));
      return { success: true };
    }

    case 'adminSetUserAdmin': {
      const { username, isAdmin } = event.arguments as { username: string; isAdmin: boolean };
      // Never let an admin remove their own admin membership - the only way back in would be
      // another admin doing it for them, or a console-level fix. Easy mistake to guard against.
      if (!isAdmin && identity?.username === username) {
        throw new Error('You cannot remove your own admin access.');
      }
      await cognito.send(isAdmin
        ? new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: 'admin' })
        : new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: 'admin' }));
      return { success: true };
    }

    case 'adminInviteStaff': {
      const { email, name } = event.arguments as { email: string; name?: string };
      const attrs = [{ Name: 'email', Value: email }, { Name: 'email_verified', Value: 'true' }];
      if (name) attrs.push({ Name: 'name', Value: name });
      const created = await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: attrs
        // No MessageAction override: Cognito sends its normal invitation email with a
        // temporary password, same as any other admin-created user.
      }));
      await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: email, GroupName: 'admin' }));
      return { success: true, tempUsername: created.User?.Username ?? email };
    }

    default:
      throw new Error(`Unknown admin-users operation: ${event.info.fieldName}`);
  }
};
