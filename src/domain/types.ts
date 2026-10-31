// Core domain model. Mirrors the service boundaries of the TravelMateVR backend
// (catalogue, experiences, marketplace, bookings, trips, identity, AI, support).

export type Locale = 'en' | 'fr' | 'de' | 'zh' | 'it';
export type Currency = 'USD';

/** Content text with an English default and optional translations from the CMS. */
export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, 'en'>, string>>;

export type MediaId = string;
/** Id of an equirectangular panorama in /pano. */
export type PanoId = string;
/** Id of an equirectangular 360° video in /video (see src/data/videos.generated.json). */
export type VideoId = string;

export type ExpansionPhase = 1 | 2 | 3 | 4 | 5 | 6;
export type Region = 'east-africa' | 'southern-africa' | 'west-central-africa' | 'north-africa' | 'southeast-asia' | 'middle-east' | 'europe' | 'global';
/** Regions outside Africa, shown as the global showcase. */
export const GLOBAL_REGIONS: readonly Region[] = ['southeast-asia', 'middle-east', 'europe'];

export type InterestTag =
  | 'wildlife' | 'beach' | 'culture' | 'mountain' | 'adventure' | 'luxury'
  | 'family' | 'eco' | 'lifestyle' | 'landscape' | 'city' | 'lake';

export type CategoryId = 'lifestyle' | 'landscape' | 'cultural' | 'wildlife';

export interface Country {
  id: string;
  /** ISO 3166-1 alpha-2 — names are localised with Intl.DisplayNames. */
  iso: string;
  /** Set for places featured alongside countries that are not sovereign states (e.g. Zanzibar). */
  name?: string;
  region: Region;
  phase: ExpansionPhase;
  media: MediaId;
  tagline: LocalizedText;
  /** Entry requirements summary (content; confirm with official sources). */
  entry?: LocalizedText;
  emergency?: string;
  timezone?: string;
  languages?: string[];
}

export type ClimateProfile = 'northern-tz' | 'crater-highlands' | 'coast' | 'western-tz' | 'southern-highlands' | 'southern-tz' | 'kenya-mara' | 'great-lakes' | 'cape' | 'okavango' | 'namib' | 'zambezi' | 'highveld'
  | 'bali' | 'halong' | 'siem-reap' | 'petra' | 'dubai' | 'muscat' | 'santorini' | 'bled' | 'madeira';

export interface Destination {
  id: string;
  slug: string;
  name: string;
  countryId: string;
  /** Sub-national area, e.g. "Northern circuit". */
  area: LocalizedText;
  media: MediaId;
  gallery?: MediaId[];
  summary: LocalizedText;
  overview?: LocalizedText;
  tags: InterestTag[];
  coordinates: [lat: number, lng: number];
  bestMonths: number[];
  fromPriceUsd: number;
  rating: number;
  reviewCount: number;
  aliases?: string[];
  ecoCertified?: boolean;
  climate: ClimateProfile;
  /** Typical stay length in days. */
  typicalDays: [min: number, max: number];
  accessible?: boolean;
  familyFriendly?: boolean;
  safety?: LocalizedText;
  sustainability?: LocalizedText;
  nearby?: string[];
}

export type ExperienceKind = 'wildlife' | 'culture' | 'landscape' | 'beach' | 'adventure' | 'city';

export interface Hotspot {
  /** Degrees: 0 = initial view direction, positive = right. */
  yaw: number;
  /** Degrees: positive = up. */
  pitch: number;
  kind: 'info' | 'wildlife' | 'culture' | 'nearby';
  title: LocalizedText;
  text: LocalizedText;
}

export interface Experience {
  id: string;
  slug: string;
  title: LocalizedText;
  tagline: LocalizedText;
  destinationId: string;
  kind: ExperienceKind;
  media: MediaId;
  /**
   * 360° video: the primary immersive format. The viewer plays it on the sphere and falls back to
   * the 360° panorama (or the video's own 360° poster frame) if playback is not possible.
   */
  video?: VideoId;
  /** Real 360° panorama. Without one (or a video), the viewer shows a panoramic preview of the photo. */
  pano?: PanoId;
  /** Initial view direction for the panorama, in degrees. */
  startYaw?: number;
  durationMin: number;
  hasNarration: boolean;
  narration?: LocalizedText;
  facts?: LocalizedText[];
  hotspots?: Hotspot[];
  rating: number;
  reviewCount: number;
  featured?: boolean;
  /** Listings that can be booked from this experience. */
  listingIds?: string[];
}

