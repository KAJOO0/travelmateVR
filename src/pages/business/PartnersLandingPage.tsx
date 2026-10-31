import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { usePageTitle } from '@/app/usePageTitle';
import { whatsappLink } from '@/config/site';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { countryName } from '@/lib/content';
import { GLOBAL_REGIONS } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';
import '@/styles/portal.css';

const BENEFITS: { k: string; icon: IconName }[] = [
  { k: 'storefront', icon: 'landmark' }, { k: 'vr', icon: 'view360' }, { k: 'ai', icon: 'sparkles' },
  { k: 'bookings', icon: 'calendar' }, { k: 'payments', icon: 'shield' }, { k: 'insights', icon: 'barChart' }
];

/** Public "For partners" page: value proposition, how joining works, plans, and entry to the portal. */
export default function PartnersLandingPage() {
  const { t } = useTranslation(['business', 'common', 'home']);
  usePageTitle(t('business:landing.title'));
  const lang = useLocale();
  const global = seedIndex.countries.filter(c => GLOBAL_REGIONS.includes(c.region));
  return (
    <div className="page">
      <section className="block">
        <div className="detail-hero" style={{ minHeight: 'clamp(300px, 36vw, 440px)' }}>
          <Media id="safari-crew" sizes="1240px" priority decorative focus="50% 35%" />
          <div className="txt">
            <span className="eyebrow" style={{ color: 'var(--on-media-muted)' }}>{t('business:landing.eyebrow')}</span>
            <h1>{t('business:landing.title')}</h1>
            <p>{t('business:landing.lede')}</p>
            <div className="chip-row" style={{ marginTop: 8 }}>
              <Link className="btn light" to="/partners/join"><Icon name="plus" />{t('business:landing.apply')}</Link>
              <Link className="btn on-media" to="/business"><Icon name="briefcase" />{t('business:landing.signIn')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="pl-why">
        <h2 className="sec-title" id="pl-why">{t('business:landing.whyTitle')}</h2>
        <div className="grid3">
          {BENEFITS.map(b => (
            <div className="card about" key={b.k}><span className="ico"><Icon name={b.icon} /></span><h3>{t(`business:landing.benefits.${b.k}.t`)}</h3><p>{t(`business:landing.benefits.${b.k}.d`)}</p></div>
          ))}
        </div>
      </section>

      <section className="block" aria-labelledby="pl-for">
        <h2 className="sec-title" id="pl-for">{t('home:types.title')}</h2>
        <div className="grid3">
          {([['operators', 'binoculars', 'operator'], ['hotels', 'bed', 'lodge'], ['guides', 'compass', 'guide']] as const).map(([k, icon, kind]) => (
            <div className="card about" key={k} id={`for-${k}`} style={{ scrollMarginTop: 96 }}>
              <span className="ico"><Icon name={icon} /></span><h3>{t(`home:types.${k}.title`)}</h3><p>{t(`home:types.${k}.text`)}</p>
              <Link className="tlink" to={`/partners/join?kind=${kind}`}><span>{t('business:landing.apply')}</span><Icon name="arrowRight" /></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="block" aria-labelledby="pl-global">
        <div className="panel" style={{ display: 'grid', gap: 10 }}>
          <span className="eyebrow"><Icon name="globe" width={14} height={14} /> {t('business:landing.globalEyebrow')}</span>
          <h2 className="sec-title" id="pl-global">{t('business:landing.globalTitle')}</h2>
          <p className="lede">{t('business:landing.globalText')}</p>
          <div className="chip-row">
            {global.map(c => <Link key={c.id} className="toggle" to={`/partners/join?country=${c.id}`}><Icon name="pin" />{countryName(c, lang)}</Link>)}
          </div>
          <Link className="tlink" to="/creators"><span>{t('business:landing.globalCreators')}</span><Icon name="arrowRight" /></Link>
        </div>
      </section>

      <section className="block" aria-labelledby="pl-how">
        <h2 className="sec-title" id="pl-how">{t('business:landing.howTitle')}</h2>
        <ol className="grid3" style={{ listStyle: 'none' }}>
          {['s1', 's2', 's3'].map((s, i) => (
            <li className="panel" key={s} style={{ display: 'grid', gap: 8 }}>
              <span className="ico" aria-hidden="true" style={{ fontWeight: 700 }}>{i + 1}</span>
              <h3>{t(`business:landing.steps.${s}.t`)}</h3><p className="muted">{t(`business:landing.steps.${s}.d`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="block" aria-labelledby="pl-plans">
        <h2 className="sec-title" id="pl-plans">{t('business:landing.plansTitle')}</h2>
        <p className="lede">{t('business:landing.plansText')}</p>
        <div className="plan-cards">
          {(['starter', 'growth', 'enterprise'] as const).map(p => (
            <article key={p} className={`plan-card${p === 'growth' ? ' current' : ''}`}>
              <h3>{t(`business:settings.plans.${p}.name`)}</h3>
              <p className="small muted">{t(`business:settings.plans.${p}.text`)}</p>
              <ul>{(p === 'starter' ? ['f1', 'f2', 'f3'] : p === 'growth' ? ['f1', 'f2', 'f3', 'f4', 'f5'] : ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7']).map(k => <li key={k}><Icon name="check" />{t(`business:settings.features.${k}`)}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="small muted">{t('business:landing.pricingNote')}</p>
      </section>

      <section className="block">
        <div className="band">
          <div><h2>{t('business:landing.ctaTitle')}</h2><p>{t('business:landing.ctaText')}</p></div>
          <div className="chip-row">
            <Link className="btn light" to="/partners/join">{t('business:landing.apply')}</Link>
            <a className="btn on-media" href={whatsappLink(t('business:landing.whatsapp'))} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />{t('common:cta.whatsapp')}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
