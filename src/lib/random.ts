/**
 * Deterministic pseudo-random numbers (mulberry32) so sample analytics are stable between visits.
 * Only used for clearly labelled sample data; never for anything security-related.
 */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!,
    /** Multiplies a value by a random factor in [1 - spread, 1 + spread]. */
    jitter: (value: number, spread = 0.15) => value * (1 - spread + next() * spread * 2)
  };
}

/** ISO date (YYYY-MM-DD) offset by a number of days. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** Every ISO date from start (inclusive) to end (exclusive). */
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d < end && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
