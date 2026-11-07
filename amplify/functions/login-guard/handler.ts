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
import { AdminInitiateAuthCommand, AdminRespondToAuthChallengeCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { effective, isLocked, recordFailure, type LoginAttemptRecord } from './escalation';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const cognito = new CognitoIdentityProviderClient();
const TABLE = process.env.LOGIN_ATTEMPTS_TABLE;
// Pending-MFA records share this table under a distinct key prefix rather than a second
// table - same reasoning as everything else here being a plain DynamoDB table instead of a
// Data model: zero extra GraphQL/API surface, one IAM grant covers both record shapes.
const MFA_KEY_PREFIX = 'mfa:';
const MFA_PENDING_TTL_MS = 5 * 60 * 1000;

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

interface PendingMfa { cognitoSession: string; expiresAt: number }

/** Whether round 1 (password) also triggered a pending Cognito MFA challenge - the signal
 *  DefineAuthChallenge uses to decide whether a second CUSTOM_CHALLENGE round is needed, so
 *  a non-enrolled user's flow is byte-for-byte what it was before this feature existed. */
async function getPendingMfa(email: string): Promise<PendingMfa | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id: `${MFA_KEY_PREFIX}${email}` } }));
  const item = res.Item as PendingMfa | undefined;
  if (!item || item.expiresAt < Date.now()) return null;
  return item;
}

async function writePendingMfa(email: string, cognitoSession: string): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLE, Item: { id: `${MFA_KEY_PREFIX}${email}`, cognitoSession, expiresAt: Date.now() + MFA_PENDING_TTL_MS } }));
}

async function deletePendingMfa(email: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id: `${MFA_KEY_PREFIX}${email}` } }));
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
      } else if (session.at(-1)?.challengeResult !== true) {
        // Defensive fallback only — VerifyAuthChallengeResponse throws directly on failure
        // below, so Cognito should never actually reach this branch with challengeResult false.
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
      } else if (session.length === 1 && session[0]?.challengeMetadata === 'PASSWORD_CHALLENGE' && (await getPendingMfa(email))) {
        // Password round succeeded AND it left a pending Cognito MFA challenge behind (set in
        // VerifyAuthChallengeResponse below) - this user has TOTP enrolled, so one more round
        // is needed before tokens are issued. A non-enrolled user never has a pending record
        // here, so this branch (and everything past it) never runs for them.
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
      } else {
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
      }
      return event;
    }

    case 'CreateAuthChallenge_Authentication': {
      // Nothing to generate in either round — the password (round 1) or TOTP code (round 2)
      // IS the challenge answer. Cognito silently rejects the whole InitiateAuth call (masked
      // as a generic "Incorrect username or password", with no error anywhere in this
      // Lambda's logs) if publicChallengeParameters is an empty object — confirmed by direct
      // testing, not documented by AWS. It must have at least one key; the value itself is
      // never checked against the answer.
      const isSecondRound = event.request.session.length === 1;
      event.response.publicChallengeParameters = { prompt: isSecondRound ? 'totp' : 'password' };
      // Read back in VerifyAuthChallengeResponse (whose event type has no `session` of its
      // own) to tell the two rounds apart - this is exactly what privateChallengeParameters
      // is for: data handed from this round's CreateAuthChallenge to this SAME round's verify.
      event.response.privateChallengeParameters = { round: isSecondRound ? 'totp' : 'password' };
      event.response.challengeMetadata = isSecondRound ? 'TOTP_CHALLENGE' : 'PASSWORD_CHALLENGE';
      return event;
    }

    case 'VerifyAuthChallengeResponse_Authentication': {
      const answer = event.request.challengeAnswer;
      const record = await getRecord(email);
      const eff = effective(record, now);
      const lockedUntil = isLocked(eff, now);
      if (lockedUntil) {
        event.response.answerCorrect = false;
        throw new Error(`LOCKED:${lockedUntil}`);
      }

      // Set by this same round's CreateAuthChallenge above (session isn't available on this
      // trigger's event type) - 'totp' only ever happens for an MFA-enrolled user's second
      // round; everyone else's requests are always the password round.
      const isPasswordRound = event.request.privateChallengeParameters.round !== 'totp';
      let ok = false;

      if (isPasswordRound) {
        // The real, server-side password check. Cognito itself computes the rejection latency
        // whether or not the user exists, so this doesn't open a timing side-channel beyond
        // what Cognito already has — do not short-circuit on event.request.userNotFound before
        // this call (that WOULD reopen exactly the kind of timing leak src/services/account.ts's
        // demo mode verifyPassword() already goes out of its way to avoid).
        // Read straight off the trigger event rather than an env var pointing back at the user
        // pool/client resources: a Lambda property (Environment) referencing those and the
        // user pool's own LambdaConfig referencing this Lambda's ARN is a direct 2-resource
        // CloudFormation cycle. Every Cognito trigger event already carries both identifiers.
        try {
          const r = await cognito.send(new AdminInitiateAuthCommand({
            UserPoolId: event.userPoolId,
            ClientId: event.callerContext.clientId,
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: { USERNAME: email, PASSWORD: answer }
          }));
          if (r.AuthenticationResult) {
            ok = true;
          } else if (r.ChallengeName === 'SOFTWARE_TOKEN_MFA' && r.Session) {
            // Password correct, but this user has TOTP enrolled - Cognito wants a second
            // factor before it would hand back tokens from THIS internal call (which are
            // discarded either way; the outer custom-auth flow issues the real tokens once
            // DefineAuthChallenge says so). Stash the session so the TOTP round can continue
            // it via AdminRespondToAuthChallenge, without ever exposing it to the client.
            ok = true;
            await writePendingMfa(email, r.Session);
          }
        } catch {
          ok = false;
        }
      } else {
        const pending = await getPendingMfa(email);
        if (pending) {
          try {
            const r = await cognito.send(new AdminRespondToAuthChallengeCommand({
              UserPoolId: event.userPoolId,
              ClientId: event.callerContext.clientId,
              ChallengeName: 'SOFTWARE_TOKEN_MFA',
              Session: pending.cognitoSession,
              ChallengeResponses: { USERNAME: email, SOFTWARE_TOKEN_MFA_CODE: answer }
            }));
            ok = !!r.AuthenticationResult;
          } catch {
            ok = false;
          }
        }
      }

      if (ok) {
        if (record) await deleteRecord(email); // full reset on success
        if (!isPasswordRound) await deletePendingMfa(email);
        event.response.answerCorrect = true;
        return event;
      }

      const result = recordFailure(eff, now);
      await writeRecord(email, result.next);
      if (!isPasswordRound) await deletePendingMfa(email); // don't let a stale session be retried
      event.response.answerCorrect = false;
      throw new Error('locked' in result ? `LOCKED:${result.locked}` : `ATTEMPTS_LEFT:${result.attemptsLeft}`);
    }

    default:
      return event;
  }
};
