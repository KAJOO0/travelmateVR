import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { S3Image } from '@/components/ui/S3Image';
import { Content, Notice, WhatsAppButton } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { ListingCard } from '@/components/cards/ListingCard';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { ReviewList } from '@/features/reviews/ReviewList';
import { PartnerLogo } from '@/features/partners/PartnerLogo';
import { seedIndex } from '@/services/catalog';
import { messages } from '@/services/account';
import { useLocale } from '@/i18n/useLocale';
import { lt, ltp } from '@/lib/content';
import { dateLabel } from '@/features/trips/format';
import { currentOffer } from '@/services/inventory';
import { storefrontExtras } from '@/services/business';
import { money } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import '@/styles/home.css';
import '@/styles/pages.css';

// A real upload (src/services/business.ts's partnerProfile.uploadCover) vs. a seed-data
// manifest id - see PartnerLogo.tsx for the same reasoning.
const isS3Key = (v: string | undefined): v is string => !!v?.startsWith('profile-media/');

const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'website', 'linktree'] as const;

// Defense-in-depth: update-partner-profile's handler already rejects non-https values before
// they're written, but this field is rendered as a raw <a href> to every visitor of a public
// page - never trust a single layer for an href sink that came from user input at any point.
const isSafeHttpUrl = (v: string | undefined): v is string => !!v && /^https:\/\/[^\s]+\.[^\s]+$/.test(v);

