import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Real catalogue data: Country, Destination, Partner, Listing, Experience, Review.
// Mirrors src/domain/types.ts. Everything else (bookings, admin, partner/board portals,
// moderation, trips, platform settings) stays on the mock/local data layer for now —
// see the project plan for the phased rollout.
//
// Reads are public (the catalogue is public content). Writes are locked to the 'admin'
// Cognito group (amplify/auth/resource.ts) — nothing writes through the app yet, but the
// rule is correct from day one rather than temporarily open. A short-lived API key grant
// is added to each model solely for the one-time seed migration script
// (scripts/migrate-seed-to-amplify.ts) — it is never used by the running app.

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
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin'), allow.publicApiKey().to(['create', 'update', 'delete'])]),

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
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin'), allow.publicApiKey().to(['create', 'update', 'delete'])]),

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
      listings: a.hasMany('Listing', 'partnerId')
    })
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin'), allow.publicApiKey().to(['create', 'update', 'delete'])]),

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
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin'), allow.publicApiKey().to(['create', 'update', 'delete'])]),

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
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin'), allow.publicApiKey().to(['create', 'update', 'delete'])]),

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
    .authorization(allow => [allow.guest().to(['read']), allow.group('admin'), allow.publicApiKey().to(['create', 'update', 'delete'])])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool', // guest reads via the unauthenticated Cognito Identity Pool role; allow.group('admin') writes use the Cognito User Pool from amplify/auth/resource.ts automatically
    apiKeyAuthorizationMode: { expiresInDays: 7 } // migration-script-only — let it expire or delete it after use
  }
});
