import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Media } from '@/components/ui/Media';
import { StatusPill } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { effectiveStatus, useBookings } from '@/services/bookings';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { money } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel } from '@/features/trips/format';
import '@/styles/pages.css';

const FILTERS = ['all', 'upcoming', 'pending', 'completed', 'cancelled'] as const;

export default function BookingsPage() {
  const { t } = useTranslation(['account', 'common', 'trip']);
  const lang = useLocale();
  usePageTitle(t('account:bookings.title'));
  const list = useBookings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const rows = useMemo(() => list.map(b => ({ b, s: effectiveStatus(b) })).filter(({ s }) =>
    filter === 'all' || (filter === 'upcoming' && ['confirmed', 'paid', 'partially_paid'].includes(s)) || (filter === 'pending' && s === 'pending')
    || (filter === 'completed' && s === 'completed') || (filter === 'cancelled' && (s === 'cancelled' || s === 'refunded'))
  ).sort((a, b) => a.b.date.localeCompare(b.b.date)), [list, filter]);

  return (
    <div className="page">
      <section className="block">
        <div className="page-head"><span className="eyebrow">{t('common:nav.bookings')}</span><h1>{t('account:bookings.title')}</h1><p className="lede">{t('account:bookings.text')}</p></div>
        <div className="chip-row" role="group" aria-label={t('account:bookings.filter')}>
          {FILTERS.map(f => <button key={f} type="button" className="toggle" aria-pressed={filter === f} onClick={() => setFilter(f)}>{t(`account:bookings.f.${f}`)}</button>)}
        </div>
        {rows.length ? (
          <ul className="list">
            {rows.map(({ b, s }) => {
              const l = seedIndex.listingById.get(b.listingId);
              return (
                <li key={b.id} className="list-item">
                  {l && <span className="thumb"><Media id={l.media[0]!} sizes="84px" decorative /></span>}
                  <span className="grow">
                    <b>{l ? lt(l.title, lang) : b.listingId}</b>
                    <small>{b.id} · {dateLabel(b.date, lang, { day: 'numeric', month: 'short', year: 'numeric' })}{b.endDate ? ` → ${dateLabel(b.endDate, lang, { day: 'numeric', month: 'short' })}` : ''} · {t('trip:travellers.summary', { adults: b.guests.adults, children: b.guests.children })}</small>
                    <small>{money(b.price.total, lang, 'USD', { maximumFractionDigits: 2 })} · {t('trip:price.paid')}: {money(b.payment.paidUsd, lang, 'USD', { maximumFractionDigits: 2 })}</small>
                  </span>
                  <span className="actions"><StatusPill status={s} /><Link className="btn ghost sm" to={`/bookings/${b.id}`}>{t('account:bookings.manage')}</Link></span>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon="ticket" title={t('account:bookings.emptyTitle')} text={t('account:bookings.emptyText')} action={<Link className="btn solid sm" to="/marketplace">{t('account:bookings.browse')}</Link>} />}
      </section>
    </div>
  );
}
