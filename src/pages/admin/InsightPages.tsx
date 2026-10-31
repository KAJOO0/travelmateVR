import { useMemo } from 'react';
import { BarChart, Donut, Kpi, LineChart, RankBars, SampleTag } from '@/components/charts/Charts';
import { countryLabel, PortalHead, useFmt } from '@/features/portal/shared';
import { useAdminT, useAllBookings } from '@/features/portal/admin';
import { platformMetrics } from '@/services/admin';
import { lastMonths } from '@/services/businessAnalytics';
import { seedIndex } from '@/services/catalog';
import { lt } from '@/lib/content';

/** Platform analytics: growth, revenue by stream, markets, partners and destinations. */
export function AdminAnalyticsPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const bookings = useAllBookings();
  const months = useMemo(() => lastMonths(12), []);
  const m = useMemo(() => platformMetrics(bookings, months), [bookings, months]);
  const streams = [
    { label: t('admin:kpi.commission'), value: Math.round(m.commission) }, { label: t('admin:analytics.fees'), value: Math.round(m.fees) },
    { label: t('admin:kpi.subscriptions'), value: m.subscriptions }, { label: t('admin:kpi.advertising'), value: m.adRevenue }, { label: t('admin:kpi.enterprise'), value: m.enterprise }
  ];
  const byType = (['stay', 'safari', 'activity', 'local', 'restaurant', 'transport', 'event'] as const).map(tp => ({ label: t(`common:listingTypePlural.${tp}`), value: bookings.filter(b => seedIndex.listingById.get(b.listingId)?.type === tp).length })).filter(x => x.value);
  return (
    <>
      <PortalHead title={t('admin:nav.analytics')} text={t('admin:analytics.text')} />
      <div className="kpis">
        <Kpi icon="activity" label={t('admin:kpi.gmv')} value={f.m(m.gmv)} />
        <Kpi icon="ticket" label={t('admin:kpi.bookings')} value={f.n(m.bookings)} />
        <Kpi icon="briefcase" label={t('admin:analytics.avgBooking')} value={f.m(m.bookings ? m.gmv / m.bookings : 0)} />
        <Kpi icon="check" label={t('admin:analytics.takeRate')} value={f.pct(m.gmv ? (m.commission + m.fees) / m.gmv : 0, 1)} />
        <Kpi icon="leaf" label={t('admin:analytics.contributions')} value={f.m(m.contributions)} />
      </div>
      <section className="panel" aria-labelledby="an-g"><div className="panel-head"><h2 id="an-g">{t('admin:analytics.gmvTrend')}</h2></div>
        <LineChart label={t('admin:analytics.gmvTrend')} labels={months.map(f.mon)} format={f.m} series={[{ name: t('admin:kpi.gmv'), values: m.series.map(p => p.gmv) }, { name: t('admin:kpi.commission'), values: m.series.map(p => p.commission) }]} /></section>
      <div className="p-grid2">
        <section className="panel" aria-labelledby="an-s"><div className="panel-head"><h2 id="an-s">{t('admin:analytics.streams')}</h2><SampleTag /></div>
          <Donut label={t('admin:analytics.streams')} items={streams} format={f.m} />
          <p className="small muted" style={{ marginTop: 8 }}>{t('admin:analytics.streamsNote')}</p></section>
        <section className="panel" aria-labelledby="an-t"><h2 id="an-t" style={{ marginBottom: 12 }}>{t('admin:analytics.byType')}</h2>
          <Donut label={t('admin:analytics.byType')} items={byType} /></section>
      </div>
      <div className="p-grid2">
        <section className="panel" aria-labelledby="an-u"><div className="panel-head"><h2 id="an-u">{t('admin:dashboard.newUsers')}</h2><SampleTag /></div>
          <BarChart label={t('admin:dashboard.newUsers')} labels={months.map(f.mon)} values={m.series.map(p => p.newUsers)} highlight={months.length - 1} /></section>
        <section className="panel" aria-labelledby="an-m"><h2 id="an-m" style={{ marginBottom: 12 }}>{t('admin:dashboard.geo')}</h2>
          <RankBars label={t('admin:dashboard.geo')} items={m.markets.slice(0, 8).map(x => ({ key: x.key, label: countryLabel(x.key, f.lang), value: x.count }))} /></section>
      </div>
      <section className="p-section" aria-labelledby="an-d"><h2 id="an-d">{t('admin:dashboard.destinationPopularity')}</h2>
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('explore:filters.destination')}</th><th scope="col" className="num">{t('board:kpi.interest')}</th><th scope="col" className="num">{t('business:kpi.bookings')}</th><th scope="col" className="num">{t('admin:kpi.gmv')}</th><th scope="col" className="num">{t('business:kpi.rating')}</th></tr></thead>
          <tbody>{m.byDestination.map(x => <tr key={x.destination.id}><td>{x.destination.name}<small>{lt(x.destination.area, f.lang)}</small></td><td className="num">{f.n(x.interest)}</td><td className="num">{x.bookings}</td><td className="num">{f.m(x.gmv)}</td><td className="num">{x.destination.rating.toFixed(1)}</td></tr>)}</tbody>
        </table></div>
        <p className="small muted">{t('admin:destinations.interestNote')}</p></section>
    </>
  );
}

/** Platform-wide sustainability: contributions, certifications, community-led supply. */
export function AdminSustainabilityPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const bookings = useAllBookings();
  const m = useMemo(() => platformMetrics(bookings, lastMonths(12)), [bookings]);
  const listings = seedIndex.listings.filter(l => !l.paused);
  const eco = listings.filter(l => l.sustainability.ecoCertified).length;
  const community = listings.filter(l => l.sustainability.communityLed || l.sustainability.localOwned).length;
  const contributing = listings.filter(l => l.sustainability.contributionUsd).length;
  const byCountry = seedIndex.countries.map(c => {
    const ls = listings.filter(l => seedIndex.destById.get(l.destinationId)?.countryId === c.id);
    return { key: c.id, label: c.name ?? countryLabel(c.iso, f.lang), value: ls.filter(l => l.sustainability.ecoCertified || l.sustainability.communityLed).length };
  }).filter(x => x.value).sort((a, b) => b.value - a.value);
  return (
    <>
      <PortalHead title={t('admin:nav.sustainability')} text={t('admin:sustainability.text')} />
      <div className="kpis">
        <Kpi icon="leaf" label={t('admin:analytics.contributions')} value={f.m(m.contributions)} hint={t('board:sustainability.contributionsHint', { count: m.bookings })} />
        <Kpi icon="shield" label={t('board:sustainability.ecoListings')} value={`${Math.round((eco / Math.max(1, listings.length)) * 100)}%`} hint={t('board:sustainability.ofListings', { count: listings.length })} />
        <Kpi icon="users" label={t('board:sustainability.community')} value={`${Math.round((community / Math.max(1, listings.length)) * 100)}%`} />
        <Kpi icon="check" label={t('admin:sustainability.contributing')} value={String(contributing)} />
        <Kpi icon="pin" label={t('board:sustainability.ecoDestinations')} value={`${seedIndex.destinations.filter(d => d.ecoCertified).length}/${seedIndex.destinations.length}`} />
      </div>
      <section className="panel" aria-labelledby="su-c"><h2 id="su-c" style={{ marginBottom: 12 }}>{t('admin:sustainability.byCountry')}</h2>
        <RankBars label={t('admin:sustainability.byCountry')} items={byCountry} /></section>
      <p className="small muted">{t('board:sustainability.claims')}</p>
    </>
  );
}
