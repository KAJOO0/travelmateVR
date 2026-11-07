import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { usePageTitle } from '@/app/usePageTitle';
import { applications, type PartnerApplication } from '@/services/business';
import { usePlatform } from '@/services/platform';
import { useSession } from '@/services/account';
import { seedIndex } from '@/services/catalog';
import { countryName } from '@/lib/content';
import { useLocale } from '@/i18n/useLocale';
import type { ListingType, Partner } from '@/domain/types';
import '@/styles/pages.css';
import '@/styles/portal.css';
import { bookingOpenIn } from '@/services/payments';

const STEPS = ['business', 'services', 'contact', 'review'] as const;
type Step = (typeof STEPS)[number];
const KINDS: Partner['kind'][] = ['operator', 'lodge', 'restaurant', 'transport', 'community', 'events', 'guide'];
const SERVICES: ListingType[] = ['stay', 'safari', 'activity', 'local', 'restaurant', 'transport', 'event'];
const SPOKEN = ['English', 'Swahili', 'French', 'German', 'Italian', 'Mandarin', 'Spanish', 'Arabic', 'Portuguese', 'Greek', 'Slovene', 'Indonesian', 'Vietnamese', 'Khmer'];
// Cheap cost/abuse guard, independent of (not a substitute for) the real enforcement in
// amplify/functions/submit-partner-application/handler.ts, which is what actually makes a
// certification document mandatory server-side.
const MAX_CERT_FILE_BYTES = 10 * 1024 * 1024;
const CERT_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
type Form = Omit<PartnerApplication, 'id' | 'createdAt' | 'status' | 'certificationDocs'> & { consent: boolean; certFiles: File[] };

