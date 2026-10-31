import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { DestinationCard } from '@/components/cards/ListingCard';
import { EmptyState } from '@/components/ui/States';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { countryName, lt } from '@/lib/content';
import { money, monthName } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { useProfile } from '@/services/account';
import type { InterestTag, Region } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

const TYPES: InterestTag[] = ['wildlife', 'beach', 'mountain', 'culture', 'adventure', 'luxury', 'family', 'eco', 'lake', 'city', 'landscape'];
const REGIONS: Region[] = ['east-africa', 'southern-africa', 'southeast-asia', 'middle-east', 'europe'];

/** Destination marketplace: filters (country, region, type, budget, season, duration, accessibility, sustainability) + list/map. */
export default function DestinationsPage() {
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  const profile = useProfile();
  usePageTitle(t('explore:dest.title'));
  const [params, setParams] = useSearchParams();
  const country = params.get('country') ?? '';
  const region = params.get('region') ?? '';
  const tags = (params.get('type')?.split(',').filter(Boolean) ?? []) as InterestTag[];
  const month = Number(params.get('month') ?? 0);
  const maxDays = Number(params.get('days') ?? 0);
  const budget = Number(params.get('budget') ?? 0);
  const accessible = params.get('accessible') === '1';
  const eco = params.get('eco') === '1';
  const family = params.get('family') === '1';
  const sort = params.get('sort') ?? 'recommended';
  const [hover, setHover] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null || v === '' || v === '0') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };
  const toggleTag = (tag: InterestTag) => set('type', (tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag]).join(','));

  const list = useMemo(() => {
    const out = seedIndex.destinations.filter(d => {
      const c = seedIndex.countries.find(x => x.id === d.countryId);
      return (!country || d.countryId === country)
        && (!region || c?.region === region)
        && (!tags.length || tags.every(tag => d.tags.includes(tag) || (tag === 'family' && d.familyFriendly)))
        && (!month || d.bestMonths.includes(month))
        && (!maxDays || d.typicalDays[0] <= maxDays)
        && (!budget || d.fromPriceUsd <= budget)
        && (!accessible || d.accessible)
        && (!eco || d.ecoCertified)
        && (!family || d.familyFriendly);
    });
    // "Recommended" uses the traveller's saved interests when they have opted in to personalisation.
    const prefScore = (tagsOf: InterestTag[]) => (profile.consentPersonalisation ? profile.interests.filter(i => tagsOf.includes(i)).length : 0);
    const country1 = (id: string) => (seedIndex.countries.find(c => c.id === id)?.phase === 1 ? 1 : 0);
    return out.sort((a, b) =>
      sort === 'price' ? a.fromPriceUsd - b.fromPriceUsd
        : sort === 'rating' ? b.rating - a.rating
          : prefScore(b.tags) - prefScore(a.tags) || country1(b.countryId) - country1(a.countryId) || b.rating - a.rating);
  }, [country, region, tags, month, maxDays, budget, accessible, eco, family, sort, profile]);

  const points: MapPoint[] = useMemo(() => list.map(d => ({
    id: d.id, lat: d.coordinates[0], lng: d.coordinates[1], label: money(d.fromPriceUsd, lang), title: d.name, subtitle: lt(d.area, lang), href: `/destinations/${d.slug}`
  })), [list, lang]);

  const activeFilters = [country, region, tags.length, month, maxDays, budget, accessible, eco, family].filter(Boolean).length;
  const clear = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <div className="page">
      <section className="block">
        <div className="page-head">
          <span className="eyebrow">{t('explore:dest.eyebrow')}</span>
          <h1>{t('explore:dest.title')}</h1>
          <p className="lede">{t('explore:dest.text')}</p>
        </div>

        <div className={`browse with-map${showMap ? ' show-map' : ''}`}>
          <div className="mobile-filter-bar">
            <button type="button" className="btn ghost sm" aria-expanded={filtersOpen} aria-controls="dest-filters" onClick={() => setFiltersOpen(o => !o)}>
              <Icon name="layers" />{t('explore:filters.title')}{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setShowMap(m => !m)}><Icon name="map" />{showMap ? t('explore:filters.list') : t('explore:filters.map')}</button>
          </div>

          <aside className={`filters${filtersOpen ? ' open' : ''}`} id="dest-filters" aria-label={t('explore:filters.title')}>
            <div className="row-between">
              <h2>{t('explore:filters.title')}</h2>
              {activeFilters > 0 && <button type="button" className="tlink" onClick={clear}><span>{t('explore:filters.clear')}</span></button>}
            </div>
            <label className="field">
              <span>{t('explore:filters.country')}</span>
              <select value={country} onChange={e => set('country', e.target.value)}>
                <option value="">{t('explore:filters.allCountries')}</option>
                {seedIndex.countries.map(c => <option key={c.id} value={c.id}>{countryName(c, lang)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t('explore:filters.region')}</span>
              <select value={region} onChange={e => set('region', e.target.value)}>
                <option value="">{t('explore:filters.allRegions')}</option>
                {REGIONS.map(r => <option key={r} value={r}>{t(`explore:region.${r}`)}</option>)}
              </select>
            </label>
            <fieldset>
              <legend>{t('explore:filters.type')}</legend>
              <div className="chip-row">
                {TYPES.map(tag => <button key={tag} type="button" className="toggle" aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>{t(`common:tags.${tag}`)}</button>)}
              </div>
            </fieldset>
            <div className="range">
              <label className="label" htmlFor="budget">{t('explore:filters.budget')}: <b>{budget ? `≤ ${money(budget, lang)}` : t('explore:filters.any')}</b></label>
              <input id="budget" type="range" min={0} max={700} step={50} value={budget} onChange={e => set('budget', e.target.value)} />
              <span className="hint" style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>{t('explore:filters.budgetHint')}</span>
            </div>
            <label className="field">
              <span>{t('explore:filters.season')}</span>
              <select value={month} onChange={e => set('month', e.target.value)}>
                <option value={0}>{t('explore:filters.anyMonth')}</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{monthName(i + 1, lang, 'long')}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t('explore:filters.duration')}</span>
              <select value={maxDays} onChange={e => set('days', e.target.value)}>
                <option value={0}>{t('explore:filters.any')}</option>
                {[1, 2, 3, 5, 7].map(n => <option key={n} value={n}>{t('explore:filters.upToDays', { count: n })}</option>)}
              </select>
            </label>
            <fieldset>
              <legend>{t('explore:filters.more')}</legend>
              <label className="check"><input type="checkbox" checked={family} onChange={e => set('family', e.target.checked ? '1' : null)} />{t('explore:filters.family')}</label>
              <label className="check"><input type="checkbox" checked={accessible} onChange={e => set('accessible', e.target.checked ? '1' : null)} />{t('explore:filters.accessible')}</label>
              <label className="check"><input type="checkbox" checked={eco} onChange={e => set('eco', e.target.checked ? '1' : null)} />{t('explore:filters.eco')}</label>
            </fieldset>
          </aside>

          <div className="results">
            <div className="results-bar">
              <span className="count" aria-live="polite">{t('common:search.destinations', { count: list.length })}</span>
              <div className="chip-row">
                <label className="select">
                  <span className="sr">{t('explore:filters.sort')}</span>
                  <select value={sort} onChange={e => set('sort', e.target.value)}>
                    <option value="recommended">{t('explore:sort.recommended')}</option>
                    <option value="price">{t('explore:sort.price')}</option>
                    <option value="rating">{t('explore:sort.rating')}</option>
                  </select>
                </label>
                <button type="button" className="toggle view-toggle" onClick={() => setShowMap(m => !m)}><Icon name="map" />{showMap ? t('explore:filters.list') : t('explore:filters.map')}</button>
              </div>
            </div>
            <div className="results-list">
              {list.length ? (
                <div className="grid2">{list.map(d => <DestinationCard key={d.id} d={d} onHover={setHover} />)}</div>
              ) : (
                <EmptyState icon="compass" title={t('explore:empty.title')} text={t('explore:empty.text')} action={<button type="button" className="btn solid sm" onClick={clear}>{t('explore:filters.clear')}</button>} />
              )}
            </div>
          </div>

          <div className="map-col">
            <MapView points={points} activeId={hover} onSelect={setHover} label={t('explore:dest.mapLabel')} />
          </div>
        </div>
      </section>
    </div>
  );
}
