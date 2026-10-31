import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { Notice, StatusPill } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { effectiveStatus, partnerBookings } from '@/services/bookings';
import { seedIndex } from '@/services/catalog';
import { useSettings } from '@/services/business';
import { lt } from '@/lib/content';
import type { Booking } from '@/domain/types';
import { bookingGross, countryLabel, guestName, useBizT, useFmt } from './shared';

/** Booking details as the partner sees them, with request handling. */
export function BookingDialog({ booking, onClose }: { booking: Booking & { sample?: boolean }; onClose: () => void }) {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const listing = seedIndex.listingById.get(booking.listingId);
  const settings = useSettings(booking.partnerId);
  const [busy, setBusy] = useState<'confirm' | 'decline' | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const status = effectiveStatus(booking);
  const gross = bookingGross(booking);
  const commission = Math.round(gross * settings.commissionRate * 100) / 100;
  const today = new Date().toISOString().slice(0, 10);

  const act = async (kind: 'confirm' | 'decline') => {
    setBusy(kind);
    if (kind === 'confirm') await partnerBookings.confirm(booking.id); else await partnerBookings.decline(booking.id);
    setBusy(null);
    toast.show({ icon: 'check', text: t(kind === 'confirm' ? 'business:bookings.confirmed' : 'business:bookings.declined', { id: booking.id }) });
    onClose();
  };

  return (
    <Modal title={t('business:bookings.detailTitle', { id: booking.id })} onClose={onClose} wide footer={
      <>
        <div className="chip-row">
          {status === 'pending' && !confirmDecline && <>
            <button type="button" className="btn solid sm" disabled={!!busy} onClick={() => void act('confirm')}><Icon name="check" />{busy === 'confirm' ? t('business:common.working') : t('business:bookings.accept')}</button>
            <button type="button" className="btn ghost sm danger" disabled={!!busy} onClick={() => setConfirmDecline(true)}><Icon name="close" />{t('business:bookings.decline')}</button>
          </>}
          {(status === 'confirmed' || status === 'paid' || status === 'partially_paid') && booking.date <= today && (
            <button type="button" className="btn ghost sm" onClick={() => { partnerBookings.complete(booking.id); onClose(); }}><Icon name="check" />{t('business:bookings.markCompleted')}</button>
          )}
          {(status === 'confirmed' || status === 'paid' || status === 'partially_paid') && booking.date > today && !confirmDecline && (
            <button type="button" className="btn ghost sm danger" onClick={() => setConfirmDecline(true)}><Icon name="close" />{t('business:bookings.cancelForGuest')}</button>
          )}
        </div>
        <button type="button" className="btn ghost sm" onClick={onClose}>{t('common:a11y.close')}</button>
      </>
    }>
      {confirmDecline && (
        <Notice tone="warn" icon="info">
          {t('business:bookings.declineWarn', { amount: f.m2(booking.payment.paidUsd) })}{' '}
          <span className="chip-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn solid sm" disabled={!!busy} onClick={() => void act('decline')}>{busy ? t('business:common.working') : t('business:bookings.declineConfirm')}</button>
            <button type="button" className="btn ghost sm" onClick={() => setConfirmDecline(false)}>{t('common:actions.cancel')}</button>
          </span>
        </Notice>
      )}
      {booking.sample && <Notice icon="info">{t('business:sample.guest')}</Notice>}
      <div className="p-grid2">
        <div className="panel" style={{ display: 'grid', gap: 10 }}>
          <div className="row-between"><h3>{listing ? lt(listing.title, f.lang) : booking.listingId}</h3><StatusPill status={status} /></div>
          <dl className="kv">
            <dt>{t('business:bookings.dates')}</dt><dd>{f.d(booking.date)}{booking.endDate ? ` → ${f.d(booking.endDate)}` : ''}{booking.startTime ? ` · ${booking.startTime}` : ''}</dd>
            <dt>{t('business:bookings.guests')}</dt><dd>{t('trip:travellers.summary', { adults: booking.guests.adults, children: booking.guests.children })}{booking.units > 1 ? ` · ${t('business:bookings.units', { count: booking.units })}` : ''}</dd>
            {booking.extras.length > 0 && <><dt>{t('trip:price.extras')}</dt><dd>{booking.extras.map(x => { const e = listing?.extras?.find(y => y.id === x); return e ? lt(e.label, f.lang) : x; }).join(', ')}</dd></>}
            <dt>{t('business:bookings.received')}</dt><dd>{f.dt(booking.createdAt)}</dd>
            <dt>{t('business:bookings.payment')}</dt><dd>{t(`trip:pay.${booking.payment.method}.title`)}{booking.payment.network ? ` (${booking.payment.network === 'mpesa' ? 'M-Pesa' : booking.payment.network === 'airtel' ? 'Airtel Money' : booking.payment.network === 'mixx' ? 'Mixx by Yas' : 'HaloPesa'})` : ''} · {f.m2(booking.payment.paidUsd)} / {f.m2(booking.price.total)}</dd>
          </dl>
          {booking.requests && <div className="reply"><b>{t('business:bookings.requests')}</b>{booking.requests}</div>}
        </div>
        <div className="panel" style={{ display: 'grid', gap: 10 }}>
          <h3>{t('business:bookings.guest')}</h3>
          <dl className="kv">
            <dt>{t('business:bookings.name')}</dt><dd>{guestName(booking)}</dd>
            <dt>{t('trip:book.country')}</dt><dd>{countryLabel(booking.lead.country, f.lang)}</dd>
            <dt>{t('trip:book.email')}</dt><dd><a href={`mailto:${booking.lead.email}`}>{booking.lead.email}</a></dd>
            <dt>{t('trip:book.phone')}</dt><dd>{booking.lead.phone}</dd>
            {booking.travellers.length > 1 && <><dt>{t('trip:confirm.travellers')}</dt><dd>{booking.travellers.map(x => x.name).join(', ')}</dd></>}
          </dl>
          <p className="small muted">{t('business:bookings.privacy')}</p>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>{t('business:bookings.earnings')}</h3>
        <div className="breakdown">
          <div className="row"><span>{t('trip:price.base')}</span><span>{f.m2(booking.price.base)}</span></div>
          {booking.price.extras > 0 && <div className="row"><span>{t('trip:price.extras')}</span><span>{f.m2(booking.price.extras)}</span></div>}
          {!!booking.price.discount && <div className="row discount"><span>{t('trip:price.discount', { name: booking.price.promotion })}</span><span>−{f.m2(booking.price.discount)}</span></div>}
          <div className="row"><span>{t('business:revenue.commission', { rate: Math.round(settings.commissionRate * 100) })}</span><span>−{f.m2(commission)}</span></div>
          <div className="row total"><span>{t('business:revenue.net')}</span><span>{f.m2(gross - commission)}</span></div>
          <small className="muted">{t('business:bookings.taxNote', { taxes: f.m2(booking.price.taxes), fee: f.m2(booking.price.serviceFee) })}</small>
        </div>
      </div>
    </Modal>
  );
}
