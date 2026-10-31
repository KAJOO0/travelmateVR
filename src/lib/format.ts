import type { Currency } from '@/domain/types';

const intlLocale = (lang: string) => (lang === 'zh' ? 'zh-CN' : lang);

export function money(amount: number, lang: string, currency: Currency = 'USD', opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(intlLocale(lang), { style: 'currency', currency, maximumFractionDigits: 0, ...opts }).format(amount);
}

/** Tanzanian shillings, used for mobile-money amounts (prices themselves are in USD). */
export function tzs(amount: number, lang: string): string {
  return new Intl.NumberFormat(intlLocale(lang), { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);
}

export function num(n: number, lang: string, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(intlLocale(lang), opts).format(n);
}

export function rating(n: number, lang: string): string {
  return num(n, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function monthName(month: number, lang: string, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { month: style }).format(new Date(2026, month - 1, 1));
}

/** "3 hours", or "1 h 15 min" for fractional durations (plural rules don't fit decimals). */
export function hoursLabel(hours: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (!m) return t('common:units.hours', { count: h });
  return h ? t('common:units.hm', { h, m }) : t('common:units.min', { m });
}
