import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/States';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { IntentChips, SmartSearch } from '@/features/search/SmartSearch';
import { isNaturalLanguage, parseIntent } from '@/services/search';
import { seedIndex } from '@/services/catalog';
import { usePageTitle } from '@/app/usePageTitle';
import { Media } from '@/components/ui/Media';
import { useLocale } from '@/i18n/useLocale';
import { countryName, lt } from '@/lib/content';
import { money } from '@/lib/format';
import type { Destination } from '@/domain/types';
import '@/styles/home.css';

/** Ranks destinations and experiences against a parsed request. */
function rank(q: string) {
  const intent = parseIntent(q);
  const text = q.toLowerCase();
  const placeIds = new Set(intent.places.map(p => p.id));
  const score = (d: Destination) => {
    let s = 0;
    if (placeIds.has(d.id)) s += 100;
    if (placeIds.has(d.countryId)) s += 60;
    s += intent.styles.filter(x => d.tags.includes(x)).length * 15;
    if (d.name.toLowerCase().includes(text)) s += 50;
    if (intent.budgetUsd && intent.days && intent.travellers) {
      const est = d.fromPriceUsd * intent.days * intent.travellers;
      if (est <= intent.budgetUsd) s += 10;
    }
    return s;
  };
  const destinations = seedIndex.destinations.map(d => ({ d, s: score(d) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.d);
  const destIds = new Set(destinations.map(d => d.id));
  const experiences = seedIndex.experiences
    .filter(e => destIds.has(e.destinationId) || e.title.en.toLowerCase().includes(text))
    .sort((a, b) => destinations.findIndex(d => d.id === a.destinationId) - destinations.findIndex(d => d.id === b.destinationId));
  return { intent, destinations, experiences };
}

export default function SearchPage() {
  const { t } = useTranslation();
  const lang = useLocale();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  usePageTitle(q ? t('search.resultsFor', { q }) : t('search.title'));
  const { intent, destinations, experiences } = useMemo(() => rank(q), [q]);
  const nl = q && isNaturalLanguage(intent);

  return (
    <div className="page">
      <section className="block" aria-labelledby="sr-h">
        <div className="lead" style={{ alignItems: 'stretch', textAlign: 'left' }}>
          <h1 id="sr-h" style={{ fontSize: 'var(--fs-h2)' }}>{q ? t('search.resultsFor', { q }) : t('search.title')}</h1>
          <SmartSearch key={q} showExamples={!q} />
          {q && (
            <div className="understood" style={{ border: 0, padding: 0 }}>
              <IntentChips intent={intent} />
            </div>
          )}
        </div>

        {nl && (
          <div className="band">
            <div>
              <span className="eyebrow">{t('nav.ai')}</span>
              <h2>{t('search.aiBandTitle')}</h2>
              <p>{t('search.aiBandText')}</p>
            </div>
            <Link className="btn light" to={`/ai?q=${encodeURIComponent(q)}`}><Icon name="sparkles" />{t('search.askAi')}</Link>
          </div>
        )}

        {q && destinations.length === 0 && experiences.length === 0 && (
          <EmptyState icon="compass" title={t('search.emptyTitle')} text={t('search.emptyText')} action={<Link className="btn solid sm" to="/destinations">{t('cta.exploreDestinations')}</Link>} />
        )}

        {destinations.length > 0 && (
          <div className="group" style={{ display: 'grid', gap: 20 }}>
            <h2 className="group-title">{t('search.destinations', { count: destinations.length })}</h2>
            <div className="grid3">
              {destinations.slice(0, 9).map(d => {
                const c = seedIndex.countries.find(x => x.id === d.countryId);
                return (
                  <Link className="card xp" key={d.id} to={`/destinations/${d.slug}`}>
                    <div className="pic"><Media id={d.media} decorative /></div>
                    <div className="body">
                      <span className="where"><Icon name="pin" />{lt(d.area, lang)}{c ? ` · ${countryName(c, lang)}` : ''}</span>
                      <h3>{d.name}</h3>
                      <p>{lt(d.summary, lang)}</p>
                      <div className="facts">
                        <span>{t('search.fromPerDay', { price: money(d.fromPriceUsd, lang) })}</span>
                        {d.ecoCertified && <span className="badge eco"><Icon name="leaf" />{t('badges.eco')}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {experiences.length > 0 && (
          <div className="group" style={{ display: 'grid', gap: 20 }}>
            <h2 className="group-title">{t('search.experiences', { count: experiences.length })}</h2>
            <div className="grid3">{experiences.slice(0, 6).map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
          </div>
        )}
      </section>
    </div>
  );
}
