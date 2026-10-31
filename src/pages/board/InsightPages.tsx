import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { BarChart, Donut, Kpi, LineChart, RankBars, SampleTag } from '@/components/charts/Charts';
import { countryLabel, PortalHead, useFmt } from '@/features/portal/shared';
import { useBoardData, useBoardT } from '@/features/portal/board';
import { seedIndex } from '@/services/catalog';
import { partnerBookingStore, bookingStore } from '@/services/bookings';
import { useStore } from '@/lib/store';
import { lt } from '@/lib/content';
import { monthName } from '@/lib/format';
import { seeded } from '@/lib/random';
import { formatOf, is360 } from '@/lib/immersive';
const FORMAT_KEY = { video: 'video360', photo360: 'photo360', preview: 'panoPreview' } as const;

/** Visitor interest: demand by month and destination, source markets, interests and searches. */
export function BoardVisitorsPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const d = useBoardData();
  return (
    <>
      <PortalHead title={t('board:nav.visitors')} text={t('board:visitors.text')} sample />
      <section className="panel" aria-labelledby="vi-m">
        <h2 id="vi-m" style={{ marginBottom: 12 }}>{t('board:visitors.byDestination')}</h2>
        <LineChart label={t('board:visitors.byDestination')} labels={d.months.map(f.mon)} format={f.n} series={d.interest.slice(0, 5).map(x => ({ name: x.destination.name, values: x.values }))} />
        <p className="small muted">{t('board:visitors.interestDef')}</p>
      </section>
      <div className="p-grid3">
        <section className="panel" aria-labelledby="vi-mk"><h2 id="vi-mk" style={{ marginBottom: 12 }}>{t('board:visitors.markets')}</h2>
          <RankBars label={t('board:visitors.markets')} items={d.marketsShare.map(m => ({ key: m.key, label: countryLabel(m.key, f.lang), value: m.count }))} format={n => `${n}%`} /></section>
        <section className="panel" aria-labelledby="vi-in"><h2 id="vi-in" style={{ marginBottom: 12 }}>{t('board:visitors.interests')}</h2>
          <Donut label={t('board:visitors.interests')} items={d.interests.map(i => ({ label: t(`common:tags.${i.key}`), value: i.count }))} /></section>
        <section className="panel" aria-labelledby="vi-q"><h2 id="vi-q" style={{ marginBottom: 12 }}>{t('board:visitors.searches')}</h2>
          <ol className="rank" style={{ listStyle: 'none' }}>{d.queries.slice(0, 8).map(q => <li key={q.query} style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}><span className="rank-label">{q.query}</span><b>{f.n(q.count)}</b></li>)}</ol>
          <p className="small muted" style={{ marginTop: 10 }}>{t('board:visitors.searchesNote')}</p></section>
      </div>
    </>
  );
}

/** Attraction performance: destination pages, 360° views and engagement. */
export function BoardAttractionsPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const d = useBoardData();
  const ids = new Set(d.destinations.map(x => x.id));
  const experiences = useMemo(() => {
    const rnd = seeded('board-xp');
    return seedIndex.experiences.filter(x => ids.has(x.destinationId)).map(x => ({ x, views: rnd.int(800, 9000), avg: rnd.int(40, 160), completion: rnd.int(38, 82) })).sort((a, b) => b.views - a.views);
  }, [d.destinations]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <PortalHead title={t('board:nav.attractions')} text={t('board:attractions.text')} sample />
      <div className="table-wrap"><table className="dtable">
        <thead><tr><th scope="col">{t('explore:filters.destination')}</th><th scope="col" className="num">{t('board:attractions.pageViews')}</th><th scope="col" className="num">{t('board:kpi.vrViews')}</th><th scope="col" className="num">{t('board:attractions.avgVr')}</th><th scope="col" className="num">{t('board:attractions.saves')}</th><th scope="col" className="num">{t('business:kpi.bookings')}</th><th scope="col" className="num">{t('business:kpi.rating')}</th></tr></thead>
        <tbody>{d.attractions.map(a => (
          <tr key={a.destination.id}><td><Link to={`/destinations/${a.destination.slug}`}>{a.destination.name}</Link></td><td className="num">{f.n(a.pageViews)}</td><td className="num">{f.n(a.vrViews)}</td><td className="num">{t('board:attractions.seconds', { count: a.avgVrSeconds })}</td><td className="num">{f.n(a.saves)}</td><td className="num">{f.n(a.bookings)}</td><td className="num">{a.rating.toFixed(1)}</td></tr>
        ))}</tbody>
      </table></div>
      <section className="p-section" aria-labelledby="at-xp">
        <h2 id="at-xp">{t('board:attractions.experiences')}</h2>
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('board:attractions.experience')}</th><th scope="col">{t('board:attractions.format')}</th><th scope="col" className="num">{t('board:kpi.vrViews')}</th><th scope="col" className="num">{t('board:attractions.avgVr')}</th><th scope="col" className="num">{t('board:attractions.completion')}</th></tr></thead>
          <tbody>{experiences.map(({ x, views, avg, completion }) => (
            <tr key={x.id}><td><Link to={`/vr/${x.slug}`}>{lt(x.title, f.lang)}</Link><small>{seedIndex.destById.get(x.destinationId)?.name}</small></td><td>{t(`common:badges.${FORMAT_KEY[formatOf(x)]}`)}</td><td className="num">{f.n(views)}</td><td className="num">{t('board:attractions.seconds', { count: avg })}</td><td className="num">{completion}%</td></tr>
          ))}</tbody>
        </table></div>
        <Notice icon="view360">{t('board:attractions.captureTip', { count: experiences.filter(e => !is360(e.x)).length })}</Notice>
      </section>
    </>
  );
}

