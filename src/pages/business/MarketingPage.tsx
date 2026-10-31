import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { Modal } from '@/components/ui/Modal';
import { SampleTag } from '@/components/charts/Charts';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { inventory, usePromotions, type Promotion } from '@/services/inventory';
import { campaignStore, featuredStore, marketing, packageStore, type Campaign, type CampaignChannel } from '@/services/business';
import { campaignMetrics } from '@/services/board';
import { useStore } from '@/lib/store';
import { usePlatform } from '@/services/platform';
import { addDays, todayIso } from '@/lib/random';

const TABS = ['promotions', 'campaigns', 'featured', 'packages'] as const;
type Tab = (typeof TABS)[number];
const CHANNELS: CampaignChannel[] = ['homepage', 'destination', 'newsletter', 'social', 'ai'];

function ListingChecks({ partnerId, value, onChange }: { partnerId: string; value: string[]; onChange: (v: string[]) => void }) {
  const title = useListingTitle();
  const listings = usePartnerListings(partnerId);
  return <div className="checks">{listings.map(l => <label key={l.id} className="check"><input type="checkbox" checked={value.includes(l.id)} onChange={e => onChange(e.target.checked ? [...value, l.id] : value.filter(x => x !== l.id))} />{title(l.id)}</label>)}</div>;
}

function PromotionModal({ partnerId, promo, onClose }: { partnerId: string; promo?: Promotion; onClose: () => void }) {
  const { t } = useBizT();
  const toast = useToast();
  const [p, setP] = useState(() => promo ?? { name: '', listingIds: [] as string[], percent: 10, from: addDays(todayIso(), 7), to: addDays(todayIso(), 60), active: true, partnerId });
  const maxDiscount = usePlatform().maxPartnerDiscount;
  const errs = { name: !p.name.trim(), listings: !p.listingIds.length, percent: p.percent < 1 || p.percent > maxDiscount, dates: p.to < p.from };
  const [touched, setTouched] = useState(false);
  const save = () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    inventory.savePromotion({ ...p, name: p.name.trim() });
    toast.show({ icon: 'check', text: t('business:marketing.promoSaved') });
    onClose();
  };
  return (
    <Modal title={promo ? t('business:marketing.editPromotion') : t('business:marketing.newPromotion')} onClose={onClose}
      footer={<><button type="button" className="btn ghost" onClick={onClose}>{t('common:actions.cancel')}</button><button type="button" className="btn solid" onClick={save}>{t('common:actions.save')}</button></>}>
      <div className="form-grid">
        <label className="field full"><span>{t('business:marketing.name')}</span><input value={p.name} onChange={e => setP({ ...p, name: e.target.value })} placeholder={t('business:marketing.promoPh')} aria-invalid={touched && errs.name} />{touched && errs.name && <span className="err">{t('business:common.required')}</span>}</label>
        <label className="field"><span>{t('business:marketing.percent')}</span><input type="number" min={1} max={maxDiscount} value={p.percent} onChange={e => setP({ ...p, percent: Number(e.target.value) })} aria-invalid={touched && errs.percent} />{touched && errs.percent && <span className="err">{t('business:marketing.errPercent', { max: maxDiscount })}</span>}</label>
        <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" checked={p.active} onChange={e => setP({ ...p, active: e.target.checked })} />{t('business:common.active')}</label>
        <label className="field"><span>{t('business:marketing.validFrom')}</span><input type="date" value={p.from} onChange={e => setP({ ...p, from: e.target.value })} /></label>
        <label className="field"><span>{t('business:marketing.validTo')}</span><input type="date" value={p.to} min={p.from} onChange={e => setP({ ...p, to: e.target.value })} aria-invalid={touched && errs.dates} />{touched && errs.dates && <span className="err">{t('business:common.errDates')}</span>}</label>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:marketing.appliesTo')}</legend><ListingChecks partnerId={partnerId} value={p.listingIds} onChange={v => setP({ ...p, listingIds: v })} />{touched && errs.listings && <span className="err">{t('business:marketing.errListings')}</span>}</fieldset>
      </div>
      <p className="small muted">{t('business:marketing.promoHint')}</p>
    </Modal>
  );
}

