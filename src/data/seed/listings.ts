import type { Listing } from '@/domain/types';

const t = (en: string) => ({ en });
const TZ_VAT = 0.18;

// Marketplace listings. Listings from real partners use indicative prices until the partner confirms rates;
// all others belong to fictional sample businesses (`sample: true`).
export const LISTINGS: Listing[] = [
  // ---------------- Stays ----------------
  {
    id: 'stay-serengeti-kijani-camp', slug: 'kijani-serengeti-tented-camp', type: 'stay', subtype: 'camp', sample: true,
    title: t('Kijani Serengeti Tented Camp'), summary: t('Ten solar-powered tents on a kopje in the central Serengeti.'),
    description: t('Each tent has an en-suite bathroom with bucket shower, a private deck and views over the Seronera valley. Game drives leave at sunrise with Kijani’s own guides, and dinner is served around the fire. The camp moves with the season to stay close to the herds.'),
    partnerId: 'kijani-camps', destinationId: 'serengeti', media: ['serengeti-herds', 'impala', 'safari-crew'],
    price: { amountUsd: 650, unit: 'night' }, taxRate: TZ_VAT, capacity: 2, amenities: ['ensuite', 'meals', 'guide', 'solar', 'wifi_limited', 'laundry'],
    rating: 4.9, reviewCount: 214, sustainability: { ecoCertified: true, certification: 'Eco-rated camp', localOwned: false, contributionUsd: 10, note: t('USD 10 per night goes to a community school fund near Seronera.') },
    coordinates: [-2.45, 34.82], cancellation: 'moderate', instantBook: true,
    extras: [{ id: 'balloon', label: t('Hot-air balloon flight at sunrise'), priceUsd: 599, per: 'person' }, { id: 'bushdinner', label: t('Private bush dinner'), priceUsd: 85, per: 'person' }]
  },
  {
    id: 'stay-ngorongoro-rim-lodge', slug: 'kilima-view-crater-rim-lodge', type: 'stay', subtype: 'lodge', sample: true,
    title: t('Kilima View Crater Rim Lodge'), summary: t('Stone cottages with fireplaces on the edge of the crater.'),
    description: t('Thirty cottages look straight down into the Ngorongoro Crater. Nights are cool at 2,300 m, so every room has a fireplace and hot-water bottles. The lodge arranges early crater descents to reach the floor before most vehicles.'),
    partnerId: 'kilima-view', destinationId: 'ngorongoro', media: ['ngorongoro', 'ngorongoro-elephant'],
    price: { amountUsd: 420, unit: 'night' }, taxRate: TZ_VAT, capacity: 3, amenities: ['ensuite', 'meals', 'fireplace', 'wifi', 'restaurant', 'parking'],
    rating: 4.7, reviewCount: 388, sustainability: { contributionUsd: 5 }, coordinates: [-3.23, 35.49], cancellation: 'moderate', instantBook: true
  },
  {
    id: 'stay-tarangire-eco-lodge', slug: 'kijani-tarangire-eco-lodge', type: 'stay', subtype: 'lodge', sample: true,
    title: t('Kijani Tarangire Eco Lodge'), summary: t('Thatched chalets among baobabs above the Tarangire River.'),
    description: t('Twelve chalets built from local materials, with a swimming pool overlooking the river where elephants drink in the afternoon. Water is solar-heated and greywater is recycled for the garden.'),
    partnerId: 'kijani-camps', destinationId: 'tarangire', media: ['tarangire', 'impala'],
    price: { amountUsd: 310, unit: 'night' }, taxRate: TZ_VAT, capacity: 4, amenities: ['ensuite', 'meals', 'pool', 'solar', 'family', 'guide'],
    rating: 4.8, reviewCount: 176, sustainability: { ecoCertified: true, certification: 'Eco-rated lodge', contributionUsd: 5 }, coordinates: [-3.86, 36.0], cancellation: 'flexible', instantBook: true
  },
  {
    id: 'stay-zanzibar-pwani-retreat', slug: 'pwani-beach-retreat-zanzibar', type: 'stay', subtype: 'hotel', sample: true,
    title: t('Pwani Beach Retreat'), summary: t('Ocean-view rooms on Zanzibar’s north coast.'),
    description: t('Bright rooms open onto the beach at Nungwi, where the tide changes the shoreline through the day. Staff come from the surrounding villages, and the kitchen buys fish from local fishermen each morning.'),
    partnerId: 'pwani-retreats', destinationId: 'zanzibar', media: ['hotel-room', 'zanzibar-beach', 'nungwi'],
    price: { amountUsd: 240, unit: 'night' }, taxRate: TZ_VAT, capacity: 3, amenities: ['ensuite', 'breakfast', 'pool', 'wifi', 'ac', 'beach', 'accessible'],
    rating: 4.7, reviewCount: 532, sustainability: { localOwned: true, note: t('Over 80% of staff come from neighbouring villages.') }, coordinates: [-5.73, 39.29], cancellation: 'flexible', instantBook: true,
    extras: [{ id: 'airport', label: t('Airport pick-up'), priceUsd: 45, per: 'booking' }]
  },
  {
    id: 'stay-stone-town-guesthouse', slug: 'mji-mkongwe-courtyard-guesthouse', type: 'stay', subtype: 'guesthouse', sample: true,
    title: t('Courtyard Guesthouse, Stone Town'), summary: t('A restored merchant’s house with a rooftop terrace.'),
    description: t('Six rooms around an open courtyard behind a carved door, five minutes’ walk from the Old Fort and Forodhani Gardens. Breakfast is served on the roof with views over the old town.'),
    partnerId: 'mji-mkongwe-walks', destinationId: 'zanzibar', media: ['stonetown-door', 'stonetown-street', 'pano-amphitheatre_zanzibar_fort'], pano: 'amphitheatre_zanzibar_fort',
    price: { amountUsd: 95, unit: 'night' }, taxRate: TZ_VAT, capacity: 2, amenities: ['ensuite', 'breakfast', 'wifi', 'ac', 'rooftop'],
    rating: 4.6, reviewCount: 298, sustainability: { localOwned: true, communityLed: true }, coordinates: [-6.162, 39.188], cancellation: 'flexible', instantBook: true
  },
  {
    id: 'stay-dar-city-hotel', slug: 'jiji-city-hotel-dar-es-salaam', type: 'stay', subtype: 'hotel', sample: true,
    title: t('Jiji City Hotel'), summary: t('Central rooms near the Zanzibar ferry terminal.'),
    description: t('A practical base for a night in Dar es Salaam before the ferry or a flight south. Rooms are quiet and air-conditioned, with a 24-hour front desk and airport shuttle.'),
    partnerId: 'jiji-hotels', destinationId: 'dar-es-salaam', media: ['dar-city'],
    price: { amountUsd: 130, unit: 'night' }, taxRate: TZ_VAT, capacity: 2, amenities: ['ensuite', 'breakfast', 'wifi', 'ac', 'parking', 'accessible', 'restaurant'],
    rating: 4.3, reviewCount: 640, sustainability: {}, coordinates: [-6.816, 39.29], cancellation: 'flexible', instantBook: true
  },
  {
    id: 'stay-mbeya-highland-rest', slug: 'highland-rest-mbeya', type: 'stay', subtype: 'guesthouse', sample: true,
    title: t('Highland Rest Mbeya'), summary: t('Garden rooms and help with hikes to Ngozi.'),
    description: t('A friendly guesthouse in Mbeya with hot showers, a garden and an early breakfast for hikers. The owners arrange transport to the Ngozi trailhead and village guides.'),
    partnerId: 'highland-rest', destinationId: 'ngozi', media: ['ngozi'],
    price: { amountUsd: 55, unit: 'night' }, taxRate: TZ_VAT, capacity: 2, amenities: ['ensuite', 'breakfast', 'wifi', 'parking'],
    rating: 4.5, reviewCount: 72, sustainability: { localOwned: true }, coordinates: [-8.9, 33.46], cancellation: 'flexible', instantBook: true
  },
  {
    id: 'stay-sabie-tented-camp', slug: 'sabie-river-safari-tent', type: 'stay', subtype: 'camp', sample: true,
    title: t('Sabie River Safari Tent'), summary: t('A self-catering safari tent on a deck above the valley.'),
    description: t('Canvas, wood and a wide deck facing the river valley outside Sabie. Each tent has a kitchenette, outdoor shower and braai area. Waterfalls and the Panorama Route are a short drive away. Look around the deck in 360° before you book.'),
    partnerId: 'sabie-river-tents', destinationId: 'mpumalanga', media: ['pano-sabie_tent', 'pano-mpumalanga_veld'], pano: 'sabie_tent',
    price: { amountUsd: 110, unit: 'night' }, taxRate: 0.15, capacity: 2, amenities: ['ensuite', 'kitchen', 'braai', 'parking', 'solar'],
    rating: 4.7, reviewCount: 119, sustainability: { ecoCertified: true, certification: 'Off-grid solar' }, coordinates: [-25.1, 30.78], cancellation: 'moderate', instantBook: true
  },
  {
    id: 'stay-cape-town-guesthouse', slug: 'signal-hill-guesthouse', type: 'stay', subtype: 'guesthouse', sample: true,
    title: t('Signal Hill Guesthouse'), summary: t('Eight rooms with mountain views above the city bowl.'),
    description: t('A restored Victorian house with a small pool, honesty bar and views of Table Mountain. Walk to Kloof Street’s cafés or up Signal Hill for sunset.'),
    partnerId: 'signal-hill-house', destinationId: 'cape-town', media: ['southafrica-capetown', 'pano-table_mountain_1'],
    price: { amountUsd: 120, unit: 'night' }, taxRate: 0.15, capacity: 2, amenities: ['ensuite', 'breakfast', 'wifi', 'pool', 'parking'],
    rating: 4.8, reviewCount: 451, sustainability: {}, coordinates: [-33.93, 18.41], cancellation: 'moderate', instantBook: true
  },

  // ---------------- Safaris ----------------
  {
    id: 'safari-serengeti-migration-private', slug: 'private-migration-safari-4-days', type: 'safari', subtype: 'luxury', sample: true,
    title: t('Private Great Migration Safari, 4 days'), summary: t('Serengeti and Ngorongoro with your own guide and vehicle.'),
    description: t('Fly from Arusha into the Serengeti, follow the herds for two full days with a private guide, then drive to the Ngorongoro rim for a crater descent on the last morning. Includes park fees, meals, tented-camp nights and the return flight.'),
    partnerId: 'mawingu-safaris', destinationId: 'serengeti', media: ['serengeti-crossing', 'serengeti-herds', 'ngorongoro'],
    price: { amountUsd: 2850, unit: 'person' }, taxRate: TZ_VAT, durationDays: 4, capacity: 6, amenities: ['guide', 'vehicle', 'meals', 'park_fees', 'flight', 'camp'],
    rating: 4.9, reviewCount: 167, sustainability: { contributionUsd: 25, note: t('USD 25 per guest supports anti-poaching rangers.') }, coordinates: [-2.33, 34.83], cancellation: 'strict', instantBook: false,
    extras: [{ id: 'balloon', label: t('Balloon safari'), priceUsd: 599, per: 'person' }]
  },
  {
    id: 'safari-northern-circuit-group', slug: 'northern-circuit-group-safari-6-days', type: 'safari', subtype: 'group', sample: true,
    title: t('Northern Circuit Group Safari, 6 days'), summary: t('Tarangire, Serengeti and Ngorongoro in a small group of up to six.'),
    description: t('A good-value way to see the northern parks: a pop-top vehicle with a guide, lodges and camps along the way, and departures every Monday from Arusha.'),
    partnerId: 'mawingu-safaris', destinationId: 'serengeti', media: ['ngorongoro-elephant', 'tarangire', 'serengeti-herds'],
    price: { amountUsd: 1690, unit: 'person' }, taxRate: TZ_VAT, durationDays: 6, capacity: 6, amenities: ['guide', 'vehicle', 'meals', 'park_fees', 'lodge'],
    rating: 4.7, reviewCount: 402, sustainability: { contributionUsd: 10 }, coordinates: [-3.37, 36.68], cancellation: 'moderate', instantBook: true, startTimes: ['07:00']
  },
  {
    id: 'safari-ngorongoro-day', slug: 'ngorongoro-crater-day-trip', type: 'safari', subtype: 'day', sample: true,
    title: t('Ngorongoro Crater Day Trip'), summary: t('A full day on the crater floor with picnic lunch.'),
    description: t('Leave Karatu or the rim early, descend into the crater for about six hours of game viewing and a picnic by the hippo pool, then return in the late afternoon.'),
    partnerId: 'mawingu-safaris', destinationId: 'ngorongoro', media: ['ngorongoro', 'ngorongoro-elephant'],
    price: { amountUsd: 390, unit: 'person' }, taxRate: TZ_VAT, durationHours: 9, capacity: 6, amenities: ['guide', 'vehicle', 'lunch', 'park_fees'],
    rating: 4.8, reviewCount: 611, sustainability: {}, coordinates: [-3.2, 35.5], cancellation: 'moderate', instantBook: true, startTimes: ['06:30']
  },
  {
    id: 'safari-tarangire-day', slug: 'tarangire-day-safari', type: 'safari', subtype: 'day', sample: true,
    title: t('Tarangire Day Safari'), summary: t('Elephants and baobabs, two hours from Arusha.'),
    description: t('A relaxed day trip with a game drive along the Tarangire River and lunch at a picnic site. Ideal for families and as the first day of a longer trip.'),
    partnerId: 'mawingu-safaris', destinationId: 'tarangire', media: ['tarangire'],
    price: { amountUsd: 280, unit: 'person' }, taxRate: TZ_VAT, durationHours: 10, capacity: 6, amenities: ['guide', 'vehicle', 'lunch', 'park_fees', 'family'],
    rating: 4.7, reviewCount: 288, sustainability: {}, coordinates: [-3.83, 36.0], cancellation: 'flexible', instantBook: true, startTimes: ['07:00']
  },
  {
    id: 'safari-katavi-fahari-3day', slug: 'katavi-fahari-3-day-safari', type: 'safari', subtype: 'private',
    title: t('Katavi Safari, 3 days'), summary: t('Game drives in Katavi National Park with Katavi Fahari Tours.'),
    description: t('Three days in Katavi National Park with Katavi Fahari Tours: game drives across the Katisunga plain and along the Katuma River, where hippos and crocodiles gather in the dry season. Exact itinerary, inclusions and rates are confirmed by the operator when you enquire.'),
    partnerId: 'katavi-fahari', destinationId: 'katavi', media: ['katavi', 'safari-crew', 'impala'],
    price: { amountUsd: 980, unit: 'person', indicative: true }, taxRate: TZ_VAT, durationDays: 3, capacity: 6, amenities: ['guide', 'vehicle', 'park_fees'],
    reviewCount: 0, sustainability: { localOwned: true }, coordinates: [-6.83, 31.25], cancellation: 'moderate', instantBook: false
  },
  {
    id: 'safari-katavi-fahari-day', slug: 'katavi-fahari-day-game-drive', type: 'safari', subtype: 'day',
    title: t('Katavi Day Game Drive'), summary: t('A full-day game drive in Katavi with Katavi Fahari Tours.'),
    description: t('A day in Katavi National Park with Katavi Fahari Tours, timed around the best wildlife hours. Pick-up point, inclusions and rates are confirmed by the operator when you enquire.'),
    partnerId: 'katavi-fahari', destinationId: 'katavi', media: ['katavi', 'impala'],
    price: { amountUsd: 240, unit: 'person', indicative: true }, taxRate: TZ_VAT, durationHours: 9, capacity: 6, amenities: ['guide', 'vehicle'],
    reviewCount: 0, sustainability: { localOwned: true }, coordinates: [-6.83, 31.25], cancellation: 'moderate', instantBook: false
  },
  {
    id: 'safari-mpanda-katavi-tanganyika', slug: 'mpanda-safaris-katavi-and-lake-tanganyika', type: 'safari', subtype: 'private',
    title: t('Katavi & Lake Tanganyika, 5 days'), summary: t('Western Tanzania’s park and lake with Mpanda Safari’s.'),
    description: t('A five-day route from Mpanda: game drives in Katavi National Park, then on to the shores of Lake Tanganyika. Route, accommodation and rates are confirmed by Mpanda Safari’s when you enquire.'),
    partnerId: 'mpanda-safaris', destinationId: 'katavi', media: ['safari-crew', 'katavi', 'tanganyika'],
    price: { amountUsd: 1450, unit: 'person', indicative: true }, taxRate: TZ_VAT, durationDays: 5, capacity: 6, amenities: ['guide', 'vehicle', 'park_fees'],
    reviewCount: 0, sustainability: { localOwned: true }, coordinates: [-6.35, 31.07], cancellation: 'moderate', instantBook: false
  },
  {
    id: 'safari-ruaha-4day', slug: 'ruaha-walking-and-driving-safari', type: 'safari', subtype: 'private', sample: true,
    title: t('Ruaha Walking & Driving Safari, 4 days'), summary: t('Lions, kudu and a guided bush walk in Tanzania’s largest park.'),
    description: t('Fly to Msembe airstrip for three nights in Ruaha. Mornings are for game drives along the river; one afternoon is a guided walk with an armed ranger.'),
    partnerId: 'ruaha-trails', destinationId: 'ruaha', media: ['ruaha'],
    price: { amountUsd: 1380, unit: 'person' }, taxRate: TZ_VAT, durationDays: 4, capacity: 6, amenities: ['guide', 'vehicle', 'meals', 'park_fees', 'walking'],
    rating: 4.8, reviewCount: 64, sustainability: { ecoCertified: true, certification: 'Eco-rated camp', contributionUsd: 15 }, coordinates: [-7.5, 34.6], cancellation: 'strict', instantBook: false
  },
  {
    id: 'safari-mara-3day', slug: 'maasai-mara-safari-3-days', type: 'safari', subtype: 'group', sample: true,
    title: t('Maasai Mara Safari, 3 days'), summary: t('Big cats and the migration season in Kenya’s best-known reserve.'),
    description: t('Three days in the Mara with a small group, staying at a tented camp on the edge of a community conservancy.'),
    partnerId: 'enkare-safaris', destinationId: 'maasai-mara', media: ['kenya-lion', 'kenya-mara'],
    price: { amountUsd: 1150, unit: 'person' }, taxRate: 0.16, durationDays: 3, capacity: 7, amenities: ['guide', 'vehicle', 'meals', 'park_fees', 'camp'],
    rating: 4.7, reviewCount: 233, sustainability: { communityLed: true, contributionUsd: 20 }, coordinates: [-1.4, 35.0], cancellation: 'moderate', instantBook: true
  },
  {
    id: 'safari-okavango-mokoro', slug: 'okavango-mokoro-island-camping', type: 'safari', subtype: 'group', sample: true,
    title: t('Okavango Mokoro & Island Camping, 3 days'), summary: t('Poled canoes, walking safaris and nights on a delta island.'),
    description: t('Community polers take you by mokoro deep into the delta. You camp on an island, walk with a guide at dawn and dusk, and return to Maun on day three.'),
    partnerId: 'delta-mokoro', destinationId: 'okavango', media: ['botswana-okavango'],
    price: { amountUsd: 890, unit: 'person' }, taxRate: 0.14, durationDays: 3, capacity: 8, amenities: ['guide', 'meals', 'camp', 'walking'],
    rating: 4.8, reviewCount: 141, sustainability: { communityLed: true, contributionUsd: 15 }, coordinates: [-19.4, 22.8], cancellation: 'moderate', instantBook: true
  },

  // ---------------- Activities ----------------
  {
    id: 'activity-kilimanjaro-machame', slug: 'kilimanjaro-machame-route-7-days', type: 'activity', subtype: 'hiking', sample: true,
    title: t('Kilimanjaro Machame Route, 7 days'), summary: t('The scenic “whiskey route” to Uhuru Peak with an extra acclimatisation day.'),
    description: t('Seven days through rainforest, moorland and alpine desert, summiting at sunrise on day six. Includes park fees, a lead guide and assistant guides, porters, mountain tents and meals.'),
    partnerId: 'kilele-trekking', destinationId: 'kilimanjaro', media: ['kilimanjaro-trek', 'kilimanjaro'],
    price: { amountUsd: 2150, unit: 'person' }, taxRate: TZ_VAT, durationDays: 7, capacity: 10, amenities: ['guide', 'meals', 'park_fees', 'camp', 'porters'],
    rating: 4.8, reviewCount: 319, sustainability: { note: t('Fair porter pay and a 20 kg load limit.') }, coordinates: [-3.07, 37.35], cancellation: 'strict', instantBook: false
  },
  {
    id: 'activity-ngozi-hike', slug: 'ngozi-crater-lake-guided-hike', type: 'activity', subtype: 'hiking', sample: true,
    title: t('Ngozi Crater Lake Guided Hike'), summary: t('A half-day forest walk to the crater rim with a village guide.'),
    description: t('Meet your guide at the trailhead in the Poroto Mountains and walk about 90 minutes through montane forest to the rim. Look out for colobus monkeys. Transport from Mbeya can be added.'),
    partnerId: 'poroto-guides', destinationId: 'ngozi', media: ['ngozi'],
    price: { amountUsd: 45, unit: 'person' }, taxRate: TZ_VAT, durationHours: 4, capacity: 12, amenities: ['guide', 'water'],
    rating: 4.8, reviewCount: 58, sustainability: { communityLed: true, contributionUsd: 3, note: t('Guide fees fund forest patrols around the crater.') }, coordinates: [-9.0, 33.55], cancellation: 'flexible', instantBook: true, startTimes: ['07:30', '09:00'],
    extras: [{ id: 'transport', label: t('Return transport from Mbeya'), priceUsd: 35, per: 'booking' }]
  },
  {
    id: 'activity-zanzibar-snorkel', slug: 'mnemba-snorkelling-trip', type: 'activity', subtype: 'water', sample: true,
    title: t('Snorkelling Trip off Zanzibar’s North Coast'), summary: t('Coral gardens and dolphins by traditional boat.'),
    description: t('A morning by boat to the reefs off the north-east coast, with two snorkelling stops, fresh fruit and a swim from a sandbank. Reef-safe sunscreen is provided.'),
    partnerId: 'pwani-retreats', destinationId: 'zanzibar', media: ['zanzibar-beach', 'nungwi'],
    price: { amountUsd: 55, unit: 'person' }, taxRate: TZ_VAT, durationHours: 5, capacity: 12, amenities: ['guide', 'equipment', 'snacks', 'family'],
    rating: 4.6, reviewCount: 410, sustainability: { note: t('No-touch reef briefing before every swim.') }, coordinates: [-5.82, 39.36], cancellation: 'flexible', instantBook: true, startTimes: ['08:00']
  },
  {
    id: 'activity-table-mountain-hike', slug: 'table-mountain-guided-hike', type: 'activity', subtype: 'hiking', sample: true,
    title: t('Table Mountain Guided Hike'), summary: t('Up Platteklip Gorge with a mountain guide, down by cableway.'),
    description: t('A two-to-three-hour climb with a qualified guide who explains the fynbos on the way. Ride the cableway down (ticket included).'),
    partnerId: 'fynbos-trails', destinationId: 'cape-town', media: ['pano-table_mountain_1', 'southafrica-capetown'], pano: 'table_mountain_1',
    price: { amountUsd: 70, unit: 'person' }, taxRate: 0.15, durationHours: 4, capacity: 10, amenities: ['guide', 'water', 'cableway'],
    rating: 4.9, reviewCount: 287, sustainability: {}, coordinates: [-33.96, 18.4], cancellation: 'flexible', instantBook: true, startTimes: ['07:00', '14:00']
  },
  {
    id: 'activity-victoria-falls-tour', slug: 'victoria-falls-guided-tour', type: 'activity', subtype: 'cultural', sample: true,
    title: t('Victoria Falls Guided Tour'), summary: t('The rainforest trail and Knife-Edge Bridge with a licensed guide.'),
    description: t('Two hours along the viewpoints on the Zambian side, with stories of Mosi-oa-Tunya and David Livingstone. Rain jackets provided in high-water months.'),
    partnerId: 'mosi-guides', destinationId: 'victoria-falls', media: ['zambia-vicfalls'],
    price: { amountUsd: 40, unit: 'person' }, taxRate: 0.16, durationHours: 2, capacity: 12, amenities: ['guide', 'rain_gear', 'family', 'accessible'],
    rating: 4.7, reviewCount: 356, sustainability: {}, coordinates: [-17.92, 25.85], cancellation: 'flexible', instantBook: true, startTimes: ['09:00', '15:00']
  },

  // ---------------- Restaurants ----------------
  {
    id: 'restaurant-stone-town-swahili', slug: 'jiko-swahili-kitchen', type: 'restaurant', subtype: 'swahili', sample: true,
    title: t('Jiko Swahili Kitchen'), summary: t('Coconut curries, grilled fish and spiced tea in Stone Town.'),
    description: t('A family kitchen in a Stone Town courtyard. Try pweza (octopus) in coconut, urojo soup and mandazi with chai. Reserve a table for dinner on weekends.'),
    partnerId: 'jiko-swahili', destinationId: 'zanzibar', media: ['stonetown-door', 'stonetown-street'],
    price: { amountUsd: 18, unit: 'person' }, taxRate: TZ_VAT, capacity: 40, amenities: ['vegetarian', 'halal', 'family'],
    rating: 4.7, reviewCount: 523, sustainability: { localOwned: true }, coordinates: [-6.163, 39.19], cancellation: 'flexible', instantBook: true, startTimes: ['12:30', '19:00', '20:30']
  },
  {
    id: 'restaurant-dar-seafood', slug: 'msasani-seafood-grill', type: 'restaurant', subtype: 'seafood', sample: true,
    title: t('Msasani Seafood Grill'), summary: t('Sea-view grill on the Msasani Peninsula.'),
    description: t('Prawns, calamari and catch of the day grilled over charcoal, with sunset views over the bay.'),
    partnerId: 'jiji-hotels', destinationId: 'dar-es-salaam', media: ['dar-city'],
    price: { amountUsd: 25, unit: 'person' }, taxRate: TZ_VAT, capacity: 80, amenities: ['seafood', 'vegetarian', 'accessible'],
    rating: 4.4, reviewCount: 214, sustainability: {}, coordinates: [-6.75, 39.27], cancellation: 'flexible', instantBook: true, startTimes: ['19:00', '20:30']
  },
  {
    id: 'restaurant-kijani-bush-dinner', slug: 'kijani-bush-dinner', type: 'restaurant', subtype: 'bush', sample: true,
    title: t('Bush Dinner under the Stars'), summary: t('A lantern-lit dinner in the Serengeti, for camp guests and day visitors.'),
    description: t('Three courses cooked over open fire with a ranger on watch. Available to guests of Serengeti camps in the Seronera area.'),
    partnerId: 'kijani-camps', destinationId: 'serengeti', media: ['impala'],
    price: { amountUsd: 85, unit: 'person' }, taxRate: TZ_VAT, capacity: 20, amenities: ['vegetarian'],
    rating: 4.9, reviewCount: 98, sustainability: {}, coordinates: [-2.45, 34.82], cancellation: 'moderate', instantBook: true, startTimes: ['19:00']
  },

  // ---------------- Transport ----------------
  {
    id: 'transport-jro-transfer', slug: 'kilimanjaro-airport-transfer-arusha', type: 'transport', subtype: 'transfer', sample: true,
    title: t('Kilimanjaro Airport ↔ Arusha Transfer'), summary: t('Private transfer, meet and greet at arrivals.'),
    description: t('A driver waits with your name at Kilimanjaro International Airport (JRO) and drives you to Arusha in about an hour. Flight tracking included, so late arrivals are covered.'),
    partnerId: 'upepo-transfers', destinationId: 'kilimanjaro', media: ['safari-crew'],
    price: { amountUsd: 55, unit: 'vehicle' }, taxRate: TZ_VAT, capacity: 4, durationHours: 1, amenities: ['meet_greet', 'ac', 'water'],
    rating: 4.8, reviewCount: 812, sustainability: {}, coordinates: [-3.43, 37.07], cancellation: 'flexible', instantBook: true
  },
  {
    id: 'transport-safari-vehicle', slug: 'safari-vehicle-with-driver-guide', type: 'transport', subtype: 'driver', sample: true,
    title: t('Safari Vehicle with Driver-Guide'), summary: t('A pop-top 4x4 and driver-guide for your own route.'),
    description: t('Hire a Land Cruiser with a pop-up roof and an English-speaking driver-guide by the day. Fuel included; park fees paid separately.'),
    partnerId: 'upepo-transfers', destinationId: 'ngorongoro', media: ['safari-crew', 'ngorongoro-elephant'],
    price: { amountUsd: 180, unit: 'vehicle' }, taxRate: TZ_VAT, capacity: 6, amenities: ['guide', 'vehicle', 'fuel', 'water'],
    rating: 4.7, reviewCount: 266, sustainability: {}, coordinates: [-3.37, 36.68], cancellation: 'moderate', instantBook: true
  },
  {
    id: 'transport-dar-zanzibar-ferry', slug: 'dar-es-salaam-zanzibar-fast-ferry', type: 'transport', subtype: 'boat', sample: true,
    title: t('Dar es Salaam ↔ Zanzibar Fast Ferry'), summary: t('About two hours between the city and Stone Town.'),
    description: t('Reserved seats on the fast ferry. Departures in the morning and afternoon; arrive 45 minutes early with your passport.'),
    partnerId: 'bahari-express', destinationId: 'zanzibar', media: ['nungwi'],
    price: { amountUsd: 40, unit: 'seat' }, taxRate: 0, capacity: 400, durationHours: 2, amenities: ['ac', 'luggage'],
    rating: 4.3, reviewCount: 1210, sustainability: {}, coordinates: [-6.82, 39.29], cancellation: 'moderate', instantBook: true, startTimes: ['07:00', '09:30', '12:30', '16:00']
  },
  {
    id: 'transport-serengeti-flight', slug: 'arusha-serengeti-light-aircraft', type: 'transport', subtype: 'flight', sample: true,
    title: t('Arusha ↔ Serengeti Light-Aircraft Seat'), summary: t('Scheduled flight to Seronera in about 75 minutes.'),
    description: t('A seat on a scheduled light aircraft from Arusha Airport to Seronera airstrip. 15 kg soft-bag luggage limit.'),
    partnerId: 'anga-air', destinationId: 'serengeti', media: ['serengeti-herds'],
    price: { amountUsd: 320, unit: 'seat' }, taxRate: TZ_VAT, capacity: 12, durationHours: 1.25, amenities: ['luggage'],
    rating: 4.6, reviewCount: 190, sustainability: {}, coordinates: [-3.37, 36.63], cancellation: 'strict', instantBook: true, startTimes: ['08:00', '13:00']
  },
  {
    id: 'transport-mpanda-katavi-transfer', slug: 'mpanda-katavi-transfer', type: 'transport', subtype: 'transfer',
    title: t('Mpanda ↔ Katavi Transfer'), summary: t('Road transfer between Mpanda and Katavi National Park with Mpanda Safari’s.'),
    description: t('A road transfer between Mpanda town or airstrip and Katavi National Park. Pick-up times and rates are confirmed by Mpanda Safari’s when you enquire.'),
    partnerId: 'mpanda-safaris', destinationId: 'katavi', media: ['safari-crew'],
    price: { amountUsd: 60, unit: 'vehicle', indicative: true }, taxRate: TZ_VAT, capacity: 6, amenities: ['vehicle'],
    reviewCount: 0, sustainability: { localOwned: true }, coordinates: [-6.35, 31.07], cancellation: 'moderate', instantBook: false
  },

  // ---------------- Events ----------------
  {
    id: 'event-stone-town-music-night', slug: 'stone-town-taarab-music-night', type: 'event', subtype: 'music', sample: true,
    title: t('Taarab Music Night, Stone Town'), summary: t('An evening of Zanzibari taarab in a courtyard venue.'),
    description: t('Taarab blends Swahili poetry with Arabic and Indian melodies. Local musicians play two sets with a short introduction to the instruments.'),
    partnerId: 'stone-town-arts', destinationId: 'zanzibar', media: ['cultural-dance', 'stonetown-street'],
    price: { amountUsd: 15, unit: 'ticket' }, taxRate: TZ_VAT, capacity: 120, durationHours: 2.5, amenities: ['family'],
    rating: 4.8, reviewCount: 87, sustainability: { communityLed: true }, coordinates: [-6.161, 39.189], cancellation: 'flexible', instantBook: true, date: '2026-11-14', startTimes: ['19:30']
  },
  {
    id: 'event-full-moon-dhow', slug: 'full-moon-dhow-cruise', type: 'event', subtype: 'cruise', sample: true,
    title: t('Full-Moon Dhow Cruise'), summary: t('Sail out of Nungwi as the moon rises over the Indian Ocean.'),
    description: t('Two hours on a traditional dhow with Swahili snacks and live drumming. Sails on the full-moon evening each month.'),
    partnerId: 'pwani-retreats', destinationId: 'zanzibar', media: ['nungwi', 'zanzibar-beach'],
    price: { amountUsd: 45, unit: 'ticket' }, taxRate: TZ_VAT, capacity: 24, durationHours: 2, amenities: ['snacks'],
    rating: 4.7, reviewCount: 134, sustainability: {}, coordinates: [-5.72, 39.29], cancellation: 'moderate', instantBook: true, date: '2026-11-24', startTimes: ['18:00']
  },
  {
    id: 'event-mbeya-harvest-market', slug: 'mbeya-highland-harvest-market', type: 'event', subtype: 'market', sample: true,
    title: t('Highland Harvest Market, Mbeya'), summary: t('Coffee, honey and highland produce from local growers.'),
    description: t('A one-day market with farmers from the Mbeya highlands: coffee tastings, honey, avocados and crafts. Entry is free; reserve a place on the guided coffee tasting.'),
    partnerId: 'mbeya-coffee', destinationId: 'ngozi', media: ['ngozi', 'cultural-dance'],
    price: { amountUsd: 0, unit: 'ticket' }, taxRate: 0, capacity: 300, durationHours: 6, amenities: ['family', 'accessible'],
    rating: 4.6, reviewCount: 21, sustainability: { communityLed: true, localOwned: true }, coordinates: [-8.91, 33.46], cancellation: 'flexible', instantBook: true, date: '2026-12-05', startTimes: ['09:00']
  },

  // ---------------- Local / community experiences ----------------
  {
    id: 'local-maasai-boma-visit', slug: 'maasai-boma-visit', type: 'local', subtype: 'culture', sample: true,
    title: t('Visit a Maasai Boma'), summary: t('Spend a morning with a Maasai family near the crater highlands.'),
    description: t('Your host shows you how a boma is built, how cattle shape daily life and how beadwork carries meaning. Fees are shared among participating households, and you can buy beadwork directly from the women who make it.'),
    partnerId: 'enkaji-community', destinationId: 'ngorongoro', media: ['maasai'],
    price: { amountUsd: 35, unit: 'person' }, taxRate: TZ_VAT, durationHours: 3, capacity: 10, amenities: ['guide', 'family'],
    rating: 4.8, reviewCount: 176, sustainability: { communityLed: true, localOwned: true, contributionUsd: 10, note: t('USD 10 per guest goes to the community water project.') },
    coordinates: [-3.19, 35.55], cancellation: 'flexible', instantBook: true, startTimes: ['09:00', '14:00']
  },
  {
    id: 'local-stone-town-heritage-walk', slug: 'stone-town-heritage-walk', type: 'local', subtype: 'tour', sample: true,
    title: t('Stone Town Heritage Walk'), summary: t('Three hours through the old town with a resident guide.'),
    description: t('Start at the Old Fort, then the House of Wonders, Darajani market, the Anglican cathedral on the site of the former slave market, and the carved doors of the merchant quarter. Your guide grew up in these lanes.'),
    partnerId: 'mji-mkongwe-walks', destinationId: 'zanzibar', media: ['pano-amphitheatre_zanzibar_fort', 'stonetown-street', 'stonetown-door'], pano: 'amphitheatre_zanzibar_fort',
    price: { amountUsd: 25, unit: 'person' }, taxRate: TZ_VAT, durationHours: 3, capacity: 10, amenities: ['guide', 'water', 'accessible'],
    rating: 4.9, reviewCount: 642, sustainability: { communityLed: true, localOwned: true }, coordinates: [-6.161, 39.189], cancellation: 'flexible', instantBook: true, startTimes: ['08:30', '15:30']
  },
  {
    id: 'local-spice-cooking-class', slug: 'spice-farm-and-swahili-cooking-class', type: 'local', subtype: 'food', sample: true,
    title: t('Spice Farm & Swahili Cooking Class'), summary: t('Pick spices in the morning, cook lunch with a local family.'),
    description: t('Walk a family spice farm to taste cloves, cinnamon, vanilla and lemongrass, then cook pilau and coconut curry together and eat on the veranda.'),
    partnerId: 'jiko-swahili', destinationId: 'zanzibar', media: ['stonetown-door'],
    price: { amountUsd: 45, unit: 'person' }, taxRate: TZ_VAT, durationHours: 5, capacity: 8, amenities: ['lunch', 'vegetarian', 'family'],
    rating: 4.8, reviewCount: 233, sustainability: { localOwned: true }, coordinates: [-6.07, 39.25], cancellation: 'flexible', instantBook: true, startTimes: ['09:00']
  },
  {
    id: 'local-mbeya-coffee-farm', slug: 'mbeya-coffee-farm-visit', type: 'local', subtype: 'food', sample: true,
    title: t('Highland Coffee Farm Visit'), summary: t('From cherry to cup with smallholder growers near Mbeya.'),
    description: t('Walk the coffee rows with a grower, help with pulping and drying in season, roast beans over a fire and taste the result. Buy coffee directly from the farm.'),
    partnerId: 'mbeya-coffee', destinationId: 'ngozi', media: ['ngozi'],
    price: { amountUsd: 30, unit: 'person' }, taxRate: TZ_VAT, durationHours: 3, capacity: 8, amenities: ['guide', 'tasting'],
    rating: 4.7, reviewCount: 41, sustainability: { communityLed: true, localOwned: true }, coordinates: [-9.05, 33.6], cancellation: 'flexible', instantBook: true, startTimes: ['09:00', '14:00']
  },
  {
    id: 'local-cultural-dance-evening', slug: 'ngoma-cultural-dance-evening', type: 'local', subtype: 'culture', sample: true,
    title: t('Ngoma Dance Evening'), summary: t('Drums, song and dance with a community troupe.'),
    description: t('A community group performs traditional ngoma dances and invites guests to join in. The evening ends with a shared meal.'),
    partnerId: 'stone-town-arts', destinationId: 'zanzibar', media: ['cultural-dance'],
    price: { amountUsd: 20, unit: 'person' }, taxRate: TZ_VAT, durationHours: 2, capacity: 30, amenities: ['family', 'dinner'],
    rating: 4.6, reviewCount: 112, sustainability: { communityLed: true }, coordinates: [-6.16, 39.2], cancellation: 'flexible', instantBook: true, startTimes: ['18:30']
  },
  {
    id: 'local-tanganyika-fishing-village', slug: 'lake-tanganyika-fishing-village', type: 'local', subtype: 'culture', sample: true,
    title: t('Lake Tanganyika Fishing Village'), summary: t('Meet fishing families and watch the lantern boats head out.'),
    description: t('Visit a beach landing in the late afternoon, learn how dagaa are caught and dried, then watch the lantern boats leave at dusk. Fees go directly to the hosting families.'),
    partnerId: 'tanganyika-shore', destinationId: 'lake-tanganyika', media: ['tanganyika'],
    price: { amountUsd: 30, unit: 'person' }, taxRate: TZ_VAT, durationHours: 3, capacity: 8, amenities: ['guide'],
    rating: 4.7, reviewCount: 18, sustainability: { communityLed: true, localOwned: true, contributionUsd: 5 }, coordinates: [-4.88, 29.62], cancellation: 'flexible', instantBook: true, startTimes: ['16:00']
  }
];
