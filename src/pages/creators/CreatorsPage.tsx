import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { usePageTitle } from '@/app/usePageTitle';
import { useLocale } from '@/i18n/useLocale';
import { countryName } from '@/lib/content';
import { money, num } from '@/lib/format';
import { formatOf } from '@/lib/immersive';
import { seedIndex } from '@/services/catalog';
import { usePlatform } from '@/services/platform';
import { AUDIENCE_SIZES, CREATOR_TYPES, creatorApplications, wantedCaptures, type AudienceSize, type CaptureFormat, type CreatorApplication, type CreatorType } from '@/services/creators';
import { SITE, whatsappLink } from '@/config/site';
import { GLOBAL_REGIONS } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';
import '@/styles/portal.css';

const TYPE_ICON: Record<CreatorType, IconName> = { vlogger: 'video360', filmmaker: 'view360', photographer: 'eye', drone: 'compass', operator: 'briefcase' };
const GETS: { k: string; icon: IconName }[] = [
  { k: 'share', icon: 'ticket' }, { k: 'credit', icon: 'star' }, { k: 'featured', icon: 'sparkles' },
  { k: 'insights', icon: 'barChart' }, { k: 'support', icon: 'users' }, { k: 'global', icon: 'globe' }
];
const SPEC = ['s1', 's2', 's3', 's4', 's5', 's6'];
const FAQ = ['rights', 'consent', 'payout', 'attribution', 'drones', 'operators'];
const EXAMPLE_VIEWS = 50_000;

/** Earnings terms come from the platform settings (draft until the creator agreement). */
function useTerms() {
  const { creators } = usePlatform();
  const lang = useLocale();
  const p = {
    share: Math.round(creators.subscriptionShareRate * 1000) / 10,
    perK: money(creators.perThousandViewsUsd, lang, 'USD', { maximumFractionDigits: 2 }),
    seconds: creators.qualifiedViewSeconds,
    views: num(EXAMPLE_VIEWS, lang),
    earn: money((EXAMPLE_VIEWS / 1000) * creators.perThousandViewsUsd, lang)
  };
  return { p };
}

