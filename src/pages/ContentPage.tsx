import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { SITE } from '@/config/site';
import { usePageTitle } from '@/app/usePageTitle';
import { useLocale } from '@/i18n/useLocale';
import { PRIVACY, TERMS } from '@/content/legal';
import '@/styles/home.css';
import '@/styles/pages.css';

interface Section { h: string; p?: string[]; list?: string[] }
type PageId = 'about' | 'sustainability' | 'privacy' | 'terms' | 'security';

const HERO: Partial<Record<PageId, string>> = { about: 'safari-crew', sustainability: 'maasai' };
const PILLAR_ICONS: IconName[] = ['view360', 'sparkles', 'users', 'leaf', 'globe', 'layers'];

/** Long-form pages. Copy lives in locales/<lang>/pages.json; legal pages are drafts pending legal review. */
export default function ContentPage({ page }: { page: PageId }) {
  const { t } = useTranslation(['pages', 'common', 'home']);
  usePageTitle(t(`pages:${page}.title`));
  const lang = useLocale();
  // Privacy Policy and Terms of Use: the English legal text is the governing version in every language.
  const doc = page === 'privacy' ? PRIVACY : page === 'terms' ? TERMS : undefined;
  const sections = doc ? doc.sections : (t(`pages:${page}.sections`, { returnObjects: true }) as Section[]);
  const legal = page === 'security';
  const pillars = page === 'about' ? (t('pages:about.pillars', { returnObjects: true }) as { t: string; d: string }[]) : [];

  return (
    <div className="page">
      <section className="block">
        {HERO[page] ? (
          <div className="detail-hero" style={{ minHeight: 'clamp(280px, 34vw, 420px)' }}>
            <Media id={HERO[page]!} sizes="1240px" priority decorative focus="50% 40%" />
            <div className="txt"><span className="eyebrow" style={{ color: 'var(--on-media-muted)' }}>{t(`pages:${page}.eyebrow`)}</span><h1>{t(`pages:${page}.title`)}</h1><p>{t(`pages:${page}.lede`)}</p></div>
          </div>
        ) : (
          <div className="page-head">
            <span className="eyebrow">{t(`pages:${page}.eyebrow`)}</span>
            <h1>{t(`pages:${page}.title`)}</h1>
            <p className="lede">{t(`pages:${page}.lede`)}</p>
            {legal && <span className="draft-note"><Icon name="info" width={16} height={16} />{t('pages:draft')}</span>}
            {doc && <span className="small muted">{t('pages:legal.version', { version: doc.version, date: doc.effective })}</span>}
            {doc && lang !== 'en' && <span className="draft-note" lang={lang}><Icon name="globe" width={16} height={16} />{t('pages:legal.englishNote')}</span>}
          </div>
        )}

        {page === 'about' && (
          <>
            <blockquote className="story" style={{ margin: 0 }}><span className="sec-title" style={{ fontSize: 'var(--fs-h2)' }}>“{t('home:story.quote')}”</span></blockquote>
            <div className="panel"><h2 className="group-title" style={{ marginBottom: 8 }}>{t('pages:about.visionTitle')}</h2><p>{t('pages:about.vision')}</p></div>
            <div className="grid3">{pillars.map((p, i) => <div className="card about" key={i}><span className="ico"><Icon name={PILLAR_ICONS[i] ?? 'check'} /></span><h3>{p.t}</h3><p>{p.d}</p></div>)}</div>
          </>
        )}

        <div className="prose" lang={doc ? 'en' : undefined}>
          {doc?.intro.map((p, i) => <p key={`i${i}`}>{p}</p>)}
          {Array.isArray(sections) && sections.map((s, i) => (
            <section key={i}>
              <h2>{s.h}</h2>
              {s.p?.map((p, j) => <p key={j}>{p}</p>)}
              {s.list && <ul>{s.list.map((l, j) => <li key={j}>{l}</li>)}</ul>}
            </section>
          ))}
          <p>{t('pages:contactLine')} <a href={`mailto:${SITE.email}`}>{SITE.email}</a> · {SITE.supportPhoneDisplay} · {SITE.company}, {SITE.address.line1}, {SITE.address.city}, {SITE.address.country}.</p>
        </div>

        {page === 'about' && (
          <div className="band">
            <div><h2>{t('pages:about.ctaTitle')}</h2><p>{t('pages:about.ctaText')}</p></div>
            <div className="chip-row"><Link className="btn light" to="/explore">{t('common:nav.explore')}</Link><Link className="btn on-media" to="/partners">{t('common:footer.links.partners')}</Link></div>
          </div>
        )}
        {page === 'sustainability' && (
          <div className="chip-row"><Link className="btn solid" to="/experiences"><Icon name="users" />{t('pages:sustainability.cta1')}</Link><Link className="btn ghost" to="/destinations?eco=1"><Icon name="leaf" />{t('pages:sustainability.cta2')}</Link></div>
        )}
      </section>
    </div>
  );
}
