import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { SampleTag } from '@/components/charts/Charts';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt, useListingTitle } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT } from '@/features/portal/admin';
import { audit, marketingAdmin } from '@/services/admin';
import { campaignStore, featuredStore, packageStore } from '@/services/business';
import { boardCampaignStore, campaignMetrics, DEMO_BOARD } from '@/services/board';
import { inventory, usePromotions } from '@/services/inventory';
import { usePlatform } from '@/services/platform';
import { seedIndex } from '@/services/catalog';
import { useStore } from '@/lib/store';
import { todayIso } from '@/lib/random';

/** Review queue for partner campaigns, featured placement and packages, plus all running campaigns. */
export function AdminMarketingPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const title = useListingTitle();
  const { write } = useAdmin('marketing');
  const campaigns = useStore(campaignStore);
  const featured = useStore(featuredStore);
  const packages = useStore(packageStore);
  const boardCampaigns = useStore(boardCampaignStore);
  const queue = campaigns.filter(c => c.status === 'in_review');
  const featuredReq = Object.entries(featured).filter(([, v]) => v.status === 'requested');
  const pkgQueue = packages.filter(p => p.status === 'in_review');
  const running = [...campaigns.filter(c => c.status === 'live' || c.status === 'scheduled').map(c => ({ ...c, owner: seedIndex.partnerById.get(c.partnerId)?.name ?? c.partnerId })),
    ...boardCampaigns.filter(c => c.status === 'live' || c.status === 'scheduled').map(c => ({ ...c, owner: DEMO_BOARD.name }))];
  const decide = (fn: () => void, msg: string) => { fn(); toast.show({ icon: 'check', text: msg }); };

  return (
    <>
      <PortalHead title={t('admin:nav.marketing')} text={t('admin:marketing.text')} />
      <ReadOnly show={!write} />
      <section className="p-section" aria-labelledby="mk-q">
        <h2 id="mk-q">{t('admin:marketing.queue')} ({queue.length + featuredReq.length + pkgQueue.length})</h2>
        {!queue.length && !featuredReq.length && !pkgQueue.length && <p className="muted">{t('admin:marketing.emptyQueue')}</p>}
        <ul className="list">
          {queue.map(c => (
            <li key={c.id} className="list-item"><span className="ico"><Icon name="ticketStar" /></span>
              <span className="grow"><b>{c.name}</b><small>{t('admin:marketing.campaign')} · {seedIndex.partnerById.get(c.partnerId)?.name} · {f.d(c.from)} → {f.d(c.to)} · {f.m(c.budgetUsd)} · {c.listingIds.map(title).join(', ')}</small></span>
              {write && <span className="actions"><button type="button" className="btn solid sm" onClick={() => decide(() => marketingAdmin.decideCampaign(c.id, true), t('admin:marketing.approved'))}>{t('admin:reviews.approve')}</button><button type="button" className="btn ghost sm danger" onClick={() => decide(() => marketingAdmin.decideCampaign(c.id, false), t('admin:marketing.returned'))}>{t('admin:marketing.return')}</button></span>}</li>
          ))}
          {featuredReq.map(([id, v]) => (
            <li key={id} className="list-item"><span className="ico"><Icon name="star" /></span>
              <span className="grow"><b>{title(id)}</b><small>{t('admin:marketing.featured')} · {seedIndex.partnerById.get(seedIndex.listingById.get(id)?.partnerId ?? '')?.name} · {f.d(v.at)}</small></span>
              {write && <span className="actions"><button type="button" className="btn solid sm" onClick={() => decide(() => marketingAdmin.decideFeatured(id, true), t('admin:marketing.approved'))}>{t('admin:reviews.approve')}</button><button type="button" className="btn ghost sm danger" onClick={() => decide(() => marketingAdmin.decideFeatured(id, false), t('admin:marketing.returned'))}>{t('admin:reviews.reject')}</button></span>}</li>
          ))}
          {pkgQueue.map(p => (
            <li key={p.id} className="list-item"><span className="ico"><Icon name="layers" /></span>
              <span className="grow"><b>{p.name}</b><small>{t('admin:marketing.package')} · {seedIndex.partnerById.get(p.partnerId)?.name} · {p.listingIds.map(title).join(' + ')} · {f.m(p.priceUsd)}</small></span>
              {write && <span className="actions"><button type="button" className="btn solid sm" onClick={() => decide(() => marketingAdmin.decidePackage(p.id, true), t('admin:marketing.approved'))}>{t('admin:reviews.approve')}</button><button type="button" className="btn ghost sm danger" onClick={() => decide(() => marketingAdmin.decidePackage(p.id, false), t('admin:marketing.returned'))}>{t('admin:marketing.return')}</button></span>}</li>
          ))}
        </ul>
      </section>
      <section className="p-section" aria-labelledby="mk-run">
        <h2 id="mk-run">{t('admin:marketing.running')} <SampleTag /></h2>
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('business:marketing.name')}</th><th scope="col">{t('admin:marketing.owner')}</th><th scope="col">{t('business:marketing.validity')}</th><th scope="col" className="num">{t('business:marketing.budget')}</th><th scope="col" className="num">{t('business:marketing.impressions')}</th><th scope="col" className="num">{t('business:marketing.clicks')}</th><th scope="col">{t('business:bookings.status')}</th></tr></thead>
          <tbody>{running.map(c => { const m = campaignMetrics(c); return (
            <tr key={c.id}><td>{c.name}</td><td>{c.owner}</td><td>{f.d(c.from)} → {f.d(c.to)}</td><td className="num">{f.m(c.budgetUsd)}</td><td className="num">{f.n(m.impressions)}</td><td className="num">{f.n(m.clicks)}</td><td><span className={`status ${c.status === 'live' ? 'paid' : 'pending'}`}>{t(`board:campaigns.status.${c.status}`)}</span></td></tr>
          ); })}</tbody>
        </table></div>
      </section>
      <Notice icon="info">{t('admin:marketing.labelling')}</Notice>
    </>
  );
}

