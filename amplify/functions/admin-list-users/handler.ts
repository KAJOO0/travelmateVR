// Real Cognito user directory for the admin dashboard (src/pages/admin/UsersPage.tsx,
// DashboardPage.tsx's "Total users" KPI) - replaces the local-browser demo seed
// (src/services/admin.ts's userDirectoryStore) with the real user pool, for a real admin only.
//
// This was originally one shared Lambda for all four admin-user operations, dispatched on
// event.info.fieldName. Live-tested via a real signed-in admin session (not just a
// hand-constructed test event) and confirmed that assumption was wrong: Amplify Gen2's
// a.handler.function() invocation does not include the `info` object the generic
// AppSyncResolverEvent type promises - event.info was undefined at runtime, throwing
// "Cannot read properties of undefined (reading 'fieldName')" on every real call. Split into
// one function per operation instead, matching every other custom mutation in this project
// (delete-account, update-partner-profile, submit-partner-application), which are already
// confirmed to work this way.
import type { AppSyncResolverHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  type UserType
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient();
const USER_POOL_ID = process.env.USER_POOL_ID;

export interface AdminUserSummary {
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

export const handler: AppSyncResolverHandler<Record<string, never>, AdminUserSummary[]> = async () => {
  const [users, admins] = await Promise.all([listAllUsers(), listAdminUsernames()]);
  return users.map(u => ({
    id: u.Username!,
    email: attr(u, 'email') ?? '',
    name: attr(u, 'name'),
    enabled: !!u.Enabled,
    createdAt: (u.UserCreateDate ?? new Date()).toISOString(),
    isAdmin: admins.has(u.Username!)
  }));
};
