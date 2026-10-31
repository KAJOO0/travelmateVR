import manifest from '@/data/media.generated.json';

export interface MediaEntry {
  w: number;
  h: number;
  widths: number[];
  alt: string;
  own: boolean;
  lqip: string;
  credit?: { author: string; license: string; licenseUrl: string; source: string; title: string };
}

const MEDIA = manifest as Record<string, MediaEntry>;

export function media(id: string): MediaEntry | undefined {
  return MEDIA[id];
}

export function srcSet(id: string): string {
  const m = MEDIA[id];
  return m ? m.widths.map(w => `/media/${id}-${w}.webp ${w}w`).join(', ') : '';
}

/** Best single URL at or above the requested width (for CSS backgrounds). */
export function mediaUrl(id: string, width = 1600): string {
  const m = MEDIA[id];
  if (!m) return '';
  const w = m.widths.find(x => x >= width) ?? m.widths[m.widths.length - 1];
  return `/media/${id}-${w}.webp`;
}

export function allCredits(): [string, MediaEntry][] {
  return Object.entries(MEDIA).filter(([, m]) => m.credit);
}