function CampaignModal({ partnerId, onClose }: { partnerId: string; onClose: () => void }) {
  const { t } = useBizT();
  const toast = useToast();
  const [c, setC] = useState({ name: '', goal: 'bookings' as Campaign['goal'], listingIds: [] as string[], channels: ['destination'] as CampaignChannel[], from: addDays(todayIso(), 14), to: addDays(todayIso(), 74), budgetUsd: 300 });
  const valid = c.name.trim() && c.listingIds.length && c.channels.length && c.to >= c.from && c.budgetUsd >= 0;
  const save = (submit: boolean) => {
    if (!valid) return;
    marketing.saveCampaign({ ...c, partnerId, submit });
    toast.show({ icon: 'check', text: t(submit ? 'business:marketing.campaignSubmitted' : 'business:marketing.campaignDraft') });
    onClose();
  };
  return (
    <Modal title={t('business:marketing.newCampaign')} onClose={onClose} wide
      footer={<><button type="button" className="btn ghost" onClick={() => save(false)} disabled={!valid}>{t('business:newListing.saveDraft')}</button><button type="button" className="btn solid" onClick={() => save(true)} disabled={!valid}>{t('business:marketing.submitReview')}</button></>}>
      <div className="form-grid">
        <label className="field"><span>{t('business:marketing.name')}</span><input value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></label>
        <label className="field"><span>{t('business:marketing.goal')}</span><select value={c.goal} onChange={e => setC({ ...c, goal: e.target.value as Campaign['goal'] })}>{(['bookings', 'awareness', 'low_season'] as const).map(g => <option key={g} value={g}>{t(`business:marketing.goals.${g}`)}</option>)}</select></label>
        <label className="field"><span>{t('business:common.from')}</span><input type="date" value={c.from} onChange={e => setC({ ...c, from: e.target.value })} /></label>
        <label className="field"><span>{t('business:common.to')}</span><input type="date" value={c.to} min={c.from} onChange={e => setC({ ...c, to: e.target.value })} /></label>
        <label className="field"><span>{t('business:marketing.budget')}</span><input type="number" min={0} value={c.budgetUsd} onChange={e => setC({ ...c, budgetUsd: Number(e.target.value) })} /></label>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:marketing.channels')}</legend>
          <div className="checks">{CHANNELS.map(ch => <label key={ch} className="check"><input type="checkbox" checked={c.channels.includes(ch)} onChange={e => setC({ ...c, channels: e.target.checked ? [...c.channels, ch] : c.channels.filter(x => x !== ch) })} />{t(`business:marketing.channel.${ch}`)}</label>)}</div></fieldset>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:marketing.appliesTo')}</legend><ListingChecks partnerId={partnerId} value={c.listingIds} onChange={v => setC({ ...c, listingIds: v })} /></fieldset>
      </div>
      <Notice icon="info">{t('business:marketing.campaignNote')}</Notice>
    </Modal>
  );
}

