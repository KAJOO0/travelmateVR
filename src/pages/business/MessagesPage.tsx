import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { usePartnerThreads } from '@/features/portal/threads';
import { countryLabel, PortalHead, useBizT, useFmt } from '@/features/portal/shared';
import { partnerInbox } from '@/services/business';

const QUICK = ['quick.thanks', 'quick.availability', 'quick.details'];

export default function BusinessMessagesPage() {
  const { t } = useBizT();
  const f = useFmt();
  const { partner } = usePartnerOrg();
  const { threads, isUnread } = usePartnerThreads(partner.id);
  const [activeId, setActiveId] = useState<string | null>(threads[0]?.id ?? null);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const active = threads.find(x => x.id === activeId) ?? threads[0];

  useEffect(() => { if (active) partnerInbox.markRead(active.id); }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [active?.messages.length]);

  const send = (msg: string) => {
    if (!active || !msg.trim()) return;
    partnerInbox.reply(active.id, msg.trim());
    setText('');
  };
  const who = (g: string) => g || t('business:messages.traveller');

  return (
    <>
      <PortalHead title={t('business:nav.messages')} text={t('business:messages.text')} />
      {threads.length ? (
        <div className="inbox">
          <ul className="inbox-list" aria-label={t('business:messages.list')}>
            {threads.map(th => {
              const last = th.messages[th.messages.length - 1];
              return (
                <li key={th.id}>
                  <button type="button" className={isUnread(th) ? 'unread' : ''} aria-current={active?.id === th.id} onClick={() => setActiveId(th.id)}>
                    <b>{who(th.guest)}</b>
                    <small>{last ? (last.from === 'system' ? t(`account:${last.text}`) : last.text) : ''}</small>
                    <small>{f.dt(th.updatedAt)}{th.country ? ` · ${countryLabel(th.country, f.lang)}` : ''}</small>
                  </button>
                </li>
              );
            })}
          </ul>
          {active && (
            <section className="panel" style={{ display: 'grid', gap: 12 }} aria-label={who(active.guest)}>
              <div className="row-between"><h2>{who(active.guest)}</h2>{active.sample && <span className="sample-tag">{t('business:sample.label')}</span>}</div>
              <div className="thread" aria-live="polite">
                {active.messages.map((m, i) => (
                  <div key={i} className={`msg ${m.from === 'me' ? 'guest' : m.from}`}>
                    {m.from === 'system' ? t(`account:${m.text}`) : m.text}
                    {m.from !== 'system' && <small>{f.dt(m.at)}</small>}
                  </div>
                ))}
                <div ref={end} />
              </div>
              <div className="chip-row">{QUICK.map(k => <button key={k} type="button" className="chip-btn" onClick={() => setText(t(`business:messages.${k}`, { partner: partner.name }))}><Icon name="sparkles" />{t(`business:messages.${k}Label`)}</button>)}</div>
              <form className="composer" style={{ position: 'static', boxShadow: 'none' }} onSubmit={e => { e.preventDefault(); send(text); }}>
                <label className="sr" htmlFor="reply">{t('business:messages.reply')}</label>
                <textarea id="reply" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder={t('business:messages.reply')} />
                <button type="submit" className="btn solid sm" disabled={!text.trim()} aria-label={t('account:messages.send')}><Icon name="arrowUp" /></button>
              </form>
              <Notice icon="shield">{t('business:messages.safety')}</Notice>
            </section>
          )}
        </div>
      ) : <EmptyState icon="mail" title={t('business:messages.emptyTitle')} text={t('business:messages.emptyText')} />}
    </>
  );
}
