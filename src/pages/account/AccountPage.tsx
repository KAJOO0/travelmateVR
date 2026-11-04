import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Counter } from '@/components/ui/Counter';
import { Notice, StatusPill, WhatsAppButton } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { ReviewForm } from '@/features/reviews/ReviewList';
import { PartnerLogo } from '@/features/partners/PartnerLogo';
import { useWishlist } from '@/app/providers/WishlistProvider';
import { usePreferences, type ThemeMode } from '@/app/providers/PreferencesProvider';
import { useToast } from '@/app/providers/ToastProvider';
import { auth, documents, messages, profileStore, useDocuments, useMyReviews, useNotifications, useProfile, useSession, useThreads, DEFAULT_PROFILE } from '@/services/account';
import { effectiveStatus, useBookings } from '@/services/bookings';
import { tripStatus, useTrips } from '@/services/trips';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { LANGUAGES } from '@/i18n';
import { lt } from '@/lib/content';
import { SOCIAL } from '@/config/site';
import { downloadFile } from '@/lib/ics';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel } from '@/features/trips/format';
import { useNotificationText } from './NotificationsPage';
import type { BudgetLevel, InterestTag, Pace, TravelDocument } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

const NAV: { key: string; to: string; icon: IconName }[] = [
  { key: 'overview', to: '/account', icon: 'home' },
  { key: 'trips', to: '/trips', icon: 'suitcase' },
  { key: 'bookings', to: '/bookings', icon: 'ticket' },
  { key: 'wishlist', to: '/wishlist', icon: 'heart' },
  { key: 'itineraries', to: '/plan', icon: 'calendar' },
  { key: 'reviews', to: '/account/reviews', icon: 'star' },
  { key: 'messages', to: '/account/messages', icon: 'mail' },
  { key: 'notifications', to: '/notifications', icon: 'bell' },
  { key: 'documents', to: '/account/documents', icon: 'shield' },
  { key: 'preferences', to: '/account/preferences', icon: 'sparkles' },
  { key: 'security', to: '/account/security', icon: 'shield' }
];

export default function AccountPage() {
  const { section = 'overview' } = useParams();
  const { t } = useTranslation(['account', 'common']);
  usePageTitle(t(`account:nav.${section}`, { defaultValue: t('account:title') }));
  const user = useSession();
  return (
    <div className="page">
      <section className="block">
        <div className="head-row">
          <div className="page-head"><span className="eyebrow">{t('account:title')}</span><h1>{section === 'overview' ? (user ? t('account:hello', { name: user.name.split(' ')[0] }) : t('account:helloGuest')) : t(`account:nav.${section}`)}</h1></div>
          {!user && <Link className="btn solid sm" to="/signin?next=/account"><Icon name="user" />{t('common:nav.signIn')}</Link>}
        </div>
        <div className="dash">
          <nav className="dash-nav" aria-label={t('account:title')}>
            {NAV.map(n => <NavLink key={n.key} to={n.to} end className={({ isActive }) => (isActive ? 'active' : undefined)}><Icon name={n.icon} />{t(`account:nav.${n.key}`)}</NavLink>)}
          </nav>
          <div className="dash-main">
            {!user && <Notice>{t('account:guestNote')}</Notice>}
            {section === 'overview' && <Overview />}
            {section === 'preferences' && <Preferences />}
            {section === 'documents' && <Documents />}
            {section === 'reviews' && <MyReviews />}
            {section === 'messages' && <Messages />}
            {section === 'security' && <Security />}
          </div>
        </div>
      </section>
    </div>
  );
}

