import { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingActions, InstallBanner, MobileNav, SystemBar } from './Chrome';
import { Icon } from '@/components/ui/Icon';
import { SmartSearch } from '@/features/search/SmartSearch';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastProvider } from '@/app/providers/ToastProvider';

function PageFallback() {
  return (
    <div className="page" aria-busy="true">
      <div className="skeleton" style={{ height: 'min(46vw, 520px)', borderRadius: 30, marginTop: 24 }} />
      <div className="skeleton" style={{ height: 24, width: '40%', margin: '0 auto' }} />
    </div>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus(); };
  }, [onClose]);
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="search-dialog" ref={ref} role="dialog" aria-modal="true" aria-label={t('search.label')}>
        <div className="sd-head">
          <span className="eyebrow">{t('search.label')}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('a11y.close')}><Icon name="close" /></button>
        </div>
        <SmartSearch autoFocus onDone={onClose} />
      </div>
    </>,
    document.body
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => { setSearchOpen(false); }, [pathname]);
  // Links such as /partners#for-hotels: scroll to the section once the (lazy) page has rendered.
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 20) { window.clearInterval(id); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 100);
    return () => window.clearInterval(id);
  }, [pathname, hash]);
  // Preview links shared through a Cloudflare quick tunnel: report page views to the local
  // visitor log (scripts/preview-server.mjs). Not sent anywhere else.
  useEffect(() => {
    if (!location.hostname.endsWith('.trycloudflare.com')) return;
    try { navigator.sendBeacon('/__visit', JSON.stringify({ page: location.pathname + location.search, referrer: document.referrer })); } catch { /* ignore */ }
  }, [pathname]);
  useEffect(() => {
    // "/" opens search from anywhere (except while typing).
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !/input|textarea|select/i.test(el.tagName) && !el.isContentEditable) { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ToastProvider>
      <a className="skip" href="#main">{t('a11y.skip')}</a>
      <div className="wrap">
        <SystemBar />
        <InstallBanner />
        <Header onSearch={() => setSearchOpen(true)} />
        <main id="main" tabIndex={-1} style={{ outline: 'none', paddingTop: 24 }}>
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <FloatingActions />
      <MobileNav />
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
      <ScrollRestoration />
    </ToastProvider>
  );
}
