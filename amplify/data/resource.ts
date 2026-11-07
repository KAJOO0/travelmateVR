import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { deleteAccountFn } from '../functions/delete-account/resource';
import { submitApplicationFn } from '../functions/submit-partner-application/resource';

// Real catalogue data: Country, Destination, Partner, Listing, Experience, Review.
// Mirrors src/domain/types.ts. Everything else (bookings, admin, partner/board portals,
// moderation, trips, platform settings) stays on the mock/local data layer for now —
// see the project plan for the phased rollout.
//
// Reads are public (the catalogue is public content). Writes are locked to the 'admin'
// Cognito group (amplify/auth/resource.ts) — nothing writes through the app yet, but the
// rule is correct from day one rather than temporarily open.
//
// A standing allow.publicApiKey() write grant used to be on every model below, for the
// one-time seed migration script (scripts/migrate-seed-to-amplify.ts). Removed: that API
// key is embedded in amplify_outputs.json, which src/main.tsx bundles into the public JS —
// so it was a public, unauthenticated write credential on the live catalogue, not a
// private one, and `expiresInDays` never actually closed the window because every routine
// redeploy silently re-issued it. If the migration needs to run again, do it with
// IAM/admin credentials (e.g. `ampx sandbox` locally, or a one-off script using the
// deployer's AWS credentials directly against DynamoDB/AppSync), never a schema-level
// public key grant.

const LocalizedText = a.customType({
  en: a.string(),
  fr: a.string(),
  de: a.string(),
  zh: a.string(),
  it: a.string()
});

const Coordinates = a.customType({
  lat: a.float().required(),
  lng: a.float().required()
});

// Named (not inline) so arrays of these can use a.ref('Name').array() — Amplify Data only
// supports .array() on a ref to a named type, not on an inline a.customType(...) directly.
const Extra = a.customType({
  id: a.string().required(),
  label: a.ref('LocalizedText'),
  priceUsd: a.float().required(),
  per: a.enum(['booking', 'person'])
});

const Hotspot = a.customType({
  yaw: a.float().required(),
  pitch: a.float().required(),
  kind: a.enum(['info', 'wildlife', 'culture', 'nearby']),
  title: a.ref('LocalizedText'),
  text: a.ref('LocalizedText')
});

