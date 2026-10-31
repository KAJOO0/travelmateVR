import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { MORE_NAV, PARTNER_NAV, PRIMARY_NAV } from '@/app/nav';

/** Full navigation for tablet and mobile. */
export function NavDrawer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a, button');
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus(); };
  }, [onClose]);

  const item = (key: string, to: string, icon: Parameters<typeof Icon>[0]['name'], hint?: string) => (
    <li key={key}>
      <Link to={to} onClick={onClose}>
        <span className="mi-ico"><Icon name={icon} /></span>
        <span><b>{t(`nav.${key}`)}</b>{hint && <small>{hint}</small>}</span>
      </Link>
    </li>
  );

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" ref={panel} role="dialog" aria-modal="true" aria-label={t('a11y.menu')}>
        <div className="drawer-head">
          <Logo title={null} />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('a11y.closeMenu')}><Icon name="close" /></button>
        </div>
        <div className="drawer-ctas">
          <Link className="btn solid" to="/destinations" onClick={onClose}>{t('cta.startExploring')}</Link>
          <Link className="btn ghost" to="/partners" onClick={onClose}>{t('cta.becomePartner')}</Link>
        </div>
        <nav aria-label={t('a11y.mainNav')}>
          <h2>{t('nav.discover')}</h2>
          <ul className="menu-list">{PRIMARY_NAV.filter(n => n.to !== '/').map(n => item(n.key, n.to, n.icon))}{item('about', '/about', 'info')}</ul>
          <h2>{t('nav.marketplace')}</h2>
          <ul className="menu-list">{MORE_NAV.map(n => item(n.key, n.to, n.icon, t(`navHint.${n.key}`)))}</ul>
          <h2>{t('nav.partners')}</h2>
          <ul className="menu-list">{PARTNER_NAV.map(n => (
            <li key={n.key}><Link to={n.to} onClick={onClose}><span className="mi-ico"><Icon name={n.icon} /></span><span><b>{t(`partnerNav.${n.key}`)}</b></span></Link></li>
          ))}</ul>
          <h2>{t('nav.yourTravel')}</h2>
          <ul className="menu-list">
            {item('wishlist', '/wishlist', 'heart')}
            {item('trips', '/trips', 'suitcase')}
            {item('bookings', '/bookings', 'ticket')}
            {item('help', '/help', 'help')}
            {item('faq', '/faq', 'info')}
          </ul>
        </nav>
      </div>
    </>,
    document.body
  );
}