export default function BusinessMarketingPage() {
  const { t } = useBizT();
  const f = useFmt();
  const title = useListingTitle();
  const toast = useToast();
  const { partner } = usePartnerOrg();
  const listings = usePartnerListings(partner.id);
  const promos = usePromotions().filter(p => p.partnerId === partner.id);
  const campaigns = useStore(campaignStore).filter(c => c.partnerId === partner.id);
  const featured = useStore(featuredStore);
  const packages = useStore(packageStore).filter(p => p.partnerId === partner.id);
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'promotions') as Tab;
  const [modal, setModal] = useState<'promo' | 'campaign' | 'package' | null>(null);
  const [editPromo, setEditPromo] = useState<Promotion | undefined>();
  const [pkg, setPkg] = useState({ name: '', listingIds: [] as string[], nights: 3, priceUsd: 0, description: '' });
  const today = todayIso();

  return (
    <>
      <PortalHead title={t('business:nav.marketing')} text={t('business:marketing.text')} />
      <div className="tabs" role="tablist" aria-label={t('business:nav.marketing')}>
        {TABS.map(k => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}>{t(`business:marketing.tab.${k}`)}</button>)}
      </div>

      {tab === 'promotions' && (
        <section className="p-section">
          <div className="row-between"><p className="muted">{t('business:marketing.promotionsText')}</p><button type="button" className="btn solid sm" onClick={() => { setEditPromo(undefined); setModal('promo'); }}><Icon name="plus" />{t('business:marketing.newPromotion')}</button></div>
          {promos.length ? (
            <div className="table-wrap"><table className="dtable">
              <thead><tr><th scope="col">{t('business:marketing.name')}</th><th scope="col" className="num">{t('business:marketing.percent')}</th><th scope="col">{t('business:marketing.validity')}</th><th scope="col">{t('business:marketing.appliesTo')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
              <tbody>{promos.map(p => {
                const state = !p.active ? 'inactive' : p.to < today ? 'ended' : p.from > today ? 'scheduled' : 'live';
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td><td className="num">−{p.percent}%</td><td>{f.d(p.from)} → {f.d(p.to)}</td>
                    <td>{p.listingIds.map(title).join(', ')}</td>
                    <td><span className={`status ${state === 'live' ? 'paid' : state === 'scheduled' ? 'pending' : 'draft'}`}>{t(`business:marketing.state.${state}`)}</span></td>
                    <td><span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                      <button type="button" className="icon-btn" onClick={() => { setEditPromo(p); setModal('promo'); }} aria-label={t('business:common.edit')}><Icon name="edit" /></button>
                      <button type="button" className="icon-btn" onClick={() => inventory.removePromotion(p.id)} aria-label={t('business:common.delete')}><Icon name="trash" /></button>
                    </span></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          ) : <p className="muted">{t('business:marketing.noPromotions')}</p>}
        </section>
      )}

      {tab === 'campaigns' && (
        <section className="p-section">
          <div className="row-between"><p className="muted">{t('business:marketing.campaignsText')}</p><button type="button" className="btn solid sm" onClick={() => setModal('campaign')}><Icon name="plus" />{t('business:marketing.newCampaign')}</button></div>
          <div className="p-grid2">
            {campaigns.map(c => {
              const m = campaignMetrics(c);
              return (
                <article key={c.id} className="panel" style={{ display: 'grid', gap: 10 }}>
                  <div className="row-between"><h3>{c.name}</h3><span className={`status ${c.status === 'live' ? 'paid' : c.status === 'in_review' ? 'pending' : 'draft'}`}>{t(`business:marketing.cstatus.${c.status}`)}</span></div>
                  <small className="muted">{f.d(c.from)} → {f.d(c.to)} · {t('business:marketing.budget')}: {f.m(c.budgetUsd)} · {c.channels.map(ch => t(`business:marketing.channel.${ch}`)).join(', ')}</small>
                  {c.status === 'live' ? (
                    <>
                      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                        <div><b>{f.n(m.impressions)}</b><br /><small className="muted">{t('business:marketing.impressions')}</small></div>
                        <div><b>{f.n(m.clicks)}</b><br /><small className="muted">{t('business:marketing.clicks')}</small></div>
                        <div><b>{f.pct(m.ctr)}</b><br /><small className="muted">CTR</small></div>
                        <div><b>{f.n(m.bookings)}</b><br /><small className="muted">{t('business:kpi.bookings')}</small></div>
                      </div>
                      <SampleTag />
                    </>
                  ) : <p className="small muted">{t(`business:marketing.cstatusText.${c.status}`)}</p>}
                  <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => marketing.removeCampaign(c.id)}><Icon name="trash" />{t('business:common.delete')}</button>
                </article>
              );
            })}
          </div>
          {!campaigns.length && <p className="muted">{t('business:marketing.noCampaigns')}</p>}
        </section>
      )}

      {tab === 'featured' && (
        <section className="p-section">
          <p className="muted">{t('business:marketing.featuredText')}</p>
          <ul className="list">{listings.map(l => {
            const st = featured[l.id];
            return (
              <li key={l.id} className="list-item">
                <span className="grow"><b>{title(l.id)}</b><small>{st ? t(`business:marketing.featuredStatus.${st.status}`) : t('business:marketing.notFeatured')}</small></span>
                {st ? <button type="button" className="btn ghost sm" onClick={() => marketing.cancelFeatured(l.id)}>{t('business:marketing.withdraw')}</button>
                  : <button type="button" className="btn solid sm" onClick={() => { marketing.requestFeatured(l.id); toast.show({ icon: 'check', text: t('business:marketing.featuredRequested') }); }}><Icon name="star" />{t('business:marketing.requestFeatured')}</button>}
              </li>
            );
          })}</ul>
          <Notice icon="info">{t('business:marketing.sponsoredSoon')}</Notice>
        </section>
      )}

      {tab === 'packages' && (
        <section className="p-section">
          <p className="muted">{t('business:marketing.packagesText')}</p>
          {packages.length > 0 && <ul className="list">{packages.map(p => (
            <li key={p.id} className="list-item"><span className="grow"><b>{p.name}</b><small>{p.listingIds.map(title).join(' + ')} · {t('trip:nights', { count: p.nights })} · {f.m(p.priceUsd)}</small></span>
              <span className={`status ${p.status === 'live' ? 'paid' : 'pending'}`}>{t(`business:listings.draftStatus.${p.status}`)}</span>
              <button type="button" className="icon-btn" onClick={() => marketing.removePackage(p.id)} aria-label={t('business:common.delete')}><Icon name="trash" /></button></li>
          ))}</ul>}
          <form className="panel" style={{ display: 'grid', gap: 12 }} onSubmit={e => {
            e.preventDefault();
            if (!pkg.name.trim() || pkg.listingIds.length < 2 || pkg.priceUsd <= 0) return;
            marketing.savePackage({ ...pkg, partnerId: partner.id, status: 'in_review' });
            setPkg({ name: '', listingIds: [], nights: 3, priceUsd: 0, description: '' });
            toast.show({ icon: 'check', text: t('business:marketing.packageSubmitted') });
          }}>
            <h3>{t('business:marketing.newPackage')}</h3>
            <div className="form-grid">
              <label className="field"><span>{t('business:marketing.name')}</span><input value={pkg.name} onChange={e => setPkg({ ...pkg, name: e.target.value })} /></label>
              <label className="field"><span>{t('business:marketing.nights')}</span><input type="number" min={1} value={pkg.nights} onChange={e => setPkg({ ...pkg, nights: Math.max(1, Number(e.target.value)) })} /></label>
              <label className="field"><span>{t('business:marketing.packagePrice')}</span><input type="number" min={0} value={pkg.priceUsd || ''} onChange={e => setPkg({ ...pkg, priceUsd: Number(e.target.value) })} /></label>
              <label className="field full"><span>{t('business:listing.description')}</span><textarea rows={3} value={pkg.description} onChange={e => setPkg({ ...pkg, description: e.target.value })} /></label>
              <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:marketing.packageItems')}</legend><ListingChecks partnerId={partner.id} value={pkg.listingIds} onChange={v => setPkg({ ...pkg, listingIds: v })} /></fieldset>
            </div>
            <button type="submit" className="btn solid" style={{ justifySelf: 'start' }} disabled={!pkg.name.trim() || pkg.listingIds.length < 2 || pkg.priceUsd <= 0}>{t('business:marketing.submitReview')}</button>
          </form>
        </section>
      )}

      {modal === 'promo' && <PromotionModal partnerId={partner.id} promo={editPromo} onClose={() => setModal(null)} />}
      {modal === 'campaign' && <CampaignModal partnerId={partner.id} onClose={() => setModal(null)} />}
    </>
  );
}
