import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/bits';
import { Kpi, LineChart } from '@/components/charts/Charts';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { BookingDialog } from '@/features/portal/BookingDialog';
import { usePartnerThreads } from '@/features/portal/threads';
import { bookingGross, guestName, PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { effectiveStatus, usePartnerBookings } from '@/services/bookings';
import { partnerAnalytics, partnerInsights, upcoming } from '@/services/businessAnalytics';
import { availability } from '@/services/availability';
import { usePromotions } from '@/services/inventory';
import { useReplies } from '@/services/business';
import { seedIndex } from '@/services/catalog';
import { addDays, todayIso } from '@/lib/random';
import { lt } from '@/lib/content';
import type { Booking } from '@/domain/types';

export default function BusinessOverviewPage() {
  const { t } = useBizT();
  const f = useFmt();
  const { partner, user } = usePartnerOrg();
  const all = usePartnerBookings(partner.id);
  const listings = usePartnerListings(partner.id);
  const { unread } = usePartnerThreads(partner.id);
  const promos = usePromotions();
  const replies = useReplies();
  const title = useListingTitle();
  const [open, setOpen] = useState<Booking | null>(null);

  const a = useMemo(() => partnerAnalytics(partner.id, all), [partner.id, all]);
  const pending = all.filter(b => effectiveStatus(b) === 'pending');
  const arrivals = upcoming(all, 7);
  const today = todayIso();
  const occupancy = useMemo(() => {
    const stays = listings.filter(l => l.type === 'stay');
    let cap = 0, used = 0;
    for (const l of stays) for (const d of availability(l, today, addDays(today, 30))) { cap += d.capacity; used += Math.min(d.capacity, d.booked); }
    return cap ? used / cap : 0;
  }, [listings, today, all]);
  const reviewIds = seedIndex.reviews.filter(r => r.targetType === 'listing' && listings.some(l => l.id === r.targetId)).map(r => r.id);
  const insights = partnerInsights(a, {
    pending: pending.length, unread: unread.length, unanswered: reviewIds.filter(id => !replies[id]).length,
    noPano: listings.filter(l => !l.pano), promos: promos.filter(p => p.partnerId === partner.id && p.active).length
  });
  const last30 = all.filter(b => b.createdAt.slice(0, 10) >= addDays(today, -30));
  const revenue30 = last30.filter(b => ['confirmed', 'paid', 'partially_paid', 'completed'].includes(effectiveStatus(b))).reduce((s, b) => s + bookingGross(b), 0);

  return (
    <>
      <PortalHead title={t('business:overview.title', { name: user.name.split(' ')[0] })} text={t('business:overview.text', { partner: partner.name })}
        actions={<><Link className="btn ghost sm" to="/business/listings"><Icon name="building" />{t('business:nav.listings')}</Link><Link className="btn solid sm" to="/business/calendar"><Icon name="calendar" />{t('business:nav.calendar')}</Link></>} />

      <div className="kpis">
        <Kpi icon="ticket" label={t('business:kpi.bookings30')} value={f.n(last30.length)} />
        <Kpi icon="briefcase" label={t('business:kpi.revenue30')} value={f.m(revenue30)} hint={t('business:kpi.beforeCommission')} />
        <Kpi icon="clock" label={t('business:kpi.pending')} value={f.n(pending.length)} />
        <Kpi icon="bed" label={t('business:kpi.occupancy30')} value={f.pct(occupancy, 0)} />
        <Kpi icon="star" label={t('business:kpi.rating')} value={a.rating ? a.rating.toFixed(1) : '—'} hint={t('business:kpi.reviewsCount', { count: a.ratingCount })} />
      </div>

      <div className="p-split">
        <section className="panel" aria-labelledby="ov-rev">
          <div className="panel-head"><h2 id="ov-rev">{t('business:overview.performance')}</h2></div>
          <LineChart label={t('business:overview.performance')} labels={a.range.map(f.mon)}
            series={[{ name: t('business:kpi.revenue'), values: a.series.map(p => p.revenue) }]} format={f.m} />
          <p className="small muted">{t('business:overview.chartNote')}</p>
        </section>
        <section className="p-section" aria-labelledby="ov-ins">
          <h2 id="ov-ins">{t('business:overview.todo')}</h2>
          {insights.length ? (
            <ul className="insights">
              {insights.map(i => {
                const params = { ...i.params, ...(i.params?.listingId ? { title: title(String(i.params.listingId)) } : {}), ...(i.params?.month ? { month: new Intl.DateTimeFormat(f.lang === 'zh' ? 'zh-CN' : f.lang, { month: 'long' }).format(new Date(2026, Number(i.params.month) - 1, 1)) } : {}) };
                const body = <><Icon name={i.tone === 'good' ? 'check' : i.tone === 'warn' ? 'bell' : 'sparkles'} /><span>{t(`business:${i.key}`, params)}</span></>;
                return <li key={i.key} className={i.tone}>{i.href ? <Link to={i.href}>{body}</Link> : <div>{body}</div>}</li>;
              })}
            </ul>
          ) : <p className="muted">{t('business:overview.allClear')}</p>}
        </section>
      </div>

      <div className="p-grid2">
        <section className="p-section" aria-labelledby="ov-arr">
          <h2 id="ov-arr">{t('business:overview.arrivals')}</h2>
          {arrivals.length ? (
            <ul className="list">
              {arrivals.slice(0, 6).map(b => (
                <li key={b.id} className="list-item">
                  <span className="ico"><Icon name="calendar" /></span>
                  <span className="grow"><b>{guestName(b)}</b><small>{f.ds(b.date)} · {title(b.listingId)} · {t('trip:travellers.summary', { adults: b.guests.adults, children: b.guests.children })}</small></span>
                  <button type="button" className="btn ghost sm" onClick={() => setOpen(b)}>{t('business:common.open')}</button>
                </li>
              ))}
            </ul>
          ) : <p className="muted">{t('business:overview.noArrivals')}</p>}
        </section>
        <section className="p-section" aria-labelledby="ov-new">
          <div className="row-between"><h2 id="ov-new" style={{ fontSize: 'var(--fs-h4)', fontWeight: 600 }}>{t('business:overview.latest')}</h2><Link className="tlink" to="/business/bookings"><span>{t('business:common.viewAll')}</span><Icon name="arrowRight" /></Link></div>
          <ul className="list">
            {all.slice(0, 6).map(b => (
              <li key={b.id} className="list-item">
                <span className="grow"><b>{guestName(b)} · {b.id}</b><small>{lt(seedIndex.listingById.get(b.listingId)!.title, f.lang)} · {f.ds(b.date)}</small></span>
                <span className="actions"><StatusPill status={effectiveStatus(b)} /><button type="button" className="btn ghost sm" onClick={() => setOpen(b)}>{t('business:common.open')}</button></span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {open && <BookingDialog booking={open} onClose={() => setOpen(null)} />}
    </>
  );
}