export interface Category {
  id: CategoryId;
  media: MediaId;
  focus: string;
  zoom: number;
}

// ---------- Marketplace ----------

export type ListingType = 'stay' | 'safari' | 'activity' | 'restaurant' | 'transport' | 'event' | 'local';
export type PriceUnit = 'night' | 'person' | 'trip' | 'vehicle' | 'seat' | 'group' | 'ticket';
export type Cancellation = 'flexible' | 'moderate' | 'strict';

export interface Sustainability {
  ecoCertified?: boolean;
  certification?: string;
  communityLed?: boolean;
  localOwned?: boolean;
  /** USD added to a conservation or community fund per booking. */
  contributionUsd?: number;
  note?: LocalizedText;
}

export interface Listing {
  id: string;
  slug: string;
  type: ListingType;
  subtype: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  partnerId: string;
  destinationId: string;
  media: MediaId[];
  pano?: PanoId;
  price: { amountUsd: number; unit: PriceUnit; indicative?: boolean };
  /** e.g. 0.18 for 18% VAT. */
  taxRate: number;
  capacity?: number;
  durationHours?: number;
  durationDays?: number;
  amenities: string[];
  rating?: number;
  reviewCount: number;
  sustainability: Sustainability;
  coordinates: [lat: number, lng: number];
  cancellation: Cancellation;
  closedMonths?: number[];
  /** ISO date for dated events. */
  date?: string;
  startTimes?: string[];
  instantBook: boolean;
  /** Fictional demo business used to show the marketplace. */
  sample?: boolean;
  extras?: { id: string; label: LocalizedText; priceUsd: number; per: 'booking' | 'person' }[];
  /** Set by the partner in the portal: hidden from the marketplace and not bookable. */
  paused?: boolean;
}

export interface Partner {
  id: string;
  slug: string;
  name: string;
  kind: 'operator' | 'lodge' | 'restaurant' | 'transport' | 'community' | 'events' | 'guide';
  logo?: MediaId;
  cover: MediaId;
  destinationIds: string[];
  description: LocalizedText;
  verified: boolean;
  founding?: boolean;
  /** Real business (true) or a fictional demo business (false). */
  real: boolean;
  languages: string[];
  responseHours?: number;
  whatsapp?: string;
  since?: number;
  /** Storefront headline, written by the partner in the portal. */
  tagline?: Partial<LocalizedText>;
}

export interface Review {
  id: string;
  targetType: 'listing' | 'experience' | 'destination';
  targetId: string;
  author: string;
  countryIso: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  verifiedBooking: boolean;
  lang: Locale;
  /** Set for reviews written on this device. */
  mine?: boolean;
  /** Moderation state for newly submitted reviews (seeded reviews are already published). */
  status?: 'pending' | 'approved' | 'rejected';
}

/** Structured reading of a free-text travel request. */
export interface SearchIntent {
  raw: string;
  places: { id: string; label: string; type: 'country' | 'destination' }[];
  days?: number;
  travellers?: number;
  budgetUsd?: number;
  budgetMode?: 'max' | 'about';
  styles: InterestTag[];
  kinds: ('safari' | 'stay' | 'activity' | 'experience' | 'transport' | 'restaurant' | 'event')[];
}

export interface SearchSuggestion {
  id: string;
  type: 'destination' | 'country' | 'experience' | 'listing';
  label: string;
  sublabel: string;
  href: string;
  media: MediaId;
}

// ---------- Traveller ----------

export type Pace = 'relaxed' | 'balanced' | 'packed';
export type BudgetLevel = 'value' | 'comfort' | 'luxury';

export interface TravellerProfile {
  interests: InterestTag[];
  budgetLevel?: BudgetLevel;
  travelStyle?: 'independent' | 'guided' | 'mixed';
  adventure: number;
  luxury: number;
  adults: number;
  children: number;
  accessibility: string[];
  pace: Pace;
  sustainabilityFirst: boolean;
  preferredDestinations: string[];
  consentPersonalisation: boolean;
}

export type Slot = 'morning' | 'afternoon' | 'evening';

