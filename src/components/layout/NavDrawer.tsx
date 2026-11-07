import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { MORE_NAV, PARTNER_NAV, PRIMARY_NAV } from '@/app/nav';
import { auth, hasRole, useSession } from '@/services/account';
import { ADMIN_ROLES } from '@/services/admin';

/** Full navigation for tablet and mobile. */
export function NavDrawer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSession();
  const panel = useRef<HTMLDivElement>(null);
  // Below 767px, layout.css hides the desktop header's whole account-menu trigger
  // (`.tools .signin{display:none}`) with no mobile replacement - confirmed live: on a
  // phone-width screen there was no way at all to reach /account, /admin, or sign out
  // other than navigating to /account first via the bottom nav's "profile" tab (which
  // itself has its own sign-out button, but nothing surfaces /admin). This section is
  // that replacement, always present in the one mobile nav surface that isn't hidden.
  const signOut = async () => { onClose(); await auth.signOut(); navigate('/'); };

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
          <h2>{t('account:title')}</h2>
          <ul className="menu-list">
            <li><Link to="/account" onClick={onClose}><span className="mi-ico"><Icon name="user" /></span><span><b>{t('account:title')}</b></span></Link></li>
            {user && hasRole(user, ADMIN_ROLES) && <li><Link to="/admin" onClick={onClose}><span className="mi-ico"><Icon name="shield" /></span><span><b>{t('account:header.admin')}</b></span></Link></li>}
            {user
              ? <li><button type="button" onClick={() => void signOut()}><span className="mi-ico"><Icon name="logout" /></span><span><b>{t('account:header.signOut')}</b></span></button></li>
              : <li><Link to="/signin" onClick={onClose}><span className="mi-ico"><Icon name="user" /></span><span><b>{t('nav.signIn')}</b></span></Link></li>}
          </ul>
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
