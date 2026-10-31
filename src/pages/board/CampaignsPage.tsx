import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { Modal } from '@/components/ui/Modal';
import { SampleTag } from '@/components/charts/Charts';
import { useToast } from '@/app/providers/ToastProvider';
import { countryLabel, PortalHead, useFmt } from '@/features/portal/shared';
import { useBoardData, useBoardT } from '@/features/portal/board';
import { boardCampaigns, campaignMetrics, SOURCE_MARKETS, useBoardCampaigns, type BoardCampaign } from '@/services/board';
import { seedIndex } from '@/services/catalog';
import { addDays, todayIso } from '@/lib/random';
import type { InterestTag } from '@/domain/types';

const CHANNELS: BoardCampaign['channels'] = ['homepage', 'explore', 'ai', 'newsletter', 'partners'];
const INTERESTS: InterestTag[] = ['wildlife', 'beach', 'culture', 'mountain', 'adventure', 'eco', 'family', 'luxury'];

function CampaignModal({ c, onClose }: { c?: BoardCampaign; onClose: () => void }) {
  const { t } = useBoardT();
  const f = useFmt();
  const toast = useToast();
  const d = useBoardData();
  const [x, setX] = useState(() => c ?? { name: '', destinationIds: [] as string[], markets: ['US', 'GB'], interests: ['wildlife'] as InterestTag[], channels: ['explore', 'ai'] as BoardCampaign['channels'], from: addDays(todayIso(), 21), to: addDays(todayIso(), 111), budgetUsd: 5000, status: 'draft' as BoardCampaign['status'] });
  const valid = x.name.trim() && x.destinationIds.length && x.channels.length && x.to >= x.from;
  const toggle = <T,>(list: T[], v: T, on: boolean) => (on ? [...list, v] : list.filter(i => i !== v));
  const save = (schedule: boolean) => {
    if (!valid) return;
    const status: BoardCampaign['status'] = !schedule ? 'draft' : x.from <= todayIso() ? 'live' : 'scheduled';
    boardCampaigns.save({ ...x, id: c?.id, name: x.name.trim(), status });
    toast.show({ icon: 'check', text: t(schedule ? 'board:campaigns.scheduled' : 'board:campaigns.draftSaved') });
    onClose();
  };
  return (
    <Modal title={c ? t('board:campaigns.edit') : t('board:campaigns.new')} onClose={onClose} wide
      footer={<><button type="button" className="btn ghost" onClick={() => save(false)} disabled={!valid}>{t('business:newListing.saveDraft')}</button><button type="button" className="btn solid" onClick={() => save(true)} disabled={!valid}>{t('board:campaigns.schedule')}</button></>}>
      <div className="form-grid">
        <label className="field full"><span>{t('business:marketing.name')}</span><input value={x.name} onChange={e => setX({ ...x, name: e.target.value })} /></label>
        <label className="field"><span>{t('business:common.from')}</span><input type="date" value={x.from} onChange={e => setX({ ...x, from: e.target.value })} /></label>
        <label className="field"><span>{t('business:common.to')}</span><input type="date" value={x.to} min={x.from} onChange={e => setX({ ...x, to: e.target.value })} /></label>
        <label className="field"><span>{t('business:marketing.budget')}</span><input type="number" min={0} value={x.budgetUsd} onChange={e => setX({ ...x, budgetUsd: Number(e.target.value) })} /></label>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('board:nav.destinations')}</legend>
          <div className="checks">{d.destinations.map(dd => <label key={dd.id} className="check"><input type="checkbox" checked={x.destinationIds.includes(dd.id)} onChange={e => setX({ ...x, destinationIds: toggle(x.destinationIds, dd.id, e.target.checked) })} />{dd.name}</label>)}</div></fieldset>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('board:campaigns.markets')}</legend>
          <div className="checks">{SOURCE_MARKETS.map(m => <label key={m} className="check"><input type="checkbox" checked={x.markets.includes(m)} onChange={e => setX({ ...x, markets: toggle(x.markets, m, e.target.checked) })} />{countryLabel(m, f.lang)}</label>)}</div></fieldset>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('board:campaigns.interests')}</legend>
          <div className="checks">{INTERESTS.map(i => <label key={i} className="check"><input type="checkbox" checked={x.interests.includes(i)} onChange={e => setX({ ...x, interests: toggle(x.interests, i, e.target.checked) })} />{t(`common:tags.${i}`)}</label>)}</div></fieldset>
        <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:marketing.channels')}</legend>
          <div className="checks">{CHANNELS.map(ch => <label key={ch} className="check"><input type="checkbox" checked={x.channels.includes(ch)} onChange={e => setX({ ...x, channels: toggle(x.channels, ch, e.target.checked) })} />{t(`board:campaigns.channel.${ch}`)}</label>)}</div></fieldset>
      </div>
      <Notice icon="info">{t('board:campaigns.note')}</Notice>
    </Modal>
  );
}

export default function BoardCampaignsPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const list = useBoardCampaigns();
  const [modal, setModal] = useState<{ c?: BoardCampaign } | null>(null);
  return (
    <>
      <PortalHead title={t('board:nav.campaigns')} text={t('board:campaigns.text')} actions={<button type="button" className="btn solid sm" onClick={() => setModal({})}><Icon name="plus" />{t('board:campaigns.new')}</button>} />
      <div className="p-grid2">
        {list.map(c => {
          const m = campaignMetrics(c);
          return (
            <article key={c.id} className="panel" style={{ display: 'grid', gap: 10 }}>
              <div className="row-between"><h3>{c.name}</h3><span className={`status ${c.status === 'live' ? 'paid' : c.status === 'scheduled' ? 'pending' : 'draft'}`}>{t(`board:campaigns.status.${c.status}`)}</span></div>
              <small className="muted">{f.d(c.from)} → {f.d(c.to)} · {t('business:marketing.budget')}: {f.m(c.budgetUsd)}</small>
              <small>{c.destinationIds.map(id => seedIndex.destById.get(id)?.name ?? id).join(', ')}</small>
              <small className="muted">{c.markets.map(m2 => countryLabel(m2, f.lang)).join(', ')} · {c.interests.map(i => t(`common:tags.${i}`)).join(', ')}</small>
              {c.status === 'live' && (
                <>
                  <div className="progress" aria-label={t('board:campaigns.progress')}><span style={{ display: 'block', height: 6, borderRadius: 999, width: `${Math.round(m.progress * 100)}%`, background: 'var(--accent-bright)' }} /></div>
                  <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <div><b>{f.n(m.impressions)}</b><br /><small className="muted">{t('business:marketing.impressions')}</small></div>
                    <div><b>{f.n(m.clicks)}</b><br /><small className="muted">{t('business:marketing.clicks')}</small></div>
                    <div><b>{f.n(m.saves)}</b><br /><small className="muted">{t('board:campaigns.saves')}</small></div>
                    <div><b>{f.n(m.bookings)}</b><br /><small className="muted">{t('business:kpi.bookings')}</small></div>
                  </div>
                  <SampleTag />
                </>
              )}
              <div className="chip-row">
                <button type="button" className="btn ghost sm" onClick={() => setModal({ c })}><Icon name="edit" />{t('business:common.edit')}</button>
                <button type="button" className="btn ghost sm" onClick={() => boardCampaigns.remove(c.id)}><Icon name="trash" />{t('business:common.delete')}</button>
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && <p className="muted">{t('board:campaigns.none')}</p>}
      {modal && <CampaignModal c={modal.c} onClose={() => setModal(null)} />}
    </>
  );
}
