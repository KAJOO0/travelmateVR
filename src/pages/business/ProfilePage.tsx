import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { S3Image } from '@/components/ui/S3Image';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT, useFmt, usePartnerListings } from '@/features/portal/shared';
import { storefrontStore, useStorefront, partnerProfile, type PartnerSocialLinks } from '@/services/business';
import { LANGUAGES } from '@/i18n';
import { ltp } from '@/lib/content';
import type { Locale, MediaId } from '@/domain/types';

const SOCIAL_PLATFORMS: (keyof PartnerSocialLinks)[] = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'website', 'linktree'];
/** An S3 key (profile-media/{identity}/...) vs. a seed-data manifest id — the two need
 *  different renderers (S3Image vs Media; see src/lib/media.ts, which can't resolve an
 *  uploaded file at all). */
const isS3Key = (v: string | undefined): v is string => !!v?.startsWith('profile-media/');

const SPOKEN = ['English', 'Swahili', 'French', 'German', 'Italian', 'Mandarin', 'Spanish', 'Arabic'];

/** Brand and storefront: what travellers see on the partner's public page. */
export default function BusinessProfilePage() {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const { partner } = usePartnerOrg();
  const listings = usePartnerListings(partner.id);
  const saved = useStorefront()[partner.id] ?? {};
  const [lang, setLang] = useState<Locale>(f.lang as Locale);
  const pick = (l: Locale) => ({
    tagline: (saved.tagline as Record<string, string> | undefined)?.[l] ?? '',
    description: (partner.description as Record<string, string | undefined>)[l] ?? ''
  });
  const [text, setText] = useState(() => pick(lang));
  const [cover, setCover] = useState<MediaId>(partner.cover);
  const [languages, setLanguages] = useState(partner.languages);
  const [responseHours, setResponseHours] = useState(partner.responseHours ?? 24);
  const [phone, setPhone] = useState(saved.phone ?? '');
  const [website, setWebsite] = useState(saved.website ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [social, setSocial] = useState<PartnerSocialLinks>(partner.social ?? {});
  const [savingPublic, setSavingPublic] = useState(false);
  const covers = [...new Set([partner.cover, ...listings.flatMap(l => l.media)])];
  const webErr = !!website && !/^https:\/\/[^\s]+\.[^\s]+$/.test(website);
  const phoneErr = !!phone && !/^\+?[\d\s()-]{7,20}$/.test(phone);
  const socialErr = (v: string) => !!v && !/^https:\/\/[^\s]+\.[^\s]+$/.test(v);

  const save = async () => {
    if (webErr || phoneErr || SOCIAL_PLATFORMS.some(k => socialErr(social[k] ?? ''))) return;
    storefrontStore.set(all => {
      const prev = all[partner.id] ?? {};
      return {
        ...all, [partner.id]: {
          ...prev,
          tagline: text.tagline.trim() ? { ...prev.tagline, [lang]: text.tagline.trim() } : prev.tagline,
          description: text.description.trim() ? { ...prev.description, [lang]: text.description.trim() } : prev.description,
          cover, languages, responseHours, phone: phone.trim() || undefined, website: website.trim() || undefined, updatedAt: new Date().toISOString()
        }
      };
    });
    // Separate from the local overlay above: this is the real, publicly-visible write (logo,
    // cover, social). Fails gracefully for today's demo/seed partner accounts, which have no
    // real backend Partner row yet — the local save above still succeeds either way.
    if (logoFile || coverFile || SOCIAL_PLATFORMS.some(k => social[k])) {
      setSavingPublic(true);
      try {
        const logo = logoFile ? await partnerProfile.uploadLogo(logoFile) : undefined;
        const newCover = coverFile ? await partnerProfile.uploadCover(coverFile) : undefined;
        await partnerProfile.save(partner.id, { logo, cover: newCover, social });
        setLogoFile(null); setCoverFile(null);
      } catch {
        toast.show({ icon: 'close', text: t('business:profile.publicSaveFailed') });
        setSavingPublic(false);
        return;
      }
      setSavingPublic(false);
    }
    toast.show({ icon: 'check', text: t('business:profile.saved') });
  };

  return (
    <>
      <PortalHead title={t('business:nav.profile')} text={t('business:profile.text')}
        actions={<Link className="btn ghost sm" to={`/partner/${partner.slug}`}><Icon name="external" />{t('business:shell.viewStorefront')}</Link>} />
      <div className="p-split">
        <form className="panel" style={{ display: 'grid', gap: 16 }} onSubmit={e => { e.preventDefault(); void save(); }}>
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <h2>{t('business:profile.brand')}</h2>
            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><span>{t('business:listing.editLang')}</span>
              <select value={lang} onChange={e => { const l = e.target.value as Locale; setLang(l); setText(pick(l)); }}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select></label>
          </div>
          <label className="field"><span>{t('business:profile.tagline')}</span><input value={text.tagline} maxLength={100} placeholder={t('business:profile.taglinePh')} onChange={e => setText(s => ({ ...s, tagline: e.target.value }))} /></label>
          <label className="field"><span>{t('business:profile.about')}</span><textarea rows={5} value={text.description} placeholder={partner.description.en} onChange={e => setText(s => ({ ...s, description: e.target.value }))} /></label>
          <label className="field"><span>{t('business:profile.logo')}</span>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
            <span className="hint">{t('business:profile.logoHint')}</span>
          </label>
          <fieldset className="field" style={{ border: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>{t('business:profile.cover')}</legend>
            <div className="chip-row">{covers.map(m => (
              <button key={m} type="button" onClick={() => { setCover(m); setCoverFile(null); }} aria-pressed={!coverFile && cover === m} aria-label={t('business:profile.useCover')}
                style={{ position: 'relative', width: 120, height: 76, borderRadius: 12, overflow: 'hidden', padding: 0, border: !coverFile && cover === m ? '3px solid var(--accent-bright)' : '1px solid var(--panel-line)', cursor: 'pointer', background: 'none' }}>
                <Media id={m} sizes="120px" decorative />
              </button>
            ))}</div>
            <span className="hint">{t('business:profile.coverUploadHint')}</span>
            <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
          </fieldset>
          <fieldset className="field" style={{ border: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>{t('business:profile.social')}</legend>
            <div className="form-grid">
              {SOCIAL_PLATFORMS.map(k => (
                <label key={k} className="field"><span>{t(`business:profile.socialLabel.${k}`)}</span>
                  <input type="url" value={social[k] ?? ''} placeholder="https://" onChange={e => setSocial(s => ({ ...s, [k]: e.target.value }))} aria-invalid={socialErr(social[k] ?? '')} />
                  {socialErr(social[k] ?? '') && <span className="err">{t('business:profile.errWebsite')}</span>}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field" style={{ border: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>{t('explore:dest.languages')}</legend>
            <div className="checks">{SPOKEN.map(s => <label key={s} className="check"><input type="checkbox" checked={languages.includes(s)} onChange={e => setLanguages(e.target.checked ? [...languages, s] : languages.filter(x => x !== s))} />{s}</label>)}</div>
          </fieldset>
          <div className="form-grid">
            <label className="field"><span>{t('explore:partner.responseTime')}</span>
              <select value={responseHours} onChange={e => setResponseHours(Number(e.target.value))}>{[1, 2, 4, 8, 12, 24, 48].map(h => <option key={h} value={h}>{t('explore:partner.response', { count: h })}</option>)}</select></label>
            <label className="field"><span>{t('business:profile.phone')}</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} aria-invalid={phoneErr} placeholder="+255 …" />{phoneErr && <span className="err">{t('trip:book.errPhone')}</span>}</label>
            <label className="field full"><span>{t('business:profile.website')}</span><input type="url" value={website} onChange={e => setWebsite(e.target.value)} aria-invalid={webErr} placeholder="https://" />{webErr && <span className="err">{t('business:profile.errWebsite')}</span>}</label>
          </div>
          <Notice icon="info">{t('business:profile.verifiedNote')}</Notice>
          <button type="submit" className="btn solid" disabled={savingPublic} style={{ justifySelf: 'start' }}><Icon name="check" />{savingPublic ? t('business:common.working') : t('business:profile.publish')}</button>
        </form>
        <aside className="p-section" aria-label={t('business:profile.preview')}>
          <h2>{t('business:profile.preview')}</h2>
          <article className="card">
            <div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
              {coverFile
                ? <img src={URL.createObjectURL(coverFile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : isS3Key(cover)
                  ? <S3Image s3Key={cover} alt="" className="media-img" fallback={<Media id={partner.cover} sizes="420px" decorative />} />
                  : <Media id={cover} sizes="420px" decorative />}
            </div>
            <div style={{ padding: 18, display: 'grid', gap: 6 }}>
              <h3 style={{ fontSize: 'var(--fs-h3)' }}>{partner.name}</h3>
              {(text.tagline || ltp(saved.tagline, lang)) && <p style={{ fontWeight: 600 }}>{text.tagline || ltp(saved.tagline, lang)}</p>}
              <p className="muted small">{text.description || partner.description.en}</p>
              <small className="muted">{languages.join(' · ')} · {t('explore:partner.response', { count: responseHours })}</small>
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}
