import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { usePageTitle } from '@/app/usePageTitle';
import { SITE } from '@/config/site';
import '@/styles/pages.css';

interface QA { q: string; a: string }
// Help Center topics (account namespace) and FAQ-only topics (pages namespace), in reading order.
const GROUPS: { id: string; src: 'help' | 'faq' }[] = [
  { id: 'general', src: 'faq' }, { id: 'vr', src: 'help' }, { id: 'ai', src: 'help' }, { id: 'booking', src: 'help' },
  { id: 'payment', src: 'help' }, { id: 'availability', src: 'faq' }, { id: 'cancel', src: 'help' }, { id: 'account', src: 'help' },
  { id: 'safety', src: 'help' }, { id: 'partners', src: 'help' }, { id: 'business', src: 'faq' }, { id: 'boards', src: 'faq' }, { id: 'creators', src: 'faq' }
];

/** Frequently asked questions for travellers, partners, tourism bodies and creators. */
export default function FaqPage() {
  const { t } = useTranslation(['pages', 'account', 'common']);
  usePageTitle(t('pages:faq.title'));
  const [q, setQ] = useState('');
  const groups = useMemo(() => GROUPS.map(g => {
    const items: QA[] = g.src === 'help'
      ? [1, 2, 3].map(i => ({ q: t(`account:faq.${g.id}.q${i}`), a: t(`account:faq.${g.id}.a${i}`) }))
      : (t(`pages:faq.groups.${g.id}.items`, { returnObjects: true }) as QA[]);
    const title = g.src === 'help' ? t(`account:faq.${g.id}.title`) : t(`pages:faq.groups.${g.id}.title`);
    return { ...g, title, items: Array.isArray(items) ? items : [] };
  }), [t]);
  const needle = q.trim().toLowerCase();
  const shown = groups.map(g => ({ ...g, items: needle ? g.items.filter(x => `${x.q} ${x.a}`.toLowerCase().includes(needle)) : g.items })).filter(g => g.items.length);

  return (
    <div className="page">
      <section className="block" style={{ maxWidth: 980, marginInline: 'auto', width: '100%' }}>
        <div className="page-head">
          <span className="eyebrow">{t('pages:faq.eyebrow')}</span>
          <h1>{t('pages:faq.title')}</h1>
          <p className="lede">{t('pages:faq.lede')}</p>
        </div>
        <label className="select" style={{ width: '100%', minHeight: 50 }}>
          <Icon name="search" /><span className="sr">{t('pages:faq.search')}</span>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('pages:faq.search')} style={{ flex: 1, border: 0, background: 'transparent', color: 'var(--ink)', fontSize: 16, padding: '8px 2px' }} />
        </label>
        <nav className="chip-row" aria-label={t('pages:faq.topics')}>
          {shown.map(g => <a key={g.id} className="toggle" href={`#faq-${g.id}`}>{g.title}</a>)}
        </nav>
        {shown.length ? shown.map(g => (
          <section key={g.id} id={`faq-${g.id}`} aria-labelledby={`faq-${g.id}-h`} style={{ display: 'grid', gap: 10, scrollMarginTop: 96 }}>
            <h2 className="group-title" id={`faq-${g.id}-h`}>{g.title}</h2>
            <div className="faq">{g.items.map((x, i) => <details key={i}><summary>{x.q}</summary><div>{x.a}</div></details>)}</div>
          </section>
        )) : <p className="muted">{t('pages:faq.none')}</p>}
        <div className="band">
          <div><h2>{t('pages:faq.moreTitle')}</h2><p>{t('pages:faq.moreText', { email: SITE.email })}</p></div>
          <div className="chip-row"><Link className="btn light" to="/help">{t('common:footer.links.help')}</Link><Link className="btn on-media" to="/contact">{t('common:footer.links.contact')}</Link></div>
        </div>
      </section>
    </div>
  );
}
