import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Stars } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { useLocale } from '@/i18n/useLocale';
import { countryName } from '@/lib/content';
import { rating } from '@/lib/format';
import { myReviewsStore, useMyReviews } from '@/services/account';
import { bookings } from '@/services/bookings';
import { useToast } from '@/app/providers/ToastProvider';
import { uid } from '@/lib/store';
import type { Review } from '@/domain/types';
import { dateLabel } from '@/features/trips/format';
import { useStore } from '@/lib/store';
import { reviewModerationStore } from '@/services/moderation';
import { usePlatform } from '@/services/platform';
import { useReplies } from '@/services/business';
import { seedIndex } from '@/services/catalog';

export function ReviewList({ reviews, targetType, targetId }: { reviews: Review[]; targetType?: Review['targetType']; targetId?: string }) {
  const { t } = useTranslation(['account', 'common']);
  const lang = useLocale();
  const mine = useMyReviews();
  const replies = useReplies();
  const hidden = useStore(reviewModerationStore);
  // Your own reviews show with an “awaiting moderation” note until approved; rejected or hidden reviews are not shown.
  const all = useMemo(() => [...mine.filter(r => r.targetType === targetType && r.targetId === targetId && r.status !== 'rejected'), ...reviews].filter(r => !hidden[r.id]), [mine, reviews, targetType, targetId, hidden]);
  const [sort, setSort] = useState<'recent' | 'high' | 'low'>('recent');
  const sorted = useMemo(() => [...all].sort((a, b) => (sort === 'recent' ? b.date.localeCompare(a.date) : sort === 'high' ? b.rating - a.rating : a.rating - b.rating)), [all, sort]);
  if (!all.length) return <EmptyState icon="star" title={t('account:reviews.emptyTitle')} text={t('account:reviews.emptyText')} />;
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  return (
    <div className="reviews">
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div className="rating-summary">
          <span className="big">{rating(avg, lang)}</span>
          <div><Stars value={avg} /><div style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('account:reviews.count', { count: all.length })}</div></div>
        </div>
        <label className="select">
          <span className="sr">{t('account:reviews.sort')}</span>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
            <option value="recent">{t('account:reviews.recent')}</option>
            <option value="high">{t('account:reviews.high')}</option>
            <option value="low">{t('account:reviews.low')}</option>
          </select>
        </label>
      </div>
      {sorted.slice(0, 8).map(r => (
        <article className="review" key={r.id} lang={r.lang}>
          <header>
            <Stars value={r.rating} />
            <h4>{r.title}</h4>
            {r.verifiedBooking && <span className="badge verified"><Icon name="shield" />{t('common:badges.verifiedBooking')}</span>}
            {r.mine && r.status === 'pending' && <span className="badge">{t('account:reviews.pendingModeration')}</span>}
          </header>
          <p>{r.text}</p>
          <small lang={lang}>{r.author} · {countryName({ iso: r.countryIso }, lang)} · {dateLabel(r.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</small>
          {replies[r.id] && <div className="reply"><b>{t('account:reviews.responseFrom', { partner: seedIndex.partnerById.get(replies[r.id]!.partnerId)?.name ?? '' })}</b>{replies[r.id]!.text}</div>}
        </article>
      ))}
    </div>
  );
}

/** Review form for a completed booking — reviews from bookings carry the "verified booking" badge. */
export function ReviewForm({ bookingId, targetId, name, onClose }: { bookingId?: string; targetId: string; name: string; onClose: () => void }) {
  const { t } = useTranslation(['account', 'common']);
  const toast = useToast();
  const [stars, setStars] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [touched, setTouched] = useState(false);
  const lang = useLocale();
  const reviewsOpen = usePlatform().flags.reviews;
  const valid = stars > 0 && title.trim().length >= 3 && text.trim().length >= 20 && author.trim().length >= 2;
  const submit = () => {
    setTouched(true);
    if (!valid || !reviewsOpen) return;
    const review: Review = { id: uid('rv_'), targetType: 'listing', targetId, author: author.trim(), countryIso: 'TZ', rating: stars, title: title.trim(), text: text.trim(), date: new Date().toISOString().slice(0, 10), verifiedBooking: !!bookingId, lang, mine: true, status: 'pending' };
    myReviewsStore.set(list => [review, ...list]);
    if (bookingId) bookings.attachReview(bookingId, review.id);
    toast.show({ icon: 'star', text: t('account:reviews.thanks') });
    onClose();
  };
  return (
    <Modal title={t('account:reviews.writeFor', { name })} onClose={onClose}>
      {!reviewsOpen && <p className="err">{t('account:reviews.paused')}</p>}
      <div className="field">
        <span id="stars-l">{t('account:reviews.yourRating')}</span>
        <div role="radiogroup" aria-labelledby="stars-l" className="chip-row">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} className="toggle" aria-label={t('account:reviews.stars', { count: n })} onClick={() => setStars(n)}>
              {Array.from({ length: n }, (_, i) => <Icon key={i} name="star" className="star" />)}
            </button>
          ))}
        </div>
        {touched && !stars && <span className="err">{t('account:reviews.errRating')}</span>}
      </div>
      <label className="field"><span>{t('account:reviews.title')}</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} aria-invalid={touched && title.trim().length < 3} /></label>
      <label className="field">
        <span>{t('account:reviews.text')}</span>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={1500} aria-invalid={touched && text.trim().length < 20} />
        {touched && text.trim().length < 20 && <span className="err">{t('account:reviews.errText')}</span>}
      </label>
      <label className="field"><span>{t('account:reviews.name')}</span><input value={author} onChange={e => setAuthor(e.target.value)} maxLength={40} autoComplete="given-name" aria-invalid={touched && author.trim().length < 2} /></label>
      <p className="hint" style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('account:reviews.moderation')}</p>
      <div className="row-between"><button type="button" className="btn ghost sm" onClick={onClose}>{t('common:actions.cancel')}</button><button type="button" className="btn solid sm" onClick={submit}>{t('account:reviews.submit')}</button></div>
    </Modal>
  );
}
