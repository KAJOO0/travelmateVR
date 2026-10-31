import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LANGUAGES } from '@/i18n';
import { SITE, SOCIAL, type SocialId, whatsappLink } from '@/config/site';
import { usePreferences } from '@/app/providers/PreferencesProvider';
import { promptInstall, usePwa } from '@/app/pwa';

const COLUMNS: { title: string; links: [key: string, to: string][] }[] = [
  { title: 'explore', links: [['destinations', '/destinations'], ['experiences', '/experiences'], ['vr', '/vr'], ['ai', '/ai'], ['safaris', '/safaris'], ['stays', '/stays']] },
  { title: 'business', links: [['partners', '/partners'], ['tourismBoards', '/tourism-boards'], ['creators', '/creators'], ['listBusiness', '/partners/join']] },
  { title: 'company', links: [['about', '/about'], ['sustainability', '/sustainability'], ['help', '/help'], ['faq', '/faq'], ['contact', '/contact']] },
  { title: 'legal', links: [['privacy', '/privacy'], ['terms', '/terms'], ['security', '/security'], ['credits', '/credits']] }
];

const SOCIAL_ICONS: Record<SocialId, IconName> = { whatsapp: 'whatsapp', instagram: 'instagram', x: 'xLogo', facebook: 'facebook' };

export function Footer() {
  const { t, i18n } = useTranslation();
  const { currency, currencies, setCurrency } = usePreferences();
  const { canInstall } = usePwa();

  return (
    <footer className="footer">
      <div className="foot-grid">
        <div className="foot-brand">
          <Link to="/" aria-label={t('a11y.home')}><Logo title={null} /></Link>
          <p>{t('footer.tagline')}</p>
          <div className="socials">
            {(Object.keys(SOCIAL) as SocialId[]).map(id => {
              const s = SOCIAL[id];
              const label = t(`social.${id}`);
              return s.url
                ? <a key={id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${label} ${s.handle ?? ''}`.trim()} title={s.handle ?? label}><Icon name={SOCIAL_ICONS[id]} /></a>
                : <span key={id} title={t('social.comingSoon', { name: label })} aria-label={t('social.comingSoon', { name: label })} role="img"><Icon name={SOCIAL_ICONS[id]} /></span>;
            })}
          </div>
          {canInstall && (
            <button type="button" className="btn ghost sm" onClick={() => void promptInstall()}>
              <Icon name="install" /> {t('pwa.install')}
            </button>
          )}
        </div>
        {COLUMNS.map(col => (
          <div className="foot-col" key={col.title}>
            <h2>{t(`footer.${col.title}`)}</h2>
            <ul>
              {col.links.map(([key, to]) => (
                <li key={key}><Link to={to}>{t(`footer.links.${key}`)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <address className="foot-contact" style={{ fontStyle: 'normal' }}>
        <a href={`mailto:${SITE.email}`}><Icon name="mail" />{SITE.email}</a>
        <a href={`tel:${SITE.supportPhone}`}><Icon name="phone" />{SITE.supportPhoneDisplay}</a>
        <a href={whatsappLink(t('footer.whatsappHello'))} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />{t('footer.whatsapp')} · {SITE.whatsappDisplay}</a>
        <span><Icon name="pin" />{SITE.address.line1}, {SITE.address.city}, {SITE.address.country}</span>
      </address>

      <div className="foot-base">
        <small>© {SITE.copyrightYear} {SITE.company}. {t('footer.rights')}</small>
        <div className="selects">
          <label className="select">
            <Icon name="globe" />
            <span className="sr">{t('prefs.language')}</span>
            <select value={i18n.resolvedLanguage} onChange={e => void i18n.changeLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code} lang={l.code}>{l.native}</option>)}
            </select>
          </label>
          <label className="select">
            <span aria-hidden="true">$</span>
            <span className="sr">{t('prefs.currency')}</span>
            <select value={currency} onChange={e => setCurrency(e.target.value as typeof currency)}>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
      </div>
    </footer>
  );
}
