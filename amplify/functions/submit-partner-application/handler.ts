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

  const bucket = process.env.PARTNER_DOCS_BUCKET_NAME;
  // Confirms every claimed document genuinely exists (not just a plausible-looking string the
  // client made up) - the actual enforcement point, not the length check above alone.
  await Promise.all(docs.map(async key => {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      throw new Error(`Certification document not found: ${key}`);
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
