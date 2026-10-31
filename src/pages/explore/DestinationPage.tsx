import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Content, Notice, SaveButton, ShareButtons, Stars, WhatsAppButton } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { ListingCard, DestinationCard } from '@/components/cards/ListingCard';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { ReviewList } from '@/features/reviews/ReviewList';
import { seedIndex } from '@/services/catalog';
import { CLIMATE } from '@/data/seed/reference';
import { useLocale } from '@/i18n/useLocale';
import { countryName, lt, ltp } from '@/lib/content';
import { dateLabel } from '@/features/trips/format';
import { livePosts, usePosts, DEMO_BOARD } from '@/services/board';
import { money, monthName } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { TYPE_PATH } from '@/app/nav';
import type { ListingType } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';
import { byFormat, formatOf } from '@/lib/immersive';
import { FormatBadge } from '@/components/cards/ExperienceCard';
import { bookingOpenIn } from '@/services/payments';
import { PreviewOnlyNotice } from '@/features/booking/PreviewOnly';

const SECTIONS: { type: ListingType; key: string }[] = [
  { type: 'activity', key: 'things' }, { type: 'stay', key: 'stays' }, { type: 'safari', key: 'safaris' }, { type: 'restaurant', key: 'restaurants' },
  { type: 'transport', key: 'transport' }, { type: 'event', key: 'events' }, { type: 'local', key: 'local' }
];

