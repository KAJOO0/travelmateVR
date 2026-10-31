import { createContext, Suspense, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/brand/Logo';
import { PreferencesMenu } from '@/components/layout/PreferencesMenu';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { ToastProvider } from '@/app/providers/ToastProvider';
import { useDismiss } from '@/lib/hooks';
import { auth, BOARD_ROLES, hasRole, PARTNER_ROLES, useSession } from '@/services/account';
import { seedIndex } from '@/services/catalog';
import { DEMO_BOARD } from '@/services/board';
import { ADMIN_ROLES, adminRoleOf, canRead, type AdminSection } from '@/services/admin';
import { partnerAdminStore } from '@/services/inventory';
import { useStore } from '@/lib/store';
import { Notice } from '@/components/ui/bits';
import type { Partner, Role, User } from '@/domain/types';
import { PortalGate } from './PortalGate';
import { usePageTitle } from '@/app/usePageTitle';
import '@/styles/pages.css';
import '@/styles/portal.css';

export type PortalKind = 'partner' | 'board' | 'admin';

const NAV: Record<PortalKind, { key: string; to: string; icon: IconName; section?: AdminSection }[]> = {
  partner: [
    { key: 'overview', to: '/business', icon: 'home' },
    { key: 'bookings', to: '/business/bookings', icon: 'ticket' },
    { key: 'calendar', to: '/business/calendar', icon: 'calendar' },
    { key: 'listings', to: '/business/listings', icon: 'building' },
    { key: 'customers', to: '/business/customers', icon: 'user' },
    { key: 'messages', to: '/business/messages', icon: 'mail' },
    { key: 'reviews', to: '/business/reviews', icon: 'star' },
    { key: 'revenue', to: '/business/revenue', icon: 'briefcase' },
    { key: 'marketing', to: '/business/marketing', icon: 'ticketStar' },
    { key: 'analytics', to: '/business/analytics', icon: 'barChart' },
    { key: 'vr', to: '/business/vr', icon: 'view360' },
    { key: 'profile', to: '/business/profile', icon: 'landmark' },
    { key: 'team', to: '/business/team', icon: 'users' },
    { key: 'settings', to: '/business/settings', icon: 'settings' }
  ],
  board: [
    { key: 'overview', to: '/board', icon: 'home' },
    { key: 'destinations', to: '/board/destinations', icon: 'pin' },
    { key: 'content', to: '/board/content', icon: 'layers' },
    { key: 'campaigns', to: '/board/campaigns', icon: 'ticketStar' },
    { key: 'visitors', to: '/board/visitors', icon: 'users' },
    { key: 'attractions', to: '/board/attractions', icon: 'view360' },
    { key: 'trends', to: '/board/trends', icon: 'barChart' },
    { key: 'partners', to: '/board/partners', icon: 'briefcase' },
    { key: 'sustainability', to: '/board/sustainability', icon: 'leaf' }
  ],
  admin: ([
    ['dashboard', '', 'home'], ['users', 'users', 'users'], ['partners', 'partners', 'briefcase'], ['destinations', 'destinations', 'pin'],
    ['bookings', 'bookings', 'ticket'], ['vr', 'vr', 'view360'], ['ai', 'ai', 'sparkles'], ['reviews', 'reviews', 'star'],
    ['marketing', 'marketing', 'ticketStar'], ['promotions', 'promotions', 'activity'], ['analytics', 'analytics', 'barChart'],
    ['sustainability', 'sustainability', 'leaf'], ['support', 'support', 'help'], ['reports', 'reports', 'download'],
    ['security', 'security', 'shield'], ['settings', 'settings', 'settings']
  ] as [AdminSection, string, IconName][]).map(([key, path, icon]) => ({ key, to: path ? `/admin/${path}` : '/admin', icon, section: key }))
};

interface PortalCtx { kind: PortalKind; user: User; partner?: Partner; orgName: string; orgId: string; adminRole?: Role }
const Ctx = createContext<PortalCtx | null>(null);
/** Organisation context for portal pages (only rendered once the role check has passed). */
export function usePortal(): PortalCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePortal outside portal');
  return v;
}
/** For partner pages: the partner the signed-in user manages. */
export function usePartnerOrg(): { partner: Partner; user: User } {
  const { partner, user } = usePortal();
  if (!partner) throw new Error('No partner organisation');
  return { partner, user };
}

