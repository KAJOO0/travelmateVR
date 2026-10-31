import type { Destination, InterestTag, ItineraryDay, ItineraryItem, Listing, SearchIntent, Slot, TravellerProfile } from '@/domain/types';
import { seedIndex } from './catalog';
import { parseIntent } from './search';
import { tripTotals, type TripTotals } from './trips';
import { DATA_SOURCE, demoLatency, http } from './http';
import { serviceFeeRate } from './platform';
import { aiTelemetry } from './aiTelemetry';
import { uid } from '@/lib/store';

/**
 * AI TravelMate service boundary. The UI depends only on this interface, so the planning model can be
 * replaced (hosted LLM, fine-tuned model, rules) without UI changes. The demo planner below is rule-based
 * and works on TravelMateVR's own catalogue.
 */
export interface PlanRequest {
  prompt: string;
  /** Earlier request in the same conversation; follow-ups modify it. */
  previous?: PlanSpec;
  profile?: TravellerProfile;
  variant?: number;
}

export interface PlanSpec {
  days: number;
  travellers: number;
  budgetUsd?: number;
  destinationIds: string[];
  styles: InterestTag[];
  tier: 'value' | 'comfort' | 'luxury';
  exclude: string[];
}

export interface TravelLeg { from: string; to: string; mode: 'road' | 'flight' | 'ferry'; hours: number; costPerPerson: number }

export interface TripPlan {
  id: string;
  prompt: string;
  spec: PlanSpec;
  intent: SearchIntent;
  route: { destinationId: string; nights: number; stayId?: string; stayAlternatives: string[] }[];
  legs: TravelLeg[];
  days: ItineraryDay[];
  totals: TripTotals & { fees: number; grandTotal: number; perPerson: number };
  withinBudget?: boolean;
  /** Translation keys explaining choices. */
  reasons: { key: string; params?: Record<string, string> }[];
  sustainability: { key: string; params?: Record<string, string> }[];
  bookable: string[];
  assumptions: { key: string; params?: Record<string, string> }[];
}

export interface AiService { plan(req: PlanRequest): Promise<TripPlan> }

// ---------------- demo planner ----------------

const STYLE_DESTINATIONS: Record<InterestTag, string[]> = {
  wildlife: ['serengeti', 'ngorongoro', 'tarangire', 'katavi', 'ruaha'],
  beach: ['zanzibar', 'lake-tanganyika'],
  culture: ['zanzibar', 'ngorongoro', 'dar-es-salaam'],
  mountain: ['kilimanjaro', 'ngozi'],
  adventure: ['kilimanjaro', 'ngozi', 'katavi'],
  luxury: ['serengeti', 'zanzibar', 'ngorongoro'],
  family: ['tarangire', 'zanzibar', 'ngorongoro'],
  eco: ['katavi', 'ruaha', 'ngozi'],
  lifestyle: ['zanzibar'],
  landscape: ['ngorongoro', 'ngozi', 'kilimanjaro'],
  city: ['dar-es-salaam', 'zanzibar'],
  lake: ['lake-tanganyika', 'ngozi']
};

