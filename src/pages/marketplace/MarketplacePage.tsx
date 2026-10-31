import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { ListingCard } from '@/components/cards/ListingCard';
import { EmptyState } from '@/components/ui/States';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { filterListings, seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { money } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { TYPE_PATH } from '@/app/nav';
import type { ListingType } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

const TYPES: ListingType[] = ['stay', 'safari', 'activity', 'local', 'restaurant', 'transport', 'event'];

const SUBTYPES: Record<ListingType, string[]> = {
  stay: ['hotel', 'lodge', 'camp', 'guesthouse', 'resort', 'villa'],
  safari: ['day', 'private', 'group', 'luxury'],
  activity: ['hiking', 'water', 'cultural', 'diving', 'adventure'],
  restaurant: ['swahili', 'seafood', 'bush'],
  transport: ['flight', 'transfer', 'driver', 'car', 'boat', 'bus', 'train'],
  event: ['music', 'cruise', 'market', 'festival'],
  local: ['culture', 'tour', 'food', 'craft']
};

/** Unified tourism marketplace. `type` undefined = all categories. */
export default function MarketplacePage({ type }: { type?: ListingType }) {
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  const [params, setParams] = useSearchParams();
  const titleKey = type ? `explore:market.title.${type}` : 'explore:market.title.all';
  usePageTitle(t(titleKey));
  const destination = params.get('destination') ?? '';
  const subtype = params.get('subtype') ?? '';
  const maxPrice = Number(params.get('price') ?? 0);
  const eco = params.get('eco') === '1';
  const community = params.get('community') === '1';
  const instant = params.get('instant') === '1';
  const sort = params.get('sort') ?? 'recommended';
  const q = params.get('q') ?? '';
  const [hover, setHover] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null || v === '' || v === '0') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const base = useMemo(() => filterListings(seedIndex.listings, { type }), [type]);
  const maxOfType = useMemo(() => Math.max(50, ...base.map(l => l.price.amountUsd)), [base]);
  const list = useMemo(() => {
    const out = filterListings(seedIndex.listings, { type, destinationId: destination || undefined, subtype: subtype || undefined, maxPriceUsd: maxPrice || undefined, eco, community, instantBook: instant, q: q || undefined });
    return out.sort((a, b) =>
      sort === 'price' ? a.price.amountUsd - b.price.amountUsd
        : sort === 'priceDesc' ? b.price.amountUsd - a.price.amountUsd
          : sort === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0)
            // Recommended: real partners first, then sustainability, then rating.
            : Number(seedIndex.partnerById.get(b.partnerId)?.real) - Number(seedIndex.partnerById.get(a.partnerId)?.real)
              || Number(!!b.sustainability.communityLed || !!b.sustainability.ecoCertified) - Number(!!a.sustainability.communityLed || !!a.sustainability.ecoCertified)
              || (b.rating ?? 0) - (a.rating ?? 0));
  }, [type, destination, subtype, maxPrice, eco, community, instant, sort, q]);

  const destinations = useMemo(() => seedIndex.destinations.filter(d => base.some(l => l.destinationId === d.id)), [base]);
  const subtypes = type ? SUBTYPES[type].filter(s => base.some(l => l.subtype === s)) : [];
  const points: MapPoint[] = useMemo(() => list.map(l => ({ id: l.id, lat: l.coordinates[0], lng: l.coordinates[1], label: l.price.amountUsd ? money(l.price.amountUsd, lang) : t('common:price.free'), title: lt(l.title, lang), subtitle: seedIndex.destById.get(l.destinationId)?.name, href: `/listing/${l.slug}` })), [list, lang, t]);
  const activeFilters = [destination, subtype, maxPrice, eco, community, instant, q].filter(Boolean).length;
  const clear = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <div className="page">
      <section className="block">
        <div className="page-head">
          <span className="eyebrow">{t('explore:market.eyebrow')}</span>
          <h1>{t(titleKey)}</h1>
          <p className="lede">{t(type ? `explore:market.text.${type}` : 'explore:market.text.all')}</p>
        </div>

        <nav className="chip-row" aria-label={t('explore:market.categories')}>
          <Link className="toggle" to="/marketplace" aria-current={!type ? 'page' : undefined}>{t('explore:filters.all')}</Link>
          {TYPES.map(tp => <Link key={tp} className="toggle" to={TYPE_PATH[tp]} aria-current={type === tp ? 'page' : undefined}>{t(`common:listingTypePlural.${tp}`)}</Link>)}
        </nav>

        {type === 'local' && (
          <div className="band" style={{ background: 'linear-gradient(100deg, #0b5d3b 0%, #0079c1 100%)' }}>
            <div>
              <span className="eyebrow">{t('explore:market.communityEyebrow')}</span>
              <h2>{t('explore:market.communityTitle')}</h2>
              <p>{t('explore:market.communityText')}</p>
            </div>
            <Link className="btn light" to="/sustainability"><Icon name="leaf" />{t('explore:market.communityCta')}</Link>
          </div>
        )}

        <div className={`browse with-map${showMap ? ' show-map' : ''}`}>
          <div className="mobile-filter-bar">
            <button type="button" className="btn ghost sm" aria-expanded={filtersOpen} aria-controls="mk-filters" onClick={() => setFiltersOpen(o => !o)}><Icon name="layers" />{t('explore:filters.title')}{activeFilters ? ` (${activeFilters})` : ''}</button>
            <button type="button" className="btn ghost sm" onClick={() => setShowMap(m => !m)}><Icon name="map" />{showMap ? t('explore:filters.list') : t('explore:filters.map')}</button>
          </div>
          <aside className={`filters${filtersOpen ? ' open' : ''}`} id="mk-filters" aria-label={t('explore:filters.title')}>
            <div className="row-between"><h2>{t('explore:filters.title')}</h2>{activeFilters > 0 && <button type="button" className="tlink" onClick={clear}><span>{t('explore:filters.clear')}</span></button>}</div>
            <label className="field">
              <span>{t('explore:filters.keyword')}</span>
              <input type="search" value={q} onChange={e => set('q', e.target.value)} placeholder={t('explore:filters.keywordPh')} />
            </label>
            <label className="field">
              <span>{t('explore:filters.destination')}</span>
              <select value={destination} onChange={e => set('destination', e.target.value)}>
                <option value="">{t('explore:filters.allDestinations')}</option>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            {subtypes.length > 1 && (
              <fieldset>
                <legend>{t('explore:filters.type')}</legend>
                <div className="chip-row">{subtypes.map(s => <button key={s} type="button" className="toggle" aria-pressed={subtype === s} onClick={() => set('subtype', subtype === s ? null : s)}>{t(`common:subtype.${s}`)}</button>)}</div>
              </fieldset>
            )}
            <div className="range">
              <label className="label" htmlFor="mk-price">{t('explore:filters.maxPrice')}: <b>{maxPrice ? money(maxPrice, lang) : t('explore:filters.any')}</b></label>
              <input id="mk-price" type="range" min={0} max={Math.ceil(maxOfType / 50) * 50} step={type === 'safari' || type === 'stay' || !type ? 50 : 5} value={maxPrice} onChange={e => set('price', e.target.value)} />
            </div>
            <fieldset>
              <legend>{t('explore:filters.trust')}</legend>
              <label className="check"><input type="checkbox" checked={eco} onChange={e => set('eco', e.target.checked ? '1' : null)} />{t('explore:filters.eco')}</label>
              <label className="check"><input type="checkbox" checked={community} onChange={e => set('community', e.target.checked ? '1' : null)} />{t('explore:filters.community')}</label>
              <label className="check"><input type="checkbox" checked={instant} onChange={e => set('instant', e.target.checked ? '1' : null)} />{t('explore:filters.instant')}</label>
            </fieldset>
          </aside>

          <div className="results">
            <div className="results-bar">
              <span className="count" aria-live="polite">{t('explore:market.count', { count: list.length })}</span>
              <div className="chip-row">
                <label className="select"><span className="sr">{t('explore:filters.sort')}</span>
                  <select value={sort} onChange={e => set('sort', e.target.value)}>
                    <option value="recommended">{t('explore:sort.recommended')}</option>
                    <option value="price">{t('explore:sort.price')}</option>
                    <option value="priceDesc">{t('explore:sort.priceDesc')}</option>
                    <option value="rating">{t('explore:sort.rating')}</option>
                  </select>
                </label>
                <button type="button" className="toggle view-toggle" onClick={() => setShowMap(m => !m)}><Icon name="map" />{showMap ? t('explore:filters.list') : t('explore:filters.map')}</button>
              </div>
            </div>
            <div className="results-list">
              {list.length ? <div className="grid2">{list.map(l => <ListingCard key={l.id} listing={l} onHover={setHover} />)}</div>
                : <EmptyState icon="compass" title={t('explore:empty.title')} text={t('explore:empty.text')} action={<button type="button" className="btn solid sm" onClick={clear}>{t('explore:filters.clear')}</button>} />}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('explore:market.sampleNote')}</p>
          </div>

          <div className="map-col"><MapView points={points} activeId={hover} onSelect={setHover} label={t('explore:market.mapLabel')} /></div>
        </div>
      </section>
    </div>
  );
}
