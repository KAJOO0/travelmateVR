import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n/useLocale';
import { money, num } from '@/lib/format';
import { dateLabel } from '@/features/trips/format';
import { usePageTitle } from '@/app/usePageTitle';
import { seedIndex } from '@/services/catalog';
import { useOverrides } from '@/services/inventory';
import { lt } from '@/lib/content';
import type { Booking, Listing } from '@/domain/types';
import { SampleTag } from '@/components/charts/Charts';

/** Page header for portal screens; also sets the document title. */
export function PortalHead({ title, text, actions, sample }: { title: string; text?: string; actions?: ReactNode; sample?: boolean }) {
  usePageTitle(title);
  return (
    <div className="p-head">
      <div>
        <h1>{title}{sample && <> <SampleTag /></>}</h1>
        {text && <p>{text}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

/** Number, money, percentage and date formatters for the active language. */
export function useFmt() {
  const lang = useLocale();
  return useMemo(() => ({
    lang,
    m: (n: number) => money(n, lang),
    m2: (n: number) => money(n, lang, 'USD', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }),
    n: (n: number) => num(n, lang),
    pct: (n: number, digits = 1) => num(n, lang, { style: 'percent', maximumFractionDigits: digits }),
    d: (iso?: string) => dateLabel(iso, lang, { day: 'numeric', month: 'short', year: 'numeric' }),
    // Short date; adds the year when it isn't the current one.
    ds: (iso?: string) => dateLabel(iso, lang, iso && iso.slice(0, 4) !== String(new Date().getFullYear()) ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }),
    dt: (iso: string) => new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)),
    mon: (ym: string) => new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang, { month: 'short', timeZone: 'UTC' }).format(new Date(`${ym}-01T00:00:00Z`))
  }), [lang]);
}

/** The partner's listings; re-renders when inventory edits are saved. */
export function usePartnerListings(partnerId: string): Listing[] {
  const overrides = useOverrides();
  // Copies, so React sees new objects after the catalogue overlay updates the shared ones.
  return useMemo(() => { void overrides; return seedIndex.listings.filter(l => l.partnerId === partnerId).map(l => ({ ...l })); }, [partnerId, overrides]);
}

export const guestName = (b: Booking) => `${b.lead.firstName} ${b.lead.lastName}`.trim();
export function useListingTitle() {
  const lang = useLocale();
  return (id: string) => { const l = seedIndex.listingById.get(id); return l ? lt(l.title, lang) : id; };
}

/** Booking value the partner earns: base + extras − promotion, before commission. */
export const bookingGross = (b: Booking) => b.price.base + b.price.extras - (b.price.discount ?? 0);

export function countryLabel(iso: string, lang: string): string {
  try { return new Intl.DisplayNames([lang === 'zh' ? 'zh-Hans' : lang], { type: 'region' }).of(iso) ?? iso; } catch { return iso; }
}

/** Shows a translated note under a panel, e.g. how numbers are calculated. */
export function Footnote({ children }: { children: ReactNode }) {
  return <p className="small muted" style={{ marginTop: 8 }}>{children}</p>;
}

export function useBizT() {
  return useTranslation(['business', 'common', 'explore', 'trip']);
}
