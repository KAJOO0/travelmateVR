import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Counter } from '@/components/ui/Counter';
import { Notice, ShareButtons } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { seedIndex } from '@/services/catalog';
import { SLOTS, trips, tripTotals, useTrips, type ItemPos } from '@/services/trips';
import { useBookings } from '@/services/bookings';
import { useToast } from '@/app/providers/ToastProvider';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { hoursLabel, money } from '@/lib/format';
import { buildIcs, downloadFile } from '@/lib/ics';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel, dayLabel, itemTitle } from '@/features/trips/format';
import type { ItineraryItem, Slot, Trip } from '@/domain/types';
import '@/styles/pages.css';
import { bookingOpen } from '@/services/payments';

const SLOT_ICON: Record<Slot, IconName> = { morning: 'sun', afternoon: 'activity', evening: 'moon' };
const KIND_ICON: Partial<Record<ItineraryItem['kind'], IconName>> = { stay: 'bed', safari: 'binoculars', activity: 'activity', restaurant: 'utensils', meal: 'utensils', transport: 'car', travel: 'car', event: 'ticketStar', local: 'users', free: 'sun' };

export default function ItineraryBuilderPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation(['trip', 'common', 'explore']);
  const lang = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const list = useTrips();
  const bookingList = useBookings();
  const trip = list.find(x => x.id === id);
  usePageTitle(trip?.name ?? t('trip:plan.notFound'));
  const [drag, setDrag] = useState<ItemPos | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [modal, setModal] = useState<'add' | 'share' | 'book' | 'delete' | 'settings' | null>(params.get('book') === '1' ? 'book' : null);
  const [addTarget, setAddTarget] = useState<{ day: number; slot: Slot }>({ day: 0, slot: 'morning' });
  const travellers = trip ? trip.adults + trip.children : 0;
  const totals = useMemo(() => (trip ? tripTotals(trip) : null), [trip]);
  const points: MapPoint[] = useMemo(() => {
    if (!trip) return [];
    const seen: string[] = [];
    trip.days.forEach(d => { if (seen[seen.length - 1] !== d.destinationId) seen.push(d.destinationId); });
    return seen.map((dId, i) => { const d = seedIndex.destById.get(dId)!; return { id: `${dId}-${i}`, lat: d.coordinates[0], lng: d.coordinates[1], label: String(i + 1), title: d.name, href: `/destinations/${d.slug}` }; });
  }, [trip]);

  if (!trip || !totals) return <div className="page"><NotFoundState title={t('trip:plan.notFound')} to="/plan" label={t('trip:plan.title')} /></div>;
  const m = (n: number) => money(n, lang);
  const bookable = trip.days.flatMap((d, di) => SLOTS.flatMap(s => d.slots[s].map(it => ({ it, day: d, di })))).filter(x => x.it.listingId);
  const stays = [...new Set(trip.days.map(d => d.stayListingId).filter(Boolean) as string[])];
  const bookingFor = (listingId?: string) => (listingId ? bookingList.find(b => b.tripId === trip.id && b.listingId === listingId && !['cancelled', 'refunded'].includes(b.status)) : undefined);

  const onDrop = (day: number, slot: Slot, index?: number) => {
    if (!drag) return;
    trips.moveItem(trip.id, drag, { day, slot, index });
    setDrag(null); setOver(null);
  };
  const move = (pos: ItemPos, dir: -1 | 1) => {
    const order: { day: number; slot: Slot }[] = trip.days.flatMap((_, di) => SLOTS.map(s => ({ day: di, slot: s })));
    const len = trip.days[pos.day]!.slots[pos.slot].length;
    if (dir === -1 && pos.index > 0) return trips.moveItem(trip.id, pos, { day: pos.day, slot: pos.slot, index: pos.index - 1 });
    if (dir === 1 && pos.index < len - 1) return trips.moveItem(trip.id, pos, { day: pos.day, slot: pos.slot, index: pos.index + 1 });
    const i = order.findIndex(o => o.day === pos.day && o.slot === pos.slot) + dir;
    const target = order[i];
    if (target) trips.moveItem(trip.id, pos, { ...target, index: dir === 1 ? 0 : undefined });
  };

  const exportIcs = () => {
    const events = trip.days.flatMap((d, di) => SLOTS.flatMap(s => d.slots[s].map(it => ({
      uid: `${trip.id}-${it.id}`, title: itemTitle(t, it, lang), start: d.date ?? new Date().toISOString().slice(0, 10), time: d.date ? it.time : undefined,
      durationHours: it.durationHours, location: seedIndex.destById.get(d.destinationId)?.name, description: `${trip.name} · ${dayLabel(t, di, d.date, lang)}`
    }))));
    downloadFile(`${trip.name.replace(/[^\w-]+/g, '-')}.ics`, buildIcs(events, trip.name));
  };

  return (
    <div className="page" style={{ gap: 24 }}>
      <div className="head-row">
        <div className="page-head">
          <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/plan">{t('trip:plan.title')}</Link></li><li aria-current="page">{trip.name}</li></ol></nav>
          <h1 className="sr">{trip.name}</h1>
          <label className="sr" htmlFor="trip-name">{t('trip:plan.name')}</label>
          <input id="trip-name" className="input" style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, maxWidth: 680, border: '1px solid transparent', background: 'transparent', paddingInline: 0 }} value={trip.name} onChange={e => trips.update(trip.id, { name: e.target.value })} />
          <div className="chip-row">
            <span className="badge"><Icon name="calendar" />{trip.startDate ? `${dateLabel(trip.startDate, lang)} → ${dateLabel(trip.endDate, lang)}` : t('trip:daysCount', { count: trip.days.length })}</span>
            <span className="badge"><Icon name="users" />{t('trip:travellers.summary', { adults: trip.adults, children: trip.children })}</span>
            {trip.budgetUsd && <span className="badge"><Icon name="ticket" />{t('trip:plan.budgetOf', { amount: m(trip.budgetUsd) })}</span>}
            {trip.source === 'ai' && <span className="badge accent"><Icon name="sparkles" />{t('trip:plan.byAi')}</span>}
            {trip.sample && <span className="sample">{t('common:badges.sampleData')}</span>}
          </div>
        </div>
        <div className="head-actions no-print">
          <button type="button" className="btn ghost sm" onClick={() => setModal('settings')}><Icon name="layers" />{t('trip:plan.settings')}</button>
          <button type="button" className="btn ghost sm" onClick={() => setModal('share')}><Icon name="share" />{t('common:share.share')}</button>
          <button type="button" className="btn ghost sm" onClick={exportIcs}><Icon name="calendar" />{t('trip:plan.exportIcs')}</button>
          <button type="button" className="btn ghost sm" onClick={() => window.print()}><Icon name="download" />{t('trip:plan.exportPdf')}</button>
          <Link className="btn ghost sm" to={`/trips/${trip.id}`}><Icon name="suitcase" />{t('trip:plan.control')}</Link>
          <button type="button" className="btn solid sm" onClick={() => setModal('book')}><Icon name="ticket" />{t('trip:plan.book')}</button>
        </div>
      </div>
      {trip.notes && <Notice>{trip.notes}</Notice>}
      <p className="no-print" style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('trip:plan.dragHint')}</p>

      <div className="planner">
        <div className="days">
          {trip.days.map((day, di) => {
            const dest = seedIndex.destById.get(day.destinationId);
            const stay = day.stayListingId ? seedIndex.listingById.get(day.stayListingId) : undefined;
            const stayOptions = seedIndex.listings.filter(l => !l.paused && l.type === 'stay' && l.destinationId === day.destinationId);
            return (
              <section key={di} className="day" aria-labelledby={`day-${di}`}>
                <div className="day-head">
                  <div><h3 id={`day-${di}`}>{dayLabel(t, di, day.date, lang)}</h3><small>{dest?.name}{stay ? ` · ${lt(stay.title, lang)}` : ''}</small></div>
                  <div className="chip-row no-print">
                    <label className="select"><Icon name="pin" /><span className="sr">{t('trip:plan.dayDestination')}</span>
                      <select value={day.destinationId} onChange={e => trips.updateDay(trip.id, di, { destinationId: e.target.value, stayListingId: undefined })}>
                        {seedIndex.destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </label>
                    {stayOptions.length > 0 && (
                      <label className="select"><Icon name="bed" /><span className="sr">{t('trip:plan.stay')}</span>
                        <select value={day.stayListingId ?? ''} onChange={e => trips.updateDay(trip.id, di, { stayListingId: e.target.value || undefined })}>
                          <option value="">{t('trip:plan.noStay')}</option>
                          {stayOptions.map(s => <option key={s.id} value={s.id}>{lt(s.title, lang)} · {m(s.price.amountUsd)}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
                <div className="slots">
                  {SLOTS.map(slot => {
                    const key = `${di}-${slot}`;
                    return (
                      <div key={slot} className={`slot${over === key ? ' drop' : ''}`}
                        onDragOver={e => { if (drag) { e.preventDefault(); setOver(key); } }}
                        onDragLeave={() => setOver(o => (o === key ? null : o))}
                        onDrop={e => { e.preventDefault(); onDrop(di, slot); }}>
                        <h4><Icon name={SLOT_ICON[slot]} />{t(`trip:slot.${slot}`)}</h4>
                        {day.slots[slot].map((it, ii) => {
                          const pos = { day: di, slot, index: ii };
                          const listing = it.listingId ? seedIndex.listingById.get(it.listingId) : undefined;
                          const booking = it.bookingId ? bookingList.find(b => b.id === it.bookingId) : bookingFor(it.listingId);
                          const title = itemTitle(t, it, lang);
                          return (
                            <div key={it.id} className={`item${drag && drag.day === di && drag.slot === slot && drag.index === ii ? ' dragging' : ''}`} draggable
                              onDragStart={e => { setDrag(pos); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.id); }}
                              onDragEnd={() => { setDrag(null); setOver(null); }}
                              onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop(di, slot, ii); }}>
                              <span className="thumb">{it.media ? <Media id={it.media} sizes="48px" decorative /> : <Icon name={KIND_ICON[it.kind] ?? 'compass'} />}</span>
                              <div>
                                <b>{listing ? <Link to={`/listing/${listing.slug}`} style={{ color: 'inherit' }}>{title}</Link> : title}</b>
                                <small>{it.time} · {hoursLabel(it.durationHours, t)}{it.priceUsd ? ` · ${m(it.priceUsd * (it.perPerson ? travellers : 1))}` : ''}</small>
                                {(it.transport || it.distanceKm) && <small>{it.transport ? t(`trip:mode.${it.transport}`) : ''}{it.distanceKm ? ` · ${it.distanceKm} km` : ''}</small>}
                                {it.note && <small>{it.note.startsWith('ai.') ? t(`trip:${it.note}`) : it.note}</small>}
                                {booking ? <span className="booked">✓ {t('trip:plan.booked', { id: booking.id })}</span> : null}
                                <div className="tools no-print">
                                  <button type="button" onClick={() => move(pos, -1)} aria-label={t('trip:plan.moveUp', { title })}><Icon name="arrowUp" /></button>
                                  <button type="button" onClick={() => move(pos, 1)} aria-label={t('trip:plan.moveDown', { title })}><Icon name="arrowUp" style={{ transform: 'rotate(180deg)' }} /></button>
                                  <label className="sr" htmlFor={`time-${it.id}`}>{t('trip:plan.time')}</label>
                                  <input id={`time-${it.id}`} type="time" value={it.time} onChange={e => trips.updateItem(trip.id, pos, { time: e.target.value })} style={{ height: 28, border: '1px solid var(--panel-line)', borderRadius: 8, background: 'var(--panel)', color: 'var(--ink)', fontSize: 12, padding: '0 4px' }} />
                                  {listing && !booking && bookingOpen(listing) && <Link to={`/book/${listing.slug}?trip=${trip.id}${day.date ? `&date=${day.date}` : ''}&adults=${trip.adults}&children=${trip.children}`} aria-label={t('trip:plan.bookItem', { title })}><Icon name="ticket" /></Link>}
                                  <button type="button" onClick={() => trips.removeItem(trip.id, pos)} aria-label={t('trip:plan.remove', { title })}><Icon name="close" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <button type="button" className="add-btn no-print" onClick={() => { setAddTarget({ day: di, slot }); setModal('add'); }}><Icon name="plus" />{t('trip:plan.add')}</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <div className="chip-row no-print">
            <button type="button" className="btn ghost sm" onClick={() => trips.setDays(trip.id, trip.days.length + 1)}>{t('trip:plan.addDay')}</button>
            {trip.days.length > 1 && <button type="button" className="btn ghost sm" onClick={() => trips.setDays(trip.id, trip.days.length - 1)}>{t('trip:plan.removeDay')}</button>}
          </div>
        </div>

        <aside className="detail-side">
          <div className="panel">
            <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 10 }}>{t('trip:cost.title')}</h2>
            <div className="breakdown">
              <div className="row"><span>{t('trip:cost.stays')}</span><span>{m(totals.stays)}</span></div>
              <div className="row"><span>{t('trip:cost.activities')}</span><span>{m(totals.activities)}</span></div>
              <div className="row"><span>{t('trip:cost.transport')}</span><span>{m(totals.transport)}</span></div>
              <div className="row"><span>{t('trip:cost.meals')}</span><span>{m(totals.meals)}</span></div>
              {totals.other > 0 && <div className="row"><span>{t('trip:cost.other')}</span><span>{m(totals.other)}</span></div>}
              <div className="row total"><span>{t('trip:cost.total')}</span><span>{m(totals.total)}</span></div>
              <div className="row"><span>{t('trip:cost.perPerson')}</span><span>{m(Math.round(totals.total / Math.max(1, travellers)))}</span></div>
              {trip.budgetUsd ? <div className="row"><span>{t('trip:plan.budget')}</span><span style={{ color: totals.total > trip.budgetUsd ? 'var(--danger)' : 'var(--success)' }}>{m(trip.budgetUsd)}</span></div> : null}
              <small style={{ color: 'var(--muted)', fontSize: 12 }}>{t('trip:cost.note')}</small>
            </div>
          </div>
          <div className="panel" style={{ display: 'grid', gap: 10 }}>
            <h2 style={{ fontSize: 'var(--fs-h4)' }}>{t('trip:plan.bookings')}</h2>
            <p>{t('trip:plan.bookedCount', { booked: bookable.filter(x => x.it.bookingId || bookingFor(x.it.listingId)).length + stays.filter(s => bookingFor(s)).length, total: bookable.length + stays.length })}</p>
            <button type="button" className="btn solid sm" onClick={() => setModal('book')}><Icon name="ticket" />{t('trip:plan.book')}</button>
          </div>
          <div className="map-frame" style={{ height: 260 }}><MapView points={points} route label={t('trip:plan.routeMap')} /></div>
          <button type="button" className="btn ghost sm no-print" onClick={() => { const c = trips.duplicate(trip.id); if (c) navigate(`/plan/${c.id}`); }}><Icon name="layers" />{t('trip:plan.duplicate')}</button>
          <button type="button" className="btn ghost sm no-print" onClick={() => setModal('delete')}><Icon name="close" />{t('trip:plan.delete')}</button>
        </aside>
      </div>

      {modal === 'add' && <AddItemModal trip={trip} target={addTarget} onClose={() => setModal(null)} />}
      {modal === 'share' && <Modal title={t('common:share.title', { name: trip.name })} onClose={() => setModal(null)}><Notice>{t('trip:plan.shareNote')}</Notice><ShareButtons title={trip.name} path={`/plan/${trip.id}`} /></Modal>}
      {modal === 'delete' && (
        <Modal title={t('trip:plan.deleteTitle')} onClose={() => setModal(null)}>
          <p>{t('trip:plan.deleteText', { name: trip.name })}</p>
          <div className="row-between"><button type="button" className="btn ghost sm" onClick={() => setModal(null)}>{t('common:actions.cancel')}</button><button type="button" className="btn solid sm" onClick={() => { trips.remove(trip.id); toast.show({ icon: 'check', text: t('trip:plan.deleted') }); navigate('/plan'); }}>{t('trip:plan.delete')}</button></div>
        </Modal>
      )}
      {modal === 'settings' && <TripSettings trip={trip} onClose={() => setModal(null)} />}
      {modal === 'book' && (
        <Modal title={t('trip:plan.bookTitle')} onClose={() => { setModal(null); if (params.get('book')) setParams({}, { replace: true }); }} wide>
          <p style={{ color: 'var(--muted)' }}>{t('trip:plan.bookText')}</p>
          <ul className="list">
            {[...stays.map(s => ({ listingId: s, date: trip.days.find(d => d.stayListingId === s)?.date, nights: trip.days.filter(d => d.stayListingId === s).length })), ...bookable.map(x => ({ listingId: x.it.listingId!, date: x.day.date, nights: 1 }))]
              .filter((x, i, a) => a.findIndex(y => y.listingId === x.listingId) === i)
              .map(x => {
                const l = seedIndex.listingById.get(x.listingId)!;
                const b = bookingFor(l.id);
                return (
                  <li key={l.id} className="list-item">
                    <span className="thumb"><Media id={l.media[0]!} sizes="84px" decorative /></span>
                    <span className="grow"><b>{lt(l.title, lang)}</b><small>{t(`common:listingType.${l.type}`)} · {x.date ?? ''}{l.type === 'stay' ? ` · ${t('trip:nights', { count: x.nights })}` : ''}</small></span>
                    <span className="actions">
                      {b ? <Link className="btn ghost sm" to={`/bookings/${b.id}`}>✓ {b.id}</Link>
                        : !bookingOpen(l) ? <span className="badge">{t('trip:previewOnly.badge')}</span>
                        : <Link className="btn solid sm" to={`/book/${l.slug}?trip=${trip.id}${x.date ? `&date=${x.date}` : ''}&adults=${trip.adults}&children=${trip.children}${l.type === 'stay' ? `&nights=${x.nights}` : ''}`}>{l.instantBook ? t('explore:listing.book') : t('explore:listing.requestBook')}</Link>}
                    </span>
                  </li>
                );
              })}
          </ul>
        </Modal>
      )}
    </div>
  );
}

function AddItemModal({ trip, target, onClose }: { trip: Trip; target: { day: number; slot: Slot }; onClose: () => void }) {
  const { t } = useTranslation(['trip', 'common']);
  const lang = useLocale();
  const day = trip.days[target.day]!;
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');
  const [onlyHere, setOnlyHere] = useState(true);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(target.slot === 'morning' ? '09:00' : target.slot === 'afternoon' ? '14:00' : '19:00');
  const [price, setPrice] = useState(0);
  const candidates = seedIndex.listings.filter(l => !l.paused && l.type !== 'stay' && (!onlyHere || l.destinationId === day.destinationId));
  const add = (item: Omit<ItineraryItem, 'id'>) => { trips.addItem(trip.id, target.day, target.slot, item); onClose(); };
  return (
    <Modal title={t('trip:plan.addTitle', { day: dayLabel(t, target.day, day.date, lang), slot: t(`trip:slot.${target.slot}`) })} onClose={onClose} wide>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'catalog'} onClick={() => setTab('catalog')}>{t('trip:plan.fromCatalog')}</button>
        <button type="button" role="tab" aria-selected={tab === 'custom'} onClick={() => setTab('custom')}>{t('trip:plan.custom')}</button>
      </div>
      {tab === 'catalog' ? (
        <>
          <label className="check"><input type="checkbox" checked={onlyHere} onChange={e => setOnlyHere(e.target.checked)} />{t('trip:plan.onlyHere', { place: seedIndex.destById.get(day.destinationId)?.name })}</label>
          <ul className="list" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {candidates.map(l => (
              <li key={l.id} className="list-item">
                <span className="thumb"><Media id={l.media[0]!} sizes="84px" decorative /></span>
                <span className="grow"><b>{lt(l.title, lang)}</b><small>{t(`common:listingType.${l.type}`)} · {seedIndex.destById.get(l.destinationId)?.name} · {l.price.amountUsd ? money(l.price.amountUsd, lang) : t('common:price.free')}</small></span>
                <span className="actions"><button type="button" className="btn solid sm" onClick={() => add({ listingId: l.id, title: l.title.en, kind: l.type, time: l.startTimes?.[0] ?? time, durationHours: l.durationHours ?? (l.durationDays ? 8 : 2), priceUsd: l.price.amountUsd, perPerson: !['night', 'vehicle', 'group', 'trip'].includes(l.price.unit), destinationId: l.destinationId, media: l.media[0] })}>{t('trip:plan.addThis')}</button></span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <form className="form-grid" onSubmit={e => { e.preventDefault(); if (title.trim().length < 2) return; add({ title: title.trim(), kind: 'free', time, durationHours: 2, priceUsd: price, perPerson: true, destinationId: day.destinationId }); }}>
          <label className="field full"><span>{t('trip:plan.customTitle')}</span><input value={title} onChange={e => setTitle(e.target.value)} required minLength={2} maxLength={80} /></label>
          <label className="field"><span>{t('trip:plan.time')}</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
          <label className="field"><span>{t('trip:plan.pricePP')}</span><input type="number" min={0} value={price} onChange={e => setPrice(Number(e.target.value) || 0)} /></label>
          <div className="full"><button type="submit" className="btn solid sm">{t('trip:plan.addThis')}</button></div>
        </form>
      )}
    </Modal>
  );
}

function TripSettings({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { t } = useTranslation(['trip', 'common']);
  const [start, setStart] = useState(trip.startDate ?? '');
  const [adults, setAdults] = useState(trip.adults);
  const [children, setChildren] = useState(trip.children);
  const [budget, setBudget] = useState<number | ''>(trip.budgetUsd ?? '');
  const save = () => {
    const days = trip.days.map((d, i) => ({ ...d, date: start ? new Date(new Date(start).getTime() + i * 86400000).toISOString().slice(0, 10) : d.date }));
    trips.update(trip.id, { startDate: start || undefined, endDate: days[days.length - 1]?.date, days, adults, children, budgetUsd: budget || undefined });
    onClose();
  };
  return (
    <Modal title={t('trip:plan.settings')} onClose={onClose}>
      <div className="form-grid">
        <label className="field full"><span>{t('trip:plan.start')}</span><input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        <div className="field"><span>{t('trip:travellers.adults')}</span><Counter value={adults} min={1} max={20} onChange={setAdults} label={t('trip:travellers.adults')} /></div>
        <div className="field"><span>{t('trip:travellers.children')}</span><Counter value={children} min={0} max={10} onChange={setChildren} label={t('trip:travellers.children')} /></div>
        <label className="field full"><span>{t('trip:plan.budget')}</span><input type="number" min={0} step={100} value={budget} onChange={e => setBudget(e.target.value ? Number(e.target.value) : '')} /></label>
      </div>
      <div className="row-between"><button type="button" className="btn ghost sm" onClick={onClose}>{t('common:actions.cancel')}</button><button type="button" className="btn solid sm" onClick={save}>{t('common:actions.save')}</button></div>
    </Modal>
  );
}
