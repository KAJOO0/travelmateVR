import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/States';
import { notificationPrefsStore, notificationStore, setBackendNotificationRead, useBackendNotifications, useNotifications } from '@/services/account';
import { useStore } from '@/lib/store';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel } from '@/features/trips/format';
import type { AppNotification } from '@/domain/types';
import type { Channel } from '@/services/messaging';
import '@/styles/pages.css';

const ICON: Record<AppNotification['kind'], IconName> = { booking: 'ticket', reminder: 'clock', itinerary: 'calendar', partner: 'mail', promotion: 'star', price: 'ticket', alert: 'info', ai: 'sparkles', support: 'help' };
const CHANNELS: Channel[] = ['inapp', 'email', 'sms', 'whatsapp', 'push'];
const KINDS = Object.keys(ICON) as AppNotification['kind'][];

export function useNotificationText() {
  const { t } = useTranslation('account');
  const lang = useLocale();
  return (n: AppNotification) => ({
    title: n.i18n ? t(n.i18n.title, n.i18n.params ?? {}) : n.title ? lt(n.title, lang) : '',
    body: n.i18n ? t(n.i18n.body, n.i18n.params ?? {}) : n.body ? lt(n.body, lang) : ''
  });
}

export default function NotificationsPage() {
  const { t } = useTranslation(['account', 'common']);
  const lang = useLocale();
  usePageTitle(t('account:notifications.title'));
  const local = useNotifications();
  const backend = useBackendNotifications();
  // Tagged so the mark-read/delete actions below know which store to write to - the backend
  // Notification model only grants update (no delete), since it's meant to stay a durable
  // record (src/services/account.ts's setBackendNotificationRead).
  const list = useMemo(
    () => [...local.map(n => ({ ...n, source: 'local' as const })), ...backend.map(n => ({ ...n, source: 'backend' as const }))]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [local, backend]
  );
  const prefs = useStore(notificationPrefsStore);
  const text = useNotificationText();
  const [tab, setTab] = useState<'all' | 'unread' | 'settings'>('all');
  const shown = useMemo(() => (tab === 'unread' ? list.filter(n => !n.read) : list), [list, tab]);
  const unread = list.filter(n => !n.read).length;

  return (
    <div className="page">
      <section className="block">
        <div className="head-row">
          <div className="page-head"><span className="eyebrow">{t('common:a11y.notifications')}</span><h1>{t('account:notifications.title')}</h1></div>
          {unread > 0 && <button type="button" className="btn ghost sm" onClick={() => { notificationStore.set(l => l.map(n => ({ ...n, read: true }))); backend.filter(n => !n.read).forEach(n => void setBackendNotificationRead(n.id, true)); }}><Icon name="check" />{t('account:notifications.markAll')}</button>}
        </div>
        <div className="tabs" role="tablist">
          {(['all', 'unread', 'settings'] as const).map(k => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(`account:notifications.tab.${k}`)}{k === 'unread' && unread ? ` (${unread})` : ''}</button>)}
        </div>

        {tab === 'settings' ? (
          <div className="panel" style={{ overflowX: 'auto' }}>
            <p style={{ marginBottom: 12 }}>{t('account:notifications.settingsText')}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-btn)' }}>
              <thead><tr><th scope="col" style={{ textAlign: 'left', padding: 8 }}>{t('account:notifications.type')}</th>{CHANNELS.map(c => <th key={c} scope="col" style={{ padding: 8 }}>{t(`account:channel.${c}`)}</th>)}</tr></thead>
              <tbody>
                {KINDS.map(k => (
                  <tr key={k} style={{ borderTop: '1px solid var(--panel-line)' }}>
                    <th scope="row" style={{ textAlign: 'left', padding: 8, fontWeight: 500 }}><Icon name={ICON[k]} width={16} height={16} /> {t(`account:notifications.kind.${k}`)}</th>
                    {CHANNELS.map(c => (
                      <td key={c} style={{ textAlign: 'center', padding: 8 }}>
                        <input type="checkbox" style={{ width: 20, height: 20, accentColor: 'var(--accent)' }} aria-label={`${t(`account:notifications.kind.${k}`)} · ${t(`account:channel.${c}`)}`}
                          checked={prefs[k].includes(c)} onChange={e => notificationPrefsStore.set(p => ({ ...p, [k]: e.target.checked ? [...p[k], c] : p[k].filter(x => x !== c) }))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 12, fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>{t('account:notifications.channelsNote')}</p>
          </div>
        ) : shown.length ? (
          <ul className="list">
            {shown.map(n => {
              const tx = text(n);
              return (
                <li key={n.id} className={`list-item${n.read ? '' : ' unread'}`}>
                  <span className="ico"><Icon name={ICON[n.kind]} /></span>
                  <span className="grow">
                    <b>{n.href ? <Link to={n.href} onClick={() => (n.source === 'backend' ? void setBackendNotificationRead(n.id, true) : notificationStore.set(l => l.map(x => (x.id === n.id ? { ...x, read: true } : x))))} style={{ color: 'inherit' }}>{tx.title}</Link> : tx.title}</b>
                    <small>{tx.body}</small>
                    <small>{dateLabel(n.createdAt, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                  </span>
                  <span className="actions">
                    <button type="button" className="btn ghost sm" onClick={() => (n.source === 'backend' ? void setBackendNotificationRead(n.id, !n.read) : notificationStore.set(l => l.map(x => (x.id === n.id ? { ...x, read: !x.read } : x))))}>{n.read ? t('account:notifications.markUnread') : t('account:notifications.markRead')}</button>
                    {n.source === 'local' && <button type="button" className="icon-btn" aria-label={t('account:notifications.delete')} onClick={() => notificationStore.set(l => l.filter(x => x.id !== n.id))}><Icon name="close" /></button>}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon="bell" title={t('account:notifications.emptyTitle')} text={t('account:notifications.emptyText')} />}
      </section>
    </div>
  );
}