export default function PartnerJoinPage() {
  const { t } = useTranslation(['business', 'common', 'explore', 'trip']);
  const lang = useLocale();
  usePageTitle(t('business:join.title'));
  const user = useSession();
  const [step, setStep] = useState<Step>('business');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<PartnerApplication | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const applicationsOpen = usePlatform().flags.partnerApplications;
  // Links from a destination page prefill the country and destination (e.g. ?country=jordan&destination=petra).
  const [params] = useSearchParams();
  const preCountry = seedIndex.countries.some(c => c.id === params.get('country')) ? params.get('country')! : 'tanzania';
  const preDest = seedIndex.destinations.find(d => d.id === params.get('destination') && d.countryId === preCountry)?.id;
  const [f, setF] = useState<Form>({
    businessName: '', kind: (KINDS as string[]).includes(params.get('kind') ?? '') ? params.get('kind') as Partner['kind'] : 'operator', countryId: preCountry, area: '', destinations: preDest ? [preDest] : [], services: [], licence: '', registration: '', website: '',
    contact: { name: '', email: '', phone: '', role: '' }, languages: preCountry === 'tanzania' || preCountry === 'zanzibar' ? ['English', 'Swahili'] : ['English'], communityOwned: false, ecoCertification: '', about: '', consent: false, certFiles: []
  });
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setF(s => ({ ...s, [k]: v }));
  const toggle = (list: string[], v: string, on: boolean) => (on ? [...list, v] : list.filter(x => x !== v));
  const dests = seedIndex.destinations.filter(d => d.countryId === f.countryId);
  const errs: Record<Step, Record<string, boolean>> = {
    business: { name: f.businessName.trim().length < 2, area: f.area.trim().length < 2, destinations: !f.destinations.length },
    services: { services: !f.services.length, about: f.about.trim().length < 40 },
    contact: {
      contactName: f.contact.name.trim().length < 2, email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact.email),
      phone: !/^\+?[\d\s()-]{7,20}$/.test(f.contact.phone), website: !!f.website && !/^https:\/\/\S+\.\S+$/.test(f.website ?? ''),
      certDocs: !f.certFiles.length
    },
    review: { consent: !f.consent }
  };
  const idx = STEPS.indexOf(step);
  const stepInvalid = Object.values(errs[step]).some(Boolean);
  const err = (k: string) => touched && errs[step][k];

  const onPickFiles = (files: FileList | null) => {
    const picked = Array.from(files ?? []);
    const valid = picked.filter(file => CERT_FILE_TYPES.includes(file.type) && file.size <= MAX_CERT_FILE_BYTES);
    up('certFiles', [...f.certFiles, ...valid]);
  };
  const removeFile = (i: number) => up('certFiles', f.certFiles.filter((_, idx2) => idx2 !== i));

  const next = async () => {
    setTouched(true);
    if (stepInvalid) return;
    setTouched(false);
    if (step !== 'review') { setStep(STEPS[idx + 1]!); window.scrollTo({ top: 0 }); return; }
    setBusy(true);
    setSubmitError(null);
    try {
      const { consent: _c, certFiles, ...data } = f;
      const certificationDocs = await Promise.all(certFiles.map(file => applications.uploadCertDoc(file)));
      setDone(await applications.submit({ ...data, certificationDocs, businessName: data.businessName.trim(), about: data.about.trim() }));
    } catch {
      setSubmitError(t('business:join.submitFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return (
    <div className="page"><section className="block" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
      <div className="state"><span className="ico"><Icon name="user" /></span><h1 className="group-title">{t('business:join.signInRequired')}</h1><p>{t('business:join.signInRequiredText')}</p><Link className="btn solid sm" to={`/signin?next=${encodeURIComponent('/partners/join')}`}>{t('business:join.signInCta')}</Link></div>
    </section></div>
  );

  if (!applicationsOpen) return (
    <div className="page"><section className="block" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
      <div className="state"><span className="ico"><Icon name="clock" /></span><h1 className="group-title">{t('business:join.closedTitle')}</h1><p>{t('business:join.closedText')}</p><Link className="btn solid sm" to="/partners">{t('business:join.backToPartners')}</Link></div>
    </section></div>
  );
  if (done) return (
    <div className="page">
      <section className="block" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
        <div className="state" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
          <span className="ico"><Icon name="check" /></span>
          <h1 className="group-title">{t('business:join.doneTitle')}</h1>
          <p>{t('business:join.doneText', { id: done.id, email: done.contact.email })}</p>
          <ol className="steps" style={{ display: 'grid', gap: 6 }}>
            <li className="done"><Icon name="check" width={14} height={14} />{t('business:join.next1')}</li>
            <li className="now">{t('business:join.next2')}</li>
            <li>{t('business:join.next3')}</li>
            <li>{t('business:join.next4')}</li>
          </ol>
          <div className="chip-row"><Link className="btn solid sm" to="/partners">{t('business:join.backToPartners')}</Link><Link className="btn ghost sm" to="/business">{t('business:join.tryDemo')}</Link></div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="page">
      <section className="block" style={{ maxWidth: 900, marginInline: 'auto', width: '100%' }}>
        <div className="page-head">
          <span className="eyebrow">{t('business:landing.eyebrow')}</span>
          <h1 className="sec-title">{t('business:join.title')}</h1>
          <p className="lede">{t('business:join.text')}</p>
        </div>
        <ol className="steps" aria-label={t('business:join.progress')}>
          {STEPS.map((s, i) => <li key={s} className={i < idx ? 'done' : i === idx ? 'now' : ''} aria-current={i === idx ? 'step' : undefined}>{i < idx && <Icon name="check" width={14} height={14} />}{i + 1}. {t(`business:join.step.${s}`)}</li>)}
        </ol>
        <form className="panel" style={{ display: 'grid', gap: 16 }} noValidate onSubmit={e => { e.preventDefault(); void next(); }}>
          {step === 'business' && (
            <div className="form-grid">
              {!bookingOpenIn(f.countryId) && <div className="full"><Notice icon="globe">{t('business:join.previewCountry')}</Notice></div>}
              <label className="field full"><span>{t('business:join.businessName')}</span><input value={f.businessName} autoComplete="organization" onChange={e => up('businessName', e.target.value)} aria-invalid={err('name')} />{err('name') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
              <label className="field"><span>{t('business:listings.type')}</span><select value={f.kind} onChange={e => up('kind', e.target.value as Partner['kind'])}>{KINDS.map(k => <option key={k} value={k}>{t(`explore:partnerKind.${k}`)}</option>)}</select></label>
              <label className="field"><span>{t('explore:filters.country')}</span><select value={f.countryId} onChange={e => setF(s => ({ ...s, countryId: e.target.value, destinations: [] }))}>{seedIndex.countries.map(c => <option key={c.id} value={c.id}>{countryName(c, lang)}</option>)}</select></label>
              <label className="field full"><span>{t('business:join.area')}</span><input value={f.area} placeholder={t('business:join.areaPh')} onChange={e => up('area', e.target.value)} aria-invalid={err('area')} />{err('area') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
              <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:join.destinations')}</legend>
                <div className="checks">{dests.map(d => <label key={d.id} className="check"><input type="checkbox" checked={f.destinations.includes(d.id)} onChange={e => up('destinations', toggle(f.destinations, d.id, e.target.checked))} />{d.name}</label>)}</div>
                {err('destinations') && <span className="err">{t('business:join.errDestinations')}</span>}</fieldset>
            </div>
          )}
          {step === 'services' && (
            <div className="form-grid">
              <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('business:join.services')}</legend>
                <div className="checks">{SERVICES.map(s => <label key={s} className="check"><input type="checkbox" checked={f.services.includes(s)} onChange={e => up('services', toggle(f.services, s, e.target.checked))} />{t(`common:listingTypePlural.${s}`)}</label>)}</div>
                {err('services') && <span className="err">{t('business:join.errServices')}</span>}</fieldset>
              <fieldset className="field full" style={{ border: 0 }}><legend className="label">{t('explore:dest.languages')}</legend>
                <div className="checks">{SPOKEN.map(s => <label key={s} className="check"><input type="checkbox" checked={f.languages.includes(s)} onChange={e => up('languages', toggle(f.languages, s, e.target.checked))} />{s}</label>)}</div></fieldset>
              <label className="field full"><span>{t('business:join.about')}</span><textarea rows={5} value={f.about} onChange={e => up('about', e.target.value)} placeholder={t('business:join.aboutPh')} aria-invalid={err('about')} />{err('about') && <span className="err">{t('business:join.errAbout')}</span>}</label>
              <label className="check full"><input type="checkbox" checked={f.communityOwned} onChange={e => up('communityOwned', e.target.checked)} />{t('business:join.community')}</label>
              <label className="field full"><span>{t('business:join.eco')}</span><input value={f.ecoCertification} onChange={e => up('ecoCertification', e.target.value)} placeholder={t('business:join.ecoPh')} /></label>
            </div>
          )}
          {step === 'contact' && (
            <div className="form-grid">
              <label className="field"><span>{t('business:join.licence')}</span><input value={f.licence} onChange={e => up('licence', e.target.value)} /><span className="hint">{t('business:join.licenceHint')}</span></label>
              <label className="field"><span>{t('business:join.registration')}</span><input value={f.registration} onChange={e => up('registration', e.target.value)} /></label>
              <label className="field full"><span>{t('business:profile.website')}</span><input type="url" value={f.website} placeholder="https://" onChange={e => up('website', e.target.value)} aria-invalid={err('website')} />{err('website') && <span className="err">{t('business:profile.errWebsite')}</span>}</label>
              <label className="field"><span>{t('business:join.contactName')}</span><input value={f.contact.name} autoComplete="name" onChange={e => up('contact', { ...f.contact, name: e.target.value })} aria-invalid={err('contactName')} />{err('contactName') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
              <label className="field"><span>{t('business:join.role')}</span><input value={f.contact.role} autoComplete="organization-title" placeholder={t('business:join.rolePh')} onChange={e => up('contact', { ...f.contact, role: e.target.value })} /></label>
              <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={f.contact.email} autoComplete="email" onChange={e => up('contact', { ...f.contact, email: e.target.value })} aria-invalid={err('email')} />{err('email') && <span className="err">{t('trip:book.errEmail')}</span>}</label>
              <label className="field"><span>{t('trip:book.phone')}</span><input type="tel" value={f.contact.phone} autoComplete="tel" onChange={e => up('contact', { ...f.contact, phone: e.target.value })} aria-invalid={err('phone')} />{err('phone') && <span className="err">{t('trip:book.errPhone')}</span>}</label>
              <label className="field full"><span>{t('business:join.certDocs')}</span>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => { onPickFiles(e.target.files); e.target.value = ''; }} aria-invalid={err('certDocs')} />
                <span className="hint">{t('business:join.certDocsHint')}</span>
                {err('certDocs') && <span className="err">{t('business:join.errCertDocs')}</span>}
              </label>
              {f.certFiles.length > 0 && (
                <ul className="list full" style={{ margin: 0 }}>
                  {f.certFiles.map((file, i) => (
                    <li key={`${file.name}-${i}`} className="list-item">
                      <span className="grow">{file.name}</span>
                      <button type="button" className="btn ghost sm" onClick={() => removeFile(i)}><Icon name="close" />{t('business:join.removeFile')}</button>
                    </li>
                  ))}
                </ul>
              )}
              <Notice icon="shield">{t('business:join.docsNote')}</Notice>
            </div>
          )}
          {step === 'review' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <dl className="kv">
                <dt>{t('business:join.businessName')}</dt><dd>{f.businessName} · {t(`explore:partnerKind.${f.kind}`)}</dd>
                <dt>{t('business:join.area')}</dt><dd>{f.area} · {f.destinations.map(id => seedIndex.destById.get(id)?.name).join(', ')}</dd>
                <dt>{t('business:join.services')}</dt><dd>{f.services.map(s => t(`common:listingTypePlural.${s}`)).join(', ')}</dd>
                <dt>{t('explore:dest.languages')}</dt><dd>{f.languages.join(', ')}</dd>
                <dt>{t('business:join.contactName')}</dt><dd>{f.contact.name} · {f.contact.email} · {f.contact.phone}</dd>
                {f.licence && <><dt>{t('business:join.licence')}</dt><dd>{f.licence}</dd></>}
              </dl>
              <label className="check"><input type="checkbox" checked={f.consent} onChange={e => up('consent', e.target.checked)} aria-invalid={err('consent')} />{t('business:join.consent')}</label>
              {err('consent') && <span className="err small">{t('trip:book.errAgree')}</span>}
              <p className="small muted"><Link to="/terms">{t('common:footer.links.terms')}</Link> · <Link to="/privacy">{t('common:footer.links.privacy')}</Link></p>
              {submitError && <Notice icon="close" tone="warn">{submitError}</Notice>}
            </div>
          )}
          <div className="row-between">
            {idx > 0 ? <button type="button" className="btn ghost" onClick={() => { setTouched(false); setStep(STEPS[idx - 1]!); }}><Icon name="arrowLeft" />{t('common:actions.back')}</button> : <Link className="btn ghost" to="/partners"><Icon name="arrowLeft" />{t('common:actions.back')}</Link>}
            <button type="submit" className="btn solid" disabled={busy}>{step === 'review' ? (busy ? t('business:common.working') : t('business:join.submit')) : t('common:actions.continue')}<Icon name="arrowRight" /></button>
          </div>
        </form>
      </section>
    </div>
  );
}
