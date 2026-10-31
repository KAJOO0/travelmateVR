import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { BarChart, Kpi, LineChart, RankBars, SampleTag } from '@/components/charts/Charts';
import { usePortal } from '@/components/portal/PortalLayout';
import { countryLabel, PortalHead, useFmt } from '@/features/portal/shared';
import { useAdminT, useAllBookings } from '@/features/portal/admin';
import { platformMetrics, useSupportQueue } from '@/services/admin';
import { lastMonths } from '@/services/businessAnalytics';
import { useAiLog } from '@/services/aiTelemetry';
import { seedIndex } from '@/services/catalog';
import { useExperienceStatus } from '@/services/moderation';

export default function AdminDashboardPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const { user } = usePortal();
  const bookings = useAllBookings();
  const aiLog = useAiLog();
  const tickets = useSupportQueue();
  useExperienceStatus();
  const months = useMemo(() => lastMonths(12), []);
  const m = useMemo(() => platformMetrics(bookings, months), [bookings, months]);
  const openTickets = tickets.filter(x => x.status !== 'resolved' && x.status !== 'closed').length;

  return (
    <>
      <PortalHead title={t('admin:dashboard.title', { name: user.name.split(' ')[0] })} text={t('admin:dashboard.text')} />
      <Notice icon="info">{t('admin:dashboard.dataNote')}</Notice>
      <div className="kpis">
        <Kpi icon="users" label={t('admin:kpi.totalUsers')} value={f.n(m.totalUsers)} hint={t('admin:kpi.sampleHint')} />
        <Kpi icon="user" label={t('admin:kpi.activeUsers')} value={f.n(m.activeUsers)} hint={t('admin:kpi.sampleHint')} />
        <Kpi icon="briefcase" label={t('admin:kpi.partners')} value={f.n(seedIndex.partners.length)} />
        <Kpi icon="pin" label={t('admin:kpi.destinations')} value={f.n(seedIndex.destinations.length)} />
        <Kpi icon="ticket" label={t('admin:kpi.bookings')} value={f.n(m.bookings)} />
        <Kpi icon="activity" label={t('admin:kpi.gmv')} value={f.m(m.gmv)} />
        <Kpi icon="check" label={t('admin:kpi.commission')} value={f.m(m.commission)} hint={t('admin:kpi.plusFees', { fees: f.m(m.fees) })} />
        <Kpi icon="layers" label={t('admin:kpi.subscriptions')} value={f.m(m.subscriptions)} hint={t('admin:kpi.annualised')} />
        <Kpi icon="ticketStar" label={t('admin:kpi.advertising')} value={f.m(m.adRevenue)} hint={t('admin:kpi.campaignBudgets')} />
        <Kpi icon="building" label={t('admin:kpi.enterprise')} value={f.m(m.enterprise)} hint={t('admin:kpi.sampleHint')} />
        <Kpi icon="view360" label={t('admin:kpi.vr')} value={f.n(seedIndex.experiences.length)} />
        <Kpi icon="sparkles" label={t('admin:kpi.ai')} value={f.n(aiLog.length)} hint={t('admin:kpi.thisDevice')} />
        <Kpi icon="barChart" label={t('admin:kpi.conversion')} value={f.pct(m.conversion, 1)} hint={t('admin:kpi.sampleHint')} />
        <Kpi icon="help" label={t('admin:kpi.tickets')} value={f.n(openTickets)} hint={t('admin:kpi.open')} />
      </div>

      <div className="p-split">
        <section className="panel" aria-labelledby="d-growth">
          <div className="panel-head"><h2 id="d-growth">{t('admin:dashboard.growth')}</h2><SampleTag /></div>
          <LineChart label={t('admin:dashboard.growth')} labels={months.map(f.mon)} format={f.n}
            series={[{ name: t('admin:kpi.activeUsers'), values: m.series.map(p => p.activeUsers) }, { name: t('admin:dashboard.newUsers'), values: m.series.map(p => p.newUsers) }]} />
        </section>
        <section className="panel" aria-labelledby="d-geo">
          <h2 id="d-geo" style={{ marginBottom: 12 }}>{t('admin:dashboard.geo')}</h2>
          <RankBars label={t('admin:dashboard.geo')} items={m.markets.slice(0, 7).map(x => ({ key: x.key, label: countryLabel(x.key, f.lang), value: x.count }))} />
          <p className="small muted" style={{ marginTop: 8 }}>{t('admin:dashboard.geoNote')}</p>
        </section>
      </div>

      <div className="p-grid2">
        <section className="panel" aria-labelledby="d-bk">
          <h2 id="d-bk" style={{ marginBottom: 12 }}>{t('admin:dashboard.bookingTrends')}</h2>
          <BarChart label={t('admin:dashboard.bookingTrends')} labels={months.map(f.mon)} values={m.series.map(p => p.bookings)} highlight={months.length - 1} />
        </section>
        <section className="panel" aria-labelledby="d-rev">
          <div className="panel-head"><h2 id="d-rev">{t('admin:dashboard.revenueTrends')}</h2><SampleTag /></div>
          <LineChart label={t('admin:dashboard.revenueTrends')} labels={months.map(f.mon)} format={f.m}
            series={[{ name: t('admin:kpi.commission'), values: m.series.map(p => p.commission) }, { name: t('admin:kpi.subscriptions'), values: m.series.map(p => p.subscription) }, { name: t('admin:kpi.advertising'), values: m.series.map(p => p.advertising) }, { name: t('admin:kpi.enterprise'), values: m.series.map(p => p.enterprise) }]} />
          <p className="small muted">{t('admin:dashboard.revenueNote')}</p>
        </section>
      </div>

      <div className="p-grid2">
        <section className="panel" aria-labelledby="d-pp">
          <div className="panel-head"><h2 id="d-pp">{t('admin:dashboard.partnerPerformance')}</h2><Link className="tlink" to="/admin/partners"><span>{t('business:common.viewAll')}</span><Icon name="arrowRight" /></Link></div>
          <div className="table-wrap" style={{ border: 0 }}><table className="dtable">
            <thead><tr><th scope="col">{t('admin:partners.partner')}</th><th scope="col" className="num">{t('business:kpi.bookings')}</th><th scope="col" className="num">{t('admin:kpi.gmv')}</th><th scope="col" className="num">{t('business:kpi.rating')}</th></tr></thead>
            <tbody>{m.byPartner.slice(0, 6).map(x => <tr key={x.partner.id}><td>{x.partner.name}{!x.partner.real && <small>{t('common:badges.sample')}</small>}</td><td className="num">{x.bookings}</td><td className="num">{f.m(x.gmv)}</td><td className="num">{x.rating ? x.rating.toFixed(1) : '—'}</td></tr>)}</tbody>
          </table></div>
        </section>
        <section className="panel" aria-labelledby="d-dp">
          <div className="panel-head"><h2 id="d-dp">{t('admin:dashboard.destinationPopularity')}</h2><SampleTag /></div>
          <RankBars label={t('admin:dashboard.destinationPopularity')} items={m.byDestination.slice(0, 8).map(x => ({ key: x.destination.id, label: x.destination.name, value: x.interest }))} format={f.n} />
        </section>
      </div>
    </>
  );
}
