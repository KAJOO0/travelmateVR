import { useEffect, useState } from 'react';
import { usePlatform } from '@/services/platform';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { MOBILE_NAV } from '@/app/nav';
import { useOnline } from '@/lib/hooks';
import { applyUpdate, dismissPwa, usePwa } from '@/app/pwa';

export function MobileNav() {
  const { t } = useTranslation();
  return (
    <nav className="bottom-nav" aria-label={t('a11y.mobileNav')}>
      <ul>
        {MOBILE_NAV.map(n => (
          <li key={n.key}>
            <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <Icon name={n.icon} />
              {t(`nav.${n.key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Floating TravelMate AI entry point, plus back-to-top once the page is scrolled. */
export function FloatingActions() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 600);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className="fab-stack">
      {scrolled && (
        <button type="button" className="totop" aria-label={t('a11y.backToTop')} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Icon name="arrowUp" />
        </button>
      )}
      <Link className="fab" to="/ai" aria-label={t('nav.ai')}>
        <span className="orb"><Icon name="sparkles" /></span>
        <span className="lbl">{t('nav.ai')}</span>
      </Link>
    </div>
  );
}

/** Offline indicator and service-worker update notice. */
export function SystemBar() {
  const { t } = useTranslation();
  const online = useOnline();
  const { needRefresh, offlineReady } = usePwa();
  const { maintenance } = usePlatform();
  const [showReady, setShowReady] = useState(false);
  useEffect(() => {
    if (!offlineReady) return;
    setShowReady(true);
    const id = setTimeout(() => { setShowReady(false); dismissPwa(); }, 5000);
    return () => clearTimeout(id);
  }, [offlineReady]);

  if (maintenance.on && maintenance.message.trim()) {
    return <div className="sysbar" role="status"><Icon name="info" /> {maintenance.message}</div>;
  }
  if (!online) {
    return (
      <div className="sysbar offline" role="status">
        <Icon name="wifiOff" /> {t('system.offline')}
      </div>
    );
  }
  if (needRefresh) {
    return (
      <div className="sysbar" role="status">
        <Icon name="refresh" /> {t('system.update')}
        <button type="button" className="btn solid" onClick={applyUpdate}>{t('system.reload')}</button>
        <button type="button" className="btn ghost" onClick={dismissPwa}>{t('system.later')}</button>
      </div>
    );
  }
  if (showReady) {
    return <div className="sysbar" role="status"><Icon name="check" /> {t('system.offlineReady')}</div>;
  }
  return null;
}
