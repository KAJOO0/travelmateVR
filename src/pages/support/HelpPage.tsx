import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Notice, StatusPill, WhatsAppButton } from '@/components/ui/bits';
import { EmptyState, NotFoundState } from '@/components/ui/States';
import { support, useTickets } from '@/services/account';
import { useBookings } from '@/services/bookings';
import { useLocale } from '@/i18n/useLocale';
import { SITE } from '@/config/site';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel } from '@/features/trips/format';
import type { SupportTicket } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

const TOPICS = ['booking', 'payment', 'cancel', 'vr', 'ai', 'account', 'partners', 'safety'] as const;
const FAQ_COUNT = 3;

export default function HelpPage() {
  const { t } = useTranslation(['account', 'common']);
  usePageTitle(t('account:help.title'));
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const tickets = useTickets();
  const faqs = useMemo(() => TOPICS.flatMap(topic => Array.from({ length: FAQ_COUNT }, (_, i) => ({ topic, q: t(`account:faq.${topic}.q${i + 1}`), a: t(`account:faq.${topic}.a${i + 1}`) }))), [t]);
  const filtered = q.trim() ? faqs.filter(f => `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase())) : faqs;

  return (
    <div className="page">
      <section className="block">
        <div className="page-head" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className="eyebrow">{t('common:nav.help')}</span>
          <h1>{t('account:help.title')}</h1>
          <p className="lede">{t('account:help.text')}</p>
        </div>
        <div className="smart" style={{ margin: '0 auto' }}>
          <form role="search" onSubmit={e => e.preventDefault()}>
            <Icon name="search" />
            <label className="sr" htmlFor="faq-q">{t('account:help.search')}</label>
            <input id="faq-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('account:help.search')} />
          </form>
        </div>
        <div className="grid3">
          <Link className="panel" to="/ai" style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 8 }}><span className="ico"><Icon name="sparkles" /></span><h3>{t('account:help.ai')}</h3><p>{t('account:help.aiText')}</p></Link>
          <a className="panel" href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(t('account:help.waMessage'))}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 8 }}><span className="ico"><Icon name="whatsapp" /></span><h3>{t('account:help.whatsapp')}</h3><p>{SITE.whatsappDisplay}</p></a>
          <a className="panel" href="#ticket" style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 8 }}><span className="ico"><Icon name="help" /></span><h3>{t('account:help.human')}</h3><p>{t('account:help.humanText', { email: SITE.email, phone: SITE.supportPhoneDisplay })}</p></a>
        </div>
      </section>

      <section className="block" aria-labelledby="faq-h">
        <h2 className="sec-title" id="faq-h">{t('account:help.faq')}</h2>
        {filtered.length ? TOPICS.filter(tp => filtered.some(f => f.topic === tp)).map(tp => (
          <div key={tp} className="group" style={{ display: 'grid', gap: 10 }}>
            <h3 className="group-title">{t(`account:faq.${tp}.title`)}</h3>
            <div className="faq">{filtered.filter(f => f.topic === tp).map((f, i) => <details key={i}><summary>{f.q}</summary><div>{f.a}</div></details>)}</div>
          </div>
        )) : <EmptyState icon="help" title={t('account:help.noResults')} text={t('account:help.noResultsText')} />}
      </section>

      <section className="block" id="ticket" aria-labelledby="tk-h">
        <h2 className="sec-title" id="tk-h">{t('account:help.contact')}</h2>
        <TicketForm defaultBooking={params.get('booking') ?? ''} />
        {tickets.length > 0 && (
          <div className="group" style={{ display: 'grid', gap: 10 }}>
            <h3 className="group-title">{t('account:help.yourTickets')}</h3>
            <TicketList tickets={tickets} />
          </div>
        )}
      </section>
    </div>
  );
}

function TicketList({ tickets }: { tickets: SupportTicket[] }) {
  const { t } = useTranslation('account');
  const lang = useLocale();
  return <ul className="list">{tickets.map(tk => <li key={tk.id} className="list-item"><span className="grow"><b>{tk.subject}</b><small>{tk.id} · {t(`account:ticket.topic.${tk.topic}`)} · {dateLabel(tk.createdAt, lang)}</small></span><span className="actions"><StatusPill status={tk.status} /><Link className="btn ghost sm" to={`/help/tickets/${tk.id}`}>{t('account:help.open')}</Link></span></li>)}</ul>;
}

export function TicketForm({ defaultBooking = '', defaultTopic = 'booking' as SupportTicket['topic'] }) {
  const { t } = useTranslation(['account', 'common']);
  const navigate = useNavigate();
  const bookingList = useBookings();
  const [topic, setTopic] = useState<SupportTicket['topic']>(defaultBooking ? 'booking' : defaultTopic);
  const [bookingId, setBookingId] = useState(defaultBooking);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const valid = subject.trim().length >= 4 && message.trim().length >= 15;
  return (
    <form className="panel" style={{ display: 'grid', gap: 14 }} onSubmit={async e => {
      e.preventDefault(); setTouched(true);
      if (!valid) return;
      setBusy(true);
      const tk = await support.open({ subject: subject.trim(), topic, bookingId: bookingId || undefined, message: message.trim() });
      navigate(`/help/tickets/${tk.id}`);
    }}>
      <div className="form-grid">
        <label className="field"><span>{t('account:ticket.topicLabel')}</span><select value={topic} onChange={e => setTopic(e.target.value as SupportTicket['topic'])}>{(['booking', 'payment', 'trip', 'account', 'partner', 'other'] as const).map(x => <option key={x} value={x}>{t(`account:ticket.topic.${x}`)}</option>)}</select></label>
        <label className="field"><span>{t('account:ticket.booking')}</span><select value={bookingId} onChange={e => setBookingId(e.target.value)}><option value="">{t('account:ticket.noBooking')}</option>{bookingList.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}</select></label>
        <label className="field full"><span>{t('account:ticket.subject')}</span><input value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} aria-invalid={touched && subject.trim().length < 4} /></label>
        <label className="field full"><span>{t('account:ticket.message')}</span><textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={3000} aria-invalid={touched && message.trim().length < 15} />{touched && message.trim().length < 15 && <span className="err">{t('account:ticket.errMessage')}</span>}</label>
      </div>
      <div className="row-between" style={{ flexWrap: 'wrap' }}><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('account:ticket.response')}</span><button type="submit" className="btn solid" disabled={busy}>{busy ? t('account:ticket.sending') : t('account:ticket.send')}</button></div>
    </form>
  );
}

export function TicketPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation(['account', 'common']);
  const lang = useLocale();
  const tk = useTickets().find(x => x.id === id);
  const [reply, setReply] = useState('');
  usePageTitle(tk ? `${tk.id} · ${tk.subject}` : t('account:ticket.notFound'));
  if (!tk) return <div className="page"><NotFoundState title={t('account:ticket.notFound')} to="/help" label={t('account:help.title')} /></div>;
  return (
    <div className="page">
      <section className="block" style={{ maxWidth: 820, width: '100%', marginInline: 'auto' }}>
        <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/help">{t('account:help.title')}</Link></li><li aria-current="page">{tk.id}</li></ol></nav>
        <div className="page-head"><h1>{tk.subject}</h1><div className="chip-row"><StatusPill status={tk.status} /><span className="badge">{t(`account:ticket.topic.${tk.topic}`)}</span>{tk.bookingId && <Link className="badge" to={`/bookings/${tk.bookingId}`}>{tk.bookingId}</Link>}</div></div>
        <div style={{ display: 'grid', gap: 10 }}>
          {tk.messages.map((m, i) => <div key={i} className={`bubble ${m.from === 'me' ? 'me' : 'ai'}`} style={{ width: 'auto' }}>{m.from === 'support' && <div className="who"><Icon name="help" />{t('account:ticket.team')}</div>}{m.from === 'support' && m.text === 'ticket.autoAck' ? t('account:ticket.autoAck') : m.text}<div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{dateLabel(m.at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>)}
        </div>
        {tk.status !== 'closed' ? (
          <form className="composer" style={{ position: 'static' }} onSubmit={e => { e.preventDefault(); if (reply.trim()) { support.reply(tk.id, reply.trim()); setReply(''); } }}>
            <label className="sr" htmlFor="reply">{t('account:ticket.reply')}</label>
            <textarea id="reply" rows={1} value={reply} onChange={e => setReply(e.target.value)} placeholder={t('account:ticket.reply')} />
            <button type="submit" className="btn solid sm" aria-label={t('account:messages.send')}><Icon name="arrowUp" /></button>
          </form>
        ) : <Notice>{t('account:ticket.closed')}</Notice>}
        <div className="chip-row">
          {tk.status !== 'closed' && <button type="button" className="btn ghost sm" onClick={() => support.close(tk.id)}>{t('account:ticket.close')}</button>}
          <WhatsAppButton message={t('account:ticket.whatsapp', { id: tk.id })} />
        </div>
      </section>
    </div>
  );
}

export function ContactPage() {
  const { t } = useTranslation(['account', 'common']);
  const [params] = useSearchParams();
  const topic = (['booking', 'payment', 'trip', 'account', 'partner', 'other'] as const).find(x => x === params.get('topic')) ?? 'other';
  usePageTitle(t('account:contact.title'));
  return (
    <div className="page">
      <section className="block">
        <div className="page-head"><span className="eyebrow">{t('common:footer.links.contact')}</span><h1>{t('account:contact.title')}</h1><p className="lede">{t('account:contact.text')}</p></div>
        <div className="grid3">
          <a className="panel" href={`mailto:${SITE.email}`} style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 6 }}><span className="ico"><Icon name="mail" /></span><h3>{t('account:contact.email')}</h3><p>{SITE.email}</p></a>
          <a className="panel" href={`tel:${SITE.supportPhone}`} style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 6 }}><span className="ico"><Icon name="phone" /></span><h3>{t('account:contact.phone')}</h3><p>{SITE.supportPhoneDisplay}</p></a>
          <a className="panel" href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 6 }}><span className="ico"><Icon name="whatsapp" /></span><h3>WhatsApp</h3><p>{SITE.whatsappDisplay}</p></a>
        </div>
        <div className="panel"><h3>{t('account:contact.office')}</h3><p>{SITE.company}<br />{SITE.address.line1}, {SITE.address.city}, {SITE.address.country}</p></div>
        <h2 className="group-title">{t('account:contact.write')}</h2>
        <TicketForm defaultTopic={topic} />
      </section>
    </div>
  );
}
