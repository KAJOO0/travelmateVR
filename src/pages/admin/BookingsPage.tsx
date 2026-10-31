import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Notice, StatusPill } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { PriceBreakdownView } from '@/features/booking/PriceBreakdownView';
import { guestName, PortalHead, useFmt, useListingTitle } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT, useAllBookings } from '@/features/portal/admin';
import { bookingsAdmin } from '@/services/admin';
import { effectiveStatus } from '@/services/bookings';
import { seedIndex } from '@/services/catalog';
import type { Booking, BookingStatus } from '@/domain/types';

const REASONS = ['partner', 'payment', 'duplicate', 'safety', 'other'] as const;

function AdminBookingModal({ b, write, onClose }: { b: Booking & { sample?: boolean }; write: boolean; onClose: () => void }) {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const [reason, setReason] = useState<(typeof REASONS)[number]>('partner');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = effectiveStatus(b);
  const cancellable = !['cancelled', 'refunded', 'completed'].includes(s);
  return (
    <Modal title={t('business:bookings.detailTitle', { id: b.id })} onClose={onClose} wide footer={write ? (
      <>
        <button type="button" className="btn ghost sm" onClick={async () => { await bookingsAdmin.resendConfirmation(b.id); toast.show({ icon: 'mail', text: t('admin:bookings.resent', { email: b.lead.email }) }); }}><Icon name="mail" />{t('admin:bookings.resend')}</button>
        {cancellable && !confirm && <button type="button" className="btn ghost sm danger" onClick={() => setConfirm(true)}>{t('admin:bookings.cancelRefund')}</button>}
      </>
    ) : undefined}>
      {b.sample && <Notice icon="info">{t('business:sample.guest')}</Notice>}
      {confirm && (
        <Notice tone="warn" icon="info">
          {t('admin:bookings.confirmText', { amount: f.m2(b.payment.paidUsd) })}
          <span className="inline-form" style={{ marginTop: 8 }}>
            <label className="field"><span>{t('admin:bookings.reason')}</span><select value={reason} onChange={e => setReason(e.target.value as typeof reason)}>{REASONS.map(r => <option key={r} value={r}>{t(`admin:bookings.reasons.${r}`)}</option>)}</select></label>
            <button type="button" className="btn solid sm" disabled={busy} onClick={async () => { setBusy(true); await bookingsAdmin.cancelWithRefund(b.id, t(`admin:bookings.reasons.${reason}`)); setBusy(false); toast.show({ icon: 'check', text: t('admin:bookings.cancelled', { id: b.id }) }); onClose(); }}>{busy ? t('business:common.working') : t('admin:bookings.confirm')}</button>
          </span>
        </Notice>
      )}
      <div className="p-grid2">
        <div className="panel">
          <dl className="kv">
            <dt>{t('business:bookings.status')}</dt><dd><StatusPill status={s} /></dd>
            <dt>{t('business:common.listing')}</dt><dd>{seedIndex.listingById.get(b.listingId)?.title.en ?? b.listingId}</dd>
            <dt>{t('admin:partners.partner')}</dt><dd>{seedIndex.partnerById.get(b.partnerId)?.name}</dd>
            <dt>{t('business:bookings.dates')}</dt><dd>{f.d(b.date)}{b.endDate ? ` → ${f.d(b.endDate)}` : ''}</dd>
            <dt>{t('business:bookings.guest')}</dt><dd>{guestName(b)} · {b.lead.email}</dd>
            <dt>{t('business:bookings.received')}</dt><dd>{f.dt(b.createdAt)}</dd>
            <dt>{t('business:bookings.payment')}</dt><dd>{t(`trip:pay.${b.payment.method}.title`)}{b.payment.reference ? ` · ${b.payment.reference}` : ''}</dd>
          </dl>
        </div>
        <div className="panel"><PriceBreakdownView price={b.price} paid={b.payment.paidUsd} /></div>
      </div>
    </Modal>
  );
}

export default function AdminBookingsPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const title = useListingTitle();
  const { write } = useAdmin('bookings');
  const all = useAllBookings();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | BookingStatus>('all');
  const [partner, setPartner] = useState('');
  const [open, setOpen] = useState<(Booking & { sample?: boolean }) | null>(null);
  const rows = useMemo(() => all.filter(b => (status === 'all' || effectiveStatus(b) === status) && (!partner || b.partnerId === partner) && (!q.trim() || `${b.id} ${guestName(b)} ${b.lead.email}`.toLowerCase().includes(q.toLowerCase()))), [all, status, partner, q]);
  const partners = [...new Set(all.map(b => b.partnerId))];
  const statuses: BookingStatus[] = ['pending', 'confirmed', 'partially_paid', 'paid', 'completed', 'cancelled', 'refunded'];

  return (
    <>
      <PortalHead title={t('admin:nav.bookings')} text={t('admin:bookings.text')} />
      <ReadOnly show={!write} />
      <div className="filters-row">
        <label className="sr" htmlFor="abq">{t('business:bookings.search')}</label>
        <input id="abq" className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('business:bookings.search')} />
        <label className="sr" htmlFor="abs">{t('business:bookings.status')}</label>
        <select id="abs" className="input" value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="all">{t('admin:bookings.allStatuses')}</option>{statuses.map(s => <option key={s} value={s}>{t(`common:status.${s}`)}</option>)}</select>
        <label className="sr" htmlFor="abp">{t('admin:partners.partner')}</label>
        <select id="abp" className="input" value={partner} onChange={e => setPartner(e.target.value)}><option value="">{t('admin:bookings.allPartners')}</option>{partners.map(p => <option key={p} value={p}>{seedIndex.partnerById.get(p)?.name ?? p}</option>)}</select>
        <span className="muted small">{t('admin:bookings.count', { count: rows.length })}</span>
      </div>
      <div className="table-wrap"><table className="dtable">
        <thead><tr><th scope="col">{t('business:bookings.booking')}</th><th scope="col">{t('business:bookings.guest')}</th><th scope="col">{t('business:common.listing')}</th><th scope="col">{t('business:bookings.dates')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col" className="num">{t('trip:price.total')}</th><th scope="col" className="num">{t('trip:price.paid')}</th></tr></thead>
        <tbody>{rows.map(b => (
          <tr key={b.id}>
            <td><button type="button" className="tlink" onClick={() => setOpen(b)}><span>{b.id}</span></button><small>{f.dt(b.createdAt)}{b.sample ? ` · ${t('business:sample.label')}` : ''}</small></td>
            <td>{guestName(b)}<small>{b.lead.email}</small></td>
            <td>{title(b.listingId)}<small>{seedIndex.partnerById.get(b.partnerId)?.name}</small></td>
            <td>{f.ds(b.date)}</td>
            <td><StatusPill status={effectiveStatus(b)} /></td>
            <td className="num">{f.m2(b.price.total)}</td><td className="num">{f.m2(b.payment.paidUsd)}</td>
          </tr>
        ))}</tbody>
      </table></div>
      {open && <AdminBookingModal b={open} write={write} onClose={() => setOpen(null)} />}
    </>
  );
}
