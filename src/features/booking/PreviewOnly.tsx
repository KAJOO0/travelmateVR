import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { seedIndex } from '@/services/catalog';
import { bookingCountries } from '@/services/payments';
import { useLocale } from '@/i18n/useLocale';
import { countryName } from '@/lib/content';
import { usePlatform } from '@/services/platform';

/** Names of the countries where bookings and payments are open, e.g. "Tanzania and Zanzibar". */
export function useOpenCountries(): string {
  usePlatform();
  const lang = useLocale();
  const names = bookingCountries().map(id => seedIndex.countries.find(c => c.id === id)).filter(Boolean).map(c => countryName(c!, lang));
  return new Intl.ListFormat(lang === 'zh' ? 'zh-CN' : lang, { type: 'conjunction' }).format(names);
}

/**
 * Shown instead of booking and payment for places outside the launch countries: travellers can
 * preview and experience them, but cannot book or pay until TravelMateVR launches there.
 */
export function PreviewOnlyNotice({ countryId, destinationSlug, compact }: { countryId?: string; destinationSlug?: string; compact?: boolean }) {
  const { t } = useTranslation(['trip', 'common']);
  const lang = useLocale();
  const open = useOpenCountries();
  const country = seedIndex.countries.find(c => c.id === countryId);
  const where = country ? countryName(country, lang) : '';
  return (
    <div className="notice preview-only" role="note">
      <Icon name="view360" />
      <div>
        <b>{t('trip:previewOnly.title')}</b>
        <p>{t('trip:previewOnly.text', { country: where, open })}</p>
        {!compact && destinationSlug && (
          <Link className="tlink" to={`/destinations/${destinationSlug}`}><span>{t('trip:previewOnly.explore')}</span><Icon name="arrowRight" /></Link>
        )}
      </div>
    </div>
  );
}