export default function DestinationPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  const d = seedIndex.destinations.find(x => x.slug === slug || x.id === slug);
  usePageTitle(d?.name ?? t('explore:dest.notFound'));
  const [share, setShare] = useState(false);
  const allPosts = usePosts();
  const listings = useMemo(() => (d ? seedIndex.listings.filter(l => !l.paused && l.destinationId === d.id) : []), [d]);
  const points: MapPoint[] = useMemo(() => (d ? [
    { id: d.id, lat: d.coordinates[0], lng: d.coordinates[1], label: d.name, title: d.name, subtitle: lt(d.area, lang) },
    ...listings.map(l => ({ id: l.id, lat: l.coordinates[0], lng: l.coordinates[1], label: l.price.amountUsd ? money(l.price.amountUsd, lang) : t('common:price.free'), title: lt(l.title, lang), subtitle: t(`common:listingType.${l.type}`), href: `/listing/${l.slug}` }))
  ] : []), [d, listings, lang, t]);

  if (!d) return <div className="page"><NotFoundState title={t('explore:dest.notFound')} to="/destinations" label={t('explore:dest.title')} /></div>;

  const country = seedIndex.countries.find(c => c.id === d.countryId)!;
  const cName = countryName(country, lang);
  const xps = seedIndex.experiences.filter(e => e.destinationId === d.id).sort(byFormat);
  const boardPosts = livePosts(d.id, allPosts);
  const firstXp = xps[0];
  const climate = CLIMATE[d.climate];
  const maxRain = Math.max(...climate.rain, 1);
  const reviewTargets = new Set(listings.map(l => l.id));
  const reviews = seedIndex.reviews.filter(r => (r.targetType === 'listing' && reviewTargets.has(r.targetId)) || (r.targetType === 'experience' && xps.some(x => x.id === r.targetId)));
  const nearby = (d.nearby ?? []).map(id => seedIndex.destById.get(id)).filter(Boolean);
  const bestMonths = d.bestMonths.slice().sort((a, b) => a - b);
  const aiPrompt = t('explore:dest.aiPrompt', { days: d.typicalDays[1] + 2, place: d.name });

  return (
    <div className="page" style={{ gap: 40 }}>
      <nav aria-label={t('common:a11y.breadcrumbs')}>
        <ol className="crumbs">
          <li><Link to="/">{t('common:nav.home')}</Link></li>
          <li><Link to="/destinations">{t('common:nav.destinations')}</Link></li>
          <li><Link to={`/destinations?country=${country.id}`}>{cName}</Link></li>
          <li aria-current="page">{d.name}</li>
        </ol>
      </nav>

      <section className="detail-hero">
        <Media id={d.media} sizes="(max-width: 1300px) 96vw, 1240px" priority decorative />
        {firstXp && (
          <Link className="play" to={`/vr/${firstXp.slug}`} aria-label={t('explore:dest.enter', { name: d.name })}>
            <span className="ring-pulse" aria-hidden="true" /><Icon name="play" />
          </Link>
        )}
        <div className="txt">
          <div className="chip-row">
            <span className="badge"><Icon name="pin" />{lt(d.area, lang)}{cName !== d.name ? ` · ${cName}` : ''}</span>
            {firstXp && <FormatBadge x={firstXp} className="badge" />}
            {d.ecoCertified && <span className="badge"><Icon name="leaf" />{t('common:badges.eco')}</span>}
          </div>
          <h1>{d.name}</h1>
          <Content as="p" text={d.summary} />
          <div className="chip-row">
            {firstXp && <Link className="btn light" to={`/vr/${firstXp.slug}`}><Icon name="vr" />{t('explore:dest.enterShort')}</Link>}
            <Link className="btn on-media" to={`/ai?q=${encodeURIComponent(aiPrompt)}`}><Icon name="sparkles" />{t('explore:dest.planWithAi')}</Link>
          </div>
        </div>
      </section>

      <nav className="jump" aria-label={t('explore:dest.onThisPage')}>
        {['overview', 'experiences', ...SECTIONS.filter(s => listings.some(l => l.type === s.type)).map(s => s.key), 'weather', 'practical', 'map', 'reviews'].map(k => (
          <a key={k} className="toggle" href={`#${k}`}>{t(`explore:dest.sec.${k}`)}</a>
        ))}
      </nav>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="section" id="overview" aria-labelledby="ov-h">
            <h2 id="ov-h">{t('explore:dest.sec.overview')}</h2>
            <Content as="p" text={d.overview ?? d.summary} />
            {d.gallery && d.gallery.length > 0 && (
              <div className="gallery">
                {[d.media, ...d.gallery].slice(0, 5).map((m, i) => <div key={m + i}><Media id={m} sizes={i === 0 ? '600px' : '300px'} /></div>)}
              </div>
            )}
          </section>

          {boardPosts.length > 0 && (
            <section className="section" id="updates" aria-labelledby="up-h">
              <h2 id="up-h">{t('explore:dest.updates')}</h2>
              <ul className="list">
                {boardPosts.map(p => (
                  <li key={p.id} className={`list-item${p.kind === 'alert' ? ' unread' : ''}`} style={{ alignItems: 'flex-start' }}>
                    <span className="ico"><Icon name={p.kind === 'alert' ? 'info' : p.kind === 'event' ? 'calendar' : 'layers'} /></span>
                    <span className="grow">
                      <b style={{ whiteSpace: 'normal' }}>{ltp(p.title, lang)}</b>
                      <span style={{ whiteSpace: 'pre-line' }}>{ltp(p.body, lang)}</span>
                      <small>{t(`explore:dest.postKind.${p.kind}`)}{p.date ? ` · ${dateLabel(p.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}` : ''} · {t('explore:dest.postFrom', { org: DEMO_BOARD.name })}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {xps.length > 0 && (
            <section className="section" id="experiences" aria-labelledby="xp-h">
              <h2 id="xp-h">{t('explore:dest.sec.experiences')}</h2>
              <div className="grid2 m-swipe">{xps.map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
            </section>
          )}

          {(listings.length === 0 || !xps.some(x => formatOf(x) === 'video')) && (
            <section className="section" id="grow" aria-labelledby="grow-h">
              <h2 id="grow-h">{t('explore:dest.growTitle', { name: d.name })}</h2>
              <div className="info-grid">
                {listings.length === 0 && (
                  <div className="panel" style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                    <h3><Icon name="briefcase" width={18} height={18} /> {t('explore:dest.operatorsTitle')}</h3>
                    <p>{t('explore:dest.operatorsText', { name: d.name })}</p>
                    <Link className="btn solid sm" style={{ justifySelf: 'start' }} to={`/partners/join?country=${d.countryId}&destination=${d.id}`}><Icon name="building" />{t('explore:dest.operatorsCta')}</Link>
                  </div>
                )}
                <div className="panel" style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                  <h3><Icon name="video360" width={18} height={18} /> {t('explore:dest.creatorsTitle')}</h3>
                  <p>{t('explore:dest.creatorsText', { name: d.name })}</p>
                  <Link className="btn ghost sm" style={{ justifySelf: 'start' }} to={`/creators?dest=${d.id}`}><Icon name="video360" />{t('explore:dest.creatorsCta')}</Link>
                </div>
              </div>
            </section>
          )}

          {SECTIONS.map(s => {
            const items = listings.filter(l => l.type === s.type);
            if (!items.length) return null;
            return (
              <section className="section" id={s.key} key={s.key} aria-labelledby={`${s.key}-h`}>
                <div className="row-between">
                  <h2 id={`${s.key}-h`}>{t(`explore:dest.sec.${s.key}`)}</h2>
                  <Link className="tlink" to={`${TYPE_PATH[s.type]}?destination=${d.id}`}><span>{t('explore:dest.seeAll')}</span><Icon name="arrowRight" /></Link>
                </div>
                <div className="grid2 m-swipe">{items.slice(0, 4).map(l => <ListingCard key={l.id} listing={l} />)}</div>
              </section>
            );
          })}

          <section className="section" id="weather" aria-labelledby="w-h">
            <h2 id="w-h">{t('explore:dest.sec.weather')}</h2>
            <p>{t('explore:dest.bestTimeText', { months: bestMonths.map(m => monthName(m, lang, 'long')).join(', ') })}</p>
            <div className="panel">
              <div className="climate" role="img" aria-label={t('explore:dest.climateLabel')}>
                {climate.rain.map((r, i) => (
                  <div key={i} className={`m${bestMonths.includes(i + 1) ? ' best' : ''}`}>
                    <span className="t">{climate.high[i]}°</span>
                    <span className="bar" style={{ height: `${Math.max(4, (r / maxRain) * 100)}px` }} title={`${r} mm`} />
                    <span className="lbl">{monthName(i + 1, lang)}</span>
                  </div>
                ))}
              </div>
              <div className="legend" style={{ marginTop: 12 }}>
                <span><i style={{ background: 'var(--accent-bright)' }} />{t('explore:dest.legendBest')}</span>
                <span><i style={{ background: 'color-mix(in srgb, var(--accent-bright) 55%, transparent)' }} />{t('explore:dest.legendRain')}</span>
                <span>°C {t('explore:dest.legendTemp')}</span>
              </div>
            </div>
          </section>

          <section className="section" id="practical" aria-labelledby="p-h">
            <h2 id="p-h">{t('explore:dest.sec.practical')}</h2>
            <div className="info-grid">
              {country.entry && (
                <div className="panel">
                  <h3><Icon name="ticket" width={18} height={18} /> {t('explore:dest.requirements')}</h3>
                  <Content as="p" text={country.entry} />
                  <p style={{ marginTop: 8, fontSize: 'var(--fs-small)' }}>{t('explore:dest.confirmOfficial')}</p>
                </div>
              )}
              {d.safety && (
                <div className="panel">
                  <h3><Icon name="shield" width={18} height={18} /> {t('explore:dest.safety')}</h3>
                  <Content as="p" text={d.safety} />
                  {country.emergency && <p style={{ marginTop: 8 }}><b>{t('explore:dest.emergency')}: {country.emergency}</b></p>}
                </div>
              )}
              <div className="panel">
                <h3><Icon name="leaf" width={18} height={18} /> {t('explore:dest.sustainability')}</h3>
                <Content as="p" text={d.sustainability ?? { en: t('explore:dest.sustainabilityDefault') }} />
                <Link className="tlink" style={{ marginTop: 8 }} to={`/experiences?destination=${d.id}`}><span>{t('explore:dest.communityLink')}</span><Icon name="arrowRight" /></Link>
              </div>
              <div className="panel">
                <h3><Icon name="sparkles" width={18} height={18} /> {t('explore:dest.itineraries')}</h3>
                <ul className="list" style={{ marginTop: 8 }}>
                  {[d.typicalDays[0] + 1, d.typicalDays[1] + 3].map(n => (
                    <li key={n}><Link className="tlink" to={`/ai?q=${encodeURIComponent(t('explore:dest.aiPrompt', { days: n, place: d.name }))}`}><span>{t('explore:dest.itineraryDays', { count: n, place: d.name })}</span><Icon name="arrowRight" /></Link></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="section" id="map" aria-labelledby="m-h">
            <h2 id="m-h">{t('explore:dest.sec.map')}</h2>
            <div className="map-frame"><MapView points={points} label={t('explore:dest.mapOf', { name: d.name })} /></div>
          </section>

          <section className="section" id="reviews" aria-labelledby="r-h">
            <h2 id="r-h">{t('explore:dest.sec.reviews')}</h2>
            <ReviewList reviews={reviews} />
          </section>

          {nearby.length > 0 && (
            <section className="section" aria-labelledby="n-h">
              <h2 id="n-h">{t('explore:dest.nearby')}</h2>
              <div className="grid2 m-swipe">{nearby.map(n => <DestinationCard key={n!.id} d={n!} />)}</div>
            </section>
          )}
        </div>

        <aside className="detail-side">
          {!bookingOpenIn(d.countryId) && <PreviewOnlyNotice countryId={d.countryId} compact />}
          <div className="panel book-box">
            <div className="row-between">
              <span className="price-tag"><small>{t('common:price.from')} </small><b style={{ fontSize: 'var(--fs-h3)' }}>{money(d.fromPriceUsd, lang)}</b><small> / {t('common:price.perPersonDay')}</small></span>
              <SaveButton kind="destination" id={d.id} name={d.name} className="icon-btn" />
            </div>
            <Stars value={d.rating} count={d.reviewCount} />
            <dl className="kv">
              <dt>{t('explore:dest.bestTime')}</dt><dd>{bestMonths.map(m => monthName(m, lang)).join(', ')}</dd>
              <dt>{t('explore:dest.stay')}</dt><dd>{t('explore:dest.daysRange', { min: d.typicalDays[0], max: d.typicalDays[1] })}</dd>
              {country.timezone && <><dt>{t('explore:dest.timezone')}</dt><dd>{country.timezone}</dd></>}
              {country.languages && <><dt>{t('explore:dest.languages')}</dt><dd>{country.languages.join(', ')}</dd></>}
            </dl>
            <Link className="btn solid" to={`/ai?q=${encodeURIComponent(aiPrompt)}`}><Icon name="sparkles" />{t('explore:dest.planWithAi')}</Link>
            <Link className="btn ghost" to={`/plan?destination=${d.id}`}><Icon name="calendar" />{t('explore:dest.buildItinerary')}</Link>
            <div className="chip-row">
              <button type="button" className="toggle" onClick={() => setShare(true)}><Icon name="share" />{t('common:share.share')}</button>
              <WhatsAppButton className="toggle" message={t('explore:dest.whatsapp', { name: d.name })} />
            </div>
          </div>
          <Notice>{t('explore:dest.demoNote')}</Notice>
        </aside>
      </div>

      {share && <Modal title={t('common:share.title', { name: d.name })} onClose={() => setShare(false)}><ShareButtons title={d.name} path={`/destinations/${d.slug}`} /></Modal>}
    </div>
  );
}
