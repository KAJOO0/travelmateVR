import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { CarouselArrows, CarouselTrack, useCarousel } from '@/components/ui/Carousel';
import { CardSkeleton, ErrorState } from '@/components/ui/States';
import { CountryCard } from '@/components/cards/CountryCard';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { Showcase, type ShowcaseCategory } from '@/features/home/Showcase';
import { SmartSearch } from '@/features/search/SmartSearch';
import { PartnerLogo } from '@/features/partners/PartnerLogo';
import { useLocale } from '@/i18n/useLocale';
import { useAsync } from '@/lib/hooks';
import { countryName } from '@/lib/content';
import { byFormat, is360 } from '@/lib/immersive';
import { catalog, seedIndex } from '@/services/catalog';
import { CATEGORIES } from '@/data/seed/experiences';
import { TESTIMONIALS } from '@/data/testimonials';
import { GLOBAL_REGIONS, type Experience } from '@/domain/types';
import { usePageTitle } from '@/app/usePageTitle';
import '@/styles/home.css';
import '@/styles/pages.css';

// Home page. One idea runs through every section: experience a destination before you travel,
// so you can decide with confidence. Technology stays in the background.

const SHOWCASE_LINKS: Record<string, { slug: string; dest: string | null }> = {
  lifestyle: { slug: 'zanzibar-shoreline', dest: 'zanzibar' },
  landscape: { slug: 'ngorongoro-crater-floor', dest: 'ngorongoro' },
  cultural: { slug: 'maasai-living-culture', dest: null },
  wildlife: { slug: 'serengeti-wildebeest-migration', dest: 'serengeti' }
};

const TRUST: { key: string; icon: IconName }[] = [
  { key: 'verified', icon: 'shield' }, { key: 'local', icon: 'users' }, { key: 'planning', icon: 'sparkles' },
  { key: 'immersive', icon: 'view360' }, { key: 'pricing', icon: 'ticket' }, { key: 'africa', icon: 'globe' }
];

type Cat = 'wildlife' | 'culture' | 'adventure' | 'beaches' | 'cities' | 'luxury' | 'conservation';
const CATS: Cat[] = ['wildlife', 'culture', 'adventure', 'beaches', 'cities', 'luxury', 'conservation'];
const inCat = (x: Experience, c: Cat) => {
  const d = seedIndex.destById.get(x.destinationId);
  switch (c) {
    case 'wildlife': return x.kind === 'wildlife';
    case 'culture': return x.kind === 'culture';
    case 'adventure': return x.kind === 'adventure' || x.kind === 'landscape';
    case 'beaches': return x.kind === 'beach';
    case 'cities': return x.kind === 'city';
    case 'luxury': return !!d?.tags.includes('luxury');
    case 'conservation': return !!(d?.ecoCertified || d?.tags.includes('eco'));
  }
};

const BENEFITS: { key: string; icon: IconName }[] = [
  { key: 'know', icon: 'eye' }, { key: 'confidence', icon: 'shield' }, { key: 'surprises', icon: 'check' },
  { key: 'compare', icon: 'layers' }, { key: 'smarter', icon: 'calendar' }, { key: 'trusted', icon: 'star' }
];
const STEPS: IconName[] = ['compass', 'view360', 'sparkles', 'ticket'];
const PARTNER_BENEFITS = ['reach', 'leads', 'confidence', 'conversion', 'showcase', 'manage'];
const PARTNER_TYPES: { key: string; icon: IconName; to: string }[] = [
  { key: 'operators', icon: 'binoculars', to: '/partners#for-operators' },
  { key: 'hotels', icon: 'bed', to: '/partners#for-hotels' },
  { key: 'guides', icon: 'compass', to: '/partners#for-guides' },
  { key: 'boards', icon: 'landmark', to: '/tourism-boards' },
  { key: 'conservation', icon: 'leaf', to: '/tourism-boards' },
  { key: 'creators', icon: 'video360', to: '/creators' }
];
const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

