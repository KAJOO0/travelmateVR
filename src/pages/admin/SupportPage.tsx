import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT } from '@/features/portal/admin';
import { supportAdmin, useSupportQueue } from '@/services/admin';
import type { TicketStatus } from '@/domain/types';

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const MACROS = ['received', 'refund', 'dates'];

export default function AdminSupportPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const { write } = useAdmin('support');
  const queue = useSupportQueue();
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const shown = queue.filter(x => filter === 'all' || (x.status !== 'resolved' && x.status !== 'closed'));
  const [activeId, setActiveId] = useState<string | null>(shown[0]?.id ?? null);
  const active = queue.find(x => x.id === activeId) ?? shown[0];
  const [text, setText] = useState('');
  const [next, setNext] = useState<TicketStatus>('waiting');

  return (
    <>
      <PortalHead title={t('admin:nav.support')} text={t('admin:support.text')} />
      <ReadOnly show={!write} />
      <div className="tabs" role="tablist" aria-label={t('admin:nav.support')}>
        {(['active', 'all'] as const).map(k => <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{t(`admin:support.tab.${k}`)} ({k === 'all' ? queue.length : queue.filter(x => x.status !== 'resolved' && x.status !== 'closed').length})</button>)}
      </div>
      {shown.length ? (
        <div className="inbox">
          <ul className="inbox-list" aria-label={t('admin:support.queue')}>
            {shown.map(x => (
              <li key={x.id}><button type="button" aria-current={active?.id === x.id} onClick={() => setActiveId(x.id)}>
                <b>{x.subject}</b><small>{x.customer} · {x.id}</small>
                <small><span className={`status ${x.status === 'open' ? 'pending' : x.status === 'resolved' || x.status === 'closed' ? 'paid' : 'confirmed'}`} style={{ padding: '1px 8px' }}>{t(`common:status.${x.status}`)}</span> {x.priority === 'high' ? ` · ${t('admin:support.high')}` : ''} · {f.dt(x.createdAt)}</small>
              </button></li>
            ))}
          </ul>
          {active && (
            <section className="panel" style={{ display: 'grid', gap: 12 }} aria-label={active.subject}>
              <div className="row-between" style={{ flexWrap: 'wrap' }}>
                <div><h2>{active.subject}</h2><small className="muted">{active.customer}{active.email ? ` · ${active.email}` : ''} · {t(`account:ticket.topic.${active.topic}`)}{active.bookingId ? ` · ${active.bookingId}` : ''}</small></div>
                {write && <select className="input" aria-label={t('business:bookings.status')} value={active.status} onChange={e => { supportAdmin.setStatus(active.id, e.target.value as TicketStatus); toast.show({ icon: 'check', text: t('admin:support.statusSaved') }); }}>{STATUSES.map(s => <option key={s} value={s}>{t(`common:status.${s}`)}</option>)}</select>}
              </div>
              <div className="thread">
                {active.messages.map((m, i) => (
                  <div key={i} className={`msg ${m.from === 'me' ? 'guest' : 'partner'}`}>
                    {m.from === 'support' && m.text === 'ticket.autoAck' ? t('account:ticket.autoAck') : m.text}<small>{f.dt(m.at)}</small>
                  </div>
                ))}
              </div>
              {write && active.status !== 'closed' && (
                <form style={{ display: 'grid', gap: 8 }} onSubmit={e => { e.preventDefault(); if (!text.trim()) return; supportAdmin.reply(active.id, text.trim(), next); setText(''); toast.show({ icon: 'mail', text: t('admin:support.sent') }); }}>
                  <div className="chip-row">{MACROS.map(k => <button key={k} type="button" className="chip-btn" onClick={() => setText(t(`admin:support.macro.${k}`, { name: active.customer.split(' ')[0] }))}><Icon name="sparkles" />{t(`admin:support.macro.${k}Label`)}</button>)}</div>
                  <label className="field"><span>{t('business:messages.reply')}</span><textarea rows={3} value={text} onChange={e => setText(e.target.value)} /></label>
                  <div className="inline-form">
                    <label className="field" style={{ maxWidth: 260 }}><span>{t('admin:support.afterReply')}</span><select value={next} onChange={e => setNext(e.target.value as TicketStatus)}>{STATUSES.map(s => <option key={s} value={s}>{t(`common:status.${s}`)}</option>)}</select></label>
                    <button type="submit" className="btn solid" disabled={!text.trim()}><Icon name="mail" />{t('admin:support.send')}</button>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>
      ) : <EmptyState icon="help" title={t('admin:support.emptyTitle')} text={t('admin:support.emptyText')} />}
    </>
  );
}
