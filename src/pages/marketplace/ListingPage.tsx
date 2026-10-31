import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Content, Notice, SaveButton, ShareButtons, Stars, WhatsAppButton } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { Counter } from '@/components/ui/Counter';
import { ListingCard, PriceTag, kindFor } from '@/components/cards/ListingCard';
import { MapView } from '@/components/map/MapView';
import { ReviewList } from '@/features/reviews/ReviewList';
import { PartnerLogo } from '@/features/partners/PartnerLogo';
import { PriceBreakdownView } from '@/features/booking/PriceBreakdownView';
import { AddToTripModal } from '@/features/trips/AddToTripModal';
import { seedIndex } from '@/services/catalog';
import { quote } from '@/services/pricing';
import { messages } from '@/services/account';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { hoursLabel, monthName } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { TYPE_PATH } from '@/app/nav';
import { dateLabel } from '@/features/trips/format';
import { checkAvailability } from '@/services/availability';
import { currentOffer } from '@/services/inventory';
import { bookingOpen } from '@/services/payments';
import { usePlatform } from '@/services/platform';
import { PreviewOnlyNotice } from '@/features/booking/PreviewOnly';
import '@/styles/home.css';
import '@/styles/pages.css';
import '@/styles/viewer.css';

const PanoViewer = lazy(() => import('@/features/vr/PanoViewer').then(m => ({ default: m.PanoViewer })));

const AMENITY_ICON: Record<string, IconName> = {
  ensuite: 'bed', meals: 'utensils', breakfast: 'utensils', lunch: 'utensils', dinner: 'utensils', snacks: 'utensils', guide: 'users', solar: 'sun', wifi: 'globe', wifi_limited: 'globe',
  laundry: 'check', fireplace: 'sun', restaurant: 'utensils', parking: 'car', pool: 'activity', family: 'users', ac: 'monitor', beach: 'sun', accessible: 'users', rooftop: 'building',
  kitchen: 'utensils', braai: 'utensils', vehicle: 'car', park_fees: 'ticket', flight: 'car', camp: 'bed', lodge: 'bed', walking: 'activity', porters: 'users', water: 'check', equipment: 'check',
  cableway: 'car', rain_gear: 'check', vegetarian: 'utensils', halal: 'utensils', seafood: 'utensils', meet_greet: 'users', fuel: 'car', luggage: 'suitcase', tasting: 'utensils'
};

const todayPlus = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

