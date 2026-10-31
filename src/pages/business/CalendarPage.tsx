import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice, StatusPill } from '@/components/ui/bits';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { BookingDialog } from '@/features/portal/BookingDialog';
import { guestName, PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { effectiveStatus, usePartnerBookings } from '@/services/bookings';
import { availability } from '@/services/availability';
import { inventory, useBlackouts, useSeasonal } from '@/services/inventory';
import { addDays, todayIso } from '@/lib/random';
import type { Booking } from '@/domain/types';

/** Calendar-based availability: occupancy per day, arrivals, seasonal rates and blackout dates. */
export function AvailabilityCalendar({ listingId, partnerId, compact }: { listingId: string; partnerId: string; compact?: boolean }) {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const all = usePartnerBookings(partnerId);
  const blackouts = useBlackouts();
  const seasonal = useSeasonal();
  const listings = usePartnerListings(partnerId);
  const listing = listings.find(l => l.id === listingId)!;
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [mode, setMode] = useState<'view' | 'block'>('view');
  const [day, setDay] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [open, setOpen] = useState<Booking | null>(null);

  const start = addDays(`${month}-01`, -7);
  const days = useMemo(() => new Map(availability(listing, start, addDays(start, 50), all).map(d => [d.date, d])), [listing, start, all, blackouts]); // eslint-disable-line react-hooks/exhaustive-deps
  const rates = seasonal.filter(r => r.listingId === listingId);
  const blocked = new Set(blackouts[listingId] ?? []);

  const onSelect = (date: string, extend: boolean) => {
    if (mode === 'view') { setDay(date); return; }
    if (date < todayIso()) return;
    if (extend && anchor) {
      const [a, b] = anchor < date ? [anchor, date] : [date, anchor];
      const range: string[] = [];
      for (let d = a; d <= b; d = addDays(d, 1)) range.push(d);
      inventory.toggleBlackout(listingId, range, !blocked.has(date));
      toast.show({ icon: 'check', text: t('business:calendar.rangeUpdated', { count: range.length }) });
    } else inventory.toggleBlackout(listingId, [date], !blocked.has(date));
    setAnchor(date);
  };

  const dayInfo = day ? days.get(day) : undefined;
  return (
    <div className="p-section">
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div className="seg" role="radiogroup" aria-label={t('business:calendar.mode')} style={{ gridTemplateColumns: 'repeat(2, auto)' }}>
          <button type="button" role="radio" aria-checked={mode === 'view'} onClick={() => setMode('view')}><Icon name="eye" /> {t('business:calendar.view')}</button>
          <button type="button" role="radio" aria-checked={mode === 'block'} onClick={() => setMode('block')}><Icon name="close" /> {t('business:calendar.block')}</button>
        </div>
        {!compact && <Link className="btn ghost sm" to={`/business/listings/${listingId}?tab=pricing`}><Icon name="briefcase" />{t('business:calendar.rates')}</Link>}
      </div>
      {mode === 'block' && <Notice icon="info">{t('business:calendar.blockHint')}</Notice>}
      <MonthCalendar month={month} onMonthChange={setMonth} label={t('business:nav.calendar')} minMonth={todayIso().slice(0, 7)}
        selected={day && mode === 'view' ? new Set([day]) : undefined} onSelect={onSelect}
        dayClass={d => { const x = days.get(d); return [x?.blackout ? 'blocked' : x && x.left === 0 ? 'full' : '', rates.some(r => r.from <= d && d <= r.to) ? 'seasonal' : ''].join(' '); }}
        renderDay={d => {
          const x = days.get(d);
          if (!x) return null;
          const arrivals = x.bookings.filter(b => b.date === d);
          return <>
            <span className="tag">{x.blackout ? t('business:calendar.closed') : t('business:calendar.left', { count: x.left })}</span>
            {arrivals.length > 0 && <span className="chip">{t('business:calendar.arrivals', { count: arrivals.length })}</span>}
            <span className="meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (x.booked / Math.max(1, x.capacity)) * 100)}%` }} /></span>
          </>;
        }} />
      <div className="mcal-legend">
        <span><i style={{ background: 'var(--accent-bright)' }} />{t('business:calendar.legendBooked')}</span>
        <span><i style={{ background: 'color-mix(in srgb, var(--warning) 30%, var(--panel))' }} />{t('business:calendar.legendFull')}</span>
        <span><i style={{ background: 'repeating-linear-gradient(135deg, var(--panel), var(--panel) 3px, color-mix(in srgb, var(--danger) 30%, var(--panel)) 3px, color-mix(in srgb, var(--danger) 30%, var(--panel)) 6px)' }} />{t('business:calendar.legendBlocked')}</span>
        <span><i style={{ boxShadow: 'inset 0 -3px 0 var(--eco)' }} />{t('business:calendar.legendSeasonal')}</span>
      </div>
      {mode === 'view' && dayInfo && (
        <div className="panel" aria-live="polite">
          <div className="panel-head"><h3>{f.d(dayInfo.date)}</h3><span className="muted small">{dayInfo.blackout ? t('business:calendar.closed') : t('business:calendar.usage', { booked: dayInfo.booked, capacity: dayInfo.capacity })}</span></div>
          {dayInfo.bookings.length ? (
            <ul className="list">{dayInfo.bookings.map(b => (
              <li key={b.id} className="list-item">
                <span className="grow"><b>{guestName(b)}</b><small>{b.id} · {f.ds(b.date)}{b.endDate ? ` → ${f.ds(b.endDate)}` : ''} · {t('trip:travellers.summary', { adults: b.guests.adults, children: b.guests.children })}</small></span>
                <span className="actions"><StatusPill status={effectiveStatus(b)} /><button type="button" className="btn ghost sm" onClick={() => setOpen(b)}>{t('business:common.open')}</button></span>
              </li>
            ))}</ul>
          ) : <p className="muted">{t('business:calendar.noBookings')}</p>}
          {dayInfo.date >= todayIso() && (
            <button type="button" className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => inventory.toggleBlackout(listingId, [dayInfo.date], !dayInfo.blackout)}>
              {dayInfo.blackout ? t('business:calendar.reopen') : t('business:calendar.closeDay')}
            </button>
          )}
        </div>
      )}
      {open && <BookingDialog booking={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export default function BusinessCalendarPage() {
  const { t } = useBizT();
  const { partner } = usePartnerOrg();
  const listings = usePartnerListings(partner.id);
  const title = useListingTitle();
  const [listingId, setListingId] = useState(listings[0]?.id ?? '');
  return (
    <>
      <PortalHead title={t('business:nav.calendar')} text={t('business:calendar.text')} />
      <div className="tabs" role="tablist" aria-label={t('business:common.listing')}>
        {listings.map(l => <button key={l.id} type="button" role="tab" aria-selected={listingId === l.id} onClick={() => setListingId(l.id)}>{title(l.id)}</button>)}
      </div>
      {listingId && <AvailabilityCalendar key={listingId} listingId={listingId} partnerId={partner.id} />}
    </>
  );
}
