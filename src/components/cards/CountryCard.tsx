import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { useLocale } from '@/i18n/useLocale';
import { countryName, lt } from '@/lib/content';
import type { CountrySummary } from '@/services/catalog';
import { GLOBAL_REGIONS } from '@/domain/types';

export function CountryCard({ c }: { c: CountrySummary }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const name = countryName(c, lang);
  return (
    <Link className="country" to={`/destinations?country=${c.id}`}>
      <Media id={c.media} sizes="(max-width: 700px) 72vw, 290px" decorative />
      {c.phase === 1 && <span className="badge accent phase">{t('country.launch')}</span>}
      {GLOBAL_REGIONS.includes(c.region) && <span className="badge media phase">{t('country.newGlobal')}</span>}
      <div className="txt">
        <h3>{name}</h3>
        <p>{lt(c.tagline, lang)}</p>
        <div className="meta">
          <span className="badge media"><Icon name="pin" />{t('country.destinations', { count: c.destinationCount })}</span>
          {c.experienceCount > 0 && <span className="badge media"><Icon name="vr" />{t('country.experiences', { count: c.experienceCount })}</span>}
        </div>
      </div>
    </Link>
  );
}