export default function HomePage() {
  const { t } = useTranslation('home');
  const { t: tc } = useTranslation();
  const lang = useLocale();
  usePageTitle(null);
  const [cat, setCat] = useState(1);

  const tanzania = seedIndex.countries.find(c => c.id === 'tanzania')!;
  const showcase: ShowcaseCategory[] = useMemo(() => CATEGORIES.map(c => {
    const link = SHOWCASE_LINKS[c.id]!;
    const d = link.dest ? seedIndex.destById.get(link.dest) : undefined;
    const xp = seedIndex.experiences.find(e => e.slug === link.slug);
    return { ...c, experienceSlug: link.slug, is360: !!xp && is360(xp), place: d ? (d.countryId === 'zanzibar' ? d.name : `${d.name} · ${countryName(tanzania, lang)}`) : countryName(tanzania, lang) };
  }), [lang, tanzania]);

  const countries = useAsync(() => catalog.countries(), []);
  const experiences = useAsync(() => catalog.experiences({}), []);
  const [xpCat, setXpCat] = useState<Cat | null>(null);
  const cats = useMemo(() => CATS.filter(c => experiences.data?.some(x => inCat(x, c))), [experiences.data]);
  const shownXps = useMemo(() => (experiences.data ?? []).filter(x => !xpCat || inCat(x, xpCat)).sort((a, b) => byFormat(a, b) || Number(!!b.featured) - Number(!!a.featured)).slice(0, 6), [experiences.data, xpCat]);
  const [region, setRegion] = useState<'africa' | 'world'>('africa');
  const regionCountries = (countries.data ?? []).filter(c => (region === 'africa') !== GLOBAL_REGIONS.includes(c.region));
  const dests = useCarousel();
  const founding = seedIndex.partners.filter(p => p.real);
  const stats = [
    { n: seedIndex.destinations.length, k: 'destinations' }, { n: seedIndex.experiences.length, k: 'experiences' },
    { n: seedIndex.countries.length, k: 'countries' }, { n: 5, k: 'languages' }
  ];

  return (
    <div className="page home">
      {/* 2 · Hero */}
      <div className="block" id="home">
        <Showcase cats={showcase} index={cat} onIndex={setCat} />
        <div className="lead">
          <span className="eyebrow">{t('hero.eyebrow')}</span>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.text')}</p>
          <div className="actions">
            <Link className="btn solid" to="/destinations">{t('hero.explore')} <Icon name="arrowRight" className="go" /></Link>
            <Link className="btn ghost" to="/plan"><Icon name="calendar" />{t('hero.plan')}</Link>
            <Link className="btn ghost" to="/partners"><Icon name="briefcase" />{tc('cta.becomePartner')}</Link>
          </div>
          <SmartSearch />
        </div>

        {/* 3 · Trust bar */}
        <section className="strip trust" aria-label={t('trust.label')}>
          {TRUST.map(v => (
            <div key={v.key}>
              <span className="ico"><Icon name={v.icon} /></span>
              <b>{t(`trust.${v.key}.title`)}</b>
              <span className="s">{t(`trust.${v.key}.text`)}</span>
            </div>
          ))}
        </section>
      </div>

      {/* 4 · Featured experiences */}
      <section className="block" aria-labelledby="xp-h">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{t('xp.eyebrow')}</span>
            <h2 className="sec-title" id="xp-h">{t('xp.title')}</h2>
            <p className="lede">{t('xp.text')}</p>
          </div>
          <Link className="tlink" to="/vr"><span>{t('xp.all')}</span><Icon name="arrowRight" /></Link>
        </div>
        <div className="chip-row cat-row" role="group" aria-label={t('xp.filter')}>
          <button type="button" className="toggle" aria-pressed={!xpCat} onClick={() => setXpCat(null)}>{t('xp.cat.all')}</button>
          {cats.map(c => <button key={c} type="button" className="toggle" aria-pressed={xpCat === c} onClick={() => setXpCat(xpCat === c ? null : c)}>{t(`xp.cat.${c}`)}</button>)}
        </div>
        {experiences.error ? <ErrorState error={experiences.error} onRetry={experiences.retry} /> : (
          <div className="grid3 m-swipe" aria-busy={experiences.loading} aria-live="polite">
            {experiences.data ? shownXps.map(x => <ExperienceCard key={x.id} xp={x} />) : Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        )}
      </section>

      {/* 5 · Why travellers choose us */}
      <section className="block" aria-labelledby="why-h">
        <div className="sec-head"><div><span className="eyebrow">{t('why.eyebrow')}</span><h2 className="sec-title" id="why-h">{t('why.title')}</h2></div></div>
        <div className="grid3 benefit-grid">
          {BENEFITS.map(b => (
            <div className="card about" key={b.key}><span className="ico"><Icon name={b.icon} /></span><h3>{t(`why.${b.key}.title`)}</h3><p>{t(`why.${b.key}.text`)}</p></div>
          ))}
        </div>
      </section>

      {/* 6 · How it works */}
      <section className="block" aria-labelledby="how-h">
        <div className="sec-head"><div><span className="eyebrow">{t('how.eyebrow')}</span><h2 className="sec-title" id="how-h">{t('how.title')}</h2></div></div>
        <ol className="how-steps">
          {STEPS.map((icon, i) => (
            <li key={i}>
              <span className="num" aria-hidden="true">{i + 1}</span>
              <span className="ico"><Icon name={icon} /></span>
              <h3>{t(`how.s${i + 1}.title`)}</h3>
              <p>{t(`how.s${i + 1}.text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 · Destinations */}
      <section className="block" aria-labelledby="dest-h">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{t('dest.eyebrow')}</span>
            <h2 className="sec-title" id="dest-h">{t('dest.title')}</h2>
            <p className="lede">{t('dest.text')}</p>
          </div>
          <CarouselArrows c={dests} prevLabel={tc('a11y.scrollPrev')} nextLabel={tc('a11y.scrollNext')} />
        </div>
        <div className="seg region-seg" role="radiogroup" aria-label={t('dest.region')}>
          <button type="button" role="radio" aria-checked={region === 'africa'} onClick={() => setRegion('africa')}>{t('dest.africa')}</button>
          <button type="button" role="radio" aria-checked={region === 'world'} onClick={() => setRegion('world')}>{t('dest.world')}</button>
        </div>
        {countries.error ? <ErrorState error={countries.error} onRetry={countries.retry} /> : (
          <CarouselTrack c={dests} label={t('dest.title')}>
            {countries.data
              ? regionCountries.map(c => <CountryCard key={c.id} c={c} />)
              : Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: 24 }} />)}
          </CarouselTrack>
        )}
        {region === 'world' && <p className="small muted">{t('dest.worldNote')}</p>}
        <Link className="btn solid" style={{ alignSelf: 'flex-start' }} to="/destinations">{t('hero.explore')} <Icon name="arrowRight" className="go" /></Link>
      </section>

      {/* 8 · AI planner (supporting the journey, not leading it) */}
      <section className="band" aria-labelledby="ai-h">
        <div>
          <span className="eyebrow">{t('ai.eyebrow')}</span>
          <h2 id="ai-h">{t('ai.title')}</h2>
          <p>{t('ai.text')}</p>
          <p className="quote">“{t('ai.example')}”</p>
        </div>
        <Link className="btn light" to={`/ai?q=${encodeURIComponent(t('ai.example'))}`}><Icon name="sparkles" />{t('ai.cta')}</Link>
      </section>

      {/* 9 · Partner acquisition */}
      <section className="block partner-split" aria-labelledby="partner-h">
        <div className="pic"><Media id="safari-crew" sizes="(max-width: 900px) 92vw, 600px" decorative focus="50% 40%" /></div>
        <div className="txt">
          <span className="eyebrow">{t('partners.eyebrow')}</span>
          <h2 className="sec-title" id="partner-h">{t('partners.title')}</h2>
          <p className="lede">{t('partners.text')}</p>
          <ul className="check-list">{PARTNER_BENEFITS.map(k => <li key={k}><Icon name="check" />{t(`partners.b.${k}`)}</li>)}</ul>
          <div className="chip-row">
            <Link className="btn solid" to="/partners/join"><Icon name="briefcase" />{tc('cta.becomePartner')}</Link>
            <Link className="btn ghost" to="/contact?topic=partner"><Icon name="calendar" />{t('partners.demo')}</Link>
          </div>
        </div>
      </section>

      {/* 10 · Partner types */}
      <section className="block" aria-labelledby="types-h">
        <div className="sec-head"><div><span className="eyebrow">{t('types.eyebrow')}</span><h2 className="sec-title" id="types-h">{t('types.title')}</h2></div></div>
        <div className="grid3 types-grid">
          {PARTNER_TYPES.map(p => (
            <Link key={p.key} className="card about type-card" to={p.to}>
              <span className="ico"><Icon name={p.icon} /></span>
              <h3>{t(`types.${p.key}.title`)}</h3>
              <p>{t(`types.${p.key}.text`)}</p>
              <span className="tlink"><span>{t('types.more')}</span><Icon name="arrowRight" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* 11 · Social proof: real numbers and real partners only */}
      <section className="block" aria-labelledby="proof-h">
        <div className="sec-head"><div><span className="eyebrow">{t('proof.eyebrow')}</span><h2 className="sec-title" id="proof-h">{t('proof.title')}</h2></div></div>
        <div className="stat-band">
          {stats.map(s => <div key={s.k}><b>{s.n}</b><span>{t(`proof.stat.${s.k}`)}</span></div>)}
        </div>
        {founding.length > 0 && (
          <div className="founding">
            <span className="small muted">{t('proof.founding')}</span>
            <div className="founding-row">{founding.map(p => <Link key={p.id} to={`/partner/${p.slug}`} className="founding-partner"><PartnerLogo partner={p} /><span><b>{p.name}</b><small>{seedIndex.destById.get(p.destinationIds[0] ?? '')?.name ?? ''}</small></span></Link>)}</div>
          </div>
        )}
        {TESTIMONIALS.length > 0 && (
          <div className="grid3">
            {TESTIMONIALS.map((q, i) => <figure key={i} className="card about quote-card"><blockquote>“{q.quote}”</blockquote><figcaption><b>{q.name}</b><small>{q.role}</small></figcaption></figure>)}
          </div>
        )}
        <div className="grid3 proof-grid">
          {(['licensed', 'reviews', 'payments', 'privacy'] as const).map(k => (
            <div className="panel" key={k}><h3><Icon name={k === 'privacy' ? 'shield' : k === 'payments' ? 'ticket' : k === 'reviews' ? 'star' : 'check'} width={18} height={18} /> {t(`proof.${k}.title`)}</h3><p>{t(`proof.${k}.text`)}</p></div>
          ))}
        </div>
      </section>

      {/* 12 · Vision */}
      <section className="block" id="about" aria-labelledby="vision-h">
        <div className="story">
          <blockquote id="vision-h">{t('vision.title')}</blockquote>
          <div className="text">
            <p className="lede">{t('vision.p1')}</p>
            <p className="lede">{t('vision.p2')}</p>
            <ol className="journey" aria-label={t('vision.journeyLabel')}>
              {(['discover', 'experience', 'plan', 'book', 'travel'] as const).map(s => <li key={s}>{t(`vision.journey.${s}`)}</li>)}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="block" aria-labelledby="faq-h">
        <div className="sec-head">
          <div><span className="eyebrow">{t('faq.eyebrow')}</span><h2 className="sec-title" id="faq-h">{t('faq.title')}</h2></div>
          <Link className="tlink" to="/faq"><span>{t('faq.all')}</span><Icon name="arrowRight" /></Link>
        </div>
        <div className="faq">{FAQ_KEYS.map(k => <details key={k}><summary>{t(`faq.${k}.q`)}</summary><div>{t(`faq.${k}.a`)}</div></details>)}</div>
      </section>

      {/* 13 · Final call to action */}
      <section className="band final-cta" aria-labelledby="final-h">
        <div><h2 id="final-h">{t('final.title')}</h2><p>{t('final.text')}</p></div>
        <div className="chip-row">
          <Link className="btn light" to="/destinations">{tc('cta.startExploring')}</Link>
          <Link className="btn on-media" to="/partners">{tc('cta.becomePartner')}</Link>
        </div>
      </section>

      <MobileCtaBar />
    </div>
  );
}

/** Phones: both journeys stay one tap away — travellers explore, businesses join. */
function MobileCtaBar() {
  const { t } = useTranslation();
  useEffect(() => { document.body.classList.add('has-mcta'); return () => document.body.classList.remove('has-mcta'); }, []);
  return (
    <div className="m-cta" role="region" aria-label={t('cta.quick')}>
      <Link className="btn solid" to="/destinations"><Icon name="compass" />{t('cta.exploreDestinations')}</Link>
      <Link className="btn ghost" to="/partners"><Icon name="briefcase" />{t('cta.becomePartner')}</Link>
    </div>
  );
}
