// Enforces the "certification document is mandatory" rule server-side, not just in the
// registration form's UI. This is the ONLY way a PartnerApplication row can be created (see
// amplify/data/resource.ts - PartnerApplication's authorization() grants no `create` to
// anyone, including the owner) - so a client calling the GraphQL API directly, bypassing
// JoinPage.tsx entirely, still can't create an application with zero certification documents.
import type { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client();
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

interface Args {
  businessName: string;
  kind: string;
  countryId: string;
  area: string;
  destinations: string[];
  services: string[];
  licence?: string | null;
  registration?: string | null;
  website?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole?: string | null;
  languages: string[];
  communityOwned: boolean;
  ecoCertification?: string | null;
  about: string;
  certificationDocs: string[];
}

export const handler: AppSyncResolverHandler<Args, Record<string, unknown>> = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined;
  if (!identity?.sub || !identity.username) throw new Error('No authenticated identity on this request.');

  const docs = (event.arguments.certificationDocs ?? []).filter(Boolean);
  if (docs.length === 0) {
    throw new Error('At least one certification document is required to submit a partner application.');
  }

  // Auto-injected by amplify/storage/resource.ts's allow.resource(submitApplicationFn) grant.
  // Confirmed live via GetFunctionConfiguration: the real name is 'PARTNER_DOCS_BUCKET_NAME'
  // (my own first guess, before I second-guessed it from a source comment that turned out to
  // describe a different, generic naming pattern, not this grant's actual one) - and its value
  // is a resolved-at-runtime SSM reference (Amplify's cross-stack mechanism that avoids a hard
  // CloudFormation reference here, which is exactly what caused the earlier circular-dependency
  // failure), not a plain baked-in string.
  const bucket = process.env.PARTNER_DOCS_BUCKET_NAME;
  // Same allow-list/size cap as the client-side picker in src/pages/business/JoinPage.tsx
  // (MAX_CERT_FILE_BYTES/CERT_FILE_TYPES) - enforced here too, since a direct GraphQL call
  // bypasses that form entirely and could otherwise upload+reference anything S3 will store.
  const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
  const MAX_BYTES = 10 * 1024 * 1024;
  // Confirms every claimed document genuinely exists (not just a plausible-looking string the
  // client made up) - the actual enforcement point, not the length check above alone.
  await Promise.all(docs.map(async key => {
    let head;
    try {
      head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch (e) {
      console.error('HeadObject failed', { bucket, key, error: e instanceof Error ? e.message : e, name: e instanceof Error ? e.name : undefined });
      throw new Error(`Certification document not found: ${key}`);
    }
    if (!head.ContentType || !ALLOWED_TYPES.has(head.ContentType)) {
      throw new Error(`Certification document has an unsupported file type: ${key}`);
    }
    if ((head.ContentLength ?? 0) > MAX_BYTES) {
      throw new Error(`Certification document is too large: ${key}`);
    }
  }));

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  // sub::username is Cognito User Pools' default owner-identity format for Amplify Data's
  // allow.owner() rule (confirmed against the installed @aws-amplify/data-schema package's own
  // doc comments) - matching it exactly is what lets the applicant read this row back later
  // through the normal generated client, authorized by that same rule.
  const owner = `${identity.sub}::${identity.username}`;

  const item: Record<string, unknown> = {
    __typename: 'PartnerApplication',
    id,
    owner,
    createdAt: now,
    updatedAt: now,
    status: 'submitted',
    ...event.arguments,
    certificationDocs: docs
  };

  await ddb.send(new PutCommand({ TableName: process.env.PARTNER_APPLICATIONS_TABLE, Item: item }));

  return item;
};