/** Oversight of partner offers: pause offers that break the rules; the platform cap lives in System settings. */
export function AdminPromotionsPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const title = useListingTitle();
  const { write } = useAdmin('promotions');
  const promos = usePromotions();
  const { maxPartnerDiscount } = usePlatform();
  const today = todayIso();
  const rows = useMemo(() => [...promos].sort((a, b) => b.percent - a.percent), [promos]);
  return (
    <>
      <PortalHead title={t('admin:nav.promotions')} text={t('admin:promotions.text', { max: maxPartnerDiscount })} />
      <ReadOnly show={!write} />
      <div className="table-wrap"><table className="dtable">
        <thead><tr><th scope="col">{t('business:marketing.name')}</th><th scope="col">{t('admin:partners.partner')}</th><th scope="col" className="num">{t('business:marketing.percent')}</th><th scope="col">{t('business:marketing.validity')}</th><th scope="col">{t('business:marketing.appliesTo')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
        <tbody>{rows.map(p => {
          const state = !p.active ? 'inactive' : p.to < today ? 'ended' : p.from > today ? 'scheduled' : 'live';
          return (
            <tr key={p.id}>
              <td>{p.name}{p.percent > maxPartnerDiscount && <small className="err">{t('admin:promotions.overCap')}</small>}</td>
              <td>{seedIndex.partnerById.get(p.partnerId)?.name}</td>
              <td className="num">−{p.percent}%</td>
              <td>{f.d(p.from)} → {f.d(p.to)}</td>
              <td>{p.listingIds.map(title).join(', ')}</td>
              <td><span className={`status ${state === 'live' ? 'paid' : state === 'scheduled' ? 'pending' : 'draft'}`}>{t(`business:marketing.state.${state}`)}</span></td>
              <td>{write && <button type="button" className="btn ghost sm" onClick={() => { inventory.savePromotion({ ...p, active: !p.active }); audit(p.active ? 'promotion.pause' : 'promotion.resume', p.id, p.name); }}>{p.active ? t('business:listings.pause') : t('business:listings.resume')}</button>}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
      {!rows.length && <p className="muted">{t('business:marketing.noPromotions')}</p>}
      <p className="small muted">{t('admin:promotions.note')}</p>
    </>
  );
}
