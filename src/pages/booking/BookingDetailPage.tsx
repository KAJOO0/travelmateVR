import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { QrCode } from '@/components/ui/QrCode';
import { Notice, StatusPill, WhatsAppButton } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { PriceBreakdownView } from '@/features/booking/PriceBreakdownView';
import { ReviewForm } from '@/features/reviews/ReviewList';
import { bookings, effectiveStatus, useBookings } from '@/services/bookings';
import { messages } from '@/services/account';
import { seedIndex } from '@/services/catalog';
import { useToast } from '@/app/providers/ToastProvider';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { money, tzs } from '@/lib/format';
import { buildIcs, downloadFile } from '@/lib/ics';
import { SITE } from '@/config/site';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel } from '@/features/trips/format';
import '@/styles/pages.css';
import { MOBILE_NETWORKS } from '@/services/payments';

/** Digital confirmation + receipt + management for one booking. */
export default function BookingDetailPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get('new') === '1';
  const { t } = useTranslation(['trip', 'explore', 'common', 'account']);
  const lang = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const list = useBookings();
  const b = list.find(x => x.id === id);
  const [modal, setModal] = useState<'cancel' | 'review' | 'delete' | null>(null);
  const [working, setWorking] = useState(false);
  usePageTitle(b ? t('trip:confirm.title', { id: b.id }) : t('trip:confirm.notFound'));
  if (!b) return <div className="page"><NotFoundState title={t('trip:confirm.notFound')} to="/bookings" label={t('account:nav.bookings')} /></div>;
  const listing = seedIndex.listingById.get(b.listingId);
  const partner = seedIndex.partnerById.get(b.partnerId);
  const status = effectiveStatus(b);
  const title = listing ? lt(listing.title, lang) : b.listingId;
  const balance = Math.round((b.price.total - b.payment.paidUsd) * 100) / 100;
  const refund = bookings.refundFor(b);
  const canCancel = ['pending', 'confirmed', 'paid', 'partially_paid'].includes(status);
  const dest = listing ? seedIndex.destById.get(listing.destinationId) : undefined;

  const ics = () => downloadFile(`${b.id}.ics`, buildIcs([{ uid: b.id, title: `${title} (${b.id})`, start: b.date, end: b.endDate, time: b.startTime && !b.endDate ? b.startTime : undefined, durationHours: listing?.durationHours, location: dest?.name, description: `${t('trip:confirm.ref')}: ${b.id}\n${SITE.url}/bookings/${b.id}` }]));

  return (
    <div className="page" style={{ gap: 28 }}>
      {isNew && (
        <section className="confirm-hero" aria-live="polite">
          <span className="tick"><Icon name="check" /></span>
          <h1 className="sec-title">{status === 'pending' ? t('trip:confirm.requested') : t('trip:confirm.booked')}</h1>
          <p className="lede">{status === 'pending' ? t('trip:confirm.requestedText', { partner: partner?.name }) : t('trip:confirm.bookedText', { email: b.lead.email })}</p>
        </section>
      )}

      <div className="head-row">
        <div className="page-head">
          <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/bookings">{t('common:nav.bookings')}</Link></li><li aria-current="page">{b.id}</li></ol></nav>
          {!isNew && <h1>{title}</h1>}
          <div className="chip-row"><StatusPill status={status} />{b.sample && <span className="sample">{t('common:badges.sampleData')}</span>}<span className="badge">{t('trip:confirm.ref')}: <b>{b.id}</b></span></div>
        </div>
        <div className="head-actions no-print">
          <button type="button" className="btn ghost sm" onClick={() => window.print()}><Icon name="download" />{t('trip:confirm.receipt')}</button>
          <button type="button" className="btn ghost sm" onClick={ics}><Icon name="calendar" />{t('trip:confirm.calendar')}</button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main" style={{ gap: 24 }}>
          <section className="panel receipt" aria-labelledby="sum-h">
            <div style={{ display: 'grid', gap: 14 }}>
              <h2 id="sum-h" className="group-title">{t('trip:confirm.summary')}</h2>
              <div className="list-item" style={{ border: 0, padding: 0, background: 'none' }}>
                {listing && <span className="thumb"><Media id={listing.media[0]!} sizes="84px" decorative /></span>}
                <span className="grow"><b>{title}</b><small>{partner?.name} · {dest?.name}</small></span>
              </div>
              <dl className="kv">
                <dt>{t('trip:book.when')}</dt><dd>{dateLabel(b.date, lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}{b.endDate ? ` → ${dateLabel(b.endDate, lang, { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}{b.startTime ? ` · ${b.startTime}` : ''}</dd>
                <dt>{t('trip:book.who')}</dt><dd>{t('trip:travellers.summary', { adults: b.guests.adults, children: b.guests.children })}</dd>
                <dt>{t('trip:confirm.travellers')}</dt><dd>{b.travellers.map(x => x.name).join(', ')}</dd>
                <dt>{t('trip:book.contact')}</dt><dd>{b.lead.firstName} {b.lead.lastName} · {b.lead.email}</dd>
                <dt>{t('trip:confirm.booked')}</dt><dd>{dateLabel(b.createdAt, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
                <dt>{t('trip:book.method')}</dt><dd>{t(`trip:pay.${b.payment.method}.title`)}{b.payment.network ? ` · ${MOBILE_NETWORKS.find(n => n.id === b.payment.network)?.name ?? b.payment.network}` : ''}{b.payment.payerPhone ? ` · ${b.payment.payerPhone}` : ''}{b.payment.amountTzs ? ` · ${tzs(b.payment.amountTzs, lang)}` : ''}{b.payment.reference ? ` · ${b.payment.reference}` : ''}</dd>
                {b.requests && <><dt>{t('trip:book.requests')}</dt><dd>{b.requests}</dd></>}
              </dl>
            </div>
            <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
              <QrCode value={`${SITE.url}/bookings/${b.id}`} label={t('trip:confirm.qr', { id: b.id })} />
              <small style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', maxWidth: 170 }}>{t('trip:confirm.qrHint')}</small>
            </div>
          </section>

          {status === 'pending' && <Notice tone="warn">{t('trip:confirm.pendingNote', { partner: partner?.name })}</Notice>}
          {b.payment.method === 'bank_transfer' && balance > 0 && <Notice>{t('trip:confirm.bankNote', { id: b.id })}</Notice>}
          {status === 'refunded' && <Notice tone="ok">{t('trip:confirm.refunded')}</Notice>}

          <section className="panel no-print" style={{ display: 'grid', gap: 12 }} aria-labelledby="mg-h">
            <h2 id="mg-h" className="group-title">{t('trip:confirm.manage')}</h2>
            <div className="chip-row">
              {balance > 0 && ['confirmed', 'partially_paid'].includes(status) && (
                <button type="button" className="btn solid sm" disabled={working} onClick={async () => { setWorking(true); await bookings.payBalance(b.id); setWorking(false); toast.show({ icon: 'check', text: t('trip:confirm.paidToast') }); }}>
                  <Icon name="shield" />{t('trip:confirm.payBalance', { amount: money(balance, lang, 'USD', { maximumFractionDigits: 2 }) })}
                </button>
              )}
              {partner && <button type="button" className="btn ghost sm" onClick={() => navigate(`/account/messages?thread=${messages.ensure(partner.id, b.id)}`)}><Icon name="mail" />{t('explore:listing.message')}</button>}
              <WhatsAppButton message={t('trip:confirm.whatsapp', { id: b.id, title })} />
              {b.tripId && <Link className="btn ghost sm" to={`/trips/${b.tripId}`}><Icon name="suitcase" />{t('trip:confirm.openTrip')}</Link>}
              {status === 'completed' && !b.reviewId && <button type="button" className="btn ghost sm" onClick={() => setModal('review')}><Icon name="star" />{t('account:reviews.write')}</button>}
              {canCancel && <button type="button" className="btn ghost sm" onClick={() => setModal('cancel')}><Icon name="close" />{t('trip:confirm.cancel')}</button>}
              <Link className="btn ghost sm" to={`/help?booking=${b.id}`}><Icon name="help" />{t('trip:confirm.help')}</Link>
              <button type="button" className="btn ghost sm danger" onClick={() => setModal('delete')}><Icon name="trash" />{t('trip:confirm.delete')}</button>
            </div>
          </section>
        </div>

        <aside className="detail-side">
          <div className="panel book-box">
            <h2 style={{ fontSize: 'var(--fs-h4)' }}>{t('trip:confirm.payment')}</h2>
            <PriceBreakdownView price={b.price} paid={b.payment.paidUsd} indicative={listing?.price.indicative} />
            {listing && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>{t(`explore:cancellation.${listing.cancellation}`)}</p>}
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{SITE.company} · {SITE.address.line1}, {SITE.address.city}, {SITE.address.country} · {SITE.email}</p>
          </div>
        </aside>
      </div>

      {modal === 'cancel' && (
        <Modal title={t('trip:confirm.cancelTitle')} onClose={() => setModal(null)}>
          <p>{t('trip:confirm.cancelText', { title })}</p>
          <Notice tone={refund > 0 ? 'ok' : 'warn'}>{b.payment.paidUsd > 0 ? t('trip:confirm.refundPreview', { amount: money(refund, lang, 'USD', { maximumFractionDigits: 2 }), paid: money(b.payment.paidUsd, lang, 'USD', { maximumFractionDigits: 2 }) }) : t('trip:confirm.nothingPaid')}</Notice>
          <div className="row-between">
            <button type="button" className="btn ghost sm" onClick={() => setModal(null)}>{t('trip:confirm.keep')}</button>
            <button type="button" className="btn solid sm" disabled={working} onClick={async () => { setWorking(true); const r = await bookings.cancel(b.id); setWorking(false); setModal(null); toast.show({ icon: 'check', text: r > 0 ? t('trip:confirm.cancelledRefund', { amount: money(r, lang) }) : t('trip:confirm.cancelled') }); }}>{t('trip:confirm.confirmCancel')}</button>
          </div>
        </Modal>
      )}
      {modal === 'review' && listing && <ReviewForm bookingId={b.id} targetId={listing.id} name={title} onClose={() => setModal(null)} />}
      {modal === 'delete' && (
        <Modal title={t('trip:confirm.deleteTitle')} onClose={() => setModal(null)}>
          <p>{t('trip:confirm.deleteText', { title })}</p>
          <div className="row-between">
            <button type="button" className="btn ghost sm" onClick={() => setModal(null)}>{t('common:actions.cancel')}</button>
            <button type="button" className="btn solid sm danger" onClick={() => { bookings.remove(b.id); setModal(null); navigate('/bookings'); toast.show({ icon: 'check', text: t('trip:confirm.deletedToast') }); }}>{t('trip:confirm.confirmDelete')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
