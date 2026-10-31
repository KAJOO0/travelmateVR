import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { SaveButton } from '@/components/ui/bits';
import { useLocale } from '@/i18n/useLocale';
import { countryName, lt } from '@/lib/content';
import { num, rating } from '@/lib/format';
import { seedIndex } from '@/services/catalog';
import { formatOf, is360 } from '@/lib/immersive';
import type { Experience } from '@/domain/types';

/** Immersive format badge: 360° video, 360° photo or panoramic preview. */
export function FormatBadge({ x, className = 'badge media' }: { x: Pick<Experience, 'video' | 'pano'>; className?: string }) {
  const { t } = useTranslation();
  const f = formatOf(x);
  return f === 'video'
    ? <span className={`${className} fmt-video`}><Icon name="video360" />{t('badges.video360')}</span>
    : f === 'photo360'
      ? <span className={className}><Icon name="view360" />{t('badges.photo360')}</span>
      : <span className={className}><Icon name="view360" />{t('badges.panoPreview')}</span>;
}

export function ExperienceBadges({ xp }: { xp: Experience }) {
  const { t } = useTranslation();
  return (
    <>
      <FormatBadge x={xp} />
      {is360(xp) && <span className="badge media"><Icon name="vr" />{t('badges.vrReady')}</span>}
      {xp.hasNarration && <span className="badge media"><Icon name="headphones" />{t('badges.audio')}</span>}
    </>
  );
}

export function ExperienceCard({ xp }: { xp: Experience }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const dest = seedIndex.destById.get(xp.destinationId);
  const country = seedIndex.countries.find(c => c.id === dest?.countryId);
  const title = lt(xp.title, lang);
  const href = `/vr/${xp.slug}`;
  const cName = country ? countryName(country, lang) : '';

  return (
    <article className="card xp">
      <div className="pic">
        <Media id={xp.media} sizes="(max-width: 700px) 92vw, (max-width: 1000px) 46vw, 400px" decorative />
        <div className="badges"><ExperienceBadges xp={xp} /></div>
        <SaveButton kind="experience" id={xp.id} name={title} />
      </div>
      <div className="body">
        <span className="where"><Icon name="pin" />{dest?.name}{cName && cName !== dest?.name ? ` · ${cName}` : ''}</span>
        <h3><Link to={href} style={{ textDecoration: 'none', color: 'inherit' }}>{title}</Link></h3>
        <p>{lt(xp.tagline, lang)}</p>
        <div className="facts">
          <span><Icon name="layers" />{t(`kindLabel.${xp.kind}`)}</span>
          <span><Icon name="clock" />{t('units.minutes', { count: xp.durationMin })}</span>
          {xp.reviewCount > 0 ? (
            <span>
              <Icon name="star" className="star" />
              <b>{rating(xp.rating, lang)}</b>
              <span className="sr">{t('units.outOf5')}</span>
              ({num(xp.reviewCount, lang)})
            </span>
          ) : <span>{t('reviews.none')}</span>}
        </div>
        <div className="foot">
          <Link className="btn solid sm" to={href}>
            <Icon name="vr" />{t('cta.enterExperience')}
          </Link>
          <Link className="tlink" to={`/destinations/${dest?.slug ?? ''}`}><span>{t('cta.explore')}</span><Icon name="arrowRight" /></Link>
        </div>
      </div>
    </article>
  );
}
