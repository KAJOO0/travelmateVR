import type { Destination, LocalizedText } from '@/domain/types';

const NORTH: LocalizedText = { en: 'Northern circuit', fr: 'Circuit nord', de: 'Nördlicher Rundweg', zh: '北部环线', it: 'Circuito nord' };
const SOUTH: LocalizedText = { en: 'Southern circuit', fr: 'Circuit sud', de: 'Südlicher Rundweg', zh: '南部环线', it: 'Circuito sud' };
const WEST: LocalizedText = { en: 'Western circuit', fr: 'Circuit ouest', de: 'Westlicher Rundweg', zh: '西部环线', it: 'Circuito ovest' };
const ISLANDS: LocalizedText = { en: 'Zanzibar archipelago', fr: 'Archipel de Zanzibar', de: 'Sansibar-Archipel', zh: '桑给巴尔群岛', it: 'Arcipelago di Zanzibar' };
const SOUTH_HIGHLANDS: LocalizedText = { en: 'Southern Highlands', fr: 'Hautes terres du sud', de: 'Südliches Hochland', zh: '南部高地', it: 'Altopiani meridionali' };
const COAST: LocalizedText = { en: 'Coast', fr: 'Côte', de: 'Küste', zh: '沿海地区', it: 'Costa' };
const area = (en: string, fr: string, de: string, zh: string, it: string): LocalizedText => ({ en, fr, de, zh, it });

const PARK_SAFETY: LocalizedText = { en: 'Stay in your vehicle except at designated sites, follow your guide’s instructions near wildlife, and carry insect repellent. Malaria is present: talk to a travel clinic before you go.' };
const COAST_SAFETY: LocalizedText = { en: 'Swim at guarded beaches, use reef-safe sunscreen and drink bottled or filtered water. Dress modestly in Stone Town and other towns out of respect for local customs.' };
const CITY_SAFETY: LocalizedText = { en: 'Use licensed taxis or ride-hailing apps, keep valuables out of sight and avoid walking alone late at night.' };
const MOUNTAIN_SAFETY: LocalizedText = { en: 'Ascend slowly to reduce altitude sickness, travel with a licensed guide and pack layers for cold nights.' };

