import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { BarChart, Donut, Kpi, LineChart, RankBars, SampleTag } from '@/components/charts/Charts';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { countryLabel, PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { usePartnerThreads } from '@/features/portal/threads';
import { effectiveStatus, usePartnerBookings } from '@/services/bookings';
import { partnerAnalytics, partnerInsights } from '@/services/businessAnalytics';
import { usePromotions } from '@/services/inventory';
import { useReplies } from '@/services/business';
import { seedIndex } from '@/services/catalog';
import { monthName } from '@/lib/format';

export default function BusinessAnalyticsPage() {
  const { t } = useBizT();
  const f = useFmt();
  const title = useListingTitle();
  const { partner } = usePartnerOrg();
  const all = usePartnerBookings(partner.id);
  const listings = usePartnerListings(partner.id);
  const { unread } = usePartnerThreads(partner.id);
  const promos = usePromotions();
  const replies = useReplies();
  const a = useMemo(() => partnerAnalytics(partner.id, all), [partner.id, all]);
  const months = Array.from({ length: 12 }, (_, i) => monthName(i + 1, f.lang));
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(f.lang === 'zh' ? 'zh-CN' : f.lang, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + i))));
  const insights = partnerInsights(a, {
    pending: all.filter(b => effectiveStatus(b) === 'pending').length, unread: unread.length,
    unanswered: seedIndex.reviews.filter(r => listings.some(l => l.id === r.targetId) && !replies[r.id]).length,
    noPano: listings.filter(l => !l.pano), promos: promos.filter(p => p.partnerId === partner.id && p.active).length
  });
  const peak = a.stayMonths.indexOf(Math.max(...a.stayMonths));

  return (
    <>
      <PortalHead title={t('business:nav.analytics')} text={t('business:analytics.text')} />
      <Notice icon="info">{t('business:analytics.sampleNote')}</Notice>

      <div className="kpis">
        <Kpi icon="eye" label={t('business:kpi.views')} value={f.n(a.totals.views)} delta={a.deltas.views} />
        <Kpi icon="search" label={t('business:kpi.searches')} value={f.n(a.totals.searches)} />
        <Kpi icon="ticket" label={t('business:kpi.bookings')} value={f.n(a.totals.bookings)} delta={a.deltas.bookings} />
        <Kpi icon="activity" label={t('business:kpi.conversion')} value={f.pct(a.conversion, 2)} />
        <Kpi icon="briefcase" label={t('business:kpi.revenue')} value={f.m(a.totals.revenue)} delta={a.deltas.revenue} />
        <Kpi icon="mail" label={t('business:kpi.enquiries')} value={f.n(a.totals.enquiries)} delta={a.deltas.enquiries} />
        <Kpi icon="star" label={t('business:kpi.rating')} value={a.rating.toFixed(1)} hint={t('business:kpi.reviewsCount', { count: a.ratingCount })} />
      </div>
      <p className="small muted"><SampleTag /> {t('business:analytics.whichSample')}</p>

      <section className="panel" aria-labelledby="an-funnel">
        <div className="panel-head"><h2 id="an-funnel">{t('business:analytics.interest')}</h2><SampleTag /></div>
        <LineChart label={t('business:analytics.interest')} labels={a.range.map(f.mon)} format={f.n}
          series={[{ name: t('business:kpi.searches'), values: a.series.map(p => p.searches) }, { name: t('business:kpi.views'), values: a.series.map(p => p.views) }]} />
        <p className="small muted">{t('business:analytics.interestNote')}</p>
      </section>

      <>
        <section className="panel" aria-labelledby="an-rev">
          <h2 id="an-rev" style={{ marginBottom: 12 }}>{t('business:analytics.bookingsRevenue')}</h2>
          <BarChart label={t('business:analytics.bookingsRevenue')} labels={a.range.map(f.mon)} values={a.series.map(p => p.revenue)} format={f.m} highlight={a.range.length - 1} />
          <p className="small muted">{t('business:analytics.byBookingDate')}</p>
        </section>
        <section className="panel" aria-labelledby="an-pop">
          <h2 id="an-pop" style={{ marginBottom: 12 }}>{t('business:analytics.popular')}</h2>
          <div className="table-wrap" style={{ border: 0 }}>
            <table className="dtable">
              <thead><tr><th scope="col">{t('business:common.listing')}</th><th scope="col" className="num">{t('business:kpi.views')}</th><th scope="col" className="num">{t('business:kpi.bookings')}</th><th scope="col" className="num">{t('business:kpi.conversion')}</th><th scope="col" className="num">{t('business:kpi.revenue')}</th></tr></thead>
              <tbody>{a.byListing.map(s => (
                <tr key={s.listing.id}><td className="wide"><Link to={`/business/listings/${s.listing.id}`}>{title(s.listing.id)}</Link></td><td className="num">{f.n(s.views)}</td><td className="num">{s.bookings}</td><td className="num">{f.pct(s.conversion, 2)}</td><td className="num">{f.m(s.revenue)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </>

      <div className="p-grid3">
        <section className="panel" aria-labelledby="an-mk">
          <h2 id="an-mk" style={{ marginBottom: 12 }}>{t('business:analytics.markets')}</h2>
          <RankBars label={t('business:analytics.markets')} items={a.markets.map(m => ({ key: m.key, label: countryLabel(m.key, f.lang), value: m.count }))} />
        </section>
        <section className="panel" aria-labelledby="an-party">
          <h2 id="an-party" style={{ marginBottom: 12 }}>{t('business:analytics.party')}</h2>
          <Donut label={t('business:analytics.party')} items={a.party.map(p => ({ label: t(`business:analytics.partyType.${p.key}`), value: p.count }))} />
        </section>
        <section className="panel" aria-labelledby="an-lead">
          <h2 id="an-lead" style={{ marginBottom: 12 }}>{t('business:analytics.leadTime')}</h2>
          <Donut label={t('business:analytics.leadTime')} items={(['lt14', 'lt30', 'lt90', 'gte90'] as const).map(k => ({ label: t(`business:analytics.lead.${k}`), value: a.leadBuckets.find(x => x.key === k)?.count ?? 0 }))} />
          <p className="small muted">{t('business:analytics.avgLead', { count: a.avgLead })}</p>
        </section>
      </div>

      <div className="p-grid2">
        <section className="panel" aria-labelledby="an-peak">
          <h2 id="an-peak" style={{ marginBottom: 12 }}>{t('business:analytics.peak')}</h2>
          <BarChart label={t('business:analytics.peak')} labels={months} values={a.stayMonths} highlight={peak} />
          <p className="small muted">{t('business:analytics.peakNote', { month: monthName(peak + 1, f.lang, 'long') })}</p>
        </section>
        <section className="panel" aria-labelledby="an-wd">
          <h2 id="an-wd" style={{ marginBottom: 12 }}>{t('business:analytics.weekdays')}</h2>
          <BarChart label={t('business:analytics.weekdays')} labels={weekdays} values={a.weekdays} />
          <p className="small muted">{t('business:analytics.weekdaysNote')}</p>
        </section>
      </div>

      <section className="panel" aria-labelledby="an-dem">
        <div className="panel-head"><h2 id="an-dem">{t('business:analytics.demand')}</h2><SampleTag /></div>
        <LineChart label={t('business:analytics.demand')} labels={months} format={f.n} series={a.destDemand.map(d => ({ name: d.destination.name, values: d.values }))} />
        <p className="small muted">{t('business:analytics.demandNote')}</p>
      </section>

      <section className="p-section" aria-labelledby="an-ins">
        <h2 id="an-ins">{t('business:analytics.insights')}</h2>
        <ul className="insights">{insights.map(i => {
          const params = { ...i.params, ...(i.params?.listingId ? { title: title(String(i.params.listingId)) } : {}), ...(i.params?.month ? { month: monthName(Number(i.params.month), f.lang, 'long') } : {}) };
          const body = <><Icon name={i.tone === 'good' ? 'check' : i.tone === 'warn' ? 'bell' : 'sparkles'} /><span>{t(`business:${i.key}`, params)}</span></>;
          return <li key={i.key} className={i.tone}>{i.href ? <Link to={i.href}>{body}</Link> : <div>{body}</div>}</li>;
        })}</ul>
      </section>
    </>
  );
}
