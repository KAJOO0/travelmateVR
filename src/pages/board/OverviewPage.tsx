import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { Kpi, LineChart, RankBars, SampleTag } from '@/components/charts/Charts';
import { usePortal } from '@/components/portal/PortalLayout';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { useBoardData, useBoardT } from '@/features/portal/board';
import { campaignMetrics, useBoardCampaigns, useDestinationEdits, usePosts } from '@/services/board';
import { seedIndex } from '@/services/catalog';

export default function BoardOverviewPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const { user, orgName } = usePortal();
  const d = useBoardData();
  const posts = usePosts();
  const edits = useDestinationEdits();
  const campaigns = useBoardCampaigns();
  const ids = new Set(d.destinations.map(x => x.id));
  const partners = seedIndex.partners.filter(p => p.destinationIds.some(id => ids.has(id)));
  const totalInterest = d.monthly.reduce((a, b) => a + b, 0);
  const vrViews = d.attractions.reduce((s, a) => s + a.vrViews, 0);
  const live = campaigns.filter(c => c.status === 'live');
  const drafts = posts.filter(p => p.status === 'draft').length + Object.values(edits).filter(e => e.status === 'draft').length;

  return (
    <>
      <PortalHead title={t('board:overview.title', { name: user.name.split(' ')[0] })} text={t('board:overview.text', { org: orgName })}
        actions={<><Link className="btn ghost sm" to="/board/content"><Icon name="plus" />{t('board:content.new')}</Link><Link className="btn solid sm" to="/board/campaigns"><Icon name="ticketStar" />{t('board:nav.campaigns')}</Link></>} />
      <Notice icon="info">{t('board:overview.demoNote')}</Notice>
      <div className="kpis">
        <Kpi icon="eye" label={t('board:kpi.interest')} value={f.n(totalInterest)} />
        <Kpi icon="view360" label={t('board:kpi.vrViews')} value={f.n(vrViews)} />
        <Kpi icon="pin" label={t('board:kpi.destinations')} value={f.n(d.destinations.length)} />
        <Kpi icon="briefcase" label={t('board:kpi.partners')} value={f.n(partners.length)} hint={t('board:kpi.verified', { count: partners.filter(p => p.verified).length })} />
        <Kpi icon="layers" label={t('board:kpi.drafts')} value={f.n(drafts)} />
      </div>
      <p className="small muted"><SampleTag /> {t('board:overview.sampleNote')}</p>
      <div className="p-split">
        <section className="panel" aria-labelledby="bo-int">
          <div className="panel-head"><h2 id="bo-int">{t('board:visitors.interest')}</h2><SampleTag /></div>
          <LineChart label={t('board:visitors.interest')} labels={d.months.map(f.mon)} series={[{ name: t('board:kpi.interest'), values: d.monthly }]} format={f.n} />
        </section>
        <section className="panel" aria-labelledby="bo-top">
          <div className="panel-head"><h2 id="bo-top">{t('board:overview.top')}</h2><Link className="tlink" to="/board/attractions"><span>{t('business:common.viewAll')}</span><Icon name="arrowRight" /></Link></div>
          <RankBars label={t('board:overview.top')} items={d.interest.slice(0, 6).map(x => ({ key: x.destination.id, label: x.destination.name, value: x.total }))} format={f.n} />
        </section>
      </div>
      <section className="p-section" aria-labelledby="bo-camp">
        <h2 id="bo-camp">{t('board:overview.liveCampaigns')}</h2>
        {live.length ? <ul className="list">{live.map(c => {
          const m = campaignMetrics(c);
          return <li key={c.id} className="list-item"><span className="ico"><Icon name="ticketStar" /></span><span className="grow"><b>{c.name}</b><small>{f.d(c.from)} → {f.d(c.to)} · {f.n(m.impressions)} {t('business:marketing.impressions')} · {f.n(m.clicks)} {t('business:marketing.clicks')}</small></span><Link className="btn ghost sm" to="/board/campaigns">{t('business:common.open')}</Link></li>;
        })}</ul> : <p className="muted">{t('board:campaigns.none')}</p>}
      </section>
    </>
  );
}