const schema = a.schema({
  LocalizedText,
  Coordinates,
  Extra,
  Hotspot,

  Country: a
    .model({
      iso: a.string().required(),
      name: a.string(),
      region: a.string().required(), // Region id — plain string, not a GraphQL enum: enum value names can't contain hyphens (e.g. 'east-africa'), same reasoning as `climate` below
      phase: a.integer().required(),
      media: a.string().required(),
      tagline: LocalizedText,
      entry: LocalizedText,
      emergency: a.string(),
      timezone: a.string(),
      languages: a.string().array(),
      currency: a.string(), // folded in from src/data/seed/reference.ts's COUNTRY_INFO
      destinations: a.hasMany('Destination', 'countryId')
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin')]),

  Destination: a
    .model({
      slug: a.string().required(),
      name: a.string().required(),
      countryId: a.id().required(),
      country: a.belongsTo('Country', 'countryId'),
      area: LocalizedText,
      media: a.string().required(),
      gallery: a.string().array(),
      summary: LocalizedText,
      overview: LocalizedText,
      tags: a.string().array(), // InterestTag[]
      coordinates: Coordinates,
      bestMonths: a.integer().array(),
      fromPriceUsd: a.float().required(),
      rating: a.float().required(),
      reviewCount: a.integer().required(),
      aliases: a.string().array(),
      ecoCertified: a.boolean(),
      climate: a.string().required(), // ClimateProfile id — looked up against the static CLIMATE table, not persisted here
      typicalDaysMin: a.integer().required(),
      typicalDaysMax: a.integer().required(),
      accessible: a.boolean(),
      familyFriendly: a.boolean(),
      safety: LocalizedText,
      sustainability: LocalizedText,
      nearby: a.string().array(), // flat destination-id references, not a relation
      listings: a.hasMany('Listing', 'destinationId'),
      experiences: a.hasMany('Experience', 'destinationId')
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin')]),

  Partner: a
    .model({
      slug: a.string().required(),
      name: a.string().required(),
      kind: a.enum(['operator', 'lodge', 'restaurant', 'transport', 'community', 'events', 'guide']),
      logo: a.string(),
      cover: a.string().required(),
      destinationIds: a.string().array().required(), // flat id references (many-to-many), not a relation
      description: LocalizedText,
      verified: a.boolean().required(),
      founding: a.boolean(),
      real: a.boolean().required(), // actual founding partner vs. fictional demo business
      languages: a.string().array().required(),
      responseHours: a.integer(),
      whatsapp: a.string(),
      since: a.integer(),
      tagline: LocalizedText,
      listings: a.hasMany('Listing', 'partnerId'),
      // Links a live catalogue entry back to the PartnerApplication it came from, so an admin
      // can revoke approval for a partner whose application never had a valid certification
      // document. No automated "approved application -> live Partner" publish pipeline exists
      // yet (confirmed: approving an application today only flips a status flag) - an admin
      // sets this by hand once a Partner row exists some other way.
      applicationId: a.id(),
      revokedAt: a.datetime(),
      revokedReason: a.string()
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin')]),

  Listing: a
    .model({
      slug: a.string().required(),
      type: a.enum(['stay', 'safari', 'activity', 'restaurant', 'transport', 'event', 'local']),
      subtype: a.string().required(),
      title: LocalizedText,
      summary: LocalizedText,
      description: LocalizedText,
      partnerId: a.id().required(),
      partner: a.belongsTo('Partner', 'partnerId'),
      destinationId: a.id().required(),
      destination: a.belongsTo('Destination', 'destinationId'),
      media: a.string().array().required(),
      pano: a.string(),
      priceAmountUsd: a.float().required(),
      priceUnit: a.enum(['night', 'person', 'trip', 'vehicle', 'seat', 'group', 'ticket']),
      priceIndicative: a.boolean(),
      taxRate: a.float().required(),
      capacity: a.integer(),
      durationHours: a.float(),
      durationDays: a.integer(),
      amenities: a.string().array().required(),
      rating: a.float(),
      reviewCount: a.integer().required(),
      sustainability: a.customType({
        ecoCertified: a.boolean(),
        certification: a.string(),
        communityLed: a.boolean(),
        localOwned: a.boolean(),
        contributionUsd: a.float(),
        note: a.ref('LocalizedText')
      }),
      coordinates: Coordinates,
      cancellation: a.enum(['flexible', 'moderate', 'strict']),
      closedMonths: a.integer().array(),
      date: a.string(),
      startTimes: a.string().array(),
      instantBook: a.boolean().required(),
      sample: a.boolean(), // fictional-demo flag, carried over from seed data
      extras: a.ref('Extra').array(),
      paused: a.boolean().default(false) // forward-compat for the (out-of-scope) partner inventory overlay — nothing writes it yet
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin')]),

  Experience: a
    .model({
      slug: a.string().required(),
      title: LocalizedText,
      tagline: LocalizedText,
      destinationId: a.id().required(),
      destination: a.belongsTo('Destination', 'destinationId'),
      kind: a.enum(['wildlife', 'culture', 'landscape', 'beach', 'adventure', 'city']),
      media: a.string().required(),
      video: a.string(),
      pano: a.string(),
      startYaw: a.float(),
      durationMin: a.integer().required(),
      hasNarration: a.boolean().required(),
      narration: LocalizedText,
      facts: a.ref('LocalizedText').array(),
      hotspots: a.ref('Hotspot').array(),
      rating: a.float().required(),
      reviewCount: a.integer().required(),
      featured: a.boolean(),
      listingIds: a.string().array() // flat id references (many-to-many), not a relation
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin')]),

  Review: a
    .model({
      targetType: a.enum(['listing', 'experience', 'destination']), // polymorphic — targetId below, no FK constraint
      targetId: a.string().required(),
      author: a.string().required(),
      countryIso: a.string().required(),
      rating: a.integer().required(),
      title: a.string().required(),
      text: a.string().required(),
      date: a.string().required(),
      verifiedBooking: a.boolean().required(),
      lang: a.enum(['en', 'fr', 'de', 'zh', 'it']),
      status: a.enum(['pending', 'approved', 'rejected']) // forward-compat for (out-of-scope) moderation; migration sets 'approved' explicitly
      // 'mine' from src/domain/types.ts is a client-only UI flag — never persisted here.
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin')]),

  // A partner/tour-operator application. No `create` grant here, for anyone — the only way to
  // create one is the submitPartnerApplication mutation below, so the certification-document
  // requirement is enforced by that Lambda, not just by the registration form's own UI. See
  // amplify/functions/submit-partner-application/handler.ts.
  PartnerApplication: a
    .model({
      businessName: a.string().required(),
      kind: a.string().required(),
      countryId: a.string().required(),
      area: a.string().required(),
      destinations: a.string().array().required(),
      services: a.string().array().required(),
      licence: a.string(),
      registration: a.string(),
      website: a.string(),
      contactName: a.string().required(),
      contactEmail: a.string().required(),
      contactPhone: a.string().required(),
      contactRole: a.string(),
      languages: a.string().array().required(),
      communityOwned: a.boolean().required(),
      ecoCertification: a.string(),
      about: a.string().required(),
      // S3 keys under partner-docs/{identityId}/... (amplify/storage/resource.ts). At least
      // one is required to exist for a submission to be accepted at all — checked by
      // submitPartnerApplication's handler via S3 HeadObject, not just this array being
      // non-null (which `.required()` alone would allow to be empty).
      certificationDocs: a.string().array().required(),
      status: a.enum(['submitted', 'in_review', 'approved', 'rejected', 'revoked']),
      decidedAt: a.datetime(),
      decisionNote: a.string(),
      revokedAt: a.datetime(),
      revokedReason: a.string(),
      linkedPartnerId: a.id()
    })
    .authorization(allow => [allow.owner().to(['read']), allow.group('admin')]),

  // Backend-delivered notifications, so e.g. a partner-revocation reaches the affected user's
  // account on any device, any time they sign in - unlike src/services/account.ts's
  // pushNotification(), which only ever reaches the same browser/device it was called from.
  Notification: a
    .model({
      kind: a.enum(['booking', 'reminder', 'itinerary', 'partner', 'promotion', 'price', 'alert', 'ai', 'support']),
      titleKey: a.string().required(),
      bodyKey: a.string().required(),
      params: a.json(),
      href: a.string(),
      read: a.boolean().default(false)
    })
    .authorization(allow => [allow.owner().to(['read', 'update']), allow.group('admin').to(['create', 'read'])]),

  // No arguments beyond the application's own fields: the applicant identity comes from the
  // caller's verified token (event.identity), server-side, never from client input - the same
  // reasoning as deleteMyAccount just below. This is the one and only path that can create a
  // PartnerApplication (see its authorization() above), which is what makes the certification
  // requirement real instead of cosmetic.
  submitPartnerApplication: a
    .mutation()
    .arguments({
      businessName: a.string().required(),
      kind: a.string().required(),
      countryId: a.string().required(),
      area: a.string().required(),
      destinations: a.string().array().required(),
      services: a.string().array().required(),
      licence: a.string(),
      registration: a.string(),
      website: a.string(),
      contactName: a.string().required(),
      contactEmail: a.string().required(),
      contactPhone: a.string().required(),
      contactRole: a.string(),
      languages: a.string().array().required(),
      communityOwned: a.boolean().required(),
      ecoCertification: a.string(),
      about: a.string().required(),
      certificationDocs: a.string().array().required()
    })
    .returns(a.ref('PartnerApplication'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(submitApplicationFn)),

  // See amplify/functions/delete-account/handler.ts for why this exists as a real backend
  // mutation rather than relying on Cognito's client-side deleteUser(). No arguments: the
  // account to delete is always the caller's own, identified server-side from the verified
  // token, never from client input.
  deleteMyAccount: a
    .mutation()
    .returns(a.customType({ success: a.boolean() }))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(deleteAccountFn))
  // Progressive login lockout state lives in a plain CDK-managed DynamoDB table
  // (amplify/backend.ts), not an Amplify Data model — allow.resource() turned out to only be
  // valid for field-level authorization, not a whole model's CRUD rules (confirmed from the
  // installed package's types: ModelType.authorization() takes BaseAllowModifier, which
  // explicitly omits 'resource'). A raw table with a direct IAM grant to the login-guard
  // Lambda is arguably cleaner anyway: zero GraphQL/API surface for this data at all, not
  // even theoretically reachable via a stolen API key or token. See
  // amplify/functions/login-guard/handler.ts.
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool' // guest reads via the unauthenticated Cognito Identity Pool role; allow.group('admin') writes use the Cognito User Pool from amplify/auth/resource.ts automatically
  }
});