// Prices are indicative "from" prices per person per day in USD for demo purposes.
export const DESTINATIONS: Destination[] = [
  {
    id: 'serengeti', slug: 'serengeti-national-park', name: 'Serengeti National Park', countryId: 'tanzania',
    area: NORTH, media: 'serengeti-herds', gallery: ['serengeti-crossing', 'impala', 'safari-crew'], tags: ['wildlife', 'landscape', 'luxury'],
    coordinates: [-2.3333, 34.8333], bestMonths: [1, 2, 6, 7, 8, 9, 10], fromPriceUsd: 340, rating: 4.9, reviewCount: 2140,
    aliases: ['serengeti', 'great migration', 'migration'], ecoCertified: true, climate: 'northern-tz', typicalDays: [2, 4], familyFriendly: true,
    summary: { en: 'Endless plains, the Great Migration and some of the densest predator populations on Earth.' },
    overview: { en: 'The Serengeti covers almost 15,000 km² of grassland, kopjes and riverine forest. From December to March the herds calve on the southern plains; from July to October they cross the Mara River in the north. Lions, cheetahs and leopards follow them all year.' },
    safety: PARK_SAFETY,
    sustainability: { en: 'Park fees fund anti-poaching patrols and community projects. Choose camps that limit vehicle numbers at sightings and run on solar power.' },
    nearby: ['ngorongoro', 'tarangire', 'maasai-mara']
  },
  {
    id: 'ngorongoro', slug: 'ngorongoro-conservation-area', name: 'Ngorongoro Conservation Area', countryId: 'tanzania',
    area: NORTH, media: 'ngorongoro', gallery: ['ngorongoro-elephant', 'maasai'], tags: ['wildlife', 'landscape', 'culture'],
    coordinates: [-3.2, 35.5], bestMonths: [6, 7, 8, 9, 10, 12, 1, 2], fromPriceUsd: 310, rating: 4.8, reviewCount: 1630,
    aliases: ['ngorongoro', 'crater'], climate: 'crater-highlands', typicalDays: [1, 2], familyFriendly: true,
    summary: { en: 'A collapsed volcano sheltering a self-contained world of wildlife, alongside Maasai pastoral lands.' },
    overview: { en: 'The crater floor, 600 metres below the rim, holds lions, black rhinos, elephants and flamingo-lined soda lakes. The wider conservation area is shared with Maasai communities who graze their cattle here.' },
    safety: PARK_SAFETY,
    sustainability: { en: 'Crater visits are time-limited to protect the ecosystem. Cultural visits should be booked through community-run programmes so income stays local.' },
    nearby: ['serengeti', 'tarangire', 'kilimanjaro']
  },
  {
    id: 'kilimanjaro', slug: 'mount-kilimanjaro', name: 'Mount Kilimanjaro', countryId: 'tanzania',
    area: NORTH, media: 'kilimanjaro', gallery: ['kilimanjaro-trek'], tags: ['mountain', 'adventure', 'landscape'],
    coordinates: [-3.0674, 37.3556], bestMonths: [1, 2, 6, 7, 8, 9, 10], fromPriceUsd: 260, rating: 4.8, reviewCount: 1210,
    aliases: ['kilimanjaro', 'kili', 'kilimandjaro', 'kilimandscharo', 'kilimangiaro', '乞力马扎罗'], climate: 'northern-tz', typicalDays: [6, 9],
    summary: { en: 'Africa’s highest peak, climbed through rainforest, moorland and alpine desert to the glaciers of Uhuru.' },
    overview: { en: 'At 5,895 m, Kilimanjaro is the world’s tallest free-standing mountain. Routes such as Machame and Lemosho take six to eight days and need no technical climbing, but altitude makes a slow ascent essential.' },
    safety: MOUNTAIN_SAFETY,
    sustainability: { en: 'Book operators that follow fair porter pay and load limits, and carry out everything you bring in.' },
    nearby: ['ngorongoro', 'tarangire']
  },
  {
    id: 'zanzibar', slug: 'zanzibar', name: 'Zanzibar', countryId: 'zanzibar',
    area: ISLANDS, media: 'zanzibar-beach', gallery: ['stonetown-street', 'stonetown-door', 'nungwi', 'hotel-room', 'pano-amphitheatre_zanzibar_fort'], tags: ['beach', 'culture', 'lifestyle', 'luxury'],
    coordinates: [-6.1659, 39.2026], bestMonths: [6, 7, 8, 9, 10, 12, 1, 2], fromPriceUsd: 150, rating: 4.7, reviewCount: 2860,
    aliases: ['zanzibar', 'sansibar', 'unguja', 'stone town', 'nungwi', 'spice island', '桑给巴尔'], climate: 'coast', typicalDays: [3, 7], familyFriendly: true, accessible: true,
    summary: { en: 'Coral beaches, spice farms and the UNESCO-listed lanes of Stone Town.' },
    overview: { en: 'Unguja, the main island of the Zanzibar archipelago, mixes Swahili, Arab, Indian and European history. Stone Town’s carved doors and markets lead to beaches in the north and east, coral reefs and spice farms inland.' },
    safety: COAST_SAFETY,
    sustainability: { en: 'Pick dive and snorkel operators that never touch the reef, and buy crafts directly from cooperatives in Stone Town.' },
    nearby: ['dar-es-salaam']
  },
  {
    id: 'katavi', slug: 'katavi-national-park', name: 'Katavi National Park', countryId: 'tanzania',
    area: WEST, media: 'katavi', gallery: ['safari-crew', 'impala'], tags: ['wildlife', 'eco', 'adventure'],
    coordinates: [-6.8333, 31.25], bestMonths: [6, 7, 8, 9, 10], fromPriceUsd: 380, rating: 4.9, reviewCount: 210,
    aliases: ['katavi', 'mpanda'], ecoCertified: true, climate: 'western-tz', typicalDays: [3, 5],
    summary: { en: 'One of Africa’s most remote parks, known for huge buffalo herds and hippo pools in the dry season.' },
    overview: { en: 'Katavi sees only a few hundred visitors a year. In the dry season the Katuma River shrinks to pools crowded with hippos and crocodiles, and buffalo herds of a thousand or more gather on the Katisunga plain. The nearest town is Mpanda.' },
    safety: PARK_SAFETY,
    sustainability: { en: 'Low visitor numbers keep Katavi wild. Travelling with operators based in Mpanda keeps more income in the region.' },
    nearby: ['lake-tanganyika', 'ruaha']
  },
  {
    id: 'lake-tanganyika', slug: 'lake-tanganyika', name: 'Lake Tanganyika', countryId: 'tanzania',
    area: WEST, media: 'tanganyika', tags: ['lake', 'beach', 'eco'],
    coordinates: [-6.2556, 29.5108], bestMonths: [5, 6, 7, 8, 9, 10], fromPriceUsd: 190, rating: 4.6, reviewCount: 180,
    aliases: ['tanganyika', 'kigoma', 'mahale'], climate: 'western-tz', typicalDays: [2, 4],
    summary: { en: 'The world’s longest freshwater lake, with clear water, fishing villages and chimpanzee forests nearby.' },
    overview: { en: 'Lake Tanganyika runs 670 km along Tanzania’s western border. Its clear water holds hundreds of cichlid species, and the forests of Gombe and Mahale on its shores are home to wild chimpanzees.' },
    safety: COAST_SAFETY,
    sustainability: { en: 'Fishing communities depend on the lake. Choose guides from lakeshore villages and avoid single-use plastics.' },
    nearby: ['katavi']
  },
  {
    id: 'tarangire', slug: 'tarangire-national-park', name: 'Tarangire National Park', countryId: 'tanzania',
    area: NORTH, media: 'tarangire', tags: ['wildlife', 'family', 'landscape'],
    coordinates: [-3.8333, 36.0], bestMonths: [6, 7, 8, 9, 10], fromPriceUsd: 240, rating: 4.7, reviewCount: 940,
    aliases: ['tarangire'], climate: 'northern-tz', typicalDays: [1, 2], familyFriendly: true,
    summary: { en: 'Baobab country with some of the largest elephant herds in northern Tanzania.' },
    overview: { en: 'In the dry season the Tarangire River is the only water for miles, drawing elephants, zebras and wildebeest among ancient baobabs. It is an easy first stop on the northern circuit.' },
    safety: PARK_SAFETY,
    nearby: ['ngorongoro', 'serengeti', 'kilimanjaro']
  },
  {
    id: 'ruaha', slug: 'ruaha-national-park', name: 'Ruaha National Park', countryId: 'tanzania',
    area: SOUTH, media: 'ruaha', tags: ['wildlife', 'eco', 'adventure'],
    coordinates: [-7.5, 34.6], bestMonths: [6, 7, 8, 9, 10, 11], fromPriceUsd: 290, rating: 4.8, reviewCount: 320,
    aliases: ['ruaha', 'great ruaha'], ecoCertified: true, climate: 'southern-tz', typicalDays: [3, 4],
    summary: { en: 'Tanzania’s largest national park, wild and uncrowded along the Great Ruaha River.' },
    overview: { en: 'Ruaha is known for large lion prides, wild dogs and both greater and lesser kudu. Its rugged valleys see a fraction of the visitors of the north.' },
    safety: PARK_SAFETY,
    nearby: ['katavi', 'ngozi']
  },
  {
    id: 'ngozi', slug: 'ngozi-crater-lake', name: 'Ngozi Crater Lake', countryId: 'tanzania',
    area: SOUTH_HIGHLANDS, media: 'ngozi', tags: ['landscape', 'lake', 'adventure', 'eco'],
    coordinates: [-9.0, 33.55], bestMonths: [6, 7, 8, 9, 10], fromPriceUsd: 90, rating: 4.7, reviewCount: 96,
    aliases: ['ngozi', 'mbeya'], climate: 'southern-highlands', typicalDays: [1, 2],
    summary: { en: 'A forest-ringed volcanic crater lake above Mbeya, reached on foot through the Poroto Mountains.' },
    overview: { en: 'Ngozi is one of Africa’s largest crater lakes, about 2.5 km long, sitting in montane forest at roughly 2,000 m. Local legends surround its green water; guides from nearby villages lead the walk up.' },
    safety: MOUNTAIN_SAFETY,
    sustainability: { en: 'Hire village guides at the trailhead: guiding income supports forest protection around the crater.' },
    nearby: ['ruaha']
  },
  {
    id: 'dar-es-salaam', slug: 'dar-es-salaam', name: 'Dar es Salaam', countryId: 'tanzania',
    area: COAST, media: 'dar-city', tags: ['city', 'culture', 'beach'],
    coordinates: [-6.7924, 39.2083], bestMonths: [6, 7, 8, 9, 10, 12, 1, 2], fromPriceUsd: 110, rating: 4.4, reviewCount: 760,
    aliases: ['dar', 'dar es salaam', 'daressalaam'], climate: 'coast', typicalDays: [1, 2], accessible: true,
    summary: { en: 'Tanzania’s largest city: markets, Swahili food, and the gateway to Zanzibar and the southern parks.' },
    safety: CITY_SAFETY,
    nearby: ['zanzibar']
  },
  {
    id: 'maasai-mara', slug: 'maasai-mara', name: 'Maasai Mara National Reserve', countryId: 'kenya',
    area: area('South-west Kenya', 'Sud-ouest du Kenya', 'Südwest-Kenia', '肯尼亚西南部', 'Kenya sud-occidentale'),
    media: 'kenya-mara', gallery: ['kenya-lion'], tags: ['wildlife', 'luxury', 'culture'],
    coordinates: [-1.4061, 35.0], bestMonths: [7, 8, 9, 10], fromPriceUsd: 360, rating: 4.8, reviewCount: 1980,
    aliases: ['maasai mara', 'masai mara', 'mara'], climate: 'kenya-mara', typicalDays: [2, 4], familyFriendly: true,
    summary: { en: 'Kenya’s most famous reserve, where the migration crosses the Mara River each year.' },
    safety: PARK_SAFETY, nearby: ['serengeti']
  },
  {
    id: 'bwindi', slug: 'bwindi-impenetrable-forest', name: 'Bwindi Impenetrable Forest', countryId: 'uganda',
    area: area('South-west Uganda', 'Sud-ouest de l’Ouganda', 'Südwest-Uganda', '乌干达西南部', 'Uganda sud-occidentale'),
    media: 'uganda-gorilla', tags: ['wildlife', 'adventure', 'eco'],
    coordinates: [-1.0, 29.7], bestMonths: [6, 7, 8, 12, 1, 2], fromPriceUsd: 420, rating: 4.9, reviewCount: 640,
    aliases: ['bwindi', 'gorilla'], climate: 'great-lakes', typicalDays: [2, 3],
    summary: { en: 'Ancient rainforest that is home to almost half of the world’s mountain gorillas.' },
    safety: MOUNTAIN_SAFETY, nearby: ['volcanoes']
  },
  {
    id: 'volcanoes', slug: 'volcanoes-national-park', name: 'Volcanoes National Park', countryId: 'rwanda',
    area: area('Northern Province', 'Province du Nord', 'Nordprovinz', '北方省', 'Provincia settentrionale'),
    media: 'rwanda-volcanoes', tags: ['wildlife', 'mountain', 'luxury', 'eco'],
    coordinates: [-1.4833, 29.5333], bestMonths: [6, 7, 8, 9, 12, 1, 2], fromPriceUsd: 520, rating: 4.9, reviewCount: 410,
    aliases: ['volcanoes', 'virunga', 'musanze', 'gorilla', 'gorillas'], climate: 'great-lakes', typicalDays: [2, 3],
    summary: { en: 'Bamboo forest on the slopes of the Virunga volcanoes, with gorilla and golden monkey trekking.' },
    safety: MOUNTAIN_SAFETY, nearby: ['bwindi']
  },
  {
    id: 'cape-town', slug: 'cape-town', name: 'Cape Town', countryId: 'south-africa',
    area: area('Western Cape', 'Cap-Occidental', 'Westkap', '西开普省', 'Capo Occidentale'),
    media: 'southafrica-capetown', gallery: ['pano-table_mountain_1'], tags: ['city', 'beach', 'mountain', 'lifestyle'],
    coordinates: [-33.9249, 18.4241], bestMonths: [11, 12, 1, 2, 3], fromPriceUsd: 160, rating: 4.8, reviewCount: 3120,
    aliases: ['cape town', 'kapstadt', 'le cap', 'table mountain', '开普敦'], climate: 'cape', typicalDays: [3, 5], accessible: true, familyFriendly: true,
    summary: { en: 'A city between mountain and ocean, with winelands, penguins and the Cape Peninsula close by.' },
    safety: CITY_SAFETY, nearby: ['drakensberg']
  },
  {
    id: 'drakensberg', slug: 'drakensberg', name: 'Drakensberg', countryId: 'south-africa',
    area: area('KwaZulu-Natal', 'KwaZulu-Natal', 'KwaZulu-Natal', '夸祖鲁-纳塔尔省', 'KwaZulu-Natal'),
    media: 'pano-drakensberg_solitary_mountain', tags: ['mountain', 'adventure', 'landscape'],
    coordinates: [-28.9423, 29.3254], bestMonths: [3, 4, 5, 9, 10, 11], fromPriceUsd: 120, rating: 4.7, reviewCount: 540,
    aliases: ['drakensberg', 'ukhahlamba'], climate: 'highveld', typicalDays: [2, 4],
    summary: { en: 'Basalt escarpments, San rock art and high grasslands in a UNESCO World Heritage park.' },
    safety: MOUNTAIN_SAFETY, nearby: ['mpumalanga']
  },
  {
    id: 'mpumalanga', slug: 'mpumalanga-highveld', name: 'Mpumalanga Highveld', countryId: 'south-africa',
    area: area('Mpumalanga', 'Mpumalanga', 'Mpumalanga', '普马兰加省', 'Mpumalanga'),
    media: 'pano-mpumalanga_veld', gallery: ['pano-sabie_tent'], tags: ['landscape', 'wildlife', 'adventure'],
    coordinates: [-25.0998, 30.7899], bestMonths: [4, 5, 6, 7, 8, 9], fromPriceUsd: 130, rating: 4.6, reviewCount: 310,
    aliases: ['mpumalanga', 'sabie', 'panorama route', 'highveld'], climate: 'highveld', typicalDays: [2, 4], familyFriendly: true,
    summary: { en: 'Grassland plateaus, waterfalls around Sabie and the road to the Kruger National Park.' },
    safety: PARK_SAFETY, nearby: ['drakensberg']
  },
  {
    id: 'okavango', slug: 'okavango-delta', name: 'Okavango Delta', countryId: 'botswana',
    area: area('North-west Botswana', 'Nord-ouest du Botswana', 'Nordwest-Botswana', '博茨瓦纳西北部', 'Botswana nord-occidentale'),
    media: 'botswana-okavango', tags: ['wildlife', 'luxury', 'eco', 'lake'],
    coordinates: [-19.3, 22.9], bestMonths: [6, 7, 8, 9, 10], fromPriceUsd: 610, rating: 4.9, reviewCount: 520,
    aliases: ['okavango', 'delta', 'maun'], ecoCertified: true, climate: 'okavango', typicalDays: [3, 5],
    summary: { en: 'An inland delta of channels and islands explored by mokoro canoe and on foot.' },
    safety: PARK_SAFETY, nearby: ['victoria-falls']
  },
  {
    id: 'sossusvlei', slug: 'sossusvlei', name: 'Sossusvlei', countryId: 'namibia',
    area: area('Namib-Naukluft', 'Namib-Naukluft', 'Namib-Naukluft', '纳米布-诺克卢福', 'Namib-Naukluft'),
    media: 'namibia-sossusvlei', tags: ['landscape', 'adventure'],
    coordinates: [-24.7333, 15.2833], bestMonths: [4, 5, 6, 7, 8, 9], fromPriceUsd: 210, rating: 4.8, reviewCount: 870,
    aliases: ['sossusvlei', 'namib', 'deadvlei'], climate: 'namib', typicalDays: [2, 3],
    summary: { en: 'Some of the tallest dunes on Earth, glowing red at sunrise above white clay pans.' },
    safety: { en: 'Carry plenty of water, start dune climbs at dawn and keep to marked tracks when driving.' }
  },
  {
    id: 'victoria-falls', slug: 'victoria-falls', name: 'Victoria Falls', countryId: 'zambia',
    area: area('Livingstone', 'Livingstone', 'Livingstone', '利文斯顿', 'Livingstone'),
    media: 'zambia-vicfalls', tags: ['landscape', 'adventure'],
    coordinates: [-17.9243, 25.8572], bestMonths: [2, 3, 4, 5, 6, 7], fromPriceUsd: 180, rating: 4.8, reviewCount: 1450,
    aliases: ['victoria falls', 'vic falls', 'mosi-oa-tunya', 'livingstone'], climate: 'zambezi', typicalDays: [2, 3], familyFriendly: true,
    summary: { en: 'The smoke that thunders: a mile-wide curtain of water on the Zambezi.' },
    safety: { en: 'Stay behind barriers at viewpoints, expect to get wet in high water and book river activities only with licensed operators.' },
    nearby: ['mana-pools', 'okavango']
  },
  {
    id: 'mana-pools', slug: 'mana-pools-national-park', name: 'Mana Pools National Park', countryId: 'zimbabwe',
    area: area('Lower Zambezi Valley', 'Vallée du bas Zambèze', 'Unteres Sambesital', '赞比西河下游谷地', 'Valle del basso Zambesi'),
    media: 'zimbabwe-manapools', tags: ['wildlife', 'eco', 'adventure'],
    coordinates: [-15.9, 29.3833], bestMonths: [6, 7, 8, 9, 10], fromPriceUsd: 330, rating: 4.8, reviewCount: 260,
    aliases: ['mana pools', 'zambezi'], ecoCertified: true, climate: 'zambezi', typicalDays: [3, 4],
    summary: { en: 'Floodplain woodland on the Zambezi, famous for walking safaris and canoe trips.' },
    safety: PARK_SAFETY, nearby: ['victoria-falls', 'great-zimbabwe']
  },
  {
    id: 'great-zimbabwe', slug: 'great-zimbabwe', name: 'Great Zimbabwe', countryId: 'zimbabwe',
    area: area('Masvingo Province', 'Province de Masvingo', 'Provinz Masvingo', '马斯温戈省', 'Provincia di Masvingo'),
    media: 'zimbabwe-greatzim', tags: ['culture', 'landscape'],
    coordinates: [-20.2675, 30.9339], bestMonths: [4, 5, 6, 7, 8, 9], fromPriceUsd: 120, rating: 4.6, reviewCount: 190,
    aliases: ['great zimbabwe', 'masvingo'], climate: 'highveld', typicalDays: [1, 2], accessible: true,
    summary: { en: 'The stone ruins of a medieval African city, a UNESCO World Heritage Site.' },
    nearby: ['mana-pools']
  },

  // ---------- Global showcase ----------
  // New to TravelMateVR: no reviews yet (rating 0) and no partners listed. Prices are indicative.
  {
    id: 'bali', slug: 'bali', name: 'Bali', countryId: 'indonesia',
    area: area('Lesser Sunda Islands', 'Petites îles de la Sonde', 'Kleine Sundainseln', '小巽他群岛', 'Piccole Isole della Sonda'),
    media: 'bali-rice', gallery: ['bali-temple'], tags: ['culture', 'beach', 'lifestyle', 'landscape'],
    coordinates: [-8.4095, 115.1889], bestMonths: [4, 5, 6, 7, 8, 9, 10], fromPriceUsd: 90, rating: 0, reviewCount: 0,
    aliases: ['bali', 'ubud', 'tegallalang', 'jatiluwih', 'denpasar', '巴厘岛'], climate: 'bali', typicalDays: [5, 10], familyFriendly: true,
    summary: { en: 'Terraced rice fields, Hindu water temples, surf beaches and volcano sunrise hikes.' },
    overview: { en: 'Bali is the only Hindu-majority island in Indonesia. Inland, the subak irrigation system, a UNESCO World Heritage cultural landscape, feeds rice terraces such as Jatiluwih. Temples like Pura Ulun Danu Bratan sit on crater lakes, while the coast mixes surf breaks, reefs and fishing villages.' },
    safety: { en: 'Respect temple dress codes (sarong and sash), use licensed drivers, and drink bottled or filtered water. Check volcano alerts before hiking Mount Batur or Agung.' },
    sustainability: { en: 'Stay with locally owned homestays, refill water bottles, and choose community-run village tours so income stays in the villages.' },
    nearby: []
  },
  {
    id: 'ha-long-bay', slug: 'ha-long-bay', name: 'Ha Long Bay', countryId: 'vietnam',
    area: area('Quảng Ninh Province', 'Province de Quảng Ninh', 'Provinz Quảng Ninh', '广宁省', 'Provincia di Quảng Ninh'),
    media: 'halong-bay', gallery: ['halong-boat'], tags: ['landscape', 'beach', 'adventure'],
    coordinates: [20.9101, 107.1839], bestMonths: [3, 4, 5, 9, 10, 11], fromPriceUsd: 110, rating: 0, reviewCount: 0,
    aliases: ['ha long', 'halong', 'cat ba', 'lan ha', 'vietnam', '下龙湾'], climate: 'halong', typicalDays: [2, 3], familyFriendly: true,
    summary: { en: 'About 1,600 limestone islands and islets rising from emerald water in the Gulf of Tonkin.' },
    overview: { en: 'Ha Long Bay is a UNESCO World Heritage Site. Overnight boats thread between karst towers, caves such as Sung Sot and floating fishing communities; kayaks reach quieter lagoons in neighbouring Lan Ha Bay near Cat Ba Island.' },
    safety: { en: 'Choose licensed boats with life jackets for every passenger. Cruises can be cancelled at short notice during storms, mostly from June to September.' },
    sustainability: { en: 'Pick operators that manage waste on board and avoid single-use plastics in the bay.' },
    nearby: []
  },
  {
    id: 'angkor', slug: 'angkor-archaeological-park', name: 'Angkor Archaeological Park', countryId: 'cambodia',
    area: area('Siem Reap', 'Siem Reap', 'Siem Reap', '暹粒', 'Siem Reap'),
    media: 'angkor-wat', gallery: ['angkor-gallery'], tags: ['culture', 'landscape'],
    coordinates: [13.4125, 103.867], bestMonths: [11, 12, 1, 2, 3], fromPriceUsd: 80, rating: 0, reviewCount: 0,
    aliases: ['angkor', 'angkor wat', 'siem reap', 'bayon', 'ta prohm', '吴哥窟'], climate: 'siem-reap', typicalDays: [2, 4], accessible: true,
    summary: { en: 'The temples of the Khmer Empire, from Angkor Wat at sunrise to the faces of the Bayon.' },
    overview: { en: 'Angkor holds the remains of Khmer capitals from the 9th to the 15th century across some 400 km². Angkor Wat, built in the 12th century, is the largest religious monument in the world; Ta Prohm is still wrapped in the roots of giant trees.' },
    safety: { en: 'Carry water and sun protection, keep to marked paths and cover shoulders and knees in the temples.' },
    sustainability: { en: 'Hire licensed local guides and tuk-tuk drivers, and do not climb on fragile carvings.' },
    nearby: []
  },
  {
    id: 'petra', slug: 'petra-and-wadi-rum', name: 'Petra & Wadi Rum', countryId: 'jordan',
    area: area('Southern Jordan', 'Sud de la Jordanie', 'Südjordanien', '约旦南部', 'Giordania meridionale'),
    media: 'petra-monastery', gallery: ['wadi-rum', 'pano-wadi_rum_night'], tags: ['culture', 'adventure', 'landscape'],
    coordinates: [30.3285, 35.4444], bestMonths: [3, 4, 5, 10, 11], fromPriceUsd: 120, rating: 0, reviewCount: 0,
    aliases: ['petra', 'wadi rum', 'wadi musa', 'jordan', 'treasury', 'monastery', '佩特拉'], climate: 'petra', typicalDays: [2, 4],
    summary: { en: 'The rock-cut Nabataean city of Petra and the sandstone mountains of the Wadi Rum desert.' },
    overview: { en: 'Petra was carved into rose-coloured cliffs more than 2,000 years ago. A walk through the Siq canyon leads to the Treasury, and 800 steps climb to the Monastery. Two hours south, Wadi Rum’s desert camps offer jeep tours, camel treks and some of the darkest night skies in the region.' },
    safety: { en: 'Start early to avoid the midday heat, wear sturdy shoes for the steps, and only book desert tours with licensed Bedouin-run camps.' },
    sustainability: { en: 'Buy crafts from Bedouin cooperatives and keep to vehicle tracks in Wadi Rum to protect the desert surface.' },
    nearby: []
  },
  {
    id: 'dubai', slug: 'dubai', name: 'Dubai', countryId: 'uae',
    area: area('Emirate of Dubai', 'Émirat de Dubaï', 'Emirat Dubai', '迪拜酋长国', 'Emirato di Dubai'),
    media: 'dubai-skyline', gallery: ['dubai-dunes'], tags: ['city', 'luxury', 'lifestyle', 'adventure'],
    coordinates: [25.2048, 55.2708], bestMonths: [11, 12, 1, 2, 3], fromPriceUsd: 160, rating: 0, reviewCount: 0,
    aliases: ['dubai', 'uae', 'emirates', 'burj khalifa', 'al qudra', '迪拜'], climate: 'dubai', typicalDays: [3, 5], familyFriendly: true, accessible: true,
    summary: { en: 'Record-breaking architecture, old Creek-side souks and desert camps an hour from the city.' },
    overview: { en: 'Dubai combines the Burj Khalifa, the world’s tallest building, with the abra boats and spice and gold souks of the historic Creek. East of the city, the Dubai Desert Conservation Reserve protects Arabian oryx and gazelles among red dunes.' },
    safety: { en: 'Summer temperatures pass 40 °C: plan outdoor activities for early morning or evening and drink plenty of water. Dress modestly in traditional areas and places of worship.' },
    sustainability: { en: 'Choose desert operators inside the conservation reserve, which limits vehicle numbers and protects wildlife.' },
    nearby: ['muscat']
  },
  {
    id: 'muscat', slug: 'muscat-and-wahiba-sands', name: 'Muscat & Wahiba Sands', countryId: 'oman',
    area: area('Muscat & Ash Sharqiyah', 'Mascate et Ash Sharqiyah', 'Maskat und asch-Scharqiyya', '马斯喀特与东部省', 'Mascate e Ash Sharqiyah'),
    media: 'muscat-bay', gallery: ['wahiba-sands'], tags: ['culture', 'adventure', 'beach'],
    coordinates: [23.6139, 58.5922], bestMonths: [10, 11, 12, 1, 2, 3], fromPriceUsd: 130, rating: 0, reviewCount: 0,
    aliases: ['muscat', 'oman', 'wahiba', 'sharqiya sands', 'mutrah', '马斯喀特'], climate: 'muscat', typicalDays: [3, 6], familyFriendly: true,
    summary: { en: 'Portuguese-era forts on a quiet bay, mountain wadis and the dunes of the Wahiba Sands.' },
    overview: { en: 'Old Muscat sits between the Al Jalali and Al Mirani forts, a short drive from the Mutrah souk and corniche. Inland, palm-lined wadis such as Wadi Bani Khalid lead to the Wahiba Sands, where Bedouin camps host overnight stays among the dunes.' },
    safety: { en: 'Wadis can flood quickly after rain: check the forecast and never camp in a wadi bed. Desert driving should be done with an experienced local driver.' },
    sustainability: { en: 'Stay in small desert camps run by local families and take all rubbish back out of the wadis.' },
    nearby: ['dubai']
  },
  {
    id: 'santorini', slug: 'santorini', name: 'Santorini', countryId: 'greece',
    area: area('Cyclades', 'Cyclades', 'Kykladen', '基克拉泽斯群岛', 'Cicladi'),
    media: 'santorini-oia', gallery: ['pano-santorini_imerovigli'], tags: ['beach', 'culture', 'luxury', 'lifestyle'],
    coordinates: [36.3932, 25.4615], bestMonths: [4, 5, 6, 9, 10], fromPriceUsd: 170, rating: 0, reviewCount: 0,
    aliases: ['santorini', 'thira', 'oia', 'fira', 'imerovigli', 'greece', '圣托里尼'], climate: 'santorini', typicalDays: [3, 5],
    summary: { en: 'Cliff-top villages above a flooded volcanic caldera, with black-sand beaches and old vineyards.' },
    overview: { en: 'Santorini is the rim of a volcano that erupted around 3,600 years ago. Fira, Imerovigli and Oia line the caldera edge 300 metres above the sea; the Fira–Oia path follows the rim for about 10 km. Ancient Akrotiri, buried by the eruption, is one of the best-preserved Bronze Age sites in Europe.' },
    safety: { en: 'Walk the caldera path early in the day with water and sun protection, and take care on steep, uneven steps.' },
    sustainability: { en: 'Visit outside the peak cruise hours, and choose family wineries and locally owned guesthouses.' },
    nearby: []
  },
  {
    id: 'bled', slug: 'lake-bled', name: 'Lake Bled', countryId: 'slovenia',
    area: area('Julian Alps', 'Alpes juliennes', 'Julische Alpen', '尤利安阿尔卑斯山', 'Alpi Giulie'),
    media: 'bled-lake', gallery: ['video-bled-timelapse'], tags: ['lake', 'landscape', 'family', 'adventure'],
    coordinates: [46.3636, 14.0938], bestMonths: [5, 6, 7, 8, 9], fromPriceUsd: 120, rating: 0, reviewCount: 0,
    aliases: ['bled', 'lake bled', 'blejsko jezero', 'slovenia', 'triglav', '布莱德湖'], climate: 'bled', typicalDays: [2, 3], familyFriendly: true, accessible: true,
    summary: { en: 'An alpine lake with a church on its only island, a cliff-top castle and a 6 km lakeside path.' },
    overview: { en: 'Pletna boats row visitors to Bled Island, where 99 steps lead to the Church of the Assumption. Bled Castle stands on a cliff above the north shore, and the Vintgar Gorge and Triglav National Park are a short drive away.' },
    safety: { en: 'Swim only in marked areas; the water stays cool even in summer. Mountain weather changes fast in the Julian Alps.' },
    sustainability: { en: 'Walk or cycle around the lake: cars are restricted on the lakeside road in the summer season.' },
    nearby: []
  },
  {
    id: 'madeira', slug: 'madeira', name: 'Madeira', countryId: 'portugal',
    area: area('Autonomous Region of Madeira', 'Région autonome de Madère', 'Autonome Region Madeira', '马德拉自治区', 'Regione Autonoma di Madeira'),
    media: 'madeira-cliffs', gallery: ['madeira-saolourenco', 'video-madeira-cabo-girao'], tags: ['landscape', 'adventure', 'mountain'],
    coordinates: [32.6669, -16.9241], bestMonths: [4, 5, 6, 7, 8, 9, 10], fromPriceUsd: 110, rating: 0, reviewCount: 0,
    aliases: ['madeira', 'funchal', 'cabo girao', 'levada', 'portugal', '马德拉'], climate: 'madeira', typicalDays: [4, 7], familyFriendly: true,
    summary: { en: 'A volcanic Atlantic island of sea cliffs, levada walking trails and laurel forest.' },
    overview: { en: 'Madeira lies about 1,000 km south-west of Lisbon. Cabo Girão, one of Europe’s highest sea cliffs at 580 m, has a glass skywalk over the ocean. Hundreds of kilometres of levadas (old irrigation channels) lead through the Laurisilva forest, a UNESCO World Heritage Site.' },
    safety: { en: 'Carry a torch for levada tunnels, check trail closures after rain, and keep to the path on exposed sections.' },
    sustainability: { en: 'Stick to official trails in the Laurisilva and use local guides for mountain walks.' },
    nearby: []
  }
];