/** Tourism trends: seasonality, length of stay, lead time, party size. */
export function BoardTrendsPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const d = useBoardData();
  const months = Array.from({ length: 12 }, (_, i) => monthName(i + 1, f.lang));
  const peak = d.trends.seasonality.indexOf(Math.max(...d.trends.seasonality));
  return (
    <>
      <PortalHead title={t('board:nav.trends')} text={t('board:trends.text')} sample />
      <div className="kpis">
        <Kpi icon="calendar" label={t('board:trends.avgStay')} value={t('common:units.days', { count: d.trends.avgStayDays })} />
        <Kpi icon="clock" label={t('board:trends.leadTime')} value={t('common:units.days', { count: d.trends.avgLeadDays })} />
        <Kpi icon="users" label={t('board:trends.partySize')} value={f.n(d.trends.avgPartySize)} />
        <Kpi icon="refresh" label={t('board:trends.repeat')} value={`${d.trends.repeatShare}%`} />
      </div>
      <div className="p-grid2">
        <section className="panel" aria-labelledby="tr-s"><h2 id="tr-s" style={{ marginBottom: 12 }}>{t('board:trends.seasonality')}</h2>
          <BarChart label={t('board:trends.seasonality')} labels={months} values={d.trends.seasonality} highlight={peak} format={n => `${n}%`} />
          <p className="small muted">{t('board:trends.seasonalityNote')}</p></section>
        <section className="panel" aria-labelledby="tr-l"><h2 id="tr-l" style={{ marginBottom: 12 }}>{t('board:trends.lengthOfStay')}</h2>
          <Donut label={t('board:trends.lengthOfStay')} items={d.trends.lengthOfStay.map(x => ({ label: t('board:trends.daysRange', { range: x.key }), value: x.count }))} /></section>
      </div>
      <section className="panel" aria-labelledby="tr-i"><h2 id="tr-i" style={{ marginBottom: 12 }}>{t('board:trends.monthly')}</h2>
        <BarChart label={t('board:trends.monthly')} labels={d.months.map(f.mon)} values={d.monthly} format={f.n} highlight={d.months.length - 1} /></section>
    </>
  );
}