function Overview() {
  const { t } = useTranslation(['account', 'trip', 'common']);
  const lang = useLocale();
  const tripsList = useTrips();
  const bookingList = useBookings();
  const { items } = useWishlist();
  const reviews = useMyReviews();
  const notes = useNotifications();
  const text = useNotificationText();
  const upcoming = tripsList.filter(x => ['upcoming', 'ongoing'].includes(tripStatus(x))).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))[0];
  const daysTo = upcoming?.startDate ? Math.ceil((new Date(upcoming.startDate).getTime() - Date.now()) / 86400000) : undefined;
  const d = upcoming ? seedIndex.destById.get(upcoming.destinationIds[0] ?? '') : undefined;
  return (
    <>
      {upcoming && d ? (
        <section className="upcoming-card" aria-labelledby="up-h">
          <div className="pic"><Media id={d.media} sizes="600px" decorative /></div>
          <div className="txt">
            <span className="eyebrow">{t('account:overview.upcoming')}</span>
            <h2 id="up-h" className="group-title">{upcoming.name}</h2>
            <p style={{ color: 'var(--muted)' }}>{dateLabel(upcoming.startDate, lang, { day: 'numeric', month: 'long' })} → {dateLabel(upcoming.endDate, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {daysTo !== undefined && daysTo > 0 && <div className="countdown"><div><b>{daysTo}</b><span>{t('trip:control.days')}</span></div></div>}
            <div className="chip-row"><Link className="btn solid sm" to={`/trips/${upcoming.id}`}><Icon name="suitcase" />{t('account:overview.openControl')}</Link><Link className="btn ghost sm" to={`/plan/${upcoming.id}`}>{t('trip:control.editItinerary')}</Link></div>
          </div>
        </section>
      ) : <EmptyState icon="suitcase" title={t('trip:trips.emptyTitle')} text={t('trip:trips.emptyText')} action={<Link className="btn solid sm" to="/plan">{t('common:cta.planJourney')}</Link>} />}
      <div className="stat-row">
        <Link className="stat" to="/trips"><b>{tripsList.length}</b><span>{t('account:nav.trips')}</span></Link>
        <Link className="stat" to="/bookings"><b>{bookingList.filter(b => !['cancelled', 'refunded'].includes(effectiveStatus(b))).length}</b><span>{t('account:nav.bookings')}</span></Link>
        <Link className="stat" to="/wishlist"><b>{items.length}</b><span>{t('account:nav.wishlist')}</span></Link>
        <Link className="stat" to="/account/reviews"><b>{reviews.length}</b><span>{t('account:nav.reviews')}</span></Link>
      </div>
      <section className="section" aria-labelledby="rn-h">
        <div className="row-between"><h2 id="rn-h">{t('account:overview.recent')}</h2><Link className="tlink" to="/notifications"><span>{t('account:overview.allNotifications')}</span><Icon name="arrowRight" /></Link></div>
        <ul className="list">{notes.slice(0, 3).map(n => { const tx = text(n); return <li key={n.id} className={`list-item${n.read ? '' : ' unread'}`}><span className="grow"><b>{tx.title}</b><small>{tx.body}</small></span>{n.href && <Link className="btn ghost sm" to={n.href}>{t('trip:control.view')}</Link>}</li>; })}</ul>
      </section>
    </>
  );
}

const INTERESTS: InterestTag[] = ['wildlife', 'beach', 'culture', 'mountain', 'adventure', 'luxury', 'family', 'eco', 'lake', 'city', 'landscape'];
const ACCESS = ['stepFree', 'lowMobility', 'visual', 'hearing', 'dietary'];

function Preferences() {
  const { t, i18n } = useTranslation(['account', 'common', 'trip']);
  const toast = useToast();
  const { theme, setTheme } = usePreferences();
  const saved = useProfile();
  const [p, setP] = useState(saved);
  useEffect(() => setP(saved), [saved]);
  const up = (patch: Partial<typeof p>) => setP(x => ({ ...x, ...patch }));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  return (
    <form className="panel" style={{ display: 'grid', gap: 20 }} onSubmit={e => { e.preventDefault(); profileStore.set({ ...p, setAt: new Date().toISOString() }); toast.show({ icon: 'check', text: t('account:prefs.saved') }); }}>
      <p style={{ color: 'var(--muted)' }}>{t('account:prefs.intro')}</p>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="label" style={{ marginBottom: 8 }}>{t('account:prefs.interests')}</legend>
        <div className="chip-row">{INTERESTS.map(i => <button key={i} type="button" className="toggle" aria-pressed={p.interests.includes(i)} onClick={() => up({ interests: toggle(p.interests, i) })}>{t(`common:tags.${i}`)}</button>)}</div>
      </fieldset>
      <div className="form-grid">
        <label className="field"><span>{t('account:prefs.budget')}</span>
          <select value={p.budgetLevel ?? ''} onChange={e => up({ budgetLevel: (e.target.value || undefined) as BudgetLevel | undefined })}>
            <option value="">{t('account:prefs.noPreference')}</option>
            {(['value', 'comfort', 'luxury'] as const).map(b => <option key={b} value={b}>{t(`trip:tier.${b}`)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t('account:prefs.style')}</span>
          <select value={p.travelStyle ?? ''} onChange={e => up({ travelStyle: (e.target.value || undefined) as typeof p.travelStyle })}>
            <option value="">{t('account:prefs.noPreference')}</option>
            {(['independent', 'guided', 'mixed'] as const).map(s => <option key={s} value={s}>{t(`account:prefs.styles.${s}`)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t('account:prefs.adventure')}: {p.adventure}/5</span><input type="range" min={1} max={5} value={p.adventure} onChange={e => up({ adventure: Number(e.target.value) })} style={{ accentColor: 'var(--accent)' }} /></label>
        <label className="field"><span>{t('account:prefs.luxury')}: {p.luxury}/5</span><input type="range" min={1} max={5} value={p.luxury} onChange={e => up({ luxury: Number(e.target.value) })} style={{ accentColor: 'var(--accent)' }} /></label>
        <div className="field"><span>{t('trip:travellers.adults')}</span><Counter value={p.adults} min={1} max={20} onChange={n => up({ adults: n })} label={t('trip:travellers.adults')} /></div>
        <div className="field"><span>{t('trip:travellers.children')}</span><Counter value={p.children} min={0} max={10} onChange={n => up({ children: n })} label={t('trip:travellers.children')} /></div>
        <label className="field"><span>{t('account:prefs.pace')}</span>
          <select value={p.pace} onChange={e => up({ pace: e.target.value as Pace })}>{(['relaxed', 'balanced', 'packed'] as const).map(x => <option key={x} value={x}>{t(`account:prefs.paces.${x}`)}</option>)}</select>
        </label>
        <label className="field"><span>{t('account:prefs.destinations')}</span>
          <select multiple size={4} value={p.preferredDestinations} onChange={e => up({ preferredDestinations: [...e.target.selectedOptions].map(o => o.value) })}>
            {seedIndex.destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="label" style={{ marginBottom: 8 }}>{t('account:prefs.accessibility')}</legend>
        <div className="chip-row">{ACCESS.map(a => <button key={a} type="button" className="toggle" aria-pressed={p.accessibility.includes(a)} onClick={() => up({ accessibility: toggle(p.accessibility, a) })}>{t(`account:prefs.access.${a}`)}</button>)}</div>
      </fieldset>
      <label className="check"><input type="checkbox" checked={p.sustainabilityFirst} onChange={e => up({ sustainabilityFirst: e.target.checked })} />{t('account:prefs.sustainability')}</label>
      <label className="check"><input type="checkbox" checked={p.consentPersonalisation} onChange={e => up({ consentPersonalisation: e.target.checked })} /><span>{t('account:prefs.consent')}<br /><small style={{ color: 'var(--muted)' }}>{t('account:prefs.consentHint')}</small></span></label>
      <hr style={{ border: 0, borderTop: '1px solid var(--panel-line)', width: '100%' }} />
      <div className="form-grid">
        <label className="field"><span>{t('common:prefs.language')}</span>
          <select value={i18n.resolvedLanguage} onChange={e => void i18n.changeLanguage(e.target.value)}>{LANGUAGES.map(l => <option key={l.code} value={l.code} lang={l.code}>{l.native}</option>)}</select>
        </label>
        <label className="field"><span>{t('common:prefs.display')}</span>
          <select value={theme} onChange={e => setTheme(e.target.value as ThemeMode)}>{(['dark', 'light', 'system'] as const).map(x => <option key={x} value={x}>{t(`common:prefs.theme.${x}`)}</option>)}</select>
        </label>
      </div>
      <div className="row-between"><button type="button" className="btn ghost sm" onClick={() => setP({ ...DEFAULT_PROFILE })}>{t('account:prefs.reset')}</button><button type="submit" className="btn solid">{t('common:actions.save')}</button></div>
    </form>
  );
}

const DOC_TYPES: TravelDocument['type'][] = ['passport', 'visa', 'ticket', 'insurance', 'vaccination', 'other'];

function Documents() {
  const { t } = useTranslation(['account', 'common']);
  const lang = useLocale();
  const docs = useDocuments();
  const bookingList = useBookings();
  const tripsList = useTrips();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'passport' as TravelDocument['type'], label: '', numberHint: '', expiresOn: '', tripId: '' });
  const file = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const soon = (iso?: string) => iso && (new Date(iso).getTime() - Date.now()) / 86400000 < 180;
  const save = () => {
    setTouched(true);
    if (form.label.trim().length < 2) return;
    documents.add({ type: form.type, label: form.label.trim(), numberHint: form.numberHint.trim().slice(-4) || undefined, expiresOn: form.expiresOn || undefined, tripId: form.tripId || undefined }, file.current?.files?.[0]);
    setOpen(false); setTouched(false);
    setForm({ type: 'passport', label: '', numberHint: '', expiresOn: '', tripId: '' });
  };
  return (
    <>
      <Notice icon="shield">{t('account:docs.security')}</Notice>
      <div className="row-between"><h2 className="group-title">{t('account:docs.yours')}</h2><button type="button" className="btn solid sm" onClick={() => setOpen(true)}>+ {t('account:docs.add')}</button></div>
      {docs.length ? (
        <ul className="list">{docs.map(d => (
          <li key={d.id} className="list-item">
            <span className="ico"><Icon name={d.type === 'passport' || d.type === 'visa' ? 'globe' : d.type === 'insurance' ? 'shield' : 'ticket'} /></span>
            <span className="grow"><b>{d.label}</b><small>{t(`account:docs.type.${d.type}`)}{d.numberHint ? ` · •••• ${d.numberHint}` : ''}{d.expiresOn ? ` · ${t('account:docs.expires', { date: dateLabel(d.expiresOn, lang, { day: 'numeric', month: 'short', year: 'numeric' }) })}` : ''}{d.fileName ? ` · ${d.fileName}` : ''}</small>{soon(d.expiresOn) && <small style={{ color: 'var(--warning)' }}>{t('account:docs.expiringSoon')}</small>}</span>
            <span className="actions">
              {documents.fileFor(d.id) && <button type="button" className="btn ghost sm" onClick={() => { const f = documents.fileFor(d.id)!; window.open(URL.createObjectURL(f), '_blank', 'noopener'); }}>{t('account:docs.open')}</button>}
              <button type="button" className="icon-btn" aria-label={t('account:docs.remove', { name: d.label })} onClick={() => documents.remove(d.id)}><Icon name="close" /></button>
            </span>
          </li>
        ))}</ul>
      ) : <EmptyState icon="shield" title={t('account:docs.emptyTitle')} text={t('account:docs.emptyText')} />}
      <h2 className="group-title">{t('account:docs.confirmations')}</h2>
      <ul className="list">{bookingList.map(b => { const l = seedIndex.listingById.get(b.listingId); return <li key={b.id} className="list-item"><span className="ico"><Icon name="ticket" /></span><span className="grow"><b>{l ? lt(l.title, lang) : b.id}</b><small>{b.id} · {dateLabel(b.date, lang)}</small></span><span className="actions"><StatusPill status={effectiveStatus(b)} /><Link className="btn ghost sm" to={`/bookings/${b.id}`}>{t('account:docs.open')}</Link></span></li>; })}</ul>
      {open && (
        <Modal title={t('account:docs.add')} onClose={() => setOpen(false)}>
          <div className="form-grid">
            <label className="field"><span>{t('account:docs.typeLabel')}</span><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TravelDocument['type'] }))}>{DOC_TYPES.map(x => <option key={x} value={x}>{t(`account:docs.type.${x}`)}</option>)}</select></label>
            <label className="field"><span>{t('account:docs.label')}</span><input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder={t('account:docs.labelPh')} aria-invalid={touched && form.label.trim().length < 2} /></label>
            <label className="field"><span>{t('account:docs.last4')}</span><input value={form.numberHint} maxLength={4} onChange={e => setForm(f => ({ ...f, numberHint: e.target.value.replace(/\s/g, '') }))} autoComplete="off" /><span className="hint">{t('account:docs.last4Hint')}</span></label>
            <label className="field"><span>{t('account:docs.expiry')}</span><input type="date" value={form.expiresOn} onChange={e => setForm(f => ({ ...f, expiresOn: e.target.value }))} /></label>
            <label className="field full"><span>{t('account:docs.trip')}</span><select value={form.tripId} onChange={e => setForm(f => ({ ...f, tripId: e.target.value }))}><option value="">{t('account:docs.noTrip')}</option>{tripsList.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label className="field full"><span>{t('account:docs.file')}</span><input ref={file} type="file" accept="application/pdf,image/*" /><span className="hint">{t('account:docs.fileHint')}</span></label>
          </div>
          <div className="row-between"><button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>{t('common:actions.cancel')}</button><button type="button" className="btn solid sm" onClick={save}>{t('common:actions.save')}</button></div>
        </Modal>
      )}
    </>
  );
}

function MyReviews() {
  const { t } = useTranslation(['account', 'common']);
  const lang = useLocale();
  const mine = useMyReviews();
  const bookingList = useBookings();
  const [writing, setWriting] = useState<{ bookingId: string; listingId: string; name: string } | null>(null);
  const awaiting = bookingList.filter(b => effectiveStatus(b) === 'completed' && !b.reviewId);
  return (
    <>
      {awaiting.length > 0 && (
        <section className="section"><h2 className="group-title">{t('account:reviews.awaiting')}</h2>
          <ul className="list">{awaiting.map(b => { const l = seedIndex.listingById.get(b.listingId)!; const name = lt(l.title, lang); return <li key={b.id} className="list-item"><span className="thumb"><Media id={l.media[0]!} sizes="84px" decorative /></span><span className="grow"><b>{name}</b><small>{dateLabel(b.date, lang)}</small></span><button type="button" className="btn solid sm" onClick={() => setWriting({ bookingId: b.id, listingId: l.id, name })}>{t('account:reviews.write')}</button></li>; })}</ul>
        </section>
      )}
      <section className="section"><h2 className="group-title">{t('account:reviews.yours')}</h2>
        {mine.length ? <div className="reviews">{mine.map(r => { const l = seedIndex.listingById.get(r.targetId); return <article key={r.id} className="review"><header><b>{'★'.repeat(r.rating)}</b><h4>{r.title}</h4>{r.verifiedBooking && <span className="badge verified"><Icon name="shield" />{t('common:badges.verifiedBooking')}</span>}</header><p>{r.text}</p><small>{l ? <Link to={`/listing/${l.slug}`}>{lt(l.title, lang)}</Link> : ''} · {dateLabel(r.date, lang)} · {r.status === 'approved' ? t('account:reviews.published') : r.status === 'rejected' ? t('account:reviews.rejected') : t('account:reviews.pendingModeration')}</small></article>; })}</div>
          : <EmptyState icon="star" title={t('account:reviews.noneTitle')} text={t('account:reviews.noneText')} />}
      </section>
      {writing && <ReviewForm bookingId={writing.bookingId} targetId={writing.listingId} name={writing.name} onClose={() => setWriting(null)} />}
    </>
  );
}

function Messages() {
  const { t } = useTranslation(['account', 'common']);
  const lang = useLocale();
  const threads = useThreads();
  const [params, setParams] = useSearchParams();
  // Phones show the list or one conversation (like a chat app); wider screens show both side by side.
  const openId = params.get('thread');
  const active = threads.find(x => x.id === openId) ?? (openId ? undefined : threads[0]);
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sorted = useMemo(() => [...threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [threads]);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [active?.id, active?.messages.length]);
  // Phones: bring the opened conversation to the top of the screen so the message box is in view.
  useEffect(() => { if (openId && matchMedia('(max-width: 760px)').matches) logRef.current?.closest('.msg-chat')?.scrollIntoView({ block: 'start' }); }, [openId]);
  // Grow the message box with its content, up to a few lines.
  useEffect(() => { const el = inputRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }, [text]);
  const partner = active ? seedIndex.partnerById.get(active.partnerId) : undefined;
  const msgText = (m: { from: string; text: string }) => (m.from === 'system' ? t(`account:${m.text}`) : m.text);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : lang, { hour: '2-digit', minute: '2-digit' });
  const send = () => {
    const clean = text.replace(/\s+$/, '').slice(0, 2000);
    if (!active || !clean.trim()) return;
    messages.send(active.id, clean);
    setText('');
    inputRef.current?.focus();
  };

  if (!threads.length) return <EmptyState icon="mail" title={t('account:messages.emptyTitle')} text={t('account:messages.emptyText')} action={<Link className="btn solid sm" to="/marketplace">{t('account:bookings.browse')}</Link>} />;
  return (
    <div className={`msg-layout${openId ? ' has-open' : ''}`}>
      <ul className="msg-list" aria-label={t('account:messages.conversations')}>
        {sorted.map(th => {
          const p = seedIndex.partnerById.get(th.partnerId);
          if (!p) return null;
          const last = th.messages[th.messages.length - 1];
          return (
            <li key={th.id}>
              <button type="button" className={`msg-thread${th.id === active?.id ? ' on' : ''}`} aria-current={th.id === active?.id ? 'true' : undefined} onClick={() => setParams({ thread: th.id })}>
                <PartnerLogo partner={p} />
                <span className="grow">
                  <span className="row"><b>{p.name}</b><small>{dateLabel(th.updatedAt, lang)}</small></span>
                  <small className="preview">{last ? `${last.from === 'me' ? `${t('account:messages.you')}: ` : ''}${msgText(last)}` : ''}</small>
                  {th.bookingId && <small className="ref">{th.bookingId}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {active && partner ? (
        <section className="msg-chat" aria-label={partner.name}>
          <header className="msg-head">
            <button type="button" className="icon-btn msg-back" onClick={() => setParams({})} aria-label={t('account:messages.back')}><Icon name="arrowLeft" /></button>
            <PartnerLogo partner={partner} />
            <span className="grow"><b>{partner.name}</b>{active.bookingId && <small>{t('account:messages.booking', { id: active.bookingId })}</small>}</span>
            <WhatsAppButton className="btn ghost sm msg-wa" message={t('account:messages.whatsapp', { partner: partner.name })} />
          </header>
          <div className="msg-log" ref={logRef} aria-live="polite">
            {active.messages.map((m, i) => (
              m.from === 'system'
                ? <p key={i} className="msg-system">{msgText(m)}</p>
                : (
                  <div key={i} className={`msg-bubble ${m.from === 'me' ? 'me' : 'them'}`}>
                    <span>{m.text}</span>
                    <time dateTime={m.at}>{time(m.at)}</time>
                  </div>
                )
            ))}
          </div>
          <form className="msg-compose" onSubmit={e => { e.preventDefault(); send(); }}>
            <label className="sr" htmlFor="msg">{t('account:messages.write')}</label>
            <textarea
              id="msg" ref={inputRef} rows={1} value={text} maxLength={2000} placeholder={t('account:messages.write')}
              onChange={e => setText(e.target.value)}
              // Enter sends on a keyboard; on phones the return key adds a new line and the button sends.
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); } }}
            />
            <button type="submit" className="btn solid msg-send" disabled={!text.trim()} aria-label={t('account:messages.send')}><Icon name="arrowUp" /></button>
          </form>
          <p className="msg-note">{t('account:messages.note')} {SOCIAL.instagram.url && <a href={SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer">Instagram</a>} · {SOCIAL.x.url && <a href={SOCIAL.x.url} target="_blank" rel="noopener noreferrer">X</a>}</p>
        </section>
      ) : (
        <div className="msg-chat msg-empty"><p className="muted">{t('account:messages.pick')}</p></div>
      )}
    </div>
  );
}

function Security() {
  const { t } = useTranslation(['account', 'common']);
  const navigate = useNavigate();
  const user = useSession();
  const toast = useToast();
  const profile = useProfile();
  const [confirm, setConfirm] = useState(false);
  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (k.startsWith('tm.')) { try { data[k] = JSON.parse(localStorage.getItem(k)!); } catch { data[k] = localStorage.getItem(k); } } }
    downloadFile('travelmatevr-my-data.json', JSON.stringify(data, null, 2), 'application/json');
  };
  const devices = useMemo(() => [{ name: navigator.userAgent.includes('Mobile') ? t('account:security.thisPhone') : t('account:security.thisBrowser'), current: true }], [t]);
  return (
    <>
      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        <h2 className="group-title">{t('account:security.signin')}</h2>
        {user ? <p>{t('account:security.signedInAs', { email: user.email, provider: user.provider === 'google' ? 'Google' : t('account:security.emailPassword') })}</p> : <p>{t('account:security.notSignedIn')}</p>}
        <ul className="trust-list">
          <li><Icon name="shield" />{t('account:security.p1')}</li>
          <li><Icon name="shield" />{t('account:security.p2')}</li>
          <li><Icon name="shield" />{t('account:security.p3')}</li>
        </ul>
        <div className="chip-row">
          {user ? <button type="button" className="btn ghost sm" onClick={() => { auth.signOut(); toast.show({ icon: 'check', text: t('account:security.signedOut') }); navigate('/'); }}>{t('account:security.signOut')}</button> : <Link className="btn solid sm" to="/signin">{t('common:nav.signIn')}</Link>}
        </div>
      </section>
      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        <h2 className="group-title">{t('account:security.devices')}</h2>
        <ul className="list">{devices.map((d, i) => <li key={i} className="list-item"><span className="ico"><Icon name="monitor" /></span><span className="grow"><b>{d.name}</b><small>{t('account:security.current')}</small></span></li>)}</ul>
      </section>
      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        <h2 className="group-title">{t('account:security.privacy')}</h2>
        <label className="check"><input type="checkbox" checked={profile.consentPersonalisation} onChange={e => profileStore.set(p => ({ ...p, consentPersonalisation: e.target.checked }))} />{t('account:prefs.consent')}</label>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('account:security.privacyText')}</p>
        <div className="chip-row">
          <button type="button" className="btn ghost sm" onClick={exportData}><Icon name="download" />{t('account:security.export')}</button>
          <button type="button" className="btn ghost sm" onClick={() => setConfirm(true)}><Icon name="close" />{t('account:security.erase')}</button>
          <Link className="btn ghost sm" to="/privacy">{t('common:footer.links.privacy')}</Link>
        </div>
      </section>
      {confirm && (
        <Modal title={t('account:security.erase')} onClose={() => setConfirm(false)}>
          <p>{t('account:security.eraseText')}</p>
          <div className="row-between"><button type="button" className="btn ghost sm" onClick={() => setConfirm(false)}>{t('common:actions.cancel')}</button>
            <button type="button" className="btn solid sm" onClick={async () => { await auth.signOut(); Object.keys(localStorage).filter(k => k.startsWith('tm.') && k !== 'tm.lang' && k !== 'tm.theme').forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); window.location.href = '/'; }}>{t('account:security.eraseConfirm')}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
