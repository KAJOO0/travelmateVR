import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice, StatusPill, WhatsAppButton } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { ListingCard } from '@/components/cards/ListingCard';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { SLOTS, tripStatus, useTrips } from '@/services/trips';
import { effectiveStatus, useBookings } from '@/services/bookings';
import { useDocuments } from '@/services/account';
import { seedIndex } from '@/services/catalog';
import { CLIMATE } from '@/data/seed/reference';
import { useLocale } from '@/i18n/useLocale';
import { useOnline } from '@/lib/hooks';
import { countryName, lt } from '@/lib/content';
import { monthName } from '@/lib/format';
import { SITE } from '@/config/site';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel, dayLabel, itemTitle } from '@/features/trips/format';
import '@/styles/home.css';
import '@/styles/pages.css';

/** Trip Control Center: everything for one trip in one place, available offline. */
export default function TripControlPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation(['trip', 'explore', 'common', 'account']);
  const lang = useLocale();
  const online = useOnline();
  const trip = useTrips().find(x => x.id === id);
  const bookingList = useBookings();
  const docs = useDocuments();
  usePageTitle(trip?.name ?? t('trip:plan.notFound'));
  const points: MapPoint[] = useMemo(() => {
    if (!trip) return [];
    const seq: string[] = [];
    trip.days.forEach(d => { if (seq[seq.length - 1] !== d.destinationId) seq.push(d.destinationId); });
    return seq.map((dId, i) => { const d = seedIndex.destById.get(dId)!; return { id: `${dId}-${i}`, lat: d.coordinates[0], lng: d.coordinates[1], label: String(i + 1), title: d.name, href: `/destinations/${d.slug}` }; });
  }, [trip]);
  if (!trip) return <div className="page"><NotFoundState title={t('trip:plan.notFound')} to="/trips" label={t('trip:trips.title')} /></div>;

  const status = tripStatus(trip);
  const today = new Date().toISOString().slice(0, 10);
  const todayIdx = trip.days.findIndex(d => d.date === today);
  const focusIdx = todayIdx >= 0 ? todayIdx : 0;
  const focus = trip.days[focusIdx]!;
  const daysTo = trip.startDate ? Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000) : undefined;
  const tripBookings = bookingList.filter(b => b.tripId === trip.id);
  const tripDocs = docs.filter(d => d.tripId === trip.id || tripBookings.some(b => b.id === d.bookingId));
  const destIds = [...new Set(trip.days.map(d => d.destinationId))];
  const countries = [...new Set(destIds.map(id => seedIndex.destById.get(id)!.countryId))].map(cid => seedIndex.countries.find(c => c.id === cid)!);
  const month = trip.startDate ? new Date(trip.startDate).getMonth() + 1 : new Date().getMonth() + 1;
  const planned = new Set(trip.days.flatMap(d => SLOTS.flatMap(s => d.slots[s].map(i => i.listingId))).filter(Boolean));
  const recs = seedIndex.listings.filter(l => !l.paused && destIds.includes(l.destinationId) && (l.type === 'restaurant' || l.type === 'local') && !planned.has(l.id)).slice(0, 4);
  const lead = seedIndex.destById.get(destIds[0]!)!;

  return (
    <div className="page" style={{ gap: 32 }}>
      <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/trips">{t('common:nav.trips')}</Link></li><li aria-current="page">{trip.name}</li></ol></nav>

      <section className="upcoming-card">
        <div className="pic"><Media id={lead.media} sizes="700px" priority decorative /></div>
        <div className="txt">
          <div className="chip-row"><StatusPill status={status} /><span className="badge"><Icon name={online ? 'check' : 'wifiOff'} />{t('trip:control.offlineReady')}</span></div>
          <h1 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700 }}>{trip.name}</h1>
          <p style={{ color: 'var(--muted)' }}>{trip.startDate ? `${dateLabel(trip.startDate, lang, { day: 'numeric', month: 'long', year: 'numeric' })} → ${dateLabel(trip.endDate, lang, { day: 'numeric', month: 'long', year: 'numeric' })}` : t('trip:daysCount', { count: trip.days.length })} · {t('trip:travellers.summary', { adults: trip.adults, children: trip.children })}</p>
          <p style={{ color: 'var(--muted)' }}><Icon name="pin" width={14} height={14} /> {destIds.map(id => seedIndex.destById.get(id)?.name).join(' → ')}</p>
          {daysTo !== undefined && daysTo > 0 && (
            <div className="countdown" aria-label={t('trip:control.countdown', { count: daysTo })}><div><b>{daysTo}</b><span>{t('trip:control.days')}</span></div><div><b>{tripBookings.length}</b><span>{t('common:nav.bookings')}</span></div><div><b>{tripDocs.length}</b><span>{t('trip:control.docs')}</span></div></div>
          )}
          <div className="chip-row"><Link className="btn solid sm" to={`/plan/${trip.id}`}><Icon name="calendar" />{t('trip:control.editItinerary')}</Link><Link className="btn ghost sm" to={`/plan/${trip.id}?book=1`}><Icon name="ticket" />{t('trip:plan.book')}</Link></div>
        </div>
      </section>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="section" aria-labelledby="next-h">
            <h2 id="next-h">{todayIdx >= 0 ? t('trip:control.today') : t('trip:control.firstDay')}</h2>
            <div className="panel">
              <h3>{dayLabel(t, focusIdx, focus.date, lang)} · {seedIndex.destById.get(focus.destinationId)?.name}</h3>
              <ul className="trust-list" style={{ marginTop: 8 }}>
                {SLOTS.flatMap(s => focus.slots[s].map(it => <li key={it.id}><Icon name="clock" /><span><b>{it.time}</b> · {itemTitle(t, it, lang)}</span></li>))}
                {SLOTS.every(s => !focus.slots[s].length) && <li><Icon name="info" />{t('trip:control.nothingPlanned')}</li>}
              </ul>
            </div>
          </section>

          <section className="section" aria-labelledby="bk-h">
            <h2 id="bk-h">{t('common:nav.bookings')}</h2>
            {tripBookings.length ? (
              <ul className="list">
                {tripBookings.map(b => {
                  const l = seedIndex.listingById.get(b.listingId);
                  return (
                    <li key={b.id} className="list-item">
                      {l && <span className="thumb"><Media id={l.media[0]!} sizes="84px" decorative /></span>}
                      <span className="grow"><b>{l ? lt(l.title, lang) : b.listingId}</b><small>{b.id} · {dateLabel(b.date, lang)}{b.startTime ? ` · ${b.startTime}` : ''}</small></span>
                      <span className="actions"><StatusPill status={effectiveStatus(b)} /><Link className="btn ghost sm" to={`/bookings/${b.id}`}>{t('trip:control.view')}</Link></span>
                    </li>
                  );
                })}
              </ul>
            ) : <Notice>{t('trip:control.noBookings')}</Notice>}
          </section>

          <section className="section" aria-labelledby="it-h">
            <h2 id="it-h">{t('trip:control.itinerary')}</h2>
            <div className="plan-days">
              {trip.days.map((d, i) => (
                <div key={i} className="plan-day" style={{ background: i === focusIdx ? 'var(--accent-soft)' : undefined }}>
                  <div><div className="d">{t('trip:day', { n: i + 1 })}</div><small style={{ color: 'var(--muted)', fontSize: 12 }}>{d.date ? dateLabel(d.date, lang) : ''}<br />{seedIndex.destById.get(d.destinationId)?.name}</small></div>
                  <ul>
                    {SLOTS.flatMap(s => d.slots[s].map(it => <li key={it.id}><span className="t">{it.time}</span><span>{itemTitle(t, it, lang)}</span></li>))}
                    {d.stayListingId && <li><span className="t"><Icon name="bed" width={14} height={14} /></span><span>{lt(seedIndex.listingById.get(d.stayListingId)!.title, lang)}</span></li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="wx-h">
            <h2 id="wx-h">{t('trip:control.weather', { month: monthName(month, lang, 'long') })}</h2>
            <div className="grid3">
              {destIds.map(id => {
                const d = seedIndex.destById.get(id)!;
                const c = CLIMATE[d.climate];
                return (
                  <div key={id} className="panel">
                    <h3>{d.name}</h3>
                    <p><b style={{ fontSize: 'var(--fs-h3)', color: 'var(--ink)' }}>{c.high[month - 1]}°C</b> · {t('trip:control.rain', { mm: c.rain[month - 1] })}</p>
                    <p style={{ fontSize: 'var(--fs-small)' }}>{d.bestMonths.includes(month) ? t('trip:ai.goodMonth') : t('trip:ai.notIdeal')}</p>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>{t('trip:control.weatherNote')}</p>
          </section>

          <section className="section" aria-labelledby="map-h">
            <h2 id="map-h">{t('trip:plan.routeMap')}</h2>
            <div className="map-frame">{online ? <MapView points={points} route label={t('trip:plan.routeMap')} /> : <Notice icon="wifiOff">{t('trip:control.mapOffline')}</Notice>}</div>
          </section>

          {recs.length > 0 && (
            <section className="section" aria-labelledby="rec-h">
              <h2 id="rec-h">{t('trip:control.local')}</h2>
              <div className="grid2">{recs.map(l => <ListingCard key={l.id} listing={l} />)}</div>
            </section>
          )}
        </div>

        <aside className="detail-side">
          <div className="panel" style={{ display: 'grid', gap: 10 }}>
            <h2 style={{ fontSize: 'var(--fs-h4)' }}><Icon name="shield" width={18} height={18} /> {t('trip:control.emergency')}</h2>
            <dl className="kv">
              {countries.map(c => <span key={c.id} style={{ display: 'contents' }}><dt>{countryName(c, lang)}</dt><dd><a href={`tel:${(c.emergency ?? '112').split(' ')[0]}`}>{c.emergency ?? '112'}</a></dd></span>)}
              <dt>{t('trip:control.support')}</dt><dd><a href={`tel:${SITE.supportPhone}`}>{SITE.supportPhoneDisplay}</a></dd>
            </dl>
            <WhatsAppButton className="btn solid sm" message={t('trip:control.whatsapp', { trip: trip.name })} label={t('trip:control.whatsappLabel')} />
            <p style={{ fontSize: 'var(--fs-small)' }}>{t('trip:control.embassy')}</p>
          </div>
          <div className="panel" style={{ display: 'grid', gap: 10 }}>
            <h2 style={{ fontSize: 'var(--fs-h4)' }}><Icon name="ticket" width={18} height={18} /> {t('trip:control.documents')}</h2>
            {tripDocs.length ? <ul className="trust-list">{tripDocs.map(d => <li key={d.id}><Icon name="check" />{d.label}{d.expiresOn ? ` · ${d.expiresOn}` : ''}</li>)}</ul> : <p>{t('trip:control.noDocs')}</p>}
            <p style={{ fontSize: 'var(--fs-small)' }}>{t('trip:control.bookingRefs', { count: tripBookings.length })}</p>
            <Link className="btn ghost sm" to="/account/documents"><Icon name="ticket" />{t('trip:control.manageDocs')}</Link>
          </div>
          <div className="panel" style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ fontSize: 'var(--fs-h4)' }}>{t('explore:dest.requirements')}</h2>
            {countries.map(c => c.entry && <p key={c.id} style={{ fontSize: 'var(--fs-small)' }}><b>{countryName(c, lang)}:</b> {lt(c.entry, lang)}</p>)}
            <p style={{ fontSize: 12 }}>{t('explore:dest.confirmOfficial')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