function UserMenu({ user }: { user: User }) {
  const { t } = useTranslation('business');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close, btn);
  return (
    <div className="pop-anchor" ref={ref}>
      <button ref={btn} type="button" className="portal-user" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(o => !o)}>
        <span className="avatar" aria-hidden="true">{user.name.split(' ').map(s => s[0]).slice(0, 2).join('')}</span>
        <span className="who"><b>{user.name}</b><small>{user.email}</small></span>
        <Icon name="chevDown" />
      </button>
      {open && (
        <div className="popover" role="menu" style={{ minWidth: 220 }}>
          <ul className="menu-list">
            <li><Link role="menuitem" to="/" onClick={close}><Icon name="globe" />{t('shell.backToSite')}</Link></li>
            <li><button type="button" role="menuitem" onClick={() => { auth.signOut(); close(); navigate('/'); }}><Icon name="logout" />{t('shell.signOut')}</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}

function NoAccess() {
  const { t } = useTranslation('admin');
  usePageTitle(t('admin:noAccess.title'));
  return <div className="state"><span className="ico"><Icon name="shield" /></span><h1 className="group-title">{t('admin:noAccess.title')}</h1><p>{t('admin:noAccess.text')}</p><Link className="btn solid sm" to="/admin">{t('admin:nav.dashboard')}</Link></div>;
}

/** Shell for the partner and tourism-board portals: own header, sidebar navigation and role gate. */
export function PortalLayout({ kind }: { kind: PortalKind }) {
  const { t } = useTranslation(['business', 'board', 'admin', 'common']);
  const user = useSession();
  const { pathname } = useLocation();
  const allowed = hasRole(user, kind === 'partner' ? PARTNER_ROLES : kind === 'board' ? BOARD_ROLES : ADMIN_ROLES);
  const adminRole = kind === 'admin' ? adminRoleOf(user?.roles) : undefined;
  const section = kind === 'admin' ? ((pathname.split('/')[2] || 'dashboard') as AdminSection) : undefined;
  const partner = kind === 'partner' && user?.orgId ? seedIndex.partnerById.get(user.orgId) : undefined;
  const partnerAdmin = useStore(partnerAdminStore);
  const partnerSuspended = kind === 'partner' && !!partner && !!partnerAdmin[partner.id]?.suspended;
  const orgName = kind === 'partner' ? partner?.name ?? '' : kind === 'board' ? DEMO_BOARD.name : '';
  const ns = kind === 'partner' ? 'business' : kind === 'board' ? 'board' : 'admin';

  let body: ReactNode;
  if (!user || !allowed || (kind === 'partner' && !partner)) body = <PortalGate kind={kind} signedInAs={user && !allowed ? user : null} />;
  else body = (
    <Ctx.Provider value={{ kind, user, partner, orgName, orgId: user.orgId ?? '', adminRole }}>
      <div className="portal-body">
        <nav className="portal-nav" aria-label={t(`${ns}:shell.nav`)}>
          {NAV[kind].filter(n => !n.section || canRead(adminRole, n.section)).map(n => (
            <NavLink key={n.key} to={n.to} end={n.to === '/business' || n.to === '/board' || n.to === '/admin'}>
              <Icon name={n.icon} />{t(`${ns}:nav.${n.key}`)}
            </NavLink>
          ))}
        </nav>
        <main id="main" className="portal-main" tabIndex={-1}>
          <ErrorBoundary key={pathname}>
            {partnerSuspended && <Notice tone="warn" icon="info">{t('business:shell.suspended')}</Notice>}
            <Suspense fallback={<div className="skeleton" style={{ height: 320, borderRadius: 24 }} />}>
              {section && !canRead(adminRole, section) ? <NoAccess /> : <Outlet />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </Ctx.Provider>
  );

  return (
    <ToastProvider>
      <a className="skip" href="#main">{t('common:a11y.skip')}</a>
      <div className={`portal portal-${kind}`}>
        <header className="portal-top">
          <Link to="/" className="portal-brand" aria-label={t('business:shell.home')}><Logo className="logo" title={null} /></Link>
          <span className="portal-label">{t(`${ns}:shell.title`)}</span>
          {allowed && orgName && (
            <span className="portal-org">
              <b>{orgName}</b>
              <span className="badge demo">{t('business:shell.demoAccount')}</span>
            </span>
          )}
          <span className="portal-spacer" />
          {allowed && kind === 'partner' && partner && <Link className="btn ghost sm hide-sm" to={`/partner/${partner.slug}`}><Icon name="eye" />{t('business:shell.viewStorefront')}</Link>}
          {allowed && kind === 'board' && <Link className="btn ghost sm hide-sm" to="/destinations"><Icon name="eye" />{t('board:shell.viewSite')}</Link>}
          {allowed && adminRole && <span className="badge demo">{t('business:shell.demoAccount')}</span>}
          {allowed && adminRole && <span className="badge">{t(`admin:roles.${adminRole}`)}</span>}
          <PreferencesMenu />
          {user && allowed && <UserMenu user={user} />}
        </header>
        {body}
      </div>
      <ScrollRestoration />
    </ToastProvider>
  );
}
