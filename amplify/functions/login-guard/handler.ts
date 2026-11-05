// Cognito custom-auth-flow trigger handler — the server-side half of progressive login
// lockout. Wired to all four CUSTOM_AUTH triggers in amplify/auth/resource.ts; the frontend
// side is src/services/account.ts's attemptCustomAuthSignIn().
//
// Why a custom auth flow at all: Cognito's standard triggers have no "on failed password"
// hook (PreAuthentication fires before the password check; PostAuthentication only on
// success), so recording a failure requires being the thing that actually judges the
// password — VerifyAuthChallengeResponse, in CUSTOM_AUTH, is that place. The alternative (a
// Lambda proxying AdminInitiateAuth from the client side) doesn't work: there's no supported
// way to adopt externally-obtained Cognito tokens into Amplify's managed session store.
//
// State lives in a plain DynamoDB table (amplify/backend.ts), not an Amplify Data model —
// allow.resource() turned out to be field-level-only, not a whole-model CRUD rule. This
// table has zero GraphQL/API surface; the only access path is this Lambda's direct IAM grant.
import type {
  CreateAuthChallengeTriggerHandler,
  DefineAuthChallengeTriggerHandler,
  PreAuthenticationTriggerHandler,
  VerifyAuthChallengeResponseTriggerHandler
} from 'aws-lambda';
import { AdminInitiateAuthCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { effective, isLocked, recordFailure, type LoginAttemptRecord } from './escalation';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const cognito = new CognitoIdentityProviderClient();
const TABLE = process.env.LOGIN_ATTEMPTS_TABLE;

async function getRecord(email: string): Promise<LoginAttemptRecord | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id: email } }));
  return (res.Item as LoginAttemptRecord | undefined) ?? null;
}

async function writeRecord(email: string, next: LoginAttemptRecord): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLE, Item: { id: email, ...next } }));
}

async function deleteRecord(email: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id: email } }));
}

type AnyTriggerEvent = Parameters<
  PreAuthenticationTriggerHandler | DefineAuthChallengeTriggerHandler | CreateAuthChallengeTriggerHandler | VerifyAuthChallengeResponseTriggerHandler
>[0];

export const handler = async (event: AnyTriggerEvent): Promise<AnyTriggerEvent> => {
  const email = event.userName.toLowerCase();
  const now = Date.now();

  switch (event.triggerSource) {
    case 'PreAuthentication_Authentication': {
      const eff = effective(await getRecord(email), now);
      const lockedUntil = isLocked(eff, now);
      // Fires for every InitiateAuth, regardless of flow — the airtight part of the block.
      if (lockedUntil) throw new Error(`LOCKED:${lockedUntil}`);
      return event;
    }

    case 'DefineAuthChallenge_Authentication': {
      const session = event.request.session;
      if (session.length === 0) {
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
      } else if (session.at(-1)?.challengeResult === true) {
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
      } else {
        // Defensive fallback only — VerifyAuthChallengeResponse throws directly on failure
        // below, so Cognito should never actually reach this branch with challengeResult false.
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
      }
      return event;
    }

    case 'CreateAuthChallenge_Authentication': {
      // Nothing to generate — the password itself is the challenge answer. Cognito silently
      // rejects the whole InitiateAuth call (masked as a generic "Incorrect username or
      // password", with no error anywhere in this Lambda's logs) if publicChallengeParameters
      // is an empty object — confirmed by direct testing, not documented by AWS. It must have
      // at least one key; the value itself is never checked against the answer.
      event.response.publicChallengeParameters = { prompt: 'password' };
      event.response.privateChallengeParameters = {};
      event.response.challengeMetadata = 'PASSWORD_CHALLENGE';
      return event;
    }

    case 'VerifyAuthChallengeResponse_Authentication': {
      const password = event.request.challengeAnswer;
      const record = await getRecord(email);
      const eff = effective(record, now);
      const lockedUntil = isLocked(eff, now);
      if (lockedUntil) {
        event.response.answerCorrect = false;
        throw new Error(`LOCKED:${lockedUntil}`);
      }

      // The real, server-side password check. Cognito itself computes the rejection latency
      // whether or not the user exists, so this doesn't open a timing side-channel beyond what
      // Cognito already has — do not short-circuit on event.request.userNotFound before this
      // call (that WOULD reopen exactly the kind of timing leak src/services/account.ts's demo
      // mode verifyPassword() already goes out of its way to avoid).
      // Read straight off the trigger event rather than an env var pointing back at the user
      // pool/client resources: a Lambda property (Environment) referencing those and the user
      // pool's own LambdaConfig referencing this Lambda's ARN is a direct 2-resource
      // CloudFormation cycle. Every Cognito trigger event already carries both identifiers.
      let ok = false;
      try {
        const r = await cognito.send(new AdminInitiateAuthCommand({
          UserPoolId: event.userPoolId,
          ClientId: event.callerContext.clientId,
          AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
          AuthParameters: { USERNAME: email, PASSWORD: password }
        }));
        ok = !!r.AuthenticationResult;
      } catch {
        ok = false;
      }

      if (ok) {
        if (record) await deleteRecord(email); // full reset on success
        event.response.answerCorrect = true;
        return event;
      }

      const result = recordFailure(eff, now);
      await writeRecord(email, result.next);
      event.response.answerCorrect = false;
      throw new Error('locked' in result ? `LOCKED:${result.locked}` : `ATTEMPTS_LEFT:${result.attemptsLeft}`);
    }

    default:
      return event;
  }
};
