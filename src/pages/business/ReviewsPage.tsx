import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Stars } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { RankBars } from '@/components/charts/Charts';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { countryLabel, PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { seedIndex } from '@/services/catalog';
import { reviewReplies, useReplies } from '@/services/business';
import { useStore } from '@/lib/store';
import { myReviewsStore } from '@/services/account';

export default function BusinessReviewsPage() {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const title = useListingTitle();
  const { partner } = usePartnerOrg();
  const listings = usePartnerListings(partner.id);
  const replies = useReplies();
  const mine = useStore(myReviewsStore);
  const [filter, setFilter] = useState<'all' | 'unanswered'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const ids = new Set(listings.map(l => l.id));
  const reviews = [...mine.filter(r => r.targetType === 'listing' && ids.has(r.targetId)), ...seedIndex.reviews.filter(r => r.targetType === 'listing' && ids.has(r.targetId))]
    .sort((a, b) => b.date.localeCompare(a.date));
  const shown = filter === 'unanswered' ? reviews.filter(r => !replies[r.id]) : reviews;
  const dist = [5, 4, 3, 2, 1].map(n => ({ key: String(n), label: <Stars value={n} />, value: reviews.filter(r => Math.round(r.rating) === n).length }));
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <PortalHead title={t('business:nav.reviews')} text={t('business:reviews.text')} />
      <div className="p-split">
        <div className="p-section">
          <div className="tabs" role="tablist" aria-label={t('business:reviews.filter')}>
            {(['all', 'unanswered'] as const).map(k => <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{t(`business:reviews.tab.${k}`)} ({k === 'all' ? reviews.length : reviews.filter(r => !replies[r.id]).length})</button>)}
          </div>
          {shown.length ? (
            <ul className="list" style={{ gap: 12 }}>
              {shown.map(r => {
                const reply = replies[r.id];
                return (
                  <li key={r.id} className="panel" style={{ display: 'grid', gap: 8 }}>
                    <div className="row-between" style={{ flexWrap: 'wrap' }}>
                      <span><Stars value={r.rating} /> <b>{r.title}</b></span>
                      <small className="muted">{r.author} · {countryLabel(r.countryIso, f.lang)} · {f.d(r.date)}</small>
                    </div>
                    <p>{r.text}</p>
                    <small className="muted">{title(r.targetId)}{r.verifiedBooking ? ` · ${t('common:badges.verifiedBooking')}` : ''}</small>
                    {editing === r.id ? (
                      <form style={{ display: 'grid', gap: 8 }} onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; reviewReplies.save(r.id, partner.id, draft.trim()); setEditing(null); toast.show({ icon: 'check', text: t('business:reviews.published') }); }}>
                        <label className="field"><span>{t('business:reviews.yourReply')}</span><textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)} autoFocus /></label>
                        <span className="hint small muted">{t('business:reviews.replyHint')}</span>
                        <div className="chip-row"><button type="submit" className="btn solid sm" disabled={!draft.trim()}>{t('business:reviews.publish')}</button><button type="button" className="btn ghost sm" onClick={() => setEditing(null)}>{t('common:actions.cancel')}</button></div>
                      </form>
                    ) : reply ? (
                      <div className="reply"><b>{t('business:reviews.responseFrom', { partner: partner.name })}</b>{reply.text}
                        <div className="chip-row" style={{ marginTop: 6 }}>
                          <button type="button" className="btn ghost sm" onClick={() => { setEditing(r.id); setDraft(reply.text); }}><Icon name="edit" />{t('business:common.edit')}</button>
                          <button type="button" className="btn ghost sm" onClick={() => reviewReplies.remove(r.id)}><Icon name="trash" />{t('business:common.delete')}</button>
                        </div>
                      </div>
                    ) : <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => { setEditing(r.id); setDraft(''); }}><Icon name="mail" />{t('business:reviews.reply')}</button>}
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState icon="star" title={t('business:reviews.emptyTitle')} text={t('business:reviews.emptyText')} />}
        </div>
        <section className="panel" aria-labelledby="rv-sum">
          <h2 id="rv-sum">{t('business:reviews.summary')}</h2>
          <p style={{ fontSize: 'var(--fs-h1)', fontWeight: 700 }}>{avg ? avg.toFixed(1) : '—'}</p>
          <p className="muted small" style={{ marginBottom: 12 }}>{t('business:kpi.reviewsCount', { count: reviews.length })}</p>
          <RankBars label={t('business:reviews.summary')} items={dist} />
          <p className="small muted" style={{ marginTop: 12 }}>{t('business:reviews.policy')}</p>
        </section>
      </div>
    </>
  );
}