export default function ListingPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation(['explore', 'common', 'trip']);
  const lang = useLocale();
  usePlatform(); // re-render when the launch countries change
  const navigate = useNavigate();
  const listing = seedIndex.listings.find(l => l.slug === slug || l.id === slug);
  usePageTitle(listing ? lt(listing.title, lang) : t('explore:listing.notFound'));
  const [modal, setModal] = useState<'pano' | 'share' | 'trip' | null>(null);
  const [date, setDate] = useState(listing?.date ?? todayPlus(30));
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const price = useMemo(() => (listing ? quote({ listing, adults, children, nights: listing.price.unit === 'night' || listing.price.unit === 'vehicle' ? nights : 1, units: listing.price.unit === 'night' ? Math.max(1, Math.ceil((adults + children) / Math.max(1, listing.capacity ?? 2))) : 1, extras: [], date }) : null), [listing, adults, children, nights, date]);

  if (!listing || !price) return <div className="page"><NotFoundState title={t('explore:listing.notFound')} to="/marketplace" label={t('explore:market.title.all')} /></div>;
  const partner = seedIndex.partnerById.get(listing.partnerId)!;
  const dest = seedIndex.destById.get(listing.destinationId)!;
  const title = lt(listing.title, lang);
  const similar = seedIndex.listings.filter(l => !l.paused && l.id !== listing.id && l.type === listing.type).sort((a, b) => Number(b.destinationId === listing.destinationId) - Number(a.destinationId === listing.destinationId)).slice(0, 2);
  const reviews = seedIndex.reviews.filter(r => r.targetType === 'listing' && r.targetId === listing.id);
  const usesNights = listing.price.unit === 'night' || listing.price.unit === 'vehicle';
  const bookHref = `/book/${listing.slug}?date=${date}&adults=${adults}&children=${children}${usesNights ? `&nights=${nights}` : ''}`;
  const closed = listing.closedMonths?.includes(new Date(date).getMonth() + 1);
  // Partner-managed availability: paused listings, blackout dates and sold-out days can't be booked.
  const rooms = listing.price.unit === 'night' ? Math.max(1, Math.ceil((adults + children) / Math.max(1, listing.capacity ?? 2))) : 1;
  const needed = ['night', 'vehicle', 'group'].includes(listing.price.unit) ? rooms : listing.price.unit === 'trip' ? 1 : adults + children;
  const avail = checkAvailability(listing, date, usesNights ? nights : 1, needed);
  const blocked = !!closed || !!listing.paused || !avail.ok;
  // Bookings and payments are open only in the launch countries; elsewhere listings are preview-only.
  const canBook = bookingOpen(listing);
  const offer = currentOffer(listing);
  const guestsMax = listing.capacity && listing.type !== 'stay' ? listing.capacity : 12;
  const s = listing.sustainability;
  // Gallery: three distinct photos besides the hero and the preview tile, topped up from the destination.
  const panoTilePhoto = listing.pano ? null : listing.media[1] ?? listing.media[0];
  const extraPhotos = [...new Set([...listing.media.slice(1), dest.media, ...(dest.gallery ?? [])])]
    .filter(m => m !== listing.media[0] && m !== panoTilePhoto).slice(0, 3);

  const contactPartner = () => {
    const id = messages.ensure(partner.id);
    navigate(`/account/messages?thread=${id}`);
  };

  return (
    <div className="page" style={{ gap: 32 }}>
      <nav aria-label={t('common:a11y.breadcrumbs')}>
        <ol className="crumbs">
          <li><Link to="/">{t('common:nav.home')}</Link></li>
          <li><Link to={TYPE_PATH[listing.type]}>{t(`common:listingTypePlural.${listing.type}`)}</Link></li>
          <li><Link to={`/destinations/${dest.slug}`}>{dest.name}</Link></li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>

      <div className="head-row">
        <div className="page-head">
          <div className="chip-row">
            {partner.verified && <span className="badge verified"><Icon name="shield" />{t('common:badges.verifiedPartner')}</span>}
            {partner.founding && <span className="badge accent"><Icon name="star" />{t('common:badges.founding')}</span>}
            {s.ecoCertified && <span className="badge eco"><Icon name="leaf" />{s.certification ?? t('common:badges.eco')}</span>}
            {s.communityLed && <span className="badge eco"><Icon name="users" />{t('common:badges.community')}</span>}
            {s.localOwned && <span className="badge"><Icon name="pin" />{t('common:badges.localOperator')}</span>}
            {listing.sample && <span className="badge">{t('common:badges.sample')}</span>}
          </div>
          <h1>{title}</h1>
          <div className="lcard"><div className="meta">
            <Stars value={listing.rating} count={listing.reviewCount} />
            <span><Icon name="pin" />{dest.name}</span>
            <span>{t(`common:subtype.${listing.subtype}`)}</span>
            {listing.durationDays ? <span><Icon name="calendar" />{t('common:units.days', { count: listing.durationDays })}</span> : listing.durationHours ? <span><Icon name="clock" />{hoursLabel(listing.durationHours, t)}</span> : null}
          </div></div>
        </div>
        <div className="head-actions">
          <SaveButton kind={kindFor(listing)} id={listing.id} name={title} className="icon-btn" />
          <button type="button" className="btn ghost sm" onClick={() => setModal('share')}><Icon name="share" />{t('common:share.share')}</button>
          <button type="button" className="btn ghost sm" onClick={() => setModal('trip')}><Icon name="calendar" />{t('explore:vr.addToTrip')}</button>
        </div>
      </div>

      <div className="gallery">
        <div><Media id={listing.media[0]!} sizes="(max-width: 860px) 96vw, 760px" priority /></div>
        <button type="button" className="ph-btn pano-tile" onClick={() => setModal('pano')} aria-label={t('explore:listing.open360')}>
          <Media id={listing.pano ? `pano-${listing.pano}` : listing.media[1] ?? listing.media[0]!} sizes="320px" decorative />
          <span className="play" aria-hidden="true"><Icon name="view360" /></span>
          <span className="badge media" style={{ position: 'absolute', left: 10, bottom: 10 }}>{listing.pano ? t('explore:listing.view360') : t('common:badges.panoPreview')}</span>
        </button>
        {extraPhotos.map(m => <div key={m}><Media id={m} sizes="320px" /></div>)}
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="section" aria-labelledby="about-h">
            <h2 id="about-h">{t('explore:listing.about')}</h2>
            <Content as="p" text={listing.description} />
            {listing.price.indicative && <Notice tone="warn">{t('explore:listing.indicative', { partner: partner.name })}</Notice>}
          </section>

          {listing.amenities.length > 0 && (
            <section className="section" aria-labelledby="am-h">
              <h2 id="am-h">{t(listing.type === 'stay' ? 'explore:listing.amenities' : 'explore:listing.included')}</h2>
              <ul className="amenities">{listing.amenities.map(a => <li key={a}><Icon name={AMENITY_ICON[a] ?? 'check'} />{t(`common:amenity.${a}`)}</li>)}</ul>
            </section>
          )}

          <section className="section" aria-labelledby="sus-h">
            <h2 id="sus-h">{t('explore:listing.sustainability')}</h2>
            <div className="info-grid">
              <div className="panel">
                <ul className="trust-list">
                  <li><Icon name={s.ecoCertified ? 'check' : 'info'} />{s.ecoCertified ? t('explore:listing.susEco', { cert: s.certification ?? '' }) : t('explore:listing.susNoEco')}</li>
                  <li><Icon name={s.communityLed ? 'check' : 'info'} />{s.communityLed ? t('explore:listing.susCommunity') : t('explore:listing.susNoCommunity')}</li>
                  {s.localOwned && <li><Icon name="check" />{t('explore:listing.susLocal')}</li>}
                  {s.contributionUsd ? <li><Icon name="leaf" />{t('explore:listing.susContribution', { amount: s.contributionUsd })}</li> : null}
                </ul>
              </div>
              {s.note && <div className="panel"><h3>{t('explore:listing.impact')}</h3><Content as="p" text={s.note} /></div>}
            </div>
            <p style={{ fontSize: 'var(--fs-small)' }}>{t('explore:listing.susVerified')}</p>
          </section>

          <section className="section" aria-labelledby="av-h">
            <h2 id="av-h">{t('explore:listing.availability')}</h2>
            <div className="info-grid">
              <div className="panel">
                <dl className="kv">
                  {listing.date && <><dt>{t('explore:listing.eventDate')}</dt><dd>{dateLabel(listing.date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd></>}
                  {listing.startTimes && <><dt>{t('explore:listing.startTimes')}</dt><dd>{listing.startTimes.join(' · ')}</dd></>}
                  <dt>{t('explore:listing.season')}</dt><dd>{listing.closedMonths?.length ? t('explore:listing.closedIn', { months: listing.closedMonths.map(m => monthName(m, lang)).join(', ') }) : t('explore:listing.allYear')}</dd>
                  {listing.capacity && <><dt>{t('explore:listing.capacity')}</dt><dd>{t(listing.type === 'stay' ? 'explore:listing.perRoom' : 'explore:listing.maxGroup', { count: listing.capacity })}</dd></>}
                  <dt>{t('explore:listing.confirmation')}</dt><dd>{listing.instantBook ? t('explore:listing.instant') : t('explore:listing.request', { partner: partner.name })}</dd>
                </dl>
              </div>
              <div className="panel">
                <h3>{t('explore:listing.cancellation')}</h3>
                <p>{t(`explore:cancellation.${listing.cancellation}`)}</p>
              </div>
            </div>
          </section>

          <section className="section" aria-labelledby="loc-h">
            <h2 id="loc-h">{t('explore:listing.location')}</h2>
            <div className="map-frame"><MapView points={[{ id: listing.id, lat: listing.coordinates[0], lng: listing.coordinates[1], label: dest.name, title, subtitle: dest.name }]} label={t('explore:dest.mapOf', { name: title })} /></div>
          </section>

          <section className="section" aria-labelledby="prov-h">
            <h2 id="prov-h">{t('explore:listing.provider')}</h2>
            <div className="panel" style={{ display: 'grid', gap: 12 }}>
              <div className="partner-mini">
                <PartnerLogo partner={partner} />
                <div><b>{partner.name}</b><div style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t(`explore:partnerKind.${partner.kind}`)}{partner.since ? ` · ${t('explore:partner.since', { year: partner.since })}` : ''}{partner.responseHours ? ` · ${t('explore:partner.response', { count: partner.responseHours })}` : ''}</div></div>
              </div>
              <Content as="p" text={partner.description} />
              <div className="chip-row">
                <Link className="btn ghost sm" to={`/partner/${partner.slug}`}><Icon name="building" />{t('explore:listing.storefront')}</Link>
                <button type="button" className="btn ghost sm" onClick={contactPartner}><Icon name="mail" />{t('explore:listing.message')}</button>
                <WhatsAppButton message={t('explore:listing.whatsapp', { title, partner: partner.name })} />
              </div>
              {!partner.real && <p style={{ fontSize: 'var(--fs-small)' }}>{t('explore:listing.sampleProvider')}</p>}
            </div>
          </section>

          <section className="section" aria-labelledby="rev-h">
            <h2 id="rev-h">{t('explore:dest.sec.reviews')}</h2>
            {partner.real && !reviews.length
              ? <Notice>{t('explore:listing.newPartner', { partner: partner.name })}</Notice>
              : <ReviewList reviews={reviews} targetType="listing" targetId={listing.id} />}
          </section>

          {similar.length > 0 && (
            <section className="section" aria-labelledby="sim-h">
              <h2 id="sim-h">{t('explore:listing.similar')}</h2>
              <div className="grid2 m-swipe">{similar.map(l => <ListingCard key={l.id} listing={l} />)}</div>
            </section>
          )}
        </div>

        <aside className="detail-side" id="book">
          {!canBook ? (
            <div className="panel book-box">
              <div className="price-line"><PriceTag listing={listing} /></div>
              <PreviewOnlyNotice countryId={dest?.countryId} destinationSlug={dest?.slug} />
              {listing.pano && <button type="button" className="btn solid" onClick={() => setModal('pano')}><Icon name="view360" />{t('explore:listing.view360')}</button>}
            </div>
          ) : (
          <div className="panel book-box">
            <div className="price-line"><PriceTag listing={listing} /></div>
            <label className="field">
              <span>{listing.type === 'stay' ? t('explore:listing.checkIn') : t('explore:listing.date')}</span>
              <input type="date" value={date} min={todayPlus(1)} onChange={e => setDate(e.target.value)} disabled={!!listing.date} />
            </label>
            {closed && <Notice tone="warn">{t('explore:listing.closedWarn')}</Notice>}
            {listing.paused && <Notice tone="warn">{t('explore:listing.pausedWarn')}</Notice>}
            {!avail.ok && !closed && !listing.paused && <Notice tone="warn">{t(avail.reason === 'blackout' ? 'explore:listing.blackoutWarn' : 'explore:listing.soldOutWarn', { date: dateLabel(avail.date, lang) })}</Notice>}
            {offer && <Notice tone="ok" icon="ticketStar">{t('explore:listing.offer', { name: offer.name, percent: offer.percent, from: dateLabel(offer.from, lang), to: dateLabel(offer.to, lang) })}</Notice>}
            {usesNights && (
              <div className="row-between"><span className="label">{listing.price.unit === 'night' ? t('explore:listing.nights') : t('explore:listing.days')}</span><Counter value={nights} min={1} max={30} onChange={setNights} label={t('explore:listing.nights')} /></div>
            )}
            <div className="row-between"><span className="label">{t('trip:travellers.adults')}</span><Counter value={adults} min={1} max={guestsMax} onChange={setAdults} label={t('trip:travellers.adults')} /></div>
            <div className="row-between"><span className="label">{t('trip:travellers.children')}</span><Counter value={children} min={0} max={Math.max(0, guestsMax - adults)} onChange={setChildren} label={t('trip:travellers.children')} /></div>
            <PriceBreakdownView price={price} indicative={listing.price.indicative} />
            {blocked ? <button type="button" className="btn solid" disabled>{t('explore:listing.chooseOther')}</button> : <Link className="btn solid" to={bookHref}>{listing.instantBook ? t('explore:listing.book') : t('explore:listing.requestBook')}</Link>}
            <ul className="trust-list">
              <li><Icon name="check" />{t('explore:listing.trustPrice')}</li>
              <li><Icon name="check" />{t(`explore:cancellationShort.${listing.cancellation}`)}</li>
              <li><Icon name="shield" />{t('explore:listing.trustPay')}</li>
            </ul>
          </div>
          )}
        </aside>
      </div>

      <div className="sticky-cta no-print">
        <div><PriceTag listing={listing} /><small>{canBook ? t('explore:listing.totalFor', { total: `USD ${price.total.toFixed(0)}` }) : t('trip:previewOnly.title')}</small></div>
        {!canBook ? <a className="btn ghost sm" href="#book">{t('trip:previewOnly.why')}</a> : blocked ? <a className="btn solid sm" href="#book">{t('explore:listing.chooseOther')}</a> : <Link className="btn solid sm" to={bookHref}>{listing.instantBook ? t('explore:listing.book') : t('explore:listing.requestBook')}</Link>}
      </div>

      {modal === 'pano' && (
        <Modal title={title} onClose={() => setModal(null)} wide>
          <div style={{ position: 'relative', height: 'min(64vh, 560px)', borderRadius: 18, overflow: 'hidden', background: '#071a2f' }}>
            <Suspense fallback={<div className="xp-loading"><div className="inner"><span className="spinner" /><b>{t('explore:vr.preparing')}</b></div></div>}>
              <PanoViewer pano={listing.pano} photo={listing.pano ? undefined : listing.media[0]} label={t('explore:vr.viewerLabel', { title })} />
            </Suspense>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{listing.pano ? t('explore:vr.hintDrag') : t('explore:vr.previewNote')}</p>
        </Modal>
      )}
      {modal === 'share' && <Modal title={t('common:share.title', { name: title })} onClose={() => setModal(null)}><ShareButtons title={title} path={`/listing/${listing.slug}`} /></Modal>}
      {modal === 'trip' && (
        <AddToTripModal
          label={title}
          onClose={() => setModal(null)}
          item={{ listingId: listing.id, title: listing.title.en, kind: listing.type, time: listing.startTimes?.[0] ?? '09:00', durationHours: listing.durationHours ?? 3, priceUsd: listing.price.amountUsd, perPerson: !['night', 'vehicle', 'group', 'trip'].includes(listing.price.unit), destinationId: listing.destinationId, media: listing.media[0] }}
        />
      )}
    </div>
  );
}

