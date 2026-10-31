import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt, guestName } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT, useAllBookings } from '@/features/portal/admin';
import { downloadCsv, platformMetrics, useAudit, useDirectory } from '@/services/admin';
import { lastMonths } from '@/services/businessAnalytics';
import { useAiLog } from '@/services/aiTelemetry';
import { effectiveStatus } from '@/services/bookings';
import { addDays, todayIso } from '@/lib/random';

/** Downloadable reports, including one per revenue stream. Every export is written to the audit log. */
export default function AdminReportsPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const { write } = useAdmin('reports');
  const bookings = useAllBookings();
  const users = useDirectory();
  const auditLog = useAudit();
  const ai = useAiLog();
  const [from, setFrom] = useState(addDays(todayIso(), -365));
  const [to, setTo] = useState(addDays(todayIso(), 180));
  const months = useMemo(() => lastMonths(12), []);
  const m = useMemo(() => platformMetrics(bookings, months), [bookings, months]);
  const inRange = bookings.filter(b => b.date >= from && b.date <= to);
  const stamp = todayIso();

  const reports: { key: string; rows: number; run: () => void }[] = [
    { key: 'bookings', rows: inRange.length, run: () => downloadCsv(`bookings_${from}_${to}.csv`,
      ['id', 'created', 'status', 'listing', 'partner', 'date', 'end', 'guest', 'country', 'base', 'extras', 'discount', 'taxes', 'service_fee', 'contribution', 'total', 'paid', 'sample'],
      inRange.map(b => [b.id, b.createdAt, effectiveStatus(b), b.listingId, b.partnerId, b.date, b.endDate ?? '', guestName(b), b.lead.country, b.price.base, b.price.extras, b.price.discount ?? 0, b.price.taxes, b.price.serviceFee, b.price.contribution, b.price.total, b.payment.paidUsd, b.sample ? 'yes' : 'no'])) },
    { key: 'commission', rows: months.length, run: () => downloadCsv(`revenue_commission_${stamp}.csv`, ['month', 'gmv', 'commission'], m.series.map(p => [p.month, p.gmv, p.commission])) },
    { key: 'subscriptions', rows: months.length, run: () => downloadCsv(`revenue_subscriptions_${stamp}.csv`, ['month', 'subscription_revenue', 'sample'], m.series.map(p => [p.month, p.subscription, 'yes'])) },
    { key: 'advertising', rows: months.length, run: () => downloadCsv(`revenue_advertising_${stamp}.csv`, ['month', 'advertising_revenue', 'sample'], m.series.map(p => [p.month, p.advertising, 'yes'])) },
    { key: 'enterprise', rows: months.length, run: () => downloadCsv(`revenue_enterprise_${stamp}.csv`, ['month', 'enterprise_revenue', 'sample'], m.series.map(p => [p.month, p.enterprise, 'yes'])) },
    { key: 'partners', rows: m.byPartner.length, run: () => downloadCsv(`partners_${stamp}.csv`, ['id', 'name', 'kind', 'verified', 'real', 'listings', 'bookings', 'gmv', 'rating'],
      m.byPartner.map(x => [x.partner.id, x.partner.name, x.partner.kind, x.partner.verified ? 'yes' : 'no', x.partner.real ? 'yes' : 'no', x.listings, x.bookings, x.gmv, x.rating ? x.rating.toFixed(2) : ''])) },
    { key: 'destinations', rows: m.byDestination.length, run: () => downloadCsv(`destinations_${stamp}.csv`, ['id', 'name', 'country', 'bookings', 'gmv', 'interest_index_sample'],
      m.byDestination.map(x => [x.destination.id, x.destination.name, x.destination.countryId, x.bookings, x.gmv, x.interest])) },
    { key: 'users', rows: users.length, run: () => downloadCsv(`users_${stamp}.csv`, ['id', 'role', 'country', 'status', 'created', 'last_active', 'mfa'],
      users.map(u => [u.id, u.role, u.country, u.status, u.createdAt, u.lastActive, u.mfa ? 'yes' : 'no'])) },
    { key: 'ai', rows: ai.length, run: () => downloadCsv(`ai_interactions_${stamp}.csv`, ['id', 'at', 'lang', 'type', 'ok', 'latency_ms', 'feedback', 'flags', 'model', 'prompt_redacted'],
      ai.map(x => [x.id, x.at, x.lang, x.type, x.ok ? 'yes' : 'no', x.latencyMs, x.feedback ?? '', x.flags.join('|'), x.model, x.prompt])) },
    { key: 'audit', rows: auditLog.length, run: () => downloadCsv(`audit_log_${stamp}.csv`, ['at', 'actor', 'role', 'action', 'target', 'detail', 'ip'],
      auditLog.map(a => [a.at, a.actor, a.role, a.action, a.target, a.detail ?? '', a.ip])) }
  ];

  return (
    <>
      <PortalHead title={t('admin:nav.reports')} text={t('admin:reports.text')} />
      <ReadOnly show={!write} />
      <div className="inline-form panel">
        <label className="field"><span>{t('admin:reports.from')}</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label className="field"><span>{t('admin:reports.to')}</span><input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></label>
        <p className="small muted" style={{ flexBasis: '100%' }}>{t('admin:reports.rangeNote', { count: inRange.length })}</p>
      </div>
      <ul className="list">
        {reports.map(r => (
          <li key={r.key} className="list-item">
            <span className="ico"><Icon name="download" /></span>
            <span className="grow"><b style={{ whiteSpace: 'normal' }}>{t(`admin:reports.r.${r.key}.title`)}</b><small style={{ whiteSpace: 'normal' }}>{t(`admin:reports.r.${r.key}.text`)} · {t('admin:reports.rows', { count: r.rows })}</small></span>
            <button type="button" className="btn ghost sm" disabled={!write || !r.rows} onClick={() => { r.run(); toast.show({ icon: 'download', text: t('admin:reports.downloaded') }); }}><Icon name="download" />CSV</button>
          </li>
        ))}
      </ul>
      <p className="small muted">{t('admin:reports.privacy', { date: f.d(todayIso()) })}</p>
    </>
  );
}
