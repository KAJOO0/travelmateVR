import { currentOffer } from '@/services/inventory';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Content, SaveButton, Stars } from '@/components/ui/bits';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { hoursLabel, money } from '@/lib/format';
import { seedIndex } from '@/services/catalog';
import type { Destination, Listing } from '@/domain/types';
import { countryName } from '@/lib/content';
import { byFormat, is360 } from '@/lib/immersive';
import { FormatBadge } from './ExperienceCard';
import { bookingOpen } from '@/services/payments';

export function PriceTag({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  const lang = useLocale();
  if (listing.price.amountUsd === 0) return <span className="price-tag"><b>{t('price.free')}</b></span>;
  return (
    <span className="price-tag">
      <small>{listing.price.indicative ? t('price.indicativeFrom') : t('price.from')} </small>
      <b>{money(listing.price.amountUsd, lang)}</b>
      <small> / {t(`price.unit.${listing.price.unit}`)}</small>
    </span>
  );
}

export function ListingCard({ listing, onHover, compact }: { listing: Listing; onHover?: (id: string | null) => void; compact?: boolean }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const dest = seedIndex.destById.get(listing.destinationId);
  const partner = seedIndex.partnerById.get(listing.partnerId);
  const title = lt(listing.title, lang);
  const offer = currentOffer(listing);
  return (
    <article className={`card lcard${compact ? ' compact' : ''}`} onMouseEnter={() => onHover?.(listing.id)} onMouseLeave={() => onHover?.(null)}>
      <div className="pic">
        <Media id={listing.media[0]!} sizes="(max-width: 700px) 92vw, 420px" decorative />
        <div className="badges">
          {!bookingOpen(listing) && <span className="badge media"><Icon name="eye" />{t('badges.previewOnly')}</span>}
          {offer && <span className="badge accent"><Icon name="ticketStar" />{t('badges.offer', { percent: offer.percent })}</span>}
          {listing.pano ? <span className="badge media"><Icon name="view360" />360°</span> : <span className="badge media"><Icon name="view360" />{t('badges.panoPreview')}</span>}
          {partner?.verified && <span className="badge media"><Icon name="shield" />{t('badges.verified')}</span>}
          {listing.sustainability.ecoCertified && <span className="badge media"><Icon name="leaf" />{t('badges.eco')}</span>}
          {(listing.sustainability.communityLed) && <span className="badge media"><Icon name="users" />{t('badges.community')}</span>}
        </div>
        <SaveButton kind={kindFor(listing)} id={listing.id} name={title} />
      </div>
      <div className="body">
        <div className="meta">
          <span><Icon name="pin" />{dest?.name}</span>
          <span>{t(`subtype.${listing.subtype}`, { defaultValue: listing.subtype })}</span>
          {listing.durationDays ? <span><Icon name="calendar" />{t('units.days', { count: listing.durationDays })}</span> : listing.durationHours ? <span><Icon name="clock" />{hoursLabel(listing.durationHours, t)}</span> : null}
        </div>
        <h3><Link to={`/listing/${listing.slug}`}>{title}</Link></h3>
        <Content as="p" text={listing.summary} className="lede" />
        <div className="meta">
          <Stars value={listing.rating} count={listing.reviewCount} />
          {partner && <span>{partner.name}{partner.founding ? ` · ${t('badges.founding')}` : ''}</span>}
        </div>
        <div className="price">
          <PriceTag listing={listing} />
          {listing.sample && <span className="sample">{t('badges.sample')}</span>}
        </div>
      </div>
    </article>
  );
}

export const kindFor = (l: Listing) => (l.type === 'stay' ? 'stay' : l.type === 'safari' ? 'safari' : l.type === 'restaurant' ? 'restaurant' : l.type === 'event' ? 'event' : 'activity') as 'stay' | 'safari' | 'restaurant' | 'event' | 'activity';

export function DestinationCard({ d, onHover }: { d: Destination; onHover?: (id: string | null) => void }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const c = seedIndex.countries.find(x => x.id === d.countryId);
  const xps = seedIndex.experiences.filter(e => e.destinationId === d.id).sort(byFormat);
  return (
    <article className="card lcard" onMouseEnter={() => onHover?.(d.id)} onMouseLeave={() => onHover?.(null)}>
      <div className="pic">
        <Media id={d.media} sizes="(max-width: 700px) 92vw, 420px" decorative />
        <div className="badges">
          {xps[0] && is360(xps[0]) && <FormatBadge x={xps[0]} />}
          {xps.length > 0 && <span className="badge media"><Icon name="vr" />{t('country.experiences', { count: xps.length })}</span>}
          {d.ecoCertified && <span className="badge media"><Icon name="leaf" />{t('badges.eco')}</span>}
        </div>
        <SaveButton kind="destination" id={d.id} name={d.name} />
      </div>
      <div className="body">
        <div className="meta"><span><Icon name="pin" />{lt(d.area, lang)}{c ? ` · ${countryName(c, lang)}` : ''}</span></div>
        <h3><Link to={`/destinations/${d.slug}`}>{d.name}</Link></h3>
        <Content as="p" text={d.summary} className="lede" />
        <div className="meta"><Stars value={d.rating} count={d.reviewCount} /></div>
        <div className="price">
          <span className="price-tag"><small>{t('price.from')} </small><b>{money(d.fromPriceUsd, lang)}</b><small> / {t('price.perPersonDay')}</small></span>
        </div>
      </div>
    </article>
  );
}
