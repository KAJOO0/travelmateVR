import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StatusPill } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { BookingDialog } from '@/features/portal/BookingDialog';
import { bookingGross, guestName, PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { effectiveStatus, usePartnerBookings } from '@/services/bookings';
import { todayIso } from '@/lib/random';
import type { Booking } from '@/domain/types';

const TABS = ['all', 'pending', 'upcoming', 'past', 'cancelled'] as const;
type Tab = (typeof TABS)[number];

export default function BusinessBookingsPage() {
  const { t } = useBizT();
  const f = useFmt();
  const { partner } = usePartnerOrg();
  const all = usePartnerBookings(partner.id);
  const listings = usePartnerListings(partner.id);
  const title = useListingTitle();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('status') as Tab) ? params.get('status') : 'all') as Tab;
  const [q, setQ] = useState('');
  const [listing, setListing] = useState('');
  const [sort, setSort] = useState<'created' | 'date'>('created');
  const [open, setOpen] = useState<Booking | null>(null);
  const today = todayIso();

  const match = (b: Booking, k: Tab) => {
    const s = effectiveStatus(b);
    switch (k) {
      case 'pending': return s === 'pending';
      case 'upcoming': return ['confirmed', 'paid', 'partially_paid'].includes(s) && b.date >= today;
      case 'past': return s === 'completed' || ((b.endDate ?? b.date) < today && !['cancelled', 'refunded'].includes(s));
      case 'cancelled': return s === 'cancelled' || s === 'refunded';
      default: return true;
    }
  };
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(b => match(b, tab) && (!listing || b.listingId === listing) && (!needle || `${b.id} ${guestName(b)} ${b.lead.email}`.toLowerCase().includes(needle)))
      .sort((a, b) => (sort === 'date' ? a.date.localeCompare(b.date) : b.createdAt.localeCompare(a.createdAt)));
  }, [all, tab, listing, q, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PortalHead title={t('business:nav.bookings')} text={t('business:bookings.text')} />
      <div className="tabs" role="tablist" aria-label={t('business:bookings.filter')}>
        {TABS.map(k => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setParams(k === 'all' ? {} : { status: k })}>
            {t(`business:bookings.tab.${k}`)} <span className="muted">({all.filter(b => match(b, k)).length})</span>
          </button>
        ))}
      </div>
      <div className="filters-row">
        <label className="sr" htmlFor="bq">{t('business:bookings.search')}</label>
        <input id="bq" className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('business:bookings.search')} />
        <label className="sr" htmlFor="bl">{t('business:common.listing')}</label>
        <select id="bl" className="input" value={listing} onChange={e => setListing(e.target.value)}>
          <option value="">{t('business:common.allListings')}</option>
          {listings.map(l => <option key={l.id} value={l.id}>{title(l.id)}</option>)}
        </select>
        <label className="sr" htmlFor="bs">{t('explore:filters.sort')}</label>
        <select id="bs" className="input" value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
          <option value="created">{t('business:bookings.sortCreated')}</option>
          <option value="date">{t('business:bookings.sortDate')}</option>
        </select>
      </div>
      {rows.length ? (
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr>
              <th scope="col">{t('business:bookings.booking')}</th><th scope="col">{t('business:bookings.guest')}</th><th scope="col">{t('business:common.listing')}</th>
              <th scope="col">{t('business:bookings.dates')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col" className="num">{t('business:bookings.value')}</th>
            </tr></thead>
            <tbody>
              {rows.map(b => (
                <tr key={b.id}>
                  <td><button type="button" className="tlink" onClick={() => setOpen(b)}><span>{b.id}</span></button><small>{f.dt(b.createdAt)}</small></td>
                  <td>{guestName(b)}<small>{t('trip:travellers.summary', { adults: b.guests.adults, children: b.guests.children })}</small></td>
                  <td>{title(b.listingId)}</td>
                  <td>{f.ds(b.date)}{b.endDate ? ` → ${f.ds(b.endDate)}` : ''}</td>
                  <td><StatusPill status={effectiveStatus(b)} /></td>
                  <td className="num">{f.m2(bookingGross(b))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="ticket" title={t('business:bookings.emptyTitle')} text={t('business:bookings.emptyText')} />}
      <p className="small muted">{t('business:bookings.valueNote')}</p>
      {open && <BookingDialog booking={open} onClose={() => setOpen(null)} />}
    </>
  );
}
