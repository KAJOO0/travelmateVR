import type { InterestTag, Locale, SearchIntent, SearchSuggestion } from '@/domain/types';
import { seedIndex } from './catalog';
import { countryName, lt } from '@/lib/content';

// Rule-based reader for free-text travel requests. It runs locally so search feels instant
// and works offline; the AI service can refine the same SearchIntent shape server-side.

const LOCALES: Locale[] = ['en', 'fr', 'de', 'zh', 'it'];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fourteen: 14,
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9, dix: 10,
  ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
  uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10
};
// Latin number words must start at a word boundary ("tre" must not match inside "metre").
const NUM = `(?<![a-zà-öø-ÿ])(\\d+|${Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join('|')})`;
const toNum = (s: string) => (/^\d+$/.test(s) ? parseInt(s, 10) : NUMBER_WORDS[s.toLowerCase()]);

const STYLE_WORDS: Record<InterestTag, string[]> = {
  luxury: ['luxury', 'luxurious', 'honeymoon', 'premium', 'luxe', 'luxus', 'lusso', 'lussuoso', '豪华', '奢华', '蜜月'],
  family: ['family', 'kids', 'children', 'famille', 'enfants', 'familie', 'kinder', 'famiglia', 'bambini', '家庭', '亲子', '孩子'],
  adventure: ['adventure', 'trek', 'trekking', 'hike', 'hiking', 'climb', 'aventure', 'randonnée', 'abenteuer', 'wandern', 'avventura', 'escursione', '探险', '徒步', '登山'],
  culture: ['culture', 'cultural', 'heritage', 'history', 'kultur', 'kulturell', 'cultura', 'culturale', 'patrimoine', '文化', '历史'],
  beach: ['beach', 'beaches', 'island', 'ocean', 'sea', 'plage', 'plages', 'île', 'strand', 'strände', 'insel', 'spiaggia', 'spiagge', 'isola', 'mare', '海滩', '海岛', '海边'],
  wildlife: ['wildlife', 'animals', 'big five', 'game drive', 'faune', 'animaux', 'tiere', 'tierwelt', 'fauna', 'animali', '野生动物', '动物'],
  mountain: ['mountain', 'mountains', 'summit', 'montagne', 'berg', 'berge', 'gipfel', 'montagna', 'montagne', '山', '山峰'],
  eco: ['eco', 'sustainable', 'responsible', 'green', 'durable', 'responsable', 'nachhaltig', 'öko', 'sostenibile', 'responsabile', '生态', '环保', '可持续'],
  lifestyle: ['relax', 'wellness', 'spa', 'détente', 'entspannung', 'relax', '休闲'],
  landscape: ['landscape', 'scenery', 'views', 'paysage', 'landschaft', 'paesaggio', '风景', '景观'],
  city: ['city', 'urban', 'ville', 'stadt', 'città', '城市'],
  lake: ['lake', 'lac', 'see', 'lago', '湖']
};

const KIND_WORDS: Record<SearchIntent['kinds'][number], string[]> = {
  safari: ['safari', 'safaris', 'game drive', '游猎', '狩猎之旅'],
  stay: ['hotel', 'hotels', 'lodge', 'lodges', 'camp', 'resort', 'stay', 'villa', 'guesthouse', 'hôtel', 'hébergement', 'unterkunft', 'albergo', 'alloggio', '酒店', '住宿'],
  activity: ['activity', 'activities', 'diving', 'snorkelling', 'snorkeling', 'tour', 'activité', 'aktivität', 'attività', '活动', '潜水'],
  experience: ['vr', '360', 'virtual', 'immersive', 'virtuel', 'virtuell', 'virtuale', '虚拟', '沉浸'],
  transport: ['flight', 'flights', 'transfer', 'car rental', 'train', 'ferry', 'vol', 'flug', 'volo', '航班', '接送'],
  restaurant: ['restaurant', 'restaurants', 'food', 'dining', 'ristorante', '餐厅', '美食'],
  event: ['event', 'events', 'festival', 'événement', 'veranstaltung', 'evento', '活动节', '节日']
};

