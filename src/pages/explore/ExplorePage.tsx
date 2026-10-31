import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { CountryCard } from '@/components/cards/CountryCard';
import { DestinationCard } from '@/components/cards/ListingCard';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { MapView, type MapPoint } from '@/components/map/MapView';
import { SmartSearch } from '@/features/search/SmartSearch';
import { MORE_NAV } from '@/app/nav';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { monthName } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { useProfile } from '@/services/account';
import type { InterestTag } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';
import { byFormat, is360 } from '@/lib/immersive';

const INTERESTS: InterestTag[] = ['wildlife', 'beach', 'culture', 'mountain', 'adventure', 'eco', 'family', 'luxury'];

export default function ExplorePage() {
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  const profile = useProfile();
  usePageTitle(t('explore:hub.title'));
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const seasonal = useMemo(() => seedIndex.destinations.filter(d => d.bestMonths.includes(month)).sort((a, b) => b.rating - a.rating).slice(0, 4), [month]);
  const countries = useMemo(() => seedIndex.countries.map(c => ({
    ...c,
    destinationCount: seedIndex.destinations.filter(d => d.countryId === c.id).length,
    experienceCount: seedIndex.experiences.filter(e => seedIndex.destById.get(e.destinationId)?.countryId === c.id).length
  })), []);
  const forYou = useMemo(() => {
    if (!profile.consentPersonalisation || !profile.interests.length) return [];
    return seedIndex.destinations.map(d => ({ d, s: profile.interests.filter(i => d.tags.includes(i)).length })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || b.d.rating - a.d.rating).slice(0, 4).map(x => x.d);
  }, [profile]);
  const points: MapPoint[] = useMemo(() => seedIndex.destinations.map(d => ({ id: d.id, lat: d.coordinates[0], lng: d.coordinates[1], label: d.name, title: d.name, subtitle: lt(d.area, lang), href: `/destinations/${d.slug}` })), [lang]);
  const panos = seedIndex.experiences.filter(is360).sort(byFormat).slice(0, 3);

  return (
    <div className="page">
      <section className="block">
        <div className="page-head" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className="eyebrow">{t('explore:hub.eyebrow')}</span>
          <h1>{t('explore:hub.title')}</h1>
          <p className="lede">{t('explore:hub.text')}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><SmartSearch /></div>
      </section>

      {forYou.length > 0 && (
        <section className="block" aria-labelledby="fy-h">
          <div className="sec-head"><div><span className="eyebrow">{t('explore:hub.forYouEyebrow')}</span><h2 className="sec-title" id="fy-h">{t('explore:hub.forYou')}</h2></div><Link className="tlink" to="/account/preferences"><span>{t('explore:hub.editPrefs')}</span><Icon name="arrowRight" /></Link></div>
          <div className="grid2 m-swipe">{forYou.map(d => <DestinationCard key={d.id} d={d} />)}</div>
        </section>
      )}

      <section className="block" aria-labelledby="int-h">
        <h2 className="sec-title" id="int-h">{t('explore:hub.byInterest')}</h2>
        <div className="chips m-two" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {INTERESTS.map(i => (
            <Link key={i} className="chip" to={`/destinations?type=${i}`} style={{ textDecoration: 'none' }}>
              <b>{t(`common:tags.${i}`)}</b>
              <span>{t('common:search.destinations', { count: seedIndex.destinations.filter(d => d.tags.includes(i)).length })}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="block" aria-labelledby="season-h">
        <div className="sec-head">
          <div><span className="eyebrow">{t('explore:hub.seasonEyebrow')}</span><h2 className="sec-title" id="season-h">{t('explore:hub.season', { month: monthName(month, lang, 'long') })}</h2></div>
          <label className="select"><Icon name="calendar" /><span className="sr">{t('explore:filters.season')}</span>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{monthName(i + 1, lang, 'long')}</option>)}
            </select>
          </label>
        </div>
        <div className="grid2 m-swipe">{seasonal.map(d => <DestinationCard key={d.id} d={d} />)}</div>
        <Link className="tlink" to={`/destinations?month=${month}`}><span>{t('explore:hub.allSeason')}</span><Icon name="arrowRight" /></Link>
      </section>

      <section className="block" aria-labelledby="c-h">
        <h2 className="sec-title" id="c-h">{t('explore:hub.countries')}</h2>
        <div className="grid3 m-swipe m-swipe-narrow" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>{countries.map(c => <CountryCard key={c.id} c={c} />)}</div>
      </section>

      <section className="block" aria-labelledby="map-h">
        <h2 className="sec-title" id="map-h">{t('explore:hub.map')}</h2>
        <div className="map-frame" style={{ height: 'clamp(320px, 46vw, 520px)' }}><MapView points={points} label={t('explore:hub.map')} /></div>
      </section>

      <section className="block" aria-labelledby="vr-h">
        <div className="sec-head"><div><span className="eyebrow">360°</span><h2 className="sec-title" id="vr-h">{t('explore:hub.real360')}</h2><p className="lede">{t('explore:hub.real360Text')}</p></div><Link className="tlink" to="/vr"><span>{t('explore:hub.allVr')}</span><Icon name="arrowRight" /></Link></div>
        <div className="grid3 m-swipe">{panos.map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
      </section>

      <section className="block" aria-labelledby="mk-h">
        <h2 className="sec-title" id="mk-h">{t('explore:hub.marketplace')}</h2>
        <div className="grid3">
          {[...MORE_NAV, { key: 'experiences', to: '/experiences', icon: 'users' as const }].map(n => {
            const type = n.key === 'stays' ? 'stay' : n.key === 'safaris' ? 'safari' : n.key === 'activities' ? 'activity' : n.key === 'restaurants' ? 'restaurant' : n.key === 'events' ? 'event' : n.key === 'experiences' ? 'local' : 'transport';
            const sample = seedIndex.listings.find(l => !l.paused && l.type === type);
            return (
              <Link key={n.key} className="feature" to={n.to} style={{ minHeight: 220 }}>
                {sample && <Media id={sample.media[0]!} sizes="400px" decorative />}
                <div className="txt"><span className="eyebrow"><Icon name={n.icon} width={14} height={14} /> {t('explore:hub.listings', { count: seedIndex.listings.filter(l => l.type === type).length })}</span><h3>{t(`common:nav.${n.key}`)}</h3><p>{t(`common:navHint.${n.key}`)}</p></div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
