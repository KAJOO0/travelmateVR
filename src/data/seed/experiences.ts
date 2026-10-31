import type { Category, Experience } from '@/domain/types';

// Immersive experiences, in order of format priority: `video` (360° video), `pano` (360° photo), and
// otherwise a panoramic preview of the photo until a 360° capture is produced for them.
export const EXPERIENCES: Experience[] = [
  {
    id: 'serengeti-migration', slug: 'serengeti-wildebeest-migration', destinationId: 'serengeti', kind: 'wildlife',
    media: 'serengeti-herds', durationMin: 14, hasNarration: true, rating: 4.9, reviewCount: 1284, featured: true,
    listingIds: ['safari-serengeti-migration-private', 'safari-northern-circuit-group', 'stay-serengeti-kijani-camp'],
    title: {
      en: 'Serengeti Wildebeest Migration', fr: 'Migration des gnous du Serengeti', de: 'Gnu-Wanderung in der Serengeti',
      zh: '塞伦盖蒂角马大迁徙', it: 'Migrazione degli gnu nel Serengeti'
    },
    tagline: {
      en: 'Experience the Great Migration in 360°.', fr: 'Vivez la Grande Migration en 360°.', de: 'Erleben Sie die Große Migration in 360°.',
      zh: '以 360° 视角亲历动物大迁徙。', it: 'Vivi la Grande Migrazione a 360°.'
    },
    narration: { en: 'More than a million wildebeest, joined by zebras and gazelles, move through the Serengeti ecosystem every year, following the rains. What you see here is a column of herds crossing the open plains. Look closely and you will see calves keeping close to their mothers.' },
    facts: [
      { en: 'Around 1.3 million wildebeest take part in the migration each year.' },
      { en: 'Calving peaks in February on the southern plains, when about 8,000 calves are born a day.' },
      { en: 'River crossings in the north usually happen between July and October.' }
    ]
  },
  {
    id: 'mara-river-crossing', slug: 'mara-river-crossing', destinationId: 'serengeti', kind: 'wildlife',
    media: 'serengeti-crossing', durationMin: 9, hasNarration: true, rating: 4.8, reviewCount: 642,
    listingIds: ['safari-serengeti-migration-private'],
    title: { en: 'Mara River Crossing', fr: 'Traversée de la rivière Mara', de: 'Überquerung des Mara-Flusses', zh: '马拉河渡河', it: 'Attraversamento del fiume Mara' },
    tagline: {
      en: 'Stand on the riverbank as the herds plunge in.', fr: 'Sur la rive, quand les troupeaux plongent.', de: 'Am Ufer, wenn die Herden ins Wasser stürzen.',
      zh: '站在河岸，看兽群跃入河中。', it: 'Sulla riva mentre le mandrie si tuffano.'
    },
    narration: { en: 'At the Mara River the herds hesitate for hours before the first animal jumps. Then thousands follow in minutes, past waiting crocodiles.' }
  },
  {
    id: 'ngorongoro-crater-floor', slug: 'ngorongoro-crater-floor', destinationId: 'ngorongoro', kind: 'landscape',
    media: 'ngorongoro', durationMin: 11, hasNarration: true, rating: 4.8, reviewCount: 538, featured: true,
    listingIds: ['safari-ngorongoro-day', 'stay-ngorongoro-rim-lodge'],
    title: { en: 'Ngorongoro Crater Floor', fr: 'Au fond du cratère du Ngorongoro', de: 'Im Ngorongoro-Krater', zh: '恩戈罗恩戈罗火山口底', it: 'Il fondo del cratere di Ngorongoro' },
    tagline: {
      en: 'Descend 600 metres into a world of its own.', fr: 'Descendez 600 mètres dans un monde à part.', de: 'Steigen Sie 600 Meter in eine eigene Welt hinab.',
      zh: '下降 600 米，走进自成一体的世界。', it: 'Scendi di 600 metri in un mondo a sé.'
    },
    narration: { en: 'The Ngorongoro Crater is about 20 kilometres across. Its walls keep much of the wildlife inside all year, which makes it one of the best places in Africa to see black rhinos.' },
    facts: [{ en: 'The crater formed when a volcano collapsed about two to three million years ago.' }, { en: 'Around 25,000 large animals live on the crater floor.' }]
  },
  {
    id: 'kilimanjaro-machame', slug: 'kilimanjaro-machame-route', destinationId: 'kilimanjaro', kind: 'adventure',
    media: 'kilimanjaro-trek', durationMin: 16, hasNarration: true, rating: 4.8, reviewCount: 417, featured: true,
    listingIds: ['activity-kilimanjaro-machame'],
    title: { en: 'Kilimanjaro: Machame Route', fr: 'Kilimandjaro : voie Machame', de: 'Kilimandscharo: Machame-Route', zh: '乞力马扎罗：马查姆路线', it: 'Kilimangiaro: via Machame' },
    tagline: {
      en: 'Walk through the giant groundsels of the moorland zone.', fr: 'Marchez parmi les séneçons géants de la lande.', de: 'Wandern Sie durch die Riesensenezien der Heidezone.',
      zh: '穿行于高沼地带的巨型千里光之间。', it: 'Cammina tra i senecioni giganti della brughiera.'
    },
    narration: { en: 'Above the rainforest, Kilimanjaro’s moorland is dotted with giant groundsels, plants found only on East Africa’s high mountains. Mist often rolls up the slopes in the afternoon.' }
  },
  {
    id: 'stone-town-walk', slug: 'stone-town-heritage-walk', destinationId: 'zanzibar', kind: 'culture',
    media: 'pano-amphitheatre_zanzibar_fort', pano: 'amphitheatre_zanzibar_fort', durationMin: 12, hasNarration: true, rating: 4.7, reviewCount: 389, featured: true,
    listingIds: ['local-stone-town-heritage-walk', 'stay-stone-town-guesthouse', 'restaurant-stone-town-swahili'],
    title: { en: 'Stone Town Heritage Walk', fr: 'Promenade patrimoniale à Stone Town', de: 'Kulturspaziergang durch Stone Town', zh: '石头城遗产漫步', it: 'Passeggiata storica a Stone Town' },
    tagline: {
      en: 'Start inside the Old Fort, then into Swahili history.', fr: 'Départ dans le Vieux Fort, puis dans l’histoire swahilie.', de: 'Start im Old Fort, dann hinein in die Swahili-Geschichte.',
      zh: '从古堡出发，走进斯瓦希里历史。', it: 'Si parte dal Vecchio Forte, poi nella storia swahili.'
    },
    narration: { en: 'You are standing in the amphitheatre of the Old Fort, Ngome Kongwe, the oldest building in Stone Town. It was built around 1700 after the Omanis drove out the Portuguese. Today its open-air stage hosts concerts and film screenings, and the lanes beyond lead to Forodhani Gardens and the sea.' },
    facts: [
      { en: 'Stone Town was listed as a UNESCO World Heritage Site in 2000.' },
      { en: 'The town has more than 500 carved wooden doors, many with brass studs.' }
    ],
    hotspots: [
      { yaw: 0, pitch: 6, kind: 'culture', title: { en: 'The fort walls' }, text: { en: 'Coral stone and lime mortar walls, raised by the Omanis around 1700 on the site of an earlier Portuguese church.' } },
      { yaw: -95, pitch: -8, kind: 'culture', title: { en: 'Amphitheatre seating' }, text: { en: 'Stone terraces where audiences gather for music and film festival screenings.' } },
      { yaw: 70, pitch: 14, kind: 'nearby', title: { en: 'Toward the waterfront' }, text: { en: 'A few minutes’ walk west: Forodhani Gardens, with an evening street-food market by the sea.' } },
      { yaw: 165, pitch: 2, kind: 'info', title: { en: 'Visiting tips' }, text: { en: 'The fort is free to enter. Go in the morning when it is cooler, and carry small change for craft stalls inside.' } }
    ]
  },
  {
    id: 'zanzibar-shoreline', slug: 'zanzibar-shoreline', destinationId: 'zanzibar', kind: 'beach',
    media: 'zanzibar-beach', durationMin: 7, hasNarration: false, rating: 4.7, reviewCount: 455,
    listingIds: ['stay-zanzibar-pwani-retreat', 'activity-zanzibar-snorkel'],
    title: { en: 'Zanzibar Shoreline', fr: 'Littoral de Zanzibar', de: 'Sansibars Küste', zh: '桑给巴尔海岸线', it: 'Costa di Zanzibar' },
    tagline: {
      en: 'Turquoise water, dhows and coral cliffs.', fr: 'Eaux turquoise, boutres et falaises de corail.', de: 'Türkisfarbenes Wasser, Dhaus und Korallenklippen.',
      zh: '碧蓝海水、独桅帆船与珊瑚崖。', it: 'Acqua turchese, dhow e scogliere di corallo.'
    }
  },
  {
    id: 'maasai-living-culture', slug: 'maasai-living-culture', destinationId: 'ngorongoro', kind: 'culture',
    media: 'maasai', durationMin: 10, hasNarration: true, rating: 4.8, reviewCount: 301, featured: true,
    listingIds: ['local-maasai-boma-visit'],
    title: { en: 'Maasai Living Culture', fr: 'Culture vivante maasaï', de: 'Lebendige Maasai-Kultur', zh: '马赛人的鲜活文化', it: 'Cultura viva maasai' },
    tagline: {
      en: 'Song, dance and daily life with a Maasai community.', fr: 'Chants, danse et vie quotidienne avec une communauté maasaï.', de: 'Gesang, Tanz und Alltag mit einer Maasai-Gemeinschaft.',
      zh: '与马赛社区一起歌唱、舞蹈和生活。', it: 'Canti, danze e vita quotidiana con una comunità maasai.'
    },
    narration: { en: 'The adumu, often called the jumping dance, is performed by young men during ceremonies. The group sings in a call-and-response while each dancer jumps in turn.' }
  },
  {
    id: 'katavi-dry-season', slug: 'katavi-dry-season', destinationId: 'katavi', kind: 'wildlife',
    media: 'katavi', durationMin: 13, hasNarration: true, rating: 4.9, reviewCount: 96, featured: true,
    listingIds: ['safari-katavi-fahari-3day', 'safari-mpanda-katavi-tanganyika'],
    title: { en: 'Katavi in the Dry Season', fr: 'Katavi en saison sèche', de: 'Katavi in der Trockenzeit', zh: '旱季的卡塔维', it: 'Katavi nella stagione secca' },
    tagline: {
      en: 'Buffalo herds and hippo pools far from the crowds.', fr: 'Troupeaux de buffles et mares à hippos, loin des foules.', de: 'Büffelherden und Flusspferdbecken abseits der Massen.',
      zh: '远离人潮的水牛群与河马池。', it: 'Mandrie di bufali e pozze di ippopotami, lontano dalla folla.'
    },
    narration: { en: 'As the dry season deepens, Katavi’s rivers shrink to a chain of pools. Hundreds of hippos crowd into the remaining water, and buffalo herds move across the Katisunga floodplain.' }
  },
  {
    id: 'tarangire-elephants', slug: 'tarangire-elephants', destinationId: 'tarangire', kind: 'wildlife',
    media: 'tarangire', durationMin: 8, hasNarration: true, rating: 4.7, reviewCount: 233,
    listingIds: ['safari-tarangire-day'],
    title: { en: 'Elephants of Tarangire', fr: 'Les éléphants de Tarangire', de: 'Die Elefanten von Tarangire', zh: '塔兰吉雷的大象', it: 'Gli elefanti di Tarangire' },
    tagline: {
      en: 'Baobabs, dust and families on the move.', fr: 'Baobabs, poussière et familles en mouvement.', de: 'Baobabs, Staub und wandernde Familien.',
      zh: '猴面包树、尘土与迁移的象群。', it: 'Baobab, polvere e famiglie in cammino.'
    }
  },
  {
    id: 'ngozi-crater-hike', slug: 'ngozi-crater-lake-hike', destinationId: 'ngozi', kind: 'landscape',
    media: 'ngozi', durationMin: 9, hasNarration: true, rating: 4.7, reviewCount: 64,
    listingIds: ['activity-ngozi-hike'],
    title: { en: 'Ngozi Crater Lake Hike', fr: 'Randonnée au lac de cratère Ngozi', de: 'Wanderung zum Ngozi-Kratersee', zh: '恩戈齐火山口湖徒步', it: 'Escursione al lago craterico Ngozi' },
    tagline: {
      en: 'Through montane forest to the rim above Mbeya.', fr: 'À travers la forêt de montagne jusqu’au bord du cratère.', de: 'Durch Bergwald hinauf zum Kraterrand über Mbeya.',
      zh: '穿越山地森林，登上姆贝亚上方的火山口边缘。', it: 'Attraverso la foresta montana fino al bordo sopra Mbeya.'
    },
    narration: { en: 'From the rim, the lake lies about 200 metres below, its colour shifting from emerald to deep blue with the light. The surrounding forest is home to colobus monkeys and many bird species.' }
  },
  {
    id: 'table-mountain-summit', slug: 'table-mountain-summit', destinationId: 'cape-town', kind: 'landscape',
    media: 'pano-table_mountain_1', pano: 'table_mountain_1', startYaw: 40, durationMin: 8, hasNarration: true, rating: 4.8, reviewCount: 712, featured: true,
    listingIds: ['activity-table-mountain-hike', 'stay-cape-town-guesthouse'],
    title: { en: 'Table Mountain Summit', fr: 'Au sommet de la Montagne de la Table', de: 'Auf dem Tafelberg', zh: '桌山之巅', it: 'In cima alla Table Mountain' },
    tagline: {
      en: 'Fynbos, sandstone and the Atlantic at sunset.', fr: 'Fynbos, grès et Atlantique au coucher du soleil.', de: 'Fynbos, Sandstein und der Atlantik bei Sonnenuntergang.',
      zh: '日落时的凡波斯灌木、砂岩与大西洋。', it: 'Fynbos, arenaria e l’Atlantico al tramonto.'
    },
    narration: { en: 'You are on the plateau of Table Mountain, more than 1,000 metres above Cape Town. The low shrubs around you are fynbos, part of the Cape Floral Kingdom, the smallest and richest of the world’s six floral kingdoms.' },
    facts: [{ en: 'The Cape Floral Region holds around 9,000 plant species, most found nowhere else.' }],
    hotspots: [
      { yaw: 60, pitch: 2, kind: 'nearby', title: { en: 'Lion’s Head and the Atlantic' }, text: { en: 'The pointed peak is Lion’s Head, a popular sunrise and full-moon hike. Beyond it lie the Atlantic seaboard suburbs.' } },
      { yaw: -60, pitch: -22, kind: 'info', title: { en: 'Fynbos' }, text: { en: 'Proteas, ericas and restios grow here. Many depend on fire to germinate.' } },
      { yaw: 150, pitch: -4, kind: 'info', title: { en: 'Getting up' }, text: { en: 'Take the cableway in about five minutes, or hike Platteklip Gorge in two to three hours.' } }
    ]
  },
  {
    id: 'mpumalanga-veld', slug: 'mpumalanga-veld-sunset', destinationId: 'mpumalanga', kind: 'landscape',
    media: 'pano-mpumalanga_veld', pano: 'mpumalanga_veld', durationMin: 6, hasNarration: true, rating: 4.6, reviewCount: 188,
    title: { en: 'Highveld at Golden Hour', fr: 'Le Highveld à l’heure dorée', de: 'Highveld zur goldenen Stunde', zh: '黄金时刻的高地草原', it: 'L’Highveld all’ora d’oro' },
    tagline: {
      en: 'Open grassland on the Mpumalanga escarpment.', fr: 'Prairies ouvertes sur l’escarpement du Mpumalanga.', de: 'Offenes Grasland am Mpumalanga-Steilhang.',
      zh: '普马兰加悬崖上的开阔草原。', it: 'Praterie aperte sulla scarpata di Mpumalanga.'
    },
    narration: { en: 'The highveld grasslands turn gold in the dry winter months. To the east, the escarpment drops toward the lowveld and the Kruger National Park.' },
    hotspots: [
      { yaw: -130, pitch: 2, kind: 'info', title: { en: 'Table-top hills' }, text: { en: 'Flat-topped sandstone hills are typical of the escarpment along the Panorama Route.' } }
    ]
  },
  {
    id: 'sabie-tented-camp', slug: 'sabie-tented-camp', destinationId: 'mpumalanga', kind: 'landscape',
    media: 'pano-sabie_tent', pano: 'sabie_tent', startYaw: 30, durationMin: 5, hasNarration: false, rating: 4.7, reviewCount: 74,
    listingIds: ['stay-sabie-tented-camp'],
    title: { en: 'Tented Camp at Dawn, Sabie', fr: 'Camp sous tente à l’aube, Sabie', de: 'Zeltcamp im Morgengrauen, Sabie', zh: '萨比的黎明帐篷营地', it: 'Campo tendato all’alba, Sabie' },
    tagline: {
      en: 'Look around the deck before you book the tent.', fr: 'Faites le tour de la terrasse avant de réserver la tente.', de: 'Sehen Sie sich die Terrasse an, bevor Sie das Zelt buchen.',
      zh: '预订帐篷前，先看看露台。', it: 'Guarda la veranda prima di prenotare la tenda.'
    },
    hotspots: [
      { yaw: 25, pitch: -5, kind: 'info', title: { en: 'Kitchenette' }, text: { en: 'Self-catering deck with sink, fridge and two-plate stove.' } },
      { yaw: -80, pitch: 0, kind: 'nearby', title: { en: 'River view' }, text: { en: 'The deck faces a riverbed where antelope come to drink early in the morning.' } }
    ]
  },
  {
    id: 'drakensberg-escarpment', slug: 'drakensberg-escarpment', destinationId: 'drakensberg', kind: 'adventure',
    media: 'pano-drakensberg_solitary_mountain', pano: 'drakensberg_solitary_mountain', durationMin: 7, hasNarration: true, rating: 4.7, reviewCount: 203,
    title: { en: 'Drakensberg Escarpment', fr: 'L’escarpement du Drakensberg', de: 'Drakensberg-Steilhang', zh: '德拉肯斯堡悬崖', it: 'La scarpata del Drakensberg' },
    tagline: {
      en: 'High grassland under the Dragon Mountains.', fr: 'Hautes prairies sous les monts du Dragon.', de: 'Hochgrasland unter den Drachenbergen.',
      zh: '龙山脚下的高山草原。', it: 'Praterie d’alta quota sotto i Monti del Drago.'
    },
    narration: { en: 'The Drakensberg is South Africa’s highest mountain range. Its caves hold one of the largest collections of San rock art in Africa.' }
  },
  {
    id: 'bwindi-gorillas', slug: 'bwindi-gorilla-trek', destinationId: 'bwindi', kind: 'wildlife',
    media: 'uganda-gorilla', durationMin: 12, hasNarration: true, rating: 4.9, reviewCount: 518,
    title: { en: 'Gorilla Trek in Bwindi', fr: 'Trek des gorilles à Bwindi', de: 'Gorilla-Trekking in Bwindi', zh: '布恩迪大猩猩徒步', it: 'Trekking dei gorilla a Bwindi' },
    tagline: {
      en: 'An hour with a mountain gorilla family.', fr: 'Une heure avec une famille de gorilles des montagnes.', de: 'Eine Stunde bei einer Berggorilla-Familie.',
      zh: '与山地大猩猩家族共度一小时。', it: 'Un’ora con una famiglia di gorilla di montagna.'
    }
  },
  {
    id: 'okavango-mokoro', slug: 'okavango-mokoro', destinationId: 'okavango', kind: 'wildlife',
    media: 'botswana-okavango', durationMin: 10, hasNarration: false, rating: 4.8, reviewCount: 274,
    title: { en: 'Okavango by Mokoro', fr: 'L’Okavango en mokoro', de: 'Okavango im Mokoro', zh: '乘独木舟游奥卡万戈', it: 'L’Okavango in mokoro' },
    tagline: {
      en: 'Glide through papyrus channels at water level.', fr: 'Glissez au ras de l’eau entre les papyrus.', de: 'Gleiten Sie auf Wasserhöhe durch Papyruskanäle.',
      zh: '贴着水面滑过纸莎草水道。', it: 'Scivola a pelo d’acqua tra i canali di papiro.'
    }
  },
  {
    id: 'victoria-falls-edge', slug: 'victoria-falls-edge', destinationId: 'victoria-falls', kind: 'landscape',
    media: 'zambia-vicfalls', durationMin: 6, hasNarration: true, rating: 4.8, reviewCount: 702,
    listingIds: ['activity-victoria-falls-tour'],
    title: { en: 'At the Edge of Victoria Falls', fr: 'Au bord des chutes Victoria', de: 'Am Rand der Victoriafälle', zh: '维多利亚瀑布边缘', it: 'Sul bordo delle Cascate Vittoria' },
    tagline: {
      en: 'Spray, rainbows and the roar of the Zambezi.', fr: 'Embruns, arcs-en-ciel et grondement du Zambèze.', de: 'Gischt, Regenbögen und das Tosen des Sambesi.',
      zh: '水雾、彩虹与赞比西河的轰鸣。', it: 'Spruzzi, arcobaleni e il fragore dello Zambesi.'
    }
  },
  {
    id: 'mara-big-cats', slug: 'maasai-mara-big-cats', destinationId: 'maasai-mara', kind: 'wildlife',
    media: 'kenya-lion', durationMin: 11, hasNarration: true, rating: 4.8, reviewCount: 593,
    listingIds: ['safari-mara-3day'],
    title: { en: 'Big Cats of the Mara', fr: 'Les grands félins du Mara', de: 'Großkatzen der Mara', zh: '马拉的大型猫科动物', it: 'I grandi felini del Mara' },
    tagline: {
      en: 'Golden-hour drives with lion prides.', fr: 'Safaris à l’heure dorée avec les lions.', de: 'Pirschfahrten zur goldenen Stunde mit Löwenrudeln.',
      zh: '在黄金时刻与狮群同行。', it: 'Safari all’ora d’oro con i branchi di leoni.'
    }
  },

  // ---------- Global showcase ----------
  // 360° video first: openly licensed sample captures (credits on /credits). New to the platform,
  // so no ratings yet. Previews without a 360° capture invite creators to film them.
  {
    id: 'bled-lakeside-360', slug: 'lake-bled-lakeside-360-video', destinationId: 'bled', kind: 'landscape',
    media: 'video-bled-timelapse', video: 'bled-timelapse', durationMin: 3, hasNarration: true, rating: 0, reviewCount: 0, featured: true,
    title: { en: 'Lake Bled Shore Path', fr: 'Le sentier du lac de Bled', de: 'Uferweg am Bleder See', zh: '布莱德湖畔步道', it: 'Il sentiero del lago di Bled' },
    tagline: {
      en: 'A 360° time-lapse on the lakeside path, facing Bled Island.', fr: 'Un time-lapse à 360° sur le sentier du lac, face à l’île de Bled.', de: 'Ein 360°-Zeitraffer am Uferweg mit Blick auf die Insel Bled.',
      zh: '在湖畔步道拍摄的 360° 延时影像，正对布莱德岛。', it: 'Un time-lapse a 360° sul sentiero del lago, di fronte all’isola di Bled.'
    },
    narration: { en: 'You are on the path that circles Lake Bled, about 6 kilometres long. Turn around to find Bled Island and the Church of the Assumption; pletna boats row visitors there from the shore. The peaks behind the lake belong to the Julian Alps.' },
    facts: [{ en: 'Bled Island is the only natural island in Slovenia.' }, { en: 'Pletna boatmen have rowed visitors to the island for centuries; the right to do so was traditionally passed down within local families.' }],
    hotspots: [
      { yaw: 172, pitch: 3, kind: 'culture', title: { en: 'Bled Island' }, text: { en: 'The Church of the Assumption, reached by 99 stone steps from the landing.' } },
      { yaw: -150, pitch: 6, kind: 'nearby', title: { en: 'The Julian Alps' }, text: { en: 'Triglav National Park begins a short drive west of the lake.' } },
      { yaw: 0, pitch: -18, kind: 'info', title: { en: 'Lakeside path' }, text: { en: 'Flat and easy, about 6 km around the lake. Allow 1.5 to 2 hours on foot.' } }
    ]
  },
  {
    id: 'cabo-girao-skywalk', slug: 'cabo-girao-skywalk-360-video', destinationId: 'madeira', kind: 'adventure',
    media: 'video-madeira-cabo-girao', video: 'madeira-cabo-girao', startYaw: -18, durationMin: 2, hasNarration: true, rating: 0, reviewCount: 0, featured: true,
    title: { en: 'Cabo Girão Glass Skywalk', fr: 'La passerelle de verre du Cabo Girão', de: 'Glasplattform am Cabo Girão', zh: '吉朗角玻璃观景台', it: 'La passerella di vetro di Cabo Girão' },
    tagline: {
      en: 'Stand 580 metres above the Atlantic in 360° video.', fr: 'À 580 mètres au-dessus de l’Atlantique, en vidéo 360°.', de: '580 Meter über dem Atlantik im 360°-Video.',
      zh: '在 360° 视频中站上大西洋上方 580 米。', it: 'A 580 metri sopra l’Atlantico, in video a 360°.'
    },
    narration: { en: 'Cabo Girão is one of the highest sea cliffs in Europe. The viewing platform has a glass floor that looks straight down to the terraced fields at the foot of the cliff, reached only by cable car.' },
    facts: [{ en: 'The cliff drops about 580 metres to the sea.' }, { en: 'The fields at the bottom, the Fajãs do Cabo Girão, are reached by a cable car from the top.' }],
    hotspots: [
      { yaw: -18, pitch: -28, kind: 'info', title: { en: 'The drop' }, text: { en: 'Look down: farm terraces cling to the foot of the cliff, 580 m below.' } },
      { yaw: 36, pitch: -12, kind: 'info', title: { en: 'Glass platform' }, text: { en: 'The skywalk is free to visit. Mornings are usually clearer and quieter.' } },
      { yaw: -125, pitch: -4, kind: 'nearby', title: { en: 'Toward Câmara de Lobos' }, text: { en: 'The fishing village where Winston Churchill painted, about 10 minutes away by car.' } }
    ]
  },
  {
    id: 'wadi-rum-starlight', slug: 'wadi-rum-starlight-camp', destinationId: 'petra', kind: 'landscape',
    media: 'pano-wadi_rum_night', pano: 'wadi_rum_night', startYaw: -18, durationMin: 5, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Wadi Rum Under the Milky Way', fr: 'Le Wadi Rum sous la Voie lactée', de: 'Wadi Rum unter der Milchstraße', zh: '银河下的瓦地伦', it: 'Il Wadi Rum sotto la Via Lattea' },
    tagline: {
      en: 'A desert camp at night, in a 360° photo.', fr: 'Un camp dans le désert, la nuit, en photo 360°.', de: 'Ein Wüstencamp bei Nacht als 360°-Foto.',
      zh: '夜晚的沙漠营地，360° 全景照片。', it: 'Un campo nel deserto di notte, in foto a 360°.'
    },
    narration: { en: 'Far from city lights, the Wadi Rum desert has some of the darkest skies in the Middle East. Many camps here offer dome tents with clear panels so you can watch the stars from bed.' },
    facts: [{ en: 'Wadi Rum is a UNESCO World Heritage Site for both its landscape and its rock art.' }],
    hotspots: [
      { yaw: -18, pitch: 38, kind: 'info', title: { en: 'The Milky Way' }, text: { en: 'Best seen on moonless nights between spring and autumn.' } },
      { yaw: 36, pitch: -2, kind: 'info', title: { en: 'Dome tents' }, text: { en: 'Clear-fronted domes for stargazing; most camps also have simple Bedouin-style tents.' } },
      { yaw: -50, pitch: -20, kind: 'info', title: { en: 'Camp boardwalk' }, text: { en: 'Lit walkways keep the sand off your feet between tents and the dining area.' } }
    ]
  },
  {
    id: 'santorini-caldera', slug: 'santorini-caldera-imerovigli', destinationId: 'santorini', kind: 'landscape',
    media: 'pano-santorini_imerovigli', pano: 'santorini_imerovigli', startYaw: 40, durationMin: 5, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Santorini Caldera from Imerovigli', fr: 'La caldeira de Santorin depuis Imerovigli', de: 'Santorins Caldera von Imerovigli aus', zh: '从伊梅洛维里俯瞰圣托里尼火山口', it: 'La caldera di Santorini da Imerovigli' },
    tagline: {
      en: 'Cliffs, white villages and the volcano in a 360° photo.', fr: 'Falaises, villages blancs et volcan en photo 360°.', de: 'Klippen, weiße Dörfer und der Vulkan im 360°-Foto.',
      zh: '360° 全景照片中的悬崖、白色村庄与火山。', it: 'Scogliere, villaggi bianchi e il vulcano in una foto a 360°.'
    },
    narration: { en: 'Imerovigli is the highest village on the caldera rim, often called the balcony of the Aegean. Below lies the flooded crater, with the dark volcanic islands of Nea Kameni and Palea Kameni at its centre.' },
    facts: [{ en: 'The Minoan eruption, about 3,600 years ago, was one of the largest volcanic events in human history.' }],
    hotspots: [
      { yaw: -108, pitch: 6, kind: 'culture', title: { en: 'Imerovigli' }, text: { en: 'Cave houses and chapels built into the cliff, many now small hotels.' } },
      { yaw: 97, pitch: -4, kind: 'nearby', title: { en: 'Nea Kameni' }, text: { en: 'The young volcanic island in the caldera; boat trips let you walk to its crater.' } },
      { yaw: 169, pitch: 0, kind: 'info', title: { en: 'Skaros Rock' }, text: { en: 'Ruins of a medieval castle on the headland; a path leads out to it in about 30 minutes.' } }
    ]
  },
  {
    id: 'bali-rice-terraces', slug: 'bali-rice-terraces', destinationId: 'bali', kind: 'landscape',
    media: 'bali-rice', durationMin: 4, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Bali Rice Terraces', fr: 'Les rizières en terrasses de Bali', de: 'Balis Reisterrassen', zh: '巴厘岛梯田', it: 'Le risaie a terrazza di Bali' },
    tagline: {
      en: 'Green steps of the subak irrigation system.', fr: 'Les marches vertes du système d’irrigation subak.', de: 'Grüne Stufen des Subak-Bewässerungssystems.',
      zh: '苏巴克灌溉系统造就的绿色阶梯。', it: 'I gradini verdi del sistema di irrigazione subak.'
    },
    narration: { en: 'Bali’s rice terraces are watered by subak, a cooperative system that shares water between farmers through canals and water temples. It has been used since the 9th century.' }
  },
  {
    id: 'ha-long-karsts', slug: 'ha-long-bay-karsts', destinationId: 'ha-long-bay', kind: 'landscape',
    media: 'halong-bay', durationMin: 4, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Karst Islands of Ha Long Bay', fr: 'Les îles karstiques de la baie d’Ha Long', de: 'Karstinseln der Halong-Bucht', zh: '下龙湾的喀斯特岛屿', it: 'Le isole carsiche della baia di Ha Long' },
    tagline: {
      en: 'Limestone towers seen from Titov Island.', fr: 'Tours calcaires vues depuis l’île Titov.', de: 'Kalksteintürme von der Insel Titov aus.',
      zh: '从蒂托夫岛眺望石灰岩峰林。', it: 'Torri calcaree viste dall’isola Titov.'
    },
    narration: { en: 'The islands of Ha Long Bay formed over millions of years as the sea flooded a limestone plateau. Many are hollow, with caves you can visit by boat.' }
  },
  {
    id: 'angkor-wat-reflections', slug: 'angkor-wat-reflections', destinationId: 'angkor', kind: 'culture',
    media: 'angkor-wat', durationMin: 5, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Angkor Wat Reflections', fr: 'Reflets d’Angkor Vat', de: 'Spiegelungen von Angkor Wat', zh: '吴哥窟倒影', it: 'Riflessi di Angkor Wat' },
    tagline: {
      en: 'The five towers mirrored in the lotus pond.', fr: 'Les cinq tours reflétées dans le bassin aux lotus.', de: 'Die fünf Türme im Lotusteich gespiegelt.',
      zh: '五座宝塔倒映在莲花池中。', it: 'Le cinque torri riflesse nello stagno dei loti.'
    },
    narration: { en: 'Angkor Wat’s five towers represent the peaks of Mount Meru, the home of the gods in Hindu cosmology. At sunrise, crowds gather by the north pond to see them reflected in the water.' }
  },
  {
    id: 'petra-monastery-climb', slug: 'petra-monastery-climb', destinationId: 'petra', kind: 'culture',
    media: 'petra-monastery', durationMin: 5, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Petra: The Monastery', fr: 'Petra : le Monastère', de: 'Petra: Das Kloster', zh: '佩特拉：修道院', it: 'Petra: il Monastero' },
    tagline: {
      en: '800 steps up to Ad Deir’s carved façade.', fr: '800 marches jusqu’à la façade sculptée d’Ad Deir.', de: '800 Stufen hinauf zur Felsfassade von Ad Deir.',
      zh: '攀登 800 级台阶，抵达代尔修道院的雕刻立面。', it: '800 gradini fino alla facciata scolpita di Ad Deir.'
    },
    narration: { en: 'Ad Deir, the Monastery, is carved 47 metres wide and 48 metres high into the mountain above Petra. It was probably a temple or meeting hall, not a monastery; the name comes from crosses carved inside in later centuries.' }
  },
  {
    id: 'dubai-skyline-night', slug: 'dubai-skyline-night', destinationId: 'dubai', kind: 'city',
    media: 'dubai-skyline', durationMin: 3, hasNarration: false, rating: 0, reviewCount: 0,
    title: { en: 'Dubai Skyline at Night', fr: 'Dubaï, la nuit', de: 'Dubais Skyline bei Nacht', zh: '迪拜夜景天际线', it: 'Lo skyline di Dubai di notte' },
    tagline: {
      en: 'The Burj Khalifa above the Dubai Water Canal.', fr: 'La Burj Khalifa au-dessus du canal de Dubaï.', de: 'Der Burj Khalifa über dem Dubai Water Canal.',
      zh: '迪拜运河上方的哈利法塔。', it: 'Il Burj Khalifa sopra il Dubai Water Canal.'
    }
  },
  {
    id: 'old-muscat-forts', slug: 'old-muscat-forts', destinationId: 'muscat', kind: 'culture',
    media: 'muscat-bay', durationMin: 4, hasNarration: true, rating: 0, reviewCount: 0,
    title: { en: 'Old Muscat and Its Forts', fr: 'Le vieux Mascate et ses forts', de: 'Alt-Maskat und seine Forts', zh: '马斯喀特老城与城堡', it: 'La vecchia Mascate e i suoi forti' },
    tagline: {
      en: 'Al Mirani bay between rocky headlands.', fr: 'La baie d’Al Mirani entre deux caps rocheux.', de: 'Die Bucht von Al Mirani zwischen Felsklippen.',
      zh: '岩岬之间的米拉尼湾。', it: 'La baia di Al Mirani tra promontori rocciosi.'
    },
    narration: { en: 'The Al Jalali and Al Mirani forts were built by the Portuguese in the 1580s to guard the harbour of Muscat. Between them stands the Al Alam Palace, used by the Sultan for ceremonial occasions.' }
  }
];

export const CATEGORIES: Category[] = [
  { id: 'lifestyle', media: 'zanzibar-beach', focus: '50% 60%', zoom: 1.05 },
  { id: 'landscape', media: 'ngorongoro', focus: '50% 50%', zoom: 1.04 },
  { id: 'cultural', media: 'maasai', focus: '60% 40%', zoom: 1.05 },
  { id: 'wildlife', media: 'serengeti-herds', focus: '55% 60%', zoom: 1.05 }
];
