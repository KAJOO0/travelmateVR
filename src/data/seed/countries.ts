import type { Country } from '@/domain/types';

// African countries feature on "Explore Africa": Tanzania is Phase 1, the rest follow the expansion roadmap.
// Countries in GLOBAL_REGIONS form the global showcase.
export const COUNTRIES: Country[] = [
  {
    id: 'tanzania', iso: 'TZ', region: 'east-africa', phase: 1, media: 'serengeti-herds',
    tagline: {
      en: 'Serengeti plains, Kilimanjaro and the Spice Islands',
      fr: 'Plaines du Serengeti, Kilimandjaro et îles aux épices',
      de: 'Serengeti-Ebenen, Kilimandscharo und Gewürzinseln',
      zh: '塞伦盖蒂草原、乞力马扎罗山与香料群岛',
      it: 'Pianure del Serengeti, Kilimangiaro e Isole delle Spezie'
    }
  },
  {
    id: 'zanzibar', iso: 'TZ', name: 'Zanzibar', region: 'east-africa', phase: 1, media: 'zanzibar-beach',
    tagline: {
      en: 'Stone Town lanes and turquoise Indian Ocean beaches',
      fr: 'Ruelles de Stone Town et plages turquoise de l’océan Indien',
      de: 'Gassen von Stone Town und türkisfarbene Strände am Indischen Ozean',
      zh: '石头城小巷与印度洋碧蓝海滩',
      it: 'Vicoli di Stone Town e spiagge turchesi dell’Oceano Indiano'
    }
  },
  {
    id: 'kenya', iso: 'KE', region: 'east-africa', phase: 2, media: 'kenya-lion',
    tagline: {
      en: 'Big cats and open plains of the Maasai Mara',
      fr: 'Grands félins et plaines ouvertes du Maasai Mara',
      de: 'Großkatzen und weite Ebenen der Maasai Mara',
      zh: '马赛马拉的大型猫科动物与辽阔草原',
      it: 'Grandi felini e pianure aperte del Maasai Mara'
    }
  },
  {
    id: 'uganda', iso: 'UG', region: 'east-africa', phase: 2, media: 'uganda-gorilla',
    tagline: {
      en: 'Mountain gorillas in the Bwindi forest',
      fr: 'Gorilles des montagnes dans la forêt de Bwindi',
      de: 'Berggorillas im Bwindi-Wald',
      zh: '布恩迪森林中的山地大猩猩',
      it: 'Gorilla di montagna nella foresta di Bwindi'
    }
  },
  {
    id: 'rwanda', iso: 'RW', region: 'east-africa', phase: 2, media: 'rwanda-volcanoes',
    tagline: {
      en: 'Volcanoes, forests and a thousand green hills',
      fr: 'Volcans, forêts et mille collines verdoyantes',
      de: 'Vulkane, Wälder und tausend grüne Hügel',
      zh: '火山、森林与千丘之国',
      it: 'Vulcani, foreste e mille colline verdi'
    }
  },
  {
    id: 'south-africa', iso: 'ZA', region: 'southern-africa', phase: 3, media: 'southafrica-capetown',
    tagline: {
      en: 'Table Mountain, two oceans and the Cape winelands',
      fr: 'Montagne de la Table, deux océans et vignobles du Cap',
      de: 'Tafelberg, zwei Ozeane und die Weinregion am Kap',
      zh: '桌山、两大洋与开普酒乡',
      it: 'Table Mountain, due oceani e i vigneti del Capo'
    }
  },
  {
    id: 'botswana', iso: 'BW', region: 'southern-africa', phase: 3, media: 'botswana-okavango',
    tagline: {
      en: 'Mokoro channels of the Okavango Delta',
      fr: 'Canaux en mokoro du delta de l’Okavango',
      de: 'Mokoro-Kanäle im Okavango-Delta',
      zh: '奥卡万戈三角洲的独木舟水道',
      it: 'Canali in mokoro nel delta dell’Okavango'
    }
  },
  {
    id: 'namibia', iso: 'NA', region: 'southern-africa', phase: 3, media: 'namibia-sossusvlei',
    tagline: {
      en: 'Red dunes of Sossusvlei and desert skies',
      fr: 'Dunes rouges de Sossusvlei et ciels du désert',
      de: 'Rote Dünen von Sossusvlei und Wüstenhimmel',
      zh: '索苏斯盐沼的红色沙丘与沙漠星空',
      it: 'Dune rosse di Sossusvlei e cieli del deserto'
    }
  },
  {
    id: 'zambia', iso: 'ZM', region: 'southern-africa', phase: 3, media: 'zambia-vicfalls',
    tagline: {
      en: 'Victoria Falls and walking safaris on the Zambezi',
      fr: 'Chutes Victoria et safaris à pied sur le Zambèze',
      de: 'Victoriafälle und Fußsafaris am Sambesi',
      zh: '维多利亚瀑布与赞比西河徒步游猎',
      it: 'Cascate Vittoria e safari a piedi sullo Zambesi'
    }
  },
  {
    id: 'zimbabwe', iso: 'ZW', region: 'southern-africa', phase: 3, media: 'zimbabwe-manapools',
    tagline: {
      en: 'Mana Pools riverbanks and the stone city of Great Zimbabwe',
      fr: 'Rives de Mana Pools et cité de pierre du Grand Zimbabwe',
      de: 'Flussufer von Mana Pools und die Steinstadt Great Zimbabwe',
      zh: '马纳潭河岸与大津巴布韦石城',
      it: 'Rive di Mana Pools e la città di pietra del Grande Zimbabwe'
    }
  },
  // ---------- Global showcase: a few destinations beyond Africa, to show the platform to ----------
  // ---------- operators and creators worldwide. Region decides where they are listed. ----------
  {
    id: 'indonesia', iso: 'ID', region: 'southeast-asia', phase: 6, media: 'bali-temple',
    tagline: {
      en: 'Bali’s rice terraces, water temples and volcano sunrises',
      fr: 'Rizières en terrasses, temples d’eau et levers de soleil volcaniques à Bali',
      de: 'Balis Reisterrassen, Wassertempel und Sonnenaufgänge am Vulkan',
      zh: '巴厘岛的梯田、水上神庙与火山日出',
      it: 'Risaie a terrazza, templi sull’acqua e albe sui vulcani di Bali'
    }
  },
  {
    id: 'vietnam', iso: 'VN', region: 'southeast-asia', phase: 6, media: 'halong-bay',
    tagline: {
      en: 'Limestone islands and overnight cruises in Ha Long Bay',
      fr: 'Îles calcaires et croisières de nuit dans la baie d’Ha Long',
      de: 'Kalksteininseln und Übernachtungskreuzfahrten in der Halong-Bucht',
      zh: '下龙湾的石灰岩群岛与过夜游船',
      it: 'Isole calcaree e crociere notturne nella baia di Ha Long'
    }
  },
  {
    id: 'cambodia', iso: 'KH', region: 'southeast-asia', phase: 6, media: 'angkor-wat',
    tagline: {
      en: 'Sunrise over the temples of Angkor',
      fr: 'Lever de soleil sur les temples d’Angkor',
      de: 'Sonnenaufgang über den Tempeln von Angkor',
      zh: '吴哥寺庙群上的日出',
      it: 'L’alba sui templi di Angkor'
    }
  },
  {
    id: 'jordan', iso: 'JO', region: 'middle-east', phase: 6, media: 'petra-monastery',
    tagline: {
      en: 'Rose-red Petra and the starlit desert of Wadi Rum',
      fr: 'Petra la rose et le désert étoilé du Wadi Rum',
      de: 'Das rosenrote Petra und die sternklare Wüste des Wadi Rum',
      zh: '玫瑰红的佩特拉古城与繁星下的瓦地伦沙漠',
      it: 'Petra color rosa e il deserto stellato del Wadi Rum'
    }
  },
  {
    id: 'uae', iso: 'AE', region: 'middle-east', phase: 6, media: 'dubai-skyline',
    tagline: {
      en: 'Dubai’s skyline, souks and red desert dunes',
      fr: 'Gratte-ciel, souks et dunes rouges de Dubaï',
      de: 'Dubais Skyline, Souks und rote Wüstendünen',
      zh: '迪拜的天际线、集市与红色沙丘',
      it: 'Lo skyline, i suq e le dune rosse di Dubai'
    }
  },
  {
    id: 'oman', iso: 'OM', region: 'middle-east', phase: 6, media: 'muscat-bay',
    tagline: {
      en: 'Old Muscat’s forts, wadis and the Wahiba Sands',
      fr: 'Forts du vieux Mascate, wadis et sables de Wahiba',
      de: 'Die Forts von Alt-Maskat, Wadis und die Wahiba-Wüste',
      zh: '马斯喀特老城的城堡、干河谷与瓦希巴沙漠',
      it: 'I forti della vecchia Mascate, i wadi e le sabbie di Wahiba'
    }
  },
  {
    id: 'greece', iso: 'GR', region: 'europe', phase: 6, media: 'santorini-oia',
    tagline: {
      en: 'Whitewashed villages on Santorini’s volcanic caldera',
      fr: 'Villages blanchis à la chaux sur la caldeira de Santorin',
      de: 'Weiß getünchte Dörfer an Santorins Vulkancaldera',
      zh: '圣托里尼火山口边缘的白色村庄',
      it: 'Villaggi imbiancati sulla caldera vulcanica di Santorini'
    }
  },
  {
    id: 'slovenia', iso: 'SI', region: 'europe', phase: 6, media: 'bled-lake',
    tagline: {
      en: 'Lake Bled’s island church beneath the Julian Alps',
      fr: 'L’église insulaire du lac de Bled au pied des Alpes juliennes',
      de: 'Die Inselkirche im Bleder See unter den Julischen Alpen',
      zh: '尤利安阿尔卑斯山下布莱德湖的岛上教堂',
      it: 'La chiesa sull’isola del lago di Bled, sotto le Alpi Giulie'
    }
  },
  {
    id: 'portugal', iso: 'PT', region: 'europe', phase: 6, media: 'madeira-cliffs',
    tagline: {
      en: 'Madeira’s sea cliffs, levada walks and laurel forest',
      fr: 'Falaises de Madère, randonnées le long des levadas et forêt de lauriers',
      de: 'Madeiras Steilküsten, Levada-Wanderungen und Lorbeerwald',
      zh: '马德拉的海崖、引水渠步道与月桂森林',
      it: 'Le scogliere di Madeira, i sentieri delle levadas e la foresta di alloro'
    }
  }
];