/** Partner ecosystem in the board's area. */
export function BoardPartnersPage() {
  const { t } = useBoardT();
  const d = useBoardData();
  const ids = new Set(d.destinations.map(x => x.id));
  const partners = seedIndex.partners.filter(p => p.destinationIds.some(id => ids.has(id)));
  const listings = seedIndex.listings.filter(l => ids.has(l.destinationId));
  const kinds = [...new Set(partners.map(p => p.kind))].map(k => ({ label: t(`explore:partnerKind.${k}`), value: partners.filter(p => p.kind === k).length }));
  const community = listings.filter(l => l.sustainability.communityLed || l.sustainability.localOwned).length;
  return (
    <>
      <PortalHead title={t('board:nav.partners')} text={t('board:partners.text')}
        actions={<Link className="btn solid sm" to="/partners/join"><Icon name="plus" />{t('board:partners.invite')}</Link>} />
      <div className="kpis">
        <Kpi icon="briefcase" label={t('board:kpi.partners')} value={String(partners.length)} />
        <Kpi icon="shield" label={t('board:partners.verified')} value={String(partners.filter(p => p.verified).length)} />
        <Kpi icon="star" label={t('board:partners.founding')} value={String(partners.filter(p => p.real).length)} />
        <Kpi icon="users" label={t('board:partners.community')} value={`${Math.round((community / Math.max(1, listings.length)) * 100)}%`} hint={t('board:partners.ofListings')} />
      </div>
      <div className="p-split">
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('business:profile.brand')}</th><th scope="col">{t('business:listings.type')}</th><th scope="col">{t('explore:partner.areas')}</th><th scope="col" className="num">{t('business:nav.listings')}</th><th scope="col">{t('business:bookings.status')}</th></tr></thead>
          <tbody>{partners.map(p => (
            <tr key={p.id}>
              <td><Link to={`/partner/${p.slug}`}>{p.name}</Link>{!p.real && <small>{t('common:badges.sample')}</small>}</td>
              <td>{t(`explore:partnerKind.${p.kind}`)}</td>
              <td>{p.destinationIds.map(id => seedIndex.destById.get(id)?.name).filter(Boolean).join(', ')}</td>
              <td className="num">{seedIndex.listings.filter(l => l.partnerId === p.id).length}</td>
              <td>{p.real ? <span className="status paid">{t('common:badges.founding')}</span> : p.verified ? <span className="status confirmed">{t('common:badges.verified')}</span> : <span className="status draft">{t('board:partners.unverified')}</span>}</td>
            </tr>
          ))}</tbody>
        </table></div>
        <section className="panel" aria-labelledby="pe-k"><h2 id="pe-k" style={{ marginBottom: 12 }}>{t('board:partners.byType')}</h2><Donut label={t('board:partners.byType')} items={kinds} /></section>
      </div>
      <Notice icon="info">{t('board:partners.note')}</Notice>
    </>
  );
}

/** Sustainability metrics for the area. */
export function BoardSustainabilityPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const d = useBoardData();
  const own = useStore(bookingStore);
  const sample = useStore(partnerBookingStore);
  const ids = new Set(d.destinations.map(x => x.id));
  const listings = seedIndex.listings.filter(l => ids.has(l.destinationId));
  const bookings = [...own, ...sample].filter(b => { const l = seedIndex.listingById.get(b.listingId); return l && ids.has(l.destinationId) && !['cancelled', 'refunded'].includes(b.status); });
  const contributions = bookings.reduce((s, b) => s + b.price.contribution, 0);
  const eco = listings.filter(l => l.sustainability.ecoCertified).length;
  const community = listings.filter(l => l.sustainability.communityLed).length;
  const local = listings.filter(l => l.sustainability.localOwned).length;
  const ecoDest = d.destinations.filter(x => x.ecoCertified).length;
  const transport = [{ label: t('board:sustainability.road'), value: 61 }, { label: t('board:sustainability.flight'), value: 31 }, { label: t('board:sustainability.ferry'), value: 8 }];
  return (
    <>
      <PortalHead title={t('board:nav.sustainability')} text={t('board:sustainability.text')} />
      <div className="kpis">
        <Kpi icon="leaf" label={t('board:sustainability.contributions')} value={f.m(contributions)} hint={t('board:sustainability.contributionsHint', { count: bookings.length })} />
        <Kpi icon="shield" label={t('board:sustainability.ecoListings')} value={`${Math.round((eco / Math.max(1, listings.length)) * 100)}%`} hint={t('board:sustainability.ofListings', { count: listings.length })} />
        <Kpi icon="users" label={t('board:sustainability.community')} value={`${Math.round(((community + local) / Math.max(1, listings.length)) * 100)}%`} />
        <Kpi icon="pin" label={t('board:sustainability.ecoDestinations')} value={`${ecoDest}/${d.destinations.length}`} />
      </div>
      <p className="small muted">{t('board:sustainability.dataNote')}</p>
      <div className="p-grid2">
        <section className="panel" aria-labelledby="su-t"><div className="panel-head"><h2 id="su-t">{t('board:sustainability.transport')}</h2><SampleTag /></div>
          <Donut label={t('board:sustainability.transport')} items={transport} format={n => `${n}%`} /></section>
        <section className="panel" aria-labelledby="su-n"><h2 id="su-n" style={{ marginBottom: 12 }}>{t('board:sustainability.notes')}</h2>
          <ul className="list">{d.destinations.filter(x => x.sustainability).slice(0, 5).map(x => (
            <li key={x.id} className="list-item"><span className="ico"><Icon name="leaf" /></span><span className="grow"><b>{x.name}</b><small style={{ whiteSpace: 'normal' }}>{lt(x.sustainability!, f.lang)}</small></span></li>
          ))}</ul></section>
      </div>
      <Notice icon="info">{t('board:sustainability.claims')}</Notice>
    </>
  );
}