/** Partner digital storefront. */
export default function PartnerPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  const navigate = useNavigate();
  const partner = seedIndex.partners.find(p => p.slug === slug || p.id === slug);
  usePageTitle(partner?.name ?? t('explore:partner.notFound'));
  const listings = useMemo(() => (partner ? seedIndex.listings.filter(l => !l.paused && l.partnerId === partner.id) : []), [partner]);
  const points: MapPoint[] = useMemo(() => listings.map(l => ({ id: l.id, lat: l.coordinates[0], lng: l.coordinates[1], label: l.price.amountUsd ? money(l.price.amountUsd, lang) : t('common:price.free'), title: lt(l.title, lang), href: `/listing/${l.slug}` })), [listings, lang, t]);
  if (!partner) return <div className="page"><NotFoundState title={t('explore:partner.notFound')} to="/marketplace" label={t('explore:market.title.all')} /></div>;

  const xps = seedIndex.experiences.filter(e => e.listingIds?.some(id => listings.some(l => l.id === id)));
  const reviews = seedIndex.reviews.filter(r => r.targetType === 'listing' && listings.some(l => l.id === r.targetId));
  const types = [...new Set(listings.map(l => l.type))];
  const dests = partner.destinationIds.map(id => seedIndex.destById.get(id)).filter(Boolean);
  const eco = listings.some(l => l.sustainability.ecoCertified);
  const community = listings.some(l => l.sustainability.communityLed || l.sustainability.localOwned);
  const extra = storefrontExtras(partner.id);
  const offers = listings.map(l => ({ l, o: currentOffer(l) })).filter((x): x is { l: typeof listings[number]; o: NonNullable<ReturnType<typeof currentOffer>> } => !!x.o);
  const fromPrices = types.map(tp => { const ls = listings.filter(l => l.type === tp); const min = ls.reduce((m, l) => Math.min(m, l.price.amountUsd), Infinity); return { tp, min, unit: ls.find(l => l.price.amountUsd === min)!.price.unit, indicative: ls.some(l => l.price.indicative) }; });
  const certs = [...new Set(listings.map(l => l.sustainability.certification).filter(Boolean))] as string[];
  const contribution = listings.filter(l => l.sustainability.contributionUsd).length;

  return (
    <div className="page" style={{ gap: 36 }}>
      <nav aria-label={t('common:a11y.breadcrumbs')}>
        <ol className="crumbs"><li><Link to="/">{t('common:nav.home')}</Link></li><li><Link to="/marketplace">{t('explore:market.title.all')}</Link></li><li aria-current="page">{partner.name}</li></ol>
      </nav>

      <section className="detail-hero" style={{ minHeight: 'clamp(260px, 30vw, 380px)' }}>
        {isS3Key(partner.cover)
          ? <S3Image s3Key={partner.cover} alt="" fallback={<div style={{ width: '100%', height: '100%', background: 'var(--panel-2)' }} />} />
          : <Media id={partner.cover} sizes="1240px" priority decorative />}
        <div className="txt">
          <div className="partner-head">
            <PartnerLogo partner={partner} large />
            <div>
              <h1>{partner.name}</h1>
              {ltp(partner.tagline, lang) && <p style={{ fontWeight: 600, marginTop: 4 }}>{ltp(partner.tagline, lang)}</p>}
              <div className="chip-row" style={{ marginTop: 6 }}>
                {partner.verified && <span className="badge"><Icon name="shield" />{t('common:badges.verifiedPartner')}</span>}
                {partner.founding && <span className="badge"><Icon name="star" />{t('common:badges.founding')}</span>}
                {eco && <span className="badge"><Icon name="leaf" />{t('common:badges.eco')}</span>}
                {community && <span className="badge"><Icon name="users" />{t('common:badges.localOperator')}</span>}
                {!partner.real && <span className="badge">{t('common:badges.sample')}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="section" aria-labelledby="ab-h">
            <h2 id="ab-h">{t('explore:partner.about')}</h2>
            <Content as="p" text={partner.description} />
            {partner.real && <Notice>{t('explore:partner.realNote', { name: partner.name })}</Notice>}
            {offers.map(({ l, o }) => <Notice key={o.id + l.id} tone="ok" icon="ticketStar"><Link to={`/listing/${l.slug}`}>{lt(l.title, lang)}</Link>: {t('explore:listing.offer', { name: o.name, percent: o.percent, from: dateLabel(o.from, lang), to: dateLabel(o.to, lang) })}</Notice>)}
          </section>

          {fromPrices.length > 0 && (
            <section className="section" aria-labelledby="pr-h">
              <h2 id="pr-h">{t('explore:partner.services')}</h2>
              <div className="table-wrap" style={{ border: '1px solid var(--panel-line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <table className="dtable"><tbody>{fromPrices.map(x => (
                  <tr key={x.tp}><th scope="row" style={{ textAlign: 'left', padding: '10px 14px' }}>{t(`common:listingTypePlural.${x.tp}`)} <small className="muted">({listings.filter(l => l.type === x.tp).length})</small></th>
                    <td style={{ textAlign: 'right', padding: '10px 14px' }}>{x.indicative ? t('common:price.indicativeFrom') : t('common:price.from')} <b>{money(x.min, lang)}</b> / {t(`common:price.unit.${x.unit}`)}</td></tr>
                ))}</tbody></table>
              </div>
            </section>
          )}

          {xps.length > 0 && (
            <section className="section" aria-labelledby="xp-h">
              <h2 id="xp-h">{t('explore:partner.experiences')}</h2>
              <div className="grid2">{xps.map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
            </section>
          )}

          {types.map(tp => (
            <section className="section" key={tp} aria-labelledby={`t-${tp}`}>
              <h2 id={`t-${tp}`}>{t(`common:listingTypePlural.${tp}`)}</h2>
              <div className="grid2">{listings.filter(l => l.type === tp).map(l => <ListingCard key={l.id} listing={l} />)}</div>
            </section>
          ))}

          {(eco || community || contribution > 0) && (
            <section className="section" aria-labelledby="sus-h">
              <h2 id="sus-h">{t('explore:listing.sustainability')}</h2>
              <ul className="trust-list">
                {certs.map(c => <li key={c}><Icon name="leaf" />{t('explore:listing.susEco', { cert: c })}</li>)}
                {community && <li><Icon name="users" />{t('explore:listing.susLocal')}</li>}
                {contribution > 0 && <li><Icon name="check" />{t('explore:partner.contributes', { count: contribution })}</li>}
              </ul>
              <p className="small muted">{t('explore:listing.susVerified')}</p>
            </section>
          )}

          <section className="section" aria-labelledby="map-h">
            <h2 id="map-h">{t('explore:partner.where')}</h2>
            <div className="map-frame"><MapView points={points} label={t('explore:dest.mapOf', { name: partner.name })} /></div>
          </section>

          <section className="section" aria-labelledby="rv-h">
            <h2 id="rv-h">{t('explore:dest.sec.reviews')}</h2>
            {partner.real && !reviews.length ? <Notice>{t('explore:listing.newPartner', { partner: partner.name })}</Notice> : <ReviewList reviews={reviews} />}
          </section>
        </div>

        <aside className="detail-side">
          <div className="panel book-box">
            <h2 style={{ fontSize: 'var(--fs-h4)' }}>{t('explore:partner.contact')}</h2>
            <dl className="kv">
              <dt>{t('explore:partner.type')}</dt><dd>{t(`explore:partnerKind.${partner.kind}`)}</dd>
              <dt>{t('explore:partner.areas')}</dt><dd>{dests.map(d => d!.name).join(', ')}</dd>
              <dt>{t('explore:dest.languages')}</dt><dd>{partner.languages.join(', ')}</dd>
              {partner.responseHours && <><dt>{t('explore:partner.responseTime')}</dt><dd>{t('explore:partner.response', { count: partner.responseHours })}</dd></>}
              {partner.since && <><dt>{t('explore:partner.onPlatform')}</dt><dd>{t('explore:partner.since', { year: partner.since })}</dd></>}
              {extra.phone && <><dt>{t('explore:partner.phone')}</dt><dd><a href={`tel:${extra.phone.replace(/[^+\d]/g, '')}`}>{extra.phone}</a></dd></>}
              {extra.website && <><dt>{t('explore:partner.website')}</dt><dd><a href={extra.website} target="_blank" rel="noopener noreferrer">{extra.website.replace(/^https:\/\//, '')}</a></dd></>}
            </dl>
            <button type="button" className="btn solid" onClick={() => navigate(`/account/messages?thread=${messages.ensure(partner.id)}`)}><Icon name="mail" />{t('explore:listing.message')}</button>
            <WhatsAppButton className="btn ghost" message={t('explore:partner.whatsapp', { name: partner.name })} />
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>{t('explore:partner.whatsappNote')}</p>
            {partner.social && SOCIAL_PLATFORMS.some(k => isSafeHttpUrl(partner.social?.[k])) && (
              <div className="chip-row" style={{ marginTop: 8 }}>
                {SOCIAL_PLATFORMS.filter(k => isSafeHttpUrl(partner.social?.[k])).map(k => (
                  <a key={k} className="btn ghost sm" href={partner.social![k]} target="_blank" rel="noopener noreferrer"><Icon name="external" />{t(`explore:partner.social.${k}`)}</a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
