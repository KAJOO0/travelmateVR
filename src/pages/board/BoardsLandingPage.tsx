import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { usePageTitle } from '@/app/usePageTitle';
import { support } from '@/services/account';
import '@/styles/home.css';
import '@/styles/pages.css';
import '@/styles/portal.css';

const CAPS: { k: string; icon: IconName }[] = [
  { k: 'content', icon: 'layers' }, { k: 'campaigns', icon: 'ticketStar' }, { k: 'interest', icon: 'users' },
  { k: 'attractions', icon: 'view360' }, { k: 'partners', icon: 'briefcase' }, { k: 'sustainability', icon: 'leaf' }
];
const ORG_TYPES = ['board', 'dmo', 'government', 'park', 'conservation'];

/** Public page for tourism boards, DMOs, parks and conservation organisations. */
export default function BoardsLandingPage() {
  const { t } = useTranslation(['board', 'business', 'common', 'trip']);
  usePageTitle(t('board:landing.title'));
  const [f, setF] = useState({ org: '', type: 'board', name: '', email: '', message: '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const errs = { org: f.org.trim().length < 2, name: f.name.trim().length < 2, email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) };

  const submit = async () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    const tk = await support.open({ topic: 'partner', subject: `${t('board:landing.subject')}: ${f.org.trim()}`, message: `${t(`board:landing.types.${f.type}`)} · ${f.name} <${f.email}>\n\n${f.message}` });
    setBusy(false);
    setSent(tk.id);
  };

  return (
    <div className="page">
      <section className="block">
        <div className="detail-hero" style={{ minHeight: 'clamp(300px, 36vw, 440px)' }}>
          <Media id="ngorongoro" sizes="1240px" priority decorative />
          <div className="txt">
            <span className="eyebrow" style={{ color: 'var(--on-media-muted)' }}>{t('board:landing.eyebrow')}</span>
            <h1>{t('board:landing.title')}</h1>
            <p>{t('board:landing.lede')}</p>
            <div className="chip-row" style={{ marginTop: 8 }}>
              <a className="btn light" href="#contact"><Icon name="mail" />{t('board:landing.requestDemo')}</a>
              <Link className="btn on-media" to="/board"><Icon name="briefcase" />{t('board:landing.openDemo')}</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="block" aria-labelledby="bl-for">
        <h2 className="sec-title" id="bl-for">{t('board:landing.forTitle')}</h2>
        <p className="lede">{t('board:landing.forText')}</p>
        <div className="grid3">
          {CAPS.map(c => <div className="card about" key={c.k}><span className="ico"><Icon name={c.icon} /></span><h3>{t(`board:landing.caps.${c.k}.t`)}</h3><p>{t(`board:landing.caps.${c.k}.d`)}</p></div>)}
        </div>
      </section>
      <section className="block" id="contact" aria-labelledby="bl-c" style={{ maxWidth: 820, marginInline: 'auto', width: '100%' }}>
        <h2 className="sec-title" id="bl-c">{t('board:landing.contactTitle')}</h2>
        {sent ? (
          <Notice tone="ok" icon="check">{t('board:landing.sent', { id: sent })} <Link to={`/help/tickets/${sent}`}>{t('board:landing.track')}</Link></Notice>
        ) : (
          <form className="panel" style={{ display: 'grid', gap: 14 }} noValidate onSubmit={e => { e.preventDefault(); void submit(); }}>
            <div className="form-grid">
              <label className="field"><span>{t('board:landing.org')}</span><input value={f.org} autoComplete="organization" onChange={e => setF({ ...f, org: e.target.value })} aria-invalid={touched && errs.org} />{touched && errs.org && <span className="err">{t('trip:book.errRequired')}</span>}</label>
              <label className="field"><span>{t('board:landing.type')}</span><select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{ORG_TYPES.map(o => <option key={o} value={o}>{t(`board:landing.types.${o}`)}</option>)}</select></label>
              <label className="field"><span>{t('business:join.contactName')}</span><input value={f.name} autoComplete="name" onChange={e => setF({ ...f, name: e.target.value })} aria-invalid={touched && errs.name} />{touched && errs.name && <span className="err">{t('trip:book.errRequired')}</span>}</label>
              <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={f.email} autoComplete="email" onChange={e => setF({ ...f, email: e.target.value })} aria-invalid={touched && errs.email} />{touched && errs.email && <span className="err">{t('trip:book.errEmail')}</span>}</label>
              <label className="field full"><span>{t('board:landing.message')}</span><textarea rows={4} value={f.message} placeholder={t('board:landing.messagePh')} onChange={e => setF({ ...f, message: e.target.value })} /></label>
            </div>
            <button type="submit" className="btn solid" style={{ justifySelf: 'start' }} disabled={busy}>{busy ? t('business:common.working') : t('board:landing.send')}</button>
          </form>
        )}
      </section>
    </div>
  );
}