type PlaceEntry = { id: string; label: string; type: 'country' | 'destination'; terms: string[] };

let placeIndex: PlaceEntry[] | null = null;
function places(): PlaceEntry[] {
  if (placeIndex) return placeIndex;
  const entries: PlaceEntry[] = [];
  for (const c of seedIndex.countries) {
    const names = LOCALES.map(l => countryName(c, l).toLowerCase());
    entries.push({ id: c.id, label: countryName(c, 'en'), type: 'country', terms: [...new Set(names)] });
  }
  for (const d of seedIndex.destinations) {
    entries.push({ id: d.id, label: d.name, type: 'destination', terms: [d.name.toLowerCase(), ...(d.aliases ?? [])] });
  }
  // Longest terms first so "Lake Tanganyika" wins over "Tanganyika".
  for (const e of entries) e.terms.sort((a, b) => b.length - a.length);
  return (placeIndex = entries);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hasWord(text: string, word: string): boolean {
  if (/[一-鿿]/.test(word)) return text.includes(word);
  return new RegExp(`(^|[^\\p{L}])${escapeRe(word)}($|[^\\p{L}])`, 'u').test(text);
}

export function parseIntent(raw: string): SearchIntent {
  const text = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  const intent: SearchIntent = { raw, places: [], styles: [], kinds: [] };
  if (!text) return intent;

  // Places (countries first, then destinations), avoiding duplicates via overlapping aliases.
  const seen = new Set<string>();
  for (const p of places()) {
    if (p.terms.some(t => t.length > 2 && hasWord(text, t)) && !seen.has(p.id)) {
      seen.add(p.id);
      intent.places.push({ id: p.id, label: p.label, type: p.type });
    }
  }
  // A destination implies its country; drop the country chip when a destination already names it ("Zanzibar").
  intent.places = intent.places.filter(p => !(p.type === 'country' && intent.places.some(q => q.type === 'destination' && q.id === p.id)));

  // Duration: "5-day", "5 days", "a week", "5 jours", "5 Tage", "5 giorni", "5天"
  const days = new RegExp(`${NUM}\\s*-?\\s*(days?|nights?|jours?|nuits?|tage?n?|nächte|giorni|notti|天|晚)`, 'i').exec(text);
  if (days?.[1]) intent.days = toNum(days[1]);
  else if (/\b(a|one|1) week\b|une semaine|eine woche|una settimana|一周/.test(text)) intent.days = 7;
  else if (/\b(two|2) weeks\b|deux semaines|zwei wochen|due settimane|两周/.test(text)) intent.days = 14;
  else if (/\bweekend\b|week-end|wochenende|fine settimana|周末/.test(text)) intent.days = 2;

  // Travellers: "for two people", "4 adults", "a couple", "family of 5", "2 personnes", "zwei Personen", "due persone", "两人"
  const pax = new RegExp(`${NUM}\\s*(people|persons?|adults?|travell?ers?|guests?|pax|personnes?|adultes?|voyageurs?|personen|erwachsene|reisende|persone|adulti|viaggiatori|人|位)`, 'i').exec(text);
  const family = new RegExp(`(family of|famille de|familie mit|famiglia di)\\s*${NUM}`, 'i').exec(text);
  if (pax?.[1]) intent.travellers = toNum(pax[1]);
  else if (family?.[2]) intent.travellers = toNum(family[2]);
  else if (/\b(couple|honeymoon|my partner|my wife|my husband|for two)\b|en couple|à deux|als paar|zu zweit|in coppia|in due|per due|情侣|夫妻|蜜月|两个人/.test(text)) intent.travellers = 2;
  else if (/\b(solo|alone|by myself)\b|seul|allein|da solo|一个人|独自/.test(text)) intent.travellers = 1;

  // Budget: "$2,500", "under $5,000", "5000 usd", "2.500 $", "5k"
  // Amounts may group thousands with commas, dots, spaces or narrow spaces: 2,500 · 2.500 · 3 000.
  const AMOUNT = '(\\d{1,3}(?:[\\s\\u00a0\\u202f.,]\\d{3})+|\\d+(?:[.,]\\d{1,2})?)\\s*(k)?';
  const money = new RegExp(`(?:\\$|usd|us\\$|dollars?|美元)\\s*${AMOUNT}|${AMOUNT}\\s*(?:\\$|usd|dollars?|美元)`, 'i').exec(text);
  if (money) {
    let s = (money[1] ?? money[3] ?? '').replace(/[\s  ]/g, '');
    const k = !!(money[2] ?? money[4]);
    s = s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
    const v = parseFloat(s) * (k ? 1000 : 1);
    if (!Number.isNaN(v) && v > 0) {
      intent.budgetUsd = Math.round(v);
      intent.budgetMode = /(under|below|less than|max|maximum|up to|within|budget of|moins de|sous|maximum|unter|bis zu|höchstens|sotto|meno di|massimo|以内|以下|不超过)/.test(text) ? 'max' : 'about';
    }
  }

  for (const [tag, words] of Object.entries(STYLE_WORDS) as [InterestTag, string[]][]) {
    if (words.some(w => hasWord(text, w))) intent.styles.push(tag);
  }
  for (const [kind, words] of Object.entries(KIND_WORDS) as [SearchIntent['kinds'][number], string[]][]) {
    if (words.some(w => hasWord(text, w))) intent.kinds.push(kind);
  }
  if (intent.kinds.includes('safari') && !intent.styles.includes('wildlife')) intent.styles.push('wildlife');
  return intent;
}

/** True when the query reads like a request (dates, people, budget) rather than a place name. */
export function isNaturalLanguage(intent: SearchIntent): boolean {
  return intent.days !== undefined || intent.travellers !== undefined || intent.budgetUsd !== undefined
    || intent.styles.length + intent.kinds.length >= 2 || intent.raw.trim().split(/\s+/).length >= 5;
}

export function suggest(query: string, lang: Locale, limit = 6): SearchSuggestion[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  const intent = parseIntent(query);
  const matchedIds = new Set(intent.places.map(p => p.id));
  const scored: { s: SearchSuggestion; score: number }[] = [];

  const score = (label: string, extra: string[] = [], id?: string) => {
    const l = label.toLowerCase();
    if (id && matchedIds.has(id)) return 100;
    if (l.startsWith(q)) return 90;
    if (l.split(/\s+/).some(w => w.startsWith(q))) return 70;
    if (l.includes(q)) return 50;
    if (extra.some(e => e.startsWith(q) || q.includes(e))) return 40;
    return 0;
  };

  for (const d of seedIndex.destinations) {
    const country = seedIndex.countries.find(c => c.id === d.countryId);
    const s = score(d.name, d.aliases, d.id);
    if (s) scored.push({ score: s + 2, s: { id: `d:${d.id}`, type: 'destination', label: d.name, sublabel: `${lt(d.area, lang)} · ${country ? countryName(country, lang) : ''}`, href: `/destinations/${d.slug}`, media: d.media } });
  }
  for (const c of seedIndex.countries) {
    const name = countryName(c, lang);
    const s = Math.max(score(name, [], c.id), score(countryName(c, 'en')));
    if (s) scored.push({ score: s + 1, s: { id: `c:${c.id}`, type: 'country', label: name, sublabel: lt(c.tagline, lang), href: `/destinations?country=${c.id}`, media: c.media } });
  }
  for (const e of seedIndex.experiences) {
    const title = lt(e.title, lang);
    const d = seedIndex.destById.get(e.destinationId);
    const s = Math.max(score(title), score(e.title.en), d && matchedIds.has(d.id) ? 60 : 0);
    if (s) scored.push({ score: s, s: { id: `e:${e.id}`, type: 'experience', label: title, sublabel: d?.name ?? '', href: `/vr/${e.slug}`, media: e.media } });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.s);
}
