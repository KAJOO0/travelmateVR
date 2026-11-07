import { useCallback, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { PARTNER_NAV, PRIMARY_NAV } from '@/app/nav';
import { useDismiss } from '@/lib/hooks';
import { useWishlist } from '@/app/providers/WishlistProvider';
import { auth, hasRole, useMyProfile, useSession } from '@/services/account';
import { ADMIN_ROLES } from '@/services/admin';
import { S3Image } from '@/components/ui/S3Image';
import { PreferencesMenu } from './PreferencesMenu';
import { NavDrawer } from './NavDrawer';

export function Header({ onSearch }: { onSearch: () => void }) {
  const { t } = useTranslation(['common', 'account']);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { items } = useWishlist();
  const user = useSession();
  const myProfile = useMyProfile();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountBtn = useRef<HTMLButtonElement>(null);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  useDismiss(moreRef, moreOpen, closeMore, moreBtn);
  useDismiss(accountRef, accountOpen, closeAccount, accountBtn);
  const moreActive = ['/partners', '/tourism-boards', '/creators'].some(p => pathname.startsWith(p));
  const signOut = async () => { closeAccount(); await auth.signOut(); navigate('/'); };

  return (
    <header className="top">
      <Link className="pill logo-pill" to="/" aria-label={t('a11y.home')}>
        <Logo title={null} />
      </Link>

      <nav className="pill nav" aria-label={t('a11y.mainNav')}>
        {PRIMARY_NAV.map(n => (
          <NavLink key={n.key} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            {t(`nav.${n.key}`)}
          </NavLink>
        ))}
        <div className="pop-anchor" ref={moreRef}>
          <button
            ref={moreBtn}
            type="button"
            className={`menu-btn${moreActive ? ' active' : ''}`}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            onClick={() => setMoreOpen(o => !o)}
          >
            {t('nav.partners')} <Icon name="chevDown" className="chev" />
          </button>
          {moreOpen && (
            <div className="popover">
              <ul className="menu-list more-grid">
                {PARTNER_NAV.map(n => (
                  <li key={n.key}>
                    <Link to={n.to} onClick={closeMore}>
                      <span className="mi-ico"><Icon name={n.icon} /></span>
                      <span><b>{t(`partnerNav.${n.key}`)}</b><small>{t(`partnerNav.${n.key}Hint`)}</small></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : undefined)}>{t('nav.about')}</NavLink>
      </nav>

      <div className="pill tools">
        <button type="button" className="icon-btn" onClick={onSearch} aria-label={t('a11y.search')}>
          <Icon name="search" />
        </button>
        <PreferencesMenu />
        <Link className="icon-btn hide-sm hide-md" to="/wishlist" aria-label={t('a11y.wishlistCount', { count: items.length })}>
          <Icon name="heart" />
          {items.length > 0 && <span className="count" aria-hidden="true">{items.length}</span>}
        </Link>
        <Link className="icon-btn" to="/notifications" aria-label={t('a11y.notifications')}>
          <Icon name="bell" />
        </Link>
        <button type="button" className="icon-btn menu-toggle" aria-label={t('a11y.openMenu')} aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <Icon name="menu" />
        </button>
        {user ? (
          <div className="pop-anchor" ref={accountRef}>
            <button ref={accountBtn} type="button" className="signin" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen(o => !o)}>
              <span className="lbl">{user.name.split(' ')[0]}</span>
              <span className="avatar" aria-hidden="true">
                <S3Image s3Key={myProfile?.photoKey ?? undefined} alt="" fallback={user.name.split(' ').map(s => s[0]).slice(0, 2).join('')} />
              </span>
            </button>
            {accountOpen && (
              <div className="popover" role="menu" style={{ minWidth: 200 }}>
                <ul className="menu-list">
                  <li><Link role="menuitem" to="/account" onClick={closeAccount}><Icon name="user" />{t('account:title')}</Link></li>
                  {hasRole(user, ADMIN_ROLES) && <li><Link role="menuitem" to="/admin" onClick={closeAccount}><Icon name="shield" />{t('account:header.admin')}</Link></li>}
                  <li><button type="button" role="menuitem" onClick={() => void signOut()}><Icon name="logout" />{t('account:header.signOut')}</button></li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Link className="signin" to="/signin">
            <span className="lbl">{t('nav.signIn')}</span>
            <span className="avatar" aria-hidden="true"><Icon name="user" /></span>
          </Link>
        )}
      </div>

      <Link className="btn ghost cta cta-explore" to="/destinations">{t('cta.startExploring')}</Link>
      <Link className="btn solid cta" to="/partners">{t('cta.becomePartner')}</Link>

      {drawerOpen && <NavDrawer onClose={() => setDrawerOpen(false)} />}
    </header>
  );
}
