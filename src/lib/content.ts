import type { Country, Locale, LocalizedText } from '@/domain/types';

/** Picks the text for the active language, falling back to English. */
export function lt(text: LocalizedText, lang: Locale | string): string {
  return (text as Record<string, string | undefined>)[lang] ?? text.en;
}

const displayNames = new Map<string, Intl.DisplayNames>();
/** Country names come from the browser's CLDR data, so every language is covered. */
export function countryName(c: Pick<Country, 'iso' | 'name'>, lang: Locale | string): string {
  if (c.name) return c.name;
  const key = lang === 'zh' ? 'zh-Hans' : lang;
  let dn = displayNames.get(key);
  if (!dn) {
    try { dn = new Intl.DisplayNames([key], { type: 'region' }); } catch { dn = new Intl.DisplayNames(['en'], { type: 'region' }); }
    displayNames.set(key, dn);
  }
  return dn.of(c.iso) ?? c.iso;
}

/** Like lt() for partially translated text (partner- or board-authored): active language, English, then any. */
export function ltp(text: Partial<LocalizedText> | undefined, lang: Locale | string): string {
  if (!text) return '';
  const r = text as Record<string, string | undefined>;
  return r[lang] || r.en || Object.values(r).find(Boolean) || '';
}
