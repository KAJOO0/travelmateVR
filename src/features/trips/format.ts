import type { TFunction } from 'i18next';
import type { ItineraryItem } from '@/domain/types';
import { seedIndex } from '@/services/catalog';
import { lt } from '@/lib/content';

const intlLocale = (lang: string) => (lang === 'zh' ? 'zh-CN' : lang);

export function dateLabel(iso: string | undefined, lang: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(intlLocale(lang), { ...opts, timeZone: 'UTC' }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

export function dayLabel(t: TFunction, index: number, date: string | undefined, lang: string): string {
  return date ? `${t('trip:day', { n: index + 1 })} · ${dateLabel(date, lang)}` : t('trip:day', { n: index + 1 });
}

/** Display title for an itinerary item: listing title in the reader's language, translated key, or the user's own text. */
export function itemTitle(t: TFunction, item: ItineraryItem, lang: string): string {
  if (item.listingId && !item.titleKey) {
    const l = seedIndex.listingById.get(item.listingId);
    if (l) return lt(l.title, lang);
  }
  if (item.experienceId) {
    const x = seedIndex.experienceById.get(item.experienceId);
    if (x) return lt(x.title, lang);
  }
  if (item.titleKey) return t(item.titleKey.includes(':') ? item.titleKey : `trip:${item.titleKey}`, item.titleParams ?? {});
  return item.title;
}

export function nightsBetween(a?: string, b?: string): number {
  if (!a || !b) return 1;
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}
