// Minimum-viable account deletion: an admin-run runbook, not a self-service flow — there is
// no admin backend yet (see amplify/data/resource.ts's own comment on scope), so this is the
// stand-in until one exists. Deletes a real user's Cognito identity (AdminDeleteUser) and
// their row in the login-guard lockout table, given only their email.
//
// Usage: npm run delete:account -- --email someone@example.com
// Requires AWS credentials with cognito-idp:AdminDeleteUser and dynamodb:DeleteItem on this
// app's stack (the same credentials already used throughout this project's deploys).

import { CloudFormationClient, ListStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const REGION = 'eu-west-3';
const DEFAULT_STACK_NAME = 'amplify-d1tgxuxxng291h-main-branch-bb8bcf4da8';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function findResource(cfn: CloudFormationClient, stackName: string, resourceType: string, logicalIdPrefix: string) {
  const res = await cfn.send(new ListStackResourcesCommand({ StackName: stackName }));
  return res.StackResourceSummaries?.find(r => r.ResourceType === resourceType && r.LogicalResourceId.startsWith(logicalIdPrefix));
}

async function main() {
  const email = arg('email');
  const stackName = arg('stack-name') ?? DEFAULT_STACK_NAME;
  if (!email) {
    console.error('Usage: npm run delete:account -- --email someone@example.com [--stack-name <root-stack-name>]');
    process.exit(1);
  }

  const cfn = new CloudFormationClient({ region: REGION });

  const authNested = await findResource(cfn, stackName, 'AWS::CloudFormation::Stack', 'auth');
  if (!authNested?.PhysicalResourceId) throw new Error(`Could not find the auth nested stack under ${stackName}`);
  const userPool = await findResource(cfn, authNested.PhysicalResourceId, 'AWS::Cognito::UserPool', 'amplifyAuthUserPool');
  if (!userPool?.PhysicalResourceId) throw new Error('Could not find the Cognito User Pool resource');
  const userPoolId = userPool.PhysicalResourceId;

  const loginAttemptsTable = await findResource(cfn, stackName, 'AWS::DynamoDB::Table', 'LoginAttempts');

  const cognito = new CognitoIdentityProviderClient({ region: REGION });
  await cognito.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: email }));
  console.log(`Deleted Cognito user: ${email} (pool ${userPoolId})`);

  if (loginAttemptsTable?.PhysicalResourceId) {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
    await ddb.send(new DeleteCommand({ TableName: loginAttemptsTable.PhysicalResourceId, Key: { id: email.toLowerCase() } }));
    console.log(`Cleared lockout record in ${loginAttemptsTable.PhysicalResourceId} (if one existed)`);
  } else {
    console.log('No LoginAttempts table found under this stack — skipped (nothing to clear, or stack layout changed).');
  }

  console.log('Done. This does not touch any demo/local-storage data on the user\'s own device — that was never sent to the backend.');
}

main().catch(err => {
  console.error('Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