/** Public creator programme page: revenue share, who it is for, capture guidelines and wanted places. */
export default function CreatorsPage() {
  const { t } = useTranslation(['pages', 'common', 'explore']);
  const lang = useLocale();
  usePageTitle(t('pages:creators.title'));
  const terms = useTerms();
  const [params] = useSearchParams();
  const focusDest = seedIndex.destById.get(params.get('dest') ?? '');
  const wanted = useMemo(() => wantedCaptures(), []);
  const wantedXps = focusDest ? [...wanted.experiences].sort((a, b) => Number(b.destinationId === focusDest.id) - Number(a.destinationId === focusDest.id)) : wanted.experiences;
  const videoCount = seedIndex.experiences.filter(e => formatOf(e) === 'video').length;
  const applyHref = focusDest ? `/creators/apply?dest=${focusDest.id}` : '/creators/apply';

  return (
    <div className="page">
      <section className="block">
        <div className="detail-hero" style={{ minHeight: 'clamp(320px, 38vw, 460px)' }}>
          <Media id="santorini-oia" sizes="1240px" priority decorative focus="50% 45%" />
          <div className="txt">
            <span className="eyebrow" style={{ color: 'var(--on-media-muted)' }}>{t('pages:creators.eyebrow')}</span>
            <h1>{t('pages:creators.title')}</h1>
            <p>{t('pages:creators.lede', terms.p)}</p>
            <div className="chip-row" style={{ marginTop: 8 }}>
              <Link className="btn light" to={applyHref}><Icon name="plus" />{t('pages:creators.apply')}</Link>
              <Link className="btn on-media" to="/vr?format=video"><Icon name="video360" />{t('pages:creators.watch', { count: videoCount })}</Link>
            </div>
          </div>
        </div>
      </section>

      {focusDest && (
        <Notice icon="pin">{t('pages:creators.focus', { name: focusDest.name })} <Link to={applyHref}>{t('pages:creators.apply')}</Link></Notice>
      )}

      <section className="block" aria-labelledby="cr-share">
        <div className="share-grid">
          <div className="panel share-card">
            <span className="eyebrow">{t('pages:creators.shareEyebrow')}</span>
            <div className="earn-row">
              <p><span className="big" id="cr-share">{terms.p.perK}</span><span>{t('pages:creators.viewsText', terms.p)}</span></p>
              <p><span className="big">{t('pages:creators.shareBig', terms.p)}</span><span>{t('pages:creators.shareText', terms.p)}</span></p>
            </div>
            <p className="example"><Icon name="eye" />{t('pages:creators.example', terms.p)}</p>
            <p className="small muted">{t('pages:creators.draftTerms')}</p>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <h2 className="sec-title">{t('pages:creators.whoTitle')}</h2>
            <ul className="who-list">
              {CREATOR_TYPES.map(k => (
                <li key={k}><span className="ico"><Icon name={TYPE_ICON[k]} /></span><span><b>{t(`pages:creators.type.${k}`)}</b><small>{t(`pages:creators.typeText.${k}`)}</small></span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="cr-get">
        <h2 className="sec-title" id="cr-get">{t('pages:creators.getTitle')}</h2>
        <div className="grid3 m-swipe m-swipe-narrow">
          {GETS.map(g => (
            <div className="card about" key={g.k}><span className="ico"><Icon name={g.icon} /></span><h3>{t(`pages:creators.get.${g.k}.t`)}</h3><p>{t(`pages:creators.get.${g.k}.d`, terms.p)}</p></div>
          ))}
        </div>
      </section>

      <section className="block" aria-labelledby="cr-how">
        <h2 className="sec-title" id="cr-how">{t('pages:creators.howTitle')}</h2>
        <ol className="grid3" style={{ listStyle: 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {['s1', 's2', 's3', 's4', 's5'].map((s, i) => (
            <li className="panel" key={s} style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <span className="ico" aria-hidden="true" style={{ fontWeight: 700 }}>{i + 1}</span>
              <h3>{t(`pages:creators.steps.${s}.t`)}</h3><p className="muted">{t(`pages:creators.steps.${s}.d`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="block" aria-labelledby="cr-wanted">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{t('pages:creators.wantedEyebrow')}</span>
            <h2 className="sec-title" id="cr-wanted">{t('pages:creators.wantedTitle')}</h2>
            <p className="lede">{t('pages:creators.wantedText', { count: wanted.experiences.length + wanted.destinations.length })}</p>
          </div>
        </div>
        <div className="grid3 m-swipe">{wantedXps.slice(0, 6).map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
        {wanted.destinations.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            <h3>{t('pages:creators.wantedDestinations')}</h3>
            <div className="chip-row">
              {wanted.destinations.map(d => {
                const c = seedIndex.countries.find(x => x.id === d.countryId);
                return <Link key={d.id} className="toggle" to={`/creators/apply?dest=${d.id}`}><Icon name="pin" />{d.name}{c && countryName(c, lang) !== d.name ? ` · ${countryName(c, lang)}` : ''}</Link>;
              })}
            </div>
          </div>
        )}
      </section>

      <section className="block" aria-labelledby="cr-spec">
        <h2 className="sec-title" id="cr-spec">{t('pages:creators.specTitle')}</h2>
        <div className="info-grid">
          <div className="panel"><h3><Icon name="video360" width={18} height={18} /> {t('pages:creators.specVideo')}</h3><ul className="facts" style={{ marginTop: 8 }}>{SPEC.map(k => <li key={k}><Icon name="check" />{t(`pages:creators.spec.${k}`)}</li>)}</ul></div>
          <div className="panel"><h3><Icon name="view360" width={18} height={18} /> {t('pages:creators.specPhoto')}</h3><ul className="facts" style={{ marginTop: 8 }}>{['p1', 'p2', 'p3', 'p4'].map(k => <li key={k}><Icon name="check" />{t(`pages:creators.specP.${k}`)}</li>)}</ul></div>
        </div>
      </section>

      <section className="block" aria-labelledby="cr-faq">
        <h2 className="sec-title" id="cr-faq">{t('pages:creators.faqTitle')}</h2>
        <div className="faq">
          {FAQ.map(k => (
            <details key={k}><summary>{t(`pages:creators.faq.${k}.q`)}</summary><div>{t(`pages:creators.faq.${k}.a`, terms.p)}</div></details>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="band">
          <div><h2>{t('pages:creators.ctaTitle')}</h2><p>{t('pages:creators.ctaText', { email: SITE.email })}</p></div>
          <div className="chip-row">
            <Link className="btn light" to={applyHref}>{t('pages:creators.apply')}</Link>
            <a className="btn on-media" href={whatsappLink(t('pages:creators.whatsapp'))} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />{t('common:cta.whatsapp')}</a>
          </div>
        </div>
      </section>
    </div>
  );
}

type Form = Omit<CreatorApplication, 'id' | 'createdAt' | 'status' | 'links'> & { links: string };
const HTTPS = /^https:\/\/\S+\.\S+$/;

/** Creator application form (public). */
export function CreatorApplyPage() {
  const { t } = useTranslation(['pages', 'common', 'explore', 'trip']);
  usePageTitle(t('pages:creators.applyTitle'));
  const terms = useTerms();
  const open = usePlatform().flags.creatorApplications;
  const [params] = useSearchParams();
  const pre = seedIndex.destById.get(params.get('dest') ?? '');
  const [f, setF] = useState<Form>({
    name: '', email: '', type: 'vlogger', base: '', destinations: pre ? [pre.id] : [], otherPlaces: '', formats: ['video'], links: '',
    audience: 'lt10k', gear: '', languages: ['English'], about: '', rightsConfirmed: false
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<CreatorApplication | null>(null);
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setF(s => ({ ...s, [k]: v }));
  const toggle = <T extends string>(list: T[], v: T, on: boolean) => (on ? [...list, v] : list.filter(x => x !== v));
  const links = f.links.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  const errs = {
    name: f.name.trim().length < 2,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email),
    base: f.base.trim().length < 2,
    places: !f.destinations.length && f.otherPlaces.trim().length < 3,
    formats: !f.formats.length,
    links: !links.length || links.some(l => !HTTPS.test(l)),
    about: f.about.trim().length < 40,
    rights: !f.rightsConfirmed
  };
  const invalid = Object.values(errs).some(Boolean);
  const err = (k: keyof typeof errs) => touched && errs[k];
  const groups = useMemo(() => [
    { key: 'africa', countries: seedIndex.countries.filter(c => !GLOBAL_REGIONS.includes(c.region)) },
    ...GLOBAL_REGIONS.map(r => ({ key: r, countries: seedIndex.countries.filter(c => c.region === r) }))
  ], []);

  const submit = async () => {
    setTouched(true);
    if (invalid) { document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    setBusy(true);
    const { links: _l, ...rest } = f;
    setDone(await creatorApplications.submit({ ...rest, name: f.name.trim(), base: f.base.trim(), about: f.about.trim(), otherPlaces: f.otherPlaces.trim(), gear: f.gear.trim(), links }));
    setBusy(false);
    window.scrollTo({ top: 0 });
  };

  if (!open) return (
    <div className="page"><section className="block" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
      <div className="state"><span className="ico"><Icon name="clock" /></span><h1 className="group-title">{t('pages:creators.closedTitle')}</h1><p>{t('pages:creators.closedText', { email: SITE.email })}</p><Link className="btn solid sm" to="/creators">{t('pages:creators.back')}</Link></div>
    </section></div>
  );
  if (done) return (
    <div className="page"><section className="block" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
      <div className="state" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
        <span className="ico"><Icon name="check" /></span>
        <h1 className="group-title">{t('pages:creators.doneTitle')}</h1>
        <p>{t('pages:creators.doneText', { id: done.id, email: done.email })}</p>
        <ol className="steps" style={{ display: 'grid', gap: 6 }}>
          <li className="done"><Icon name="check" width={14} height={14} />{t('pages:creators.steps.s1.t')}</li>
          <li className="now">{t('pages:creators.steps.s2.t')}</li>
          <li>{t('pages:creators.steps.s3.t')}</li>
          <li>{t('pages:creators.steps.s4.t')}</li>
          <li>{t('pages:creators.steps.s5.t')}</li>
        </ol>
        <div className="chip-row"><Link className="btn solid sm" to="/vr?format=video">{t('pages:creators.watch', { count: seedIndex.experiences.filter(e => formatOf(e) === 'video').length })}</Link><Link className="btn ghost sm" to="/creators">{t('pages:creators.back')}</Link></div>
      </div>
    </section></div>
  );

  return (
    <div className="page">
      <section className="block" style={{ maxWidth: 900, marginInline: 'auto', width: '100%' }}>
        <div className="page-head">
          <span className="eyebrow">{t('pages:creators.eyebrow')}</span>
          <h1 className="sec-title">{t('pages:creators.applyTitle')}</h1>
          <p className="lede">{t('pages:creators.applyText', terms.p)}</p>
        </div>
        <form className="panel" style={{ display: 'grid', gap: 18 }} noValidate onSubmit={e => { e.preventDefault(); void submit(); }}>
          <h2 className="group-title">{t('pages:creators.form.you')}</h2>
          <div className="form-grid">
            <label className="field"><span>{t('pages:creators.form.name')}</span><input value={f.name} autoComplete="name" onChange={e => up('name', e.target.value)} aria-invalid={err('name')} />{err('name') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
            <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={f.email} autoComplete="email" onChange={e => up('email', e.target.value)} aria-invalid={err('email')} />{err('email') && <span className="err">{t('trip:book.errEmail')}</span>}</label>
            <label className="field"><span>{t('pages:creators.form.type')}</span><select value={f.type} onChange={e => up('type', e.target.value as CreatorType)}>{CREATOR_TYPES.map(k => <option key={k} value={k}>{t(`pages:creators.type.${k}`)}</option>)}</select></label>
            <label className="field"><span>{t('pages:creators.form.base')}</span><input value={f.base} placeholder={t('pages:creators.form.basePh')} autoComplete="address-level2" onChange={e => up('base', e.target.value)} aria-invalid={err('base')} />{err('base') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
          </div>

          <h2 className="group-title">{t('pages:creators.form.places')}</h2>
          <fieldset className="field" style={{ border: 0 }}>
            <legend className="label">{t('pages:creators.form.destinations')}</legend>
            <div style={{ display: 'grid', gap: 12 }}>
              {groups.map(g => (
                <div key={g.key} style={{ display: 'grid', gap: 6 }}>
                  <small className="muted">{g.key === 'africa' ? t('pages:creators.form.africa') : t(`explore:region.${g.key}`)}</small>
                  <div className="checks">
                    {seedIndex.destinations.filter(d => g.countries.some(c => c.id === d.countryId)).map(d => (
                      <label key={d.id} className="check"><input type="checkbox" checked={f.destinations.includes(d.id)} onChange={e => up('destinations', toggle(f.destinations, d.id, e.target.checked))} />{d.name}</label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
          <label className="field"><span>{t('pages:creators.form.other')}</span><input value={f.otherPlaces} placeholder={t('pages:creators.form.otherPh')} onChange={e => up('otherPlaces', e.target.value)} aria-invalid={err('places')} />{err('places') ? <span className="err">{t('pages:creators.form.errPlaces')}</span> : <span className="hint">{t('pages:creators.form.otherHint')}</span>}</label>

          <h2 className="group-title">{t('pages:creators.form.work')}</h2>
          <div className="form-grid">
            <fieldset className="field full" style={{ border: 0 }}>
              <legend className="label">{t('pages:creators.form.formats')}</legend>
              <div className="checks">
                {(['video', 'photo360'] as CaptureFormat[]).map(k => <label key={k} className="check"><input type="checkbox" checked={f.formats.includes(k)} onChange={e => up('formats', toggle(f.formats, k, e.target.checked))} />{t(`explore:vr.formatLabel.${k}`)}</label>)}
              </div>
              {err('formats') && <span className="err">{t('pages:creators.form.errFormats')}</span>}
            </fieldset>
            <label className="field full"><span>{t('pages:creators.form.links')}</span><textarea rows={2} value={f.links} placeholder="https://youtube.com/@…  https://instagram.com/…" onChange={e => up('links', e.target.value)} aria-invalid={err('links')} />{err('links') ? <span className="err">{t('pages:creators.form.errLinks')}</span> : <span className="hint">{t('pages:creators.form.linksHint')}</span>}</label>
            <label className="field"><span>{t('pages:creators.form.audience')}</span><select value={f.audience} onChange={e => up('audience', e.target.value as AudienceSize)}>{AUDIENCE_SIZES.map(k => <option key={k} value={k}>{t(`pages:creators.audience.${k}`)}</option>)}</select></label>
            <label className="field"><span>{t('pages:creators.form.gear')}</span><input value={f.gear} placeholder={t('pages:creators.form.gearPh')} onChange={e => up('gear', e.target.value)} /></label>
            <fieldset className="field full" style={{ border: 0 }}>
              <legend className="label">{t('explore:dest.languages')}</legend>
              <div className="checks">{['English', 'French', 'German', 'Italian', 'Mandarin', 'Swahili', 'Arabic', 'Spanish', 'Portuguese', 'Indonesian'].map(l => <label key={l} className="check"><input type="checkbox" checked={f.languages.includes(l)} onChange={e => up('languages', toggle(f.languages, l, e.target.checked))} />{l}</label>)}</div>
            </fieldset>
            <label className="field full"><span>{t('pages:creators.form.about')}</span><textarea rows={5} value={f.about} placeholder={t('pages:creators.form.aboutPh')} onChange={e => up('about', e.target.value)} aria-invalid={err('about')} />{err('about') && <span className="err">{t('pages:creators.form.errAbout')}</span>}</label>
          </div>

          <Notice icon="ticket">{t('pages:creators.form.termsNote', terms.p)}</Notice>
          <label className="check"><input type="checkbox" checked={f.rightsConfirmed} onChange={e => up('rightsConfirmed', e.target.checked)} aria-invalid={err('rights')} />{t('pages:creators.form.rights')}</label>
          {err('rights') && <span className="err small">{t('trip:book.errAgree')}</span>}
          <p className="small muted"><Link to="/terms">{t('common:footer.links.terms')}</Link> · <Link to="/privacy">{t('common:footer.links.privacy')}</Link> · <a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
          <div className="row-between">
            <Link className="btn ghost" to="/creators"><Icon name="arrowLeft" />{t('common:actions.back')}</Link>
            <button type="submit" className="btn solid" disabled={busy}>{busy ? t('pages:creators.form.sending') : t('pages:creators.form.submit')}<Icon name="arrowRight" /></button>
          </div>
        </form>
      </section>
    </div>
  );
}
