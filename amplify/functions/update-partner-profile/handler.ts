// Lets a partner write logo/cover/social onto their own PUBLIC Partner row, without opening
// Partner's authorization() up to non-admin writes generally (see amplify/data/resource.ts -
// that model's authorization() is untouched; this is the one narrow path around it, same
// reasoning as submit-partner-application/handler.ts for PartnerApplication).
import type { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client();
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

interface Args {
  partnerId: string;
  logo?: string | null;
  cover?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  website?: string | null;
  linktree?: string | null;
}

export const handler: AppSyncResolverHandler<Args, Record<string, unknown>> = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined;
  if (!identity?.sub) throw new Error('No authenticated identity on this request.');

  const { partnerId, logo, cover, ...social } = event.arguments;

  const existing = await ddb.send(new GetCommand({ TableName: process.env.PARTNER_TABLE, Key: { id: partnerId } }));
  const partner = existing.Item;
  if (!partner) throw new Error('Partner not found.');
  // ownerSub is admin-set by hand (no admin UI yet, same accepted gap as applicationId) - a
  // Partner row with none set can never be self-edited through this mutation.
  if (!partner.ownerSub || partner.ownerSub !== identity.sub) {
    throw new Error('You do not have permission to edit this partner.');
  }

  // Confirms the claimed key is a real upload, not a fabricated string - the same reasoning
  // as submit-partner-application's certification-doc check. This does NOT confirm the key
  // was uploaded by this exact caller (the AppSync Cognito identity context only exposes the
  // User Pool sub, not the Identity Pool identity id the S3 path is actually scoped by, and
  // resolving one from the other server-side would need the raw ID token, not just decoded
  // claims) - accepted as low-severity given profile-media is already a public-read prefix
  // by design (see amplify/storage/resource.ts): worst case is referencing someone else's
  // already-uploaded photo as your own, not a privacy or access-control breach.
  const bucket = process.env.PARTNER_DOCS_BUCKET_NAME;
  // Matches the accept="image/*" hint on the logo/cover file inputs in ProfilePage.tsx/
  // AccountPage.tsx - that hint is client-side only, so enforce the same shape here too.
  // 10MB mirrors submit-partner-application's cap - no existing project precedent set one for
  // images specifically, this is a reasonable, revisitable choice.
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_BYTES = 10 * 1024 * 1024;
  await Promise.all([logo, cover].filter((k): k is string => !!k).map(async key => {
    let head;
    try {
      head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      throw new Error(`Image not found: ${key}`);
    }
    if (!head.ContentType || !ALLOWED_TYPES.has(head.ContentType)) {
      throw new Error(`Image has an unsupported file type: ${key}`);
    }
    if ((head.ContentLength ?? 0) > MAX_BYTES) {
      throw new Error(`Image is too large: ${key}`);
    }
  }));

  // Same shape as the client-side check in src/pages/business/ProfilePage.tsx - enforced here
  // too, since this mutation is a public GraphQL field any authenticated partner-owner can call
  // directly (devtools/curl/any client), bypassing that React form entirely. Without this, an
  // owner could write a `javascript:` URI into a field that's stored on the public Partner row
  // and (depending on what reads Partner.social in the future) rendered as a raw <a href>.
  const SOCIAL_URL_RE = /^https:\/\/[^\s]+\.[^\s]+$/;
  for (const [key, value] of Object.entries(social)) {
    if (value != null && !SOCIAL_URL_RE.test(value as string)) {
      throw new Error(`Invalid link for ${key}: must be a https:// URL.`);
    }
  }

  const now = new Date().toISOString();
  const hasSocial = Object.values(social).some(v => v !== undefined && v !== null);

  const res = await ddb.send(new UpdateCommand({
    TableName: process.env.PARTNER_TABLE,
    Key: { id: partnerId },
    UpdateExpression: 'SET updatedAt = :now'
      + (logo !== undefined ? ', logo = :logo' : '')
      + (cover !== undefined ? ', cover = :cover' : '')
      + (hasSocial ? ', social = :social' : ''),
    ExpressionAttributeValues: {
      ':now': now,
      ...(logo !== undefined ? { ':logo': logo } : {}),
      ...(cover !== undefined ? { ':cover': cover } : {}),
      ...(hasSocial ? { ':social': social } : {})
    },
    ReturnValues: 'ALL_NEW'
  }));

  return res.Attributes ?? partner;
};