export interface ItineraryItem {
  id: string;
  listingId?: string;
  experienceId?: string;
  title: string;
  /** App-generated items carry a translation key instead of fixed text. */
  titleKey?: string;
  titleParams?: Record<string, string>;
  kind: ListingType | 'free' | 'travel' | 'meal';
  time: string;
  durationHours: number;
  priceUsd: number;
  /** Price is per person (multiplied by travellers) or per group. */
  perPerson: boolean;
  transport?: string;
  distanceKm?: number;
  destinationId?: string;
  media?: MediaId;
  bookingId?: string;
  note?: string;
}

export interface ItineraryDay {
  date?: string;
  destinationId: string;
  title?: string;
  stayListingId?: string;
  slots: Record<Slot, ItineraryItem[]>;
}

export interface Trip {
  id: string;
  name: string;
  destinationIds: string[];
  startDate?: string;
  endDate?: string;
  adults: number;
  children: number;
  budgetUsd?: number;
  interests: InterestTag[];
  days: ItineraryDay[];
  source: 'ai' | 'manual';
  prompt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'partially_paid' | 'cancelled' | 'completed' | 'refunded';
export type PaymentMethod = 'card' | 'mobile_money' | 'bank_transfer' | 'pay_later';

export interface PriceBreakdown {
  base: number;
  extras: number;
  taxes: number;
  serviceFee: number;
  contribution: number;
  /** Partner promotion applied to base + extras (positive amount, shown as a deduction). */
  discount?: number;
  promotion?: string;
  total: number;
  currency: Currency;
}

export interface Booking {
  id: string;
  listingId: string;
  partnerId: string;
  tripId?: string;
  status: BookingStatus;
  createdAt: string;
  date: string;
  endDate?: string;
  startTime?: string;
  guests: { adults: number; children: number };
  units: number;
  extras: string[];
  lead: { firstName: string; lastName: string; email: string; phone: string; country: string };
  travellers: { name: string }[];
  requests?: string;
  price: PriceBreakdown;
  payment: {
    method: PaymentMethod; paidUsd: number; reference?: string; paidAt?: string;
    /** Mobile money: network id (mpesa, airtel, mixx, halopesa) and masked payer number. */
    network?: string; payerPhone?: string;
    /** Shilling amount approved on the phone. */
    amountTzs?: number;
  };
  reviewId?: string;
}

export interface AppNotification {
  id: string;
  kind: 'booking' | 'reminder' | 'itinerary' | 'partner' | 'promotion' | 'price' | 'alert' | 'ai' | 'support';
  /** Content text (seeded/CMS) … */
  title?: LocalizedText;
  body?: LocalizedText;
  /** … or translation keys rendered in the reader's language (app-generated notifications). */
  i18n?: { title: string; body: string; params?: Record<string, string> };
  createdAt: string;
  read: boolean;
  href?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export interface SupportTicket {
  id: string;
  subject: string;
  topic: 'booking' | 'payment' | 'trip' | 'account' | 'partner' | 'other';
  status: TicketStatus;
  createdAt: string;
  bookingId?: string;
  messages: { from: 'me' | 'support'; text: string; at: string }[];
}

export interface TravelDocument {
  id: string;
  type: 'passport' | 'visa' | 'ticket' | 'booking' | 'insurance' | 'vaccination' | 'other';
  label: string;
  /** Only the last characters of a document number are kept (data minimisation). */
  numberHint?: string;
  expiresOn?: string;
  tripId?: string;
  bookingId?: string;
  fileName?: string;
  addedAt: string;
}

export interface MessageThread {
  id: string;
  partnerId: string;
  bookingId?: string;
  messages: { from: 'me' | 'partner' | 'system'; text: string; at: string }[];
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Optional sign-in name (3–30 characters: a–z, 0–9, dot, underscore, hyphen). */
  username?: string;
  provider: 'email' | 'google';
  roles: Role[];
  /** Organisation the user acts for in a business portal (partner id or tourism board id). */
  orgId?: string;
  createdAt: string;
}

export type Role =
  | 'traveller' | 'partner' | 'partner_staff' | 'tourism_board' | 'government_dmo' | 'conservation_org'
  | 'content_manager' | 'support_agent' | 'finance' | 'admin' | 'super_admin';