const toRad = (d: number) => (d * Math.PI) / 180;
function km(a: Destination, b: Destination): number {
  const [la1, lo1] = a.coordinates, [la2, lo2] = b.coordinates;
  const x = Math.sin(toRad(la2 - la1) / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(toRad(lo2 - lo1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(x));
}

function leg(a: Destination, b: Destination): TravelLeg {
  const d = km(a, b);
  const island = a.id === 'zanzibar' || b.id === 'zanzibar';
  if (island && (a.id === 'dar-es-salaam' || b.id === 'dar-es-salaam')) return { from: a.id, to: b.id, mode: 'ferry', hours: 2, costPerPerson: 40 };
  if (island || d > 350) return { from: a.id, to: b.id, mode: 'flight', hours: Math.max(1, Math.round(d / 400 * 10) / 10 + 1), costPerPerson: Math.round(Math.min(380, 110 + d * 0.25)) };
  return { from: a.id, to: b.id, mode: 'road', hours: Math.max(1, Math.round((d * 1.35) / 50)), costPerPerson: 0 };
}

const tierOf = (budgetPerPersonDay: number | undefined, profile?: TravellerProfile, styles: InterestTag[] = []): PlanSpec['tier'] => {
  if (styles.includes('luxury')) return 'luxury';
  if (budgetPerPersonDay !== undefined) return budgetPerPersonDay >= 450 ? 'luxury' : budgetPerPersonDay >= 170 ? 'comfort' : 'value';
  return profile?.budgetLevel ?? 'comfort';
};

function specFrom(req: PlanRequest): { spec: PlanSpec; intent: SearchIntent } {
  const intent = parseIntent(req.prompt);
  const text = req.prompt.toLowerCase();
  const prev = req.previous;
  const cheaper = /cheaper|lower|less expensive|budget|moins cher|günstiger|billiger|più economico|便宜/.test(text);
  const fancier = /more luxur|upgrade|nicer|plus de luxe|luxuriöser|più lusso|更豪华/.test(text);
  const exclude = [...(prev?.exclude ?? [])];
  const withoutMatch = /(without|skip|remove|no|sans|ohne|senza|不要|去掉)\s+([\p{L}\s]+)/u.exec(text);
  if (withoutMatch) {
    const removeIntent = parseIntent(withoutMatch[2]!);
    removeIntent.places.forEach(p => exclude.push(p.id));
  }
  const places = intent.places.filter(p => !exclude.includes(p.id));
  const destIds: string[] = [];
  for (const p of places) {
    if (p.type === 'destination') destIds.push(p.id);
    else {
      // Country: pick its best-matching destinations for the requested styles.
      const inCountry = seedIndex.destinations.filter(d => d.countryId === p.id);
      const styles = intent.styles.length ? intent.styles : prev?.styles ?? ['wildlife'];
      inCountry.sort((a, b) => styles.filter(s => b.tags.includes(s)).length - styles.filter(s => a.tags.includes(s)).length || b.rating - a.rating);
      destIds.push(...inCountry.slice(0, 2).map(d => d.id));
    }
  }
  // First person singular vs plural, in all five languages (我们 contains 我, so plural is checked first).
  const plural = /\b(we|us|our|nous|wir|uns|noi)\b|我们/.test(text);
  const singular = !plural && (/\b(i|i'm|i am|me|my|je|j'ai|moi|ich|mich|mein|io|ho)\b/.test(text) || /我/.test(text));
  const travellers = intent.travellers ?? prev?.travellers ?? (singular ? 1 : (req.profile?.adults ?? 2) + (req.profile?.children ?? 0));
  const days = Math.min(21, Math.max(1, intent.days ?? prev?.days ?? 7));
  const budgetUsd = intent.budgetUsd ?? prev?.budgetUsd;
  const styles = intent.styles.length ? [...new Set([...(prev && !places.length ? prev.styles : []), ...intent.styles])] : prev?.styles ?? (req.profile?.interests.length ? req.profile.interests : ['wildlife', 'beach']);
  let tier = tierOf(budgetUsd !== undefined ? budgetUsd / travellers / days : undefined, req.profile, intent.styles);
  if (prev && !intent.budgetUsd && !intent.styles.includes('luxury')) tier = prev.tier;
  if (cheaper) tier = tier === 'luxury' ? 'comfort' : 'value';
  if (fancier) tier = tier === 'value' ? 'comfort' : 'luxury';
  const destinationIds = destIds.length ? destIds : prev && !intent.styles.length ? prev.destinationIds.filter(id => !exclude.includes(id)) : [];
  return { spec: { days, travellers, budgetUsd, destinationIds, styles, tier, exclude }, intent };
}

function chooseDestinations(spec: PlanSpec, variant: number): string[] {
  if (spec.destinationIds.length) return [...new Set(spec.destinationIds)];
  const picks: string[] = [];
  const perPersonDay = spec.budgetUsd ? spec.budgetUsd / spec.travellers / spec.days : undefined;
  const maxStops = spec.days <= 3 ? 1 : spec.days <= 6 ? 2 : spec.days <= 10 ? 3 : 4;
  for (const s of spec.styles) {
    // A stop already chosen for another interest may cover this one too (Zanzibar: culture and beach).
    if (picks.some(id => STYLE_DESTINATIONS[s]?.includes(id))) continue;
    const options = (STYLE_DESTINATIONS[s] ?? []).filter(id => !spec.exclude.includes(id) && !picks.includes(id));
    // Expensive parks are skipped on tight budgets; the variant rotates alternatives on "regenerate".
    const affordable = options.filter(id => !perPersonDay || (seedIndex.destById.get(id)?.fromPriceUsd ?? 0) <= perPersonDay * 1.6);
    // Prefer options close to the stops already picked, so the route stays compact.
    const pool = (affordable.length ? affordable : options).sort((a, b) => distanceToPicks(a, picks) - distanceToPicks(b, picks));
    const pick = pool[variant % Math.max(1, pool.length)];
    if (pick) picks.push(pick);
    if (picks.length >= maxStops) break;
  }
  if (spec.styles.includes('mountain') && picks.includes('kilimanjaro') && spec.days < 7) picks.splice(picks.indexOf('kilimanjaro'), 1, 'ngozi');
  if (!picks.length) picks.push('zanzibar');
  // Order geographically: mainland parks west→east, the coast last.
  return picks.sort((a, b) => order(a) - order(b));
}
/** Rough distance (degrees) from a destination to the nearest already-picked stop; 0 when nothing is picked. */
function distanceToPicks(id: string, picks: string[]): number {
  if (!picks.length) return 0;
  const [lat, lng] = seedIndex.destById.get(id)!.coordinates;
  return Math.min(...picks.map(p => {
    const [pl, pg] = seedIndex.destById.get(p)!.coordinates;
    return Math.hypot(lat - pl, lng - pg);
  }));
}

const order = (id: string) => {
  const d = seedIndex.destById.get(id)!;
  return (d.tags.includes('beach') && d.id !== 'lake-tanganyika' ? 100 : 0) + d.coordinates[1];
};

function allocateNights(ids: string[], days: number): number[] {
  const weights = ids.map(id => {
    const d = seedIndex.destById.get(id)!;
    return (d.typicalDays[0] + d.typicalDays[1]) / 2;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const nights = weights.map(w => Math.max(1, Math.round((w / sum) * days)));
  let diff = days - nights.reduce((a, b) => a + b, 0);
  for (let i = nights.length - 1; diff !== 0; i = (i - 1 + nights.length) % nights.length) {
    if (diff > 0) { nights[i]!++; diff--; } else if (nights[i]! > 1) { nights[i]!--; diff++; } else if (nights.every(n => n <= 1)) break;
  }
  return nights;
}

function pickStay(destinationId: string, tier: PlanSpec['tier'], travellers: number): { stay?: Listing; alternatives: Listing[] } {
  const stays = seedIndex.listings.filter(l => !l.paused && l.type === 'stay' && l.destinationId === destinationId).sort((a, b) => a.price.amountUsd - b.price.amountUsd);
  if (!stays.length) return { alternatives: [] };
  const idx = tier === 'value' ? 0 : tier === 'luxury' ? stays.length - 1 : Math.floor((stays.length - 1) / 2);
  const stay = stays[idx]!;
  void travellers;
  return { stay, alternatives: stays.filter(s => s.id !== stay.id) };
}

function listingItem(l: Listing, time: string): ItineraryItem {
  return {
    id: uid('it_'), listingId: l.id, title: l.title.en, kind: l.type, time, durationHours: l.durationHours ?? (l.durationDays ? 8 : 2),
    priceUsd: l.price.amountUsd, perPerson: !['night', 'vehicle', 'group', 'trip'].includes(l.price.unit), destinationId: l.destinationId, media: l.media[0]
  };
}

function generic(titleKey: string, kind: ItineraryItem['kind'], time: string, hours: number, price: number, perPerson: boolean, destinationId: string, params?: Record<string, string>, extra: Partial<ItineraryItem> = {}): ItineraryItem {
  return { id: uid('it_'), title: titleKey, titleKey, titleParams: params, kind, time, durationHours: hours, priceUsd: price, perPerson, destinationId, ...extra };
}

function buildPlan(req: PlanRequest): TripPlan {
  const variant = req.variant ?? 0;
  const { spec, intent } = specFrom(req);
  const destIds = chooseDestinations(spec, variant);
  const nights = allocateNights(destIds, spec.days);
  const used = new Set<string>();
  const days: ItineraryDay[] = [];
  const legs: TravelLeg[] = [];
  const route: TripPlan['route'] = [];
  const start = new Date(Date.now() + 45 * 86400000);

  destIds.forEach((destId, di) => {
    const dest = seedIndex.destById.get(destId)!;
    const { stay, alternatives } = pickStay(destId, spec.tier, spec.travellers);
    route.push({ destinationId: destId, nights: nights[di]!, stayId: stay?.id, stayAlternatives: alternatives.map(a => a.id) });
    const pool = seedIndex.listings.filter(l => !l.paused && l.destinationId === destId && l.type !== 'stay' && l.type !== 'transport' && !(l.type === 'event' && l.date));
    const dayActivities = pool.filter(l => l.type !== 'restaurant')
      .sort((a, b) => scoreListing(b, spec) - scoreListing(a, spec) + ((variant % 2) ? (a.id < b.id ? 1 : -1) * 0.1 : 0));
    const dinners = pool.filter(l => l.type === 'restaurant');

    for (let n = 0; n < nights[di]!; n++) {
      const date = new Date(start.getTime() + days.length * 86400000).toISOString().slice(0, 10);
      const day: ItineraryDay = { destinationId: destId, date, stayListingId: stay?.id, slots: { morning: [], afternoon: [], evening: [] } };
      if (n === 0 && di > 0) {
        const prev = seedIndex.destById.get(destIds[di - 1]!)!;
        const l = leg(prev, dest);
        legs.push(l);
        const transfer = seedIndex.listings.find(x => !x.paused && x.type === 'transport' && x.destinationId === destId && (l.mode === 'flight' ? x.subtype === 'flight' : l.mode === 'ferry' ? x.subtype === 'boat' : x.subtype === 'driver' || x.subtype === 'transfer'));
        day.slots.morning.push(generic(`ai.item.travel.${l.mode}`, 'travel', '08:00', l.hours, l.mode === 'road' ? 0 : l.costPerPerson, true, destId, { from: prev.name, to: dest.name, hours: String(l.hours) }, { transport: l.mode, distanceKm: Math.round(km(prev, dest)), listingId: transfer?.id }));
      }
      const fill = (slot: Slot, time: string) => {
        const next = dayActivities.find(l => !used.has(l.id) && (slot !== 'evening' || (l.durationHours ?? 3) <= 3));
        if (next) { used.add(next.id); day.slots[slot].push(listingItem(next, next.startTimes?.[0] && slot === 'morning' ? next.startTimes[0] : time)); return true; }
        return false;
      };
      if (!day.slots.morning.length && !fill('morning', '08:00')) {
        const game = dest.tags.includes('wildlife');
        day.slots.morning.push(generic(game ? 'ai.item.gameDrive' : 'ai.item.explore', game ? 'safari' : 'free', game ? '06:30' : '09:00', game ? 4 : 3, 0, false, destId, { place: dest.name }));
      }
      const lastMorning = day.slots.morning[day.slots.morning.length - 1];
      const longMorning = (lastMorning?.durationHours ?? 0) >= 6;
      if (!longMorning && !fill('afternoon', '14:30')) {
        day.slots.afternoon.push(generic(dest.tags.includes('beach') ? 'ai.item.beach' : dest.tags.includes('wildlife') ? 'ai.item.afternoonDrive' : 'ai.item.free', 'free', '15:00', 3, 0, false, destId, { place: dest.name }));
      }
      const dinner = dinners.find(l => !used.has(l.id));
      if (dinner) { used.add(dinner.id); day.slots.evening.push(listingItem(dinner, dinner.startTimes?.[0] ?? '19:00')); }
      else day.slots.evening.push(generic('ai.item.dinner', 'meal', '19:30', 1.5, spec.tier === 'luxury' ? 0 : 18, true, destId, { place: stay ? stay.title.en : dest.name }, stay && spec.tier === 'luxury' ? { note: 'ai.note.mealsIncluded' } : {}));
      days.push(day);
    }
  });

  const totals0 = tripTotals({ id: 'x', name: '', destinationIds: destIds, adults: spec.travellers, children: 0, interests: spec.styles, days, source: 'ai', createdAt: '', updatedAt: '' });
  const fees = Math.round(totals0.total * serviceFeeRate());
  const grandTotal = totals0.total + fees;
  const reasons: TripPlan['reasons'] = [];
  destIds.forEach(id => {
    const d = seedIndex.destById.get(id)!;
    const matched = spec.styles.filter(s => d.tags.includes(s));
    reasons.push({ key: matched.length ? 'ai.reason.match' : 'ai.reason.route', params: { place: d.name, tags: matched.join(', ') } });
  });
  const month = start.getMonth() + 1;
  destIds.forEach(id => { const d = seedIndex.destById.get(id)!; if (!d.bestMonths.includes(month)) reasons.push({ key: 'ai.reason.season', params: { place: d.name } }); });
  const sustainability: TripPlan['sustainability'] = [];
  const allListings = days.flatMap(d => [...d.slots.morning, ...d.slots.afternoon, ...d.slots.evening]).map(i => i.listingId && seedIndex.listingById.get(i.listingId)).filter(Boolean) as Listing[];
  const community = allListings.filter(l => l.sustainability.communityLed || l.sustainability.localOwned).length;
  if (community) sustainability.push({ key: 'ai.sus.community', params: { count: String(community) } });
  const contrib = allListings.reduce((s, l) => s + (l.sustainability.contributionUsd ?? 0), 0);
  if (contrib) sustainability.push({ key: 'ai.sus.contribution', params: { amount: String(contrib * spec.travellers) } });
  if (legs.some(l => l.mode === 'flight')) sustainability.push({ key: 'ai.sus.flights' });
  sustainability.push({ key: 'ai.sus.general' });
  const assumptions: TripPlan['assumptions'] = [{ key: 'ai.assume.dates' }, { key: 'ai.assume.travellers', params: { count: String(spec.travellers) } }];
  if (!intent.days) assumptions.push({ key: 'ai.assume.days', params: { count: String(spec.days) } });
  return {
    id: uid('plan_'), prompt: req.prompt, spec: { ...spec, destinationIds: destIds }, intent, route, legs, days,
    totals: { ...totals0, fees, grandTotal, perPerson: Math.round(grandTotal / spec.travellers) },
    withinBudget: spec.budgetUsd !== undefined ? grandTotal <= spec.budgetUsd : undefined,
    reasons, sustainability, assumptions,
    bookable: [...new Set([...route.map(r => r.stayId).filter(Boolean) as string[], ...allListings.map(l => l.id)])]
  };
}

function scoreListing(l: Listing, spec: PlanSpec): number {
  let s = l.rating ?? 4.5;
  if (spec.styles.includes('culture') && (l.type === 'local' || l.subtype === 'culture')) s += 1.5;
  if (spec.styles.includes('wildlife') && l.type === 'safari') s += 1.5;
  if (spec.styles.includes('adventure') && l.subtype === 'hiking') s += 1;
  if (spec.styles.includes('beach') && l.subtype === 'water') s += 1;
  if (spec.styles.includes('eco') && (l.sustainability.ecoCertified || l.sustainability.communityLed)) s += 1;
  if (l.durationDays && l.durationDays > 1) s -= 3; // multi-day packages don't fit a single slot
  const perPersonDay = spec.budgetUsd ? spec.budgetUsd / spec.travellers / spec.days : undefined;
  if (perPersonDay && l.price.amountUsd > perPersonDay) s -= 2;
  if (spec.tier === 'value') s -= l.price.amountUsd / 200;
  return s;
}

/** Finds the plan that fits the budget best by downgrading tiers before giving up. */
function planWithinBudget(req: PlanRequest): TripPlan {
  let plan = buildPlan(req);
  if (plan.withinBudget === false && plan.spec.tier !== 'value') {
    const cheaper = buildPlan({ ...req, prompt: `${req.prompt} cheaper` });
    if (cheaper.totals.grandTotal < plan.totals.grandTotal) plan = { ...cheaper, prompt: req.prompt, reasons: [...cheaper.reasons, { key: 'ai.reason.downgraded' }] };
  }
  return plan;
}

const demoAi: AiService = {
  async plan(req) {
    await demoLatency(900, 1600);
    return planWithinBudget(req);
  }
};

const httpAi: AiService = { plan: (req) => http('/ai/plan', { method: 'POST', json: req }) };

export const ai: AiService = DATA_SOURCE === 'http' ? httpAi : demoAi;

// ---------------- direct questions ----------------

export type AiAnswer =
  | { type: 'plan'; plan: TripPlan }
  | { type: 'compare'; destinationIds: string[] }
  | { type: 'season'; destinationId: string }
  | { type: 'entry'; countryId: string; destinationId?: string }
  | { type: 'weather'; destinationId: string; month?: number };

const Q = {
  compare: /\b(compare|vs\.?|versus|or|better)\b|comparer|vergleich|confronta|比较|还是/i,
  season: /best time|when (should|to) (i )?(go|visit)|best month|meilleure période|quand partir|beste reisezeit|wann reisen|periodo migliore|quando andare|最佳(时间|季节)|什么时候去/i,
  entry: /\bvisa\b|e-?visa|entry requirement|passport|travel insurance|formalit|einreise|visum|visto|ingresso|签证|入境/i,
  weather: /weather|climate|temperature|rain|météo|climat|wetter|klima|regen|meteo|clima|pioggia|天气|气候|下雨/i
};

/** Routes a message to a direct answer or to the planner, and records telemetry for the Command Center. */
export async function respond(req: PlanRequest): Promise<AiAnswer & { logId: string }> {
  const started = performance.now();
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
  try {
    const answer = await answerFor(req);
    const logId = aiTelemetry.record({ prompt: req.prompt, lang, type: answer.type, ok: true, latencyMs: Math.round(performance.now() - started), destinations: answer.type === 'plan' ? answer.plan.route.map(r => r.destinationId) : undefined });
    return { ...answer, logId };
  } catch (err) {
    aiTelemetry.record({ prompt: req.prompt, lang, type: 'error', ok: false, latencyMs: Math.round(performance.now() - started) });
    throw err;
  }
}

async function answerFor(req: PlanRequest): Promise<AiAnswer> {
  const intent = parseIntent(req.prompt);
  const dests = intent.places.map(p => (p.type === 'destination' ? p.id : seedIndex.destinations.find(d => d.countryId === p.id)?.id)).filter(Boolean) as string[];
  const text = req.prompt;
  const isPlanny = intent.days !== undefined || intent.travellers !== undefined || intent.budgetUsd !== undefined || /\b(plan|itinerary|trip|holiday|vacation)\b|voyage|reise|viaggio|行程|旅行/i.test(text);
  if (!isPlanny) {
    if (Q.compare.test(text) && dests.length >= 2) { await demoLatency(400, 800); return { type: 'compare', destinationIds: [...new Set(dests)].slice(0, 3) }; }
    if (Q.entry.test(text) && intent.places.length) {
      await demoLatency(300, 700);
      const place = intent.places[0]!;
      const countryId = place.type === 'country' ? place.id : seedIndex.destById.get(place.id)?.countryId ?? 'tanzania';
      return { type: 'entry', countryId, destinationId: place.type === 'destination' ? place.id : undefined };
    }
    if (Q.season.test(text) && dests.length) { await demoLatency(300, 700); return { type: 'season', destinationId: dests[0]! }; }
    if (Q.weather.test(text) && dests.length) { await demoLatency(300, 700); return { type: 'weather', destinationId: dests[0]!, month: monthIn(text) }; }
  }
  return { type: 'plan', plan: await ai.plan(req) };
}

function monthIn(text: string): number | undefined {
  const lower = text.toLowerCase();
  for (const lang of ['en', 'fr', 'de', 'it']) {
    for (let m = 1; m <= 12; m++) {
      const name = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2026, m - 1, 1)).toLowerCase();
      if (lower.includes(name)) return m;
    }
  }
  const zh = /(\d{1,2})月/.exec(text);
  return zh ? Number(zh[1]) : undefined;
}
