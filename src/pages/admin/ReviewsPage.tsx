import { useState } from 'react';
import { Stars } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { countryLabel, PortalHead, useFmt, useListingTitle } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT } from '@/features/portal/admin';
import { audit } from '@/services/admin';
import { allPublishedReviews, reviewModeration, useReviewModeration } from '@/services/moderation';
import { myReviewsStore } from '@/services/account';
import { useReplies } from '@/services/business';
import { seedIndex } from '@/services/catalog';
import { useStore } from '@/lib/store';
import type { Review } from '@/domain/types';

const REASONS = ['spam', 'offensive', 'personal_data', 'not_genuine', 'off_topic'] as const;

export default function AdminReviewsPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const title = useListingTitle();
  const { write } = useAdmin('reviews');
  const mine = useStore(myReviewsStore);
  const hidden = useReviewModeration();
  const replies = useReplies();
  const [tab, setTab] = useState<'queue' | 'published' | 'hidden'>('queue');
  const [reason, setReason] = useState<Record<string, string>>({});
  const queue = mine.filter(r => (r.status ?? 'pending') === 'pending');
  const published = [...mine.filter(r => r.status === 'approved'), ...allPublishedReviews()];
  const hiddenList = Object.keys(hidden);
  const target = (r: Review) => (r.targetType === 'listing' ? title(r.targetId) : seedIndex.experienceById.get(r.targetId)?.title.en ?? seedIndex.destById.get(r.targetId)?.name ?? r.targetId);

  const card = (r: Review, actions: React.ReactNode) => (
    <li key={r.id} className="panel" style={{ display: 'grid', gap: 8 }}>
      <div className="row-between" style={{ flexWrap: 'wrap' }}><span><Stars value={r.rating} /> <b>{r.title}</b></span><small className="muted">{r.author} · {countryLabel(r.countryIso, f.lang)} · {f.d(r.date)}</small></div>
      <p>{r.text}</p>
      <small className="muted">{target(r)}{r.verifiedBooking ? ` · ${t('common:badges.verifiedBooking')}` : ''}{replies[r.id] ? ` · ${t('admin:reviews.hasReply')}` : ''}</small>
      {write && <div className="chip-row">{actions}</div>}
    </li>
  );

  return (
    <>
      <PortalHead title={t('admin:nav.reviews')} text={t('admin:reviews.text')} />
      <ReadOnly show={!write} />
      <div className="tabs" role="tablist" aria-label={t('admin:nav.reviews')}>
        {(['queue', 'published', 'hidden'] as const).map(k => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(`admin:reviews.tab.${k}`)} ({k === 'queue' ? queue.length : k === 'published' ? published.length : hiddenList.length})</button>)}
      </div>
      {tab === 'queue' && (queue.length ? <ul className="list" style={{ gap: 12 }}>{queue.map(r => card(r, <>
        <button type="button" className="btn solid sm" onClick={() => { reviewModeration.approve(r.id); audit('review.approve', r.id); toast.show({ icon: 'check', text: t('admin:reviews.approved') }); }}>{t('admin:reviews.approve')}</button>
        <button type="button" className="btn ghost sm danger" onClick={() => { reviewModeration.reject(r.id); audit('review.reject', r.id); toast.show({ icon: 'check', text: t('admin:reviews.rejected') }); }}>{t('admin:reviews.reject')}</button>
      </>))}</ul> : <p className="muted">{t('admin:reviews.emptyQueue')}</p>)}
      {tab === 'published' && <ul className="list" style={{ gap: 12 }}>{published.filter(r => !hidden[r.id]).slice(0, 40).map(r => card(r, <>
        <label className="sr" htmlFor={`rs-${r.id}`}>{t('admin:reviews.reason')}</label>
        <select id={`rs-${r.id}`} className="input" value={reason[r.id] ?? 'spam'} onChange={e => setReason({ ...reason, [r.id]: e.target.value })}>{REASONS.map(x => <option key={x} value={x}>{t(`admin:reviews.reasons.${x}`)}</option>)}</select>
        <button type="button" className="btn ghost sm danger" onClick={() => { const why = reason[r.id] ?? 'spam'; reviewModeration.hide(r.id, why); audit('review.hide', r.id, why); toast.show({ icon: 'check', text: t('admin:reviews.hidden') }); }}>{t('admin:reviews.hide')}</button>
      </>))}</ul>}
      {tab === 'hidden' && (hiddenList.length ? <ul className="list">{hiddenList.map(id => (
        <li key={id} className="list-item"><span className="grow"><b>{published.find(r => r.id === id)?.title ?? id}</b><small>{t(`admin:reviews.reasons.${hidden[id]}`)}</small></span>
          {write && <button type="button" className="btn ghost sm" onClick={() => { reviewModeration.restore(id); audit('review.restore', id); }}>{t('admin:reviews.restore')}</button>}</li>
      ))}</ul> : <p className="muted">{t('admin:reviews.noneHidden')}</p>)}
      <p className="small muted">{t('admin:reviews.policy')}</p>
    </>
  );
}
