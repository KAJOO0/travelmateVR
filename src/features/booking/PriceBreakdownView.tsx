import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n/useLocale';
import { money } from '@/lib/format';
import { serviceFeeRate } from '@/services/platform';
import type { PriceBreakdown } from '@/domain/types';

/** Transparent pricing: base, extras, taxes, service fee, conservation/community contribution, total. */
export function PriceBreakdownView({ price, indicative, paid }: { price: PriceBreakdown; indicative?: boolean; paid?: number }) {
  const { t } = useTranslation('trip');
  const lang = useLocale();
  // The rate actually charged on this price (stays correct for older bookings if the platform fee changes).
  const subtotal = price.base + price.extras - (price.discount ?? 0);
  const feeRate = subtotal > 0 ? price.serviceFee / subtotal : serviceFeeRate();
  const m = (n: number) => money(n, lang, 'USD', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 });
  return (
    <div className="breakdown" aria-label={t('price.breakdown')}>
      <div className="row"><span>{t('price.base')}</span><span>{m(price.base)}</span></div>
      {price.extras > 0 && <div className="row"><span>{t('price.extras')}</span><span>{m(price.extras)}</span></div>}
      {!!price.discount && <div className="row discount"><span>{t('price.discount', { name: price.promotion })}</span><span>−{m(price.discount)}</span></div>}
      <div className="row"><span>{t('price.taxes')}</span><span>{m(price.taxes)}</span></div>
      <div className="row"><span>{t('price.serviceFee', { rate: Math.round(feeRate * 1000) / 10 })}</span><span>{m(price.serviceFee)}</span></div>
      {price.contribution > 0 && <div className="row"><span>{t('price.contribution')}</span><span>{m(price.contribution)}</span></div>}
      <div className="row total"><span>{t('price.total')}</span><span>{m(price.total)}</span></div>
      {paid !== undefined && (
        <>
          <div className="row"><span>{t('price.paid')}</span><span>{m(paid)}</span></div>
          {price.total - paid > 0.005 && <div className="row"><span>{t('price.balance')}</span><span><b>{m(price.total - paid)}</b></span></div>}
        </>
      )}
      <small style={{ color: 'var(--muted)', fontSize: 12 }}>{indicative ? t('price.indicativeNote') : t('price.noHidden')}</small>
    </div>
  );
}
