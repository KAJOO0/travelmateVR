import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT } from '@/features/portal/admin';
import { ACCESS, ADMIN_ROLES, audit, dataRequestStore, privacyAdmin, securityEvents, useAudit, type AdminSection, type DataRequest } from '@/services/admin';
import { DEFAULT_PLATFORM, platformStore, usePlatform, type PlatformSettings } from '@/services/platform';
import { DATA_SOURCE } from '@/services/http';
import { seedIndex } from '@/services/catalog';
import { countryName } from '@/lib/content';
import { useStore } from '@/lib/store';

/** Audit log, security events, role permissions and data-protection requests. */
export function AdminSecurityPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const { write } = useAdmin('security');
  const log = useAudit();
  const events = useMemo(() => securityEvents(), []);
  const dsr = useStore(dataRequestStore);
  const [q, setQ] = useState('');
  const shownLog = log.filter(a => !q.trim() || `${a.actor} ${a.action} ${a.target} ${a.detail ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const sections = Object.keys(ACCESS) as AdminSection[];

  return (
    <>
      <PortalHead title={t('admin:nav.security')} text={t('admin:security.text')} />
      <ReadOnly show={!write} />
      <section className="p-section" aria-labelledby="se-audit">
        <h2 id="se-audit">{t('admin:security.audit')}</h2>
        <div className="filters-row"><label className="sr" htmlFor="aq">{t('admin:security.search')}</label><input id="aq" className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('admin:security.search')} /></div>
        <div className="table-wrap" style={{ maxHeight: 420 }}><table className="dtable">
          <thead><tr><th scope="col">{t('admin:ai.when')}</th><th scope="col">{t('admin:security.actor')}</th><th scope="col">{t('admin:security.action')}</th><th scope="col">{t('admin:security.target')}</th><th scope="col">IP</th></tr></thead>
          <tbody>{shownLog.slice(0, 200).map(a => (
            <tr key={a.id}><td>{f.dt(a.at)}</td><td>{a.actor}<small>{t(`admin:roles.${a.role}`, { defaultValue: a.role })}{a.sample ? ` · ${t('business:sample.label')}` : ''}</small></td><td><code>{a.action}</code></td><td>{a.target}{a.detail && <small>{a.detail}</small>}</td><td>{a.ip}</td></tr>
          ))}</tbody>
        </table></div>
        <p className="small muted">{t('admin:security.auditNote')}</p>
      </section>

      <div className="p-grid2">
        <section className="panel" aria-labelledby="se-ev"><div className="panel-head"><h2 id="se-ev">{t('admin:security.events')}</h2><span className="sample-tag">{t('business:sample.label')}</span></div>
          <ul className="list">{events.slice(0, 8).map(e => (
            <li key={e.id} className="list-item"><span className="ico"><Icon name={e.severity === 'high' ? 'shield' : 'info'} /></span>
              <span className="grow"><b>{t(`admin:security.kind.${e.kind}`)}</b><small>{e.who} · {e.ip} · {f.dt(e.at)}</small></span>
              <span className={`status ${e.severity === 'high' ? 'refunded' : e.severity === 'medium' ? 'pending' : 'draft'}`}>{t(`admin:security.sev.${e.severity}`)}</span></li>
          ))}</ul></section>
        <section className="panel" aria-labelledby="se-dsr"><h2 id="se-dsr" style={{ marginBottom: 12 }}>{t('admin:security.dsr')}</h2>
          <ul className="list">{dsr.map(r => (
            <li key={r.id} className="list-item"><span className="grow"><b>{r.id} · {t(`admin:security.dsrKind.${r.kind}`)}</b><small>{r.email} · {t('admin:security.due', { date: f.d(r.due) })}</small></span>
              {write ? <select className="input" aria-label={t('business:bookings.status')} value={r.status} onChange={e => privacyAdmin.setStatus(r.id, e.target.value as DataRequest['status'])}>{(['new', 'in_progress', 'done'] as const).map(s => <option key={s} value={s}>{t(`admin:security.dsrStatus.${s}`)}</option>)}</select>
                : <span className="status pending">{t(`admin:security.dsrStatus.${r.status}`)}</span>}</li>
          ))}</ul>
          <p className="small muted" style={{ marginTop: 8 }}>{t('admin:security.dsrNote')}</p></section>
      </div>

      <section className="p-section" aria-labelledby="se-rbac">
        <h2 id="se-rbac">{t('admin:security.rbac')}</h2>
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('admin:security.section')}</th>{ADMIN_ROLES.map(r => <th key={r} scope="col" style={{ textAlign: 'center' }}>{t(`admin:roles.${r}`)}</th>)}</tr></thead>
          <tbody>{sections.map(s => (
            <tr key={s}><th scope="row">{t(`admin:nav.${s}`)}</th>{ADMIN_ROLES.map(r => {
              const level = ACCESS[s].write.includes(r) ? 'write' : ACCESS[s].read.includes(r) ? 'read' : 'none';
              return <td key={r} style={{ textAlign: 'center' }}>{level === 'none' ? <span className="muted">—</span> : t(`admin:security.level.${level}`)}</td>;
            })}</tr>
          ))}</tbody>
        </table></div>
        <Notice icon="shield">{t('admin:security.enforced')}</Notice>
      </section>
    </>
  );
}

/** Platform configuration (super administrators only). Every change is audited. */
export function AdminSettingsPage() {
  const { t } = useAdminT();
  const toast = useToast();
  const f = useFmt();
  const { write } = useAdmin('settings');
  const saved = usePlatform();
  const [s, setS] = useState<PlatformSettings>(() => structuredClone(saved));
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const errs = { fee: s.serviceFeeRate < 0 || s.serviceFeeRate > 0.2, deposit: s.depositRate < 0.1 || s.depositRate > 1, cap: s.maxPartnerDiscount < 1 || s.maxPartnerDiscount > 90, share: s.creators.subscriptionShareRate < 0 || s.creators.subscriptionShareRate > 0.6, views: s.creators.perThousandViewsUsd < 0 || s.creators.perThousandViewsUsd > 50, qualified: s.creators.qualifiedViewSeconds < 5 || s.creators.qualifiedViewSeconds > 600, rate: s.payments.tzsPerUsd < 100 || s.payments.tzsPerUsd > 100000, countries: !s.payments.bookingCountries.length, maint: s.maintenance.on && !s.maintenance.message.trim() };
  const invalid = Object.values(errs).some(Boolean);
  const save = () => {
    if (invalid) return;
    const changes = (Object.keys(s) as (keyof PlatformSettings)[]).filter(k => JSON.stringify(s[k]) !== JSON.stringify(saved[k]));
    platformStore.set(structuredClone(s));
    audit('settings.update', changes.join(', '), JSON.stringify(changes.reduce((o, k) => ({ ...o, [k]: s[k] }), {})).slice(0, 200));
    toast.show({ icon: 'check', text: t('admin:settings.saved') });
  };
  const pct = (v: number) => Math.round(v * 1000) / 10;
  const integrations = [
    { key: 'api', ok: DATA_SOURCE === 'http' }, { key: 'payments', ok: false }, { key: 'maps', ok: !!import.meta.env.VITE_MAP_TILES_LIGHT },
    { key: 'ai', ok: DATA_SOURCE === 'http' }, { key: 'messaging', ok: false }, { key: 'storage', ok: false }
  ];

  return (
    <>
      <PortalHead title={t('admin:nav.settings')} text={t('admin:settings.text')} />
      <ReadOnly show={!write} />
      <form className="panel" style={{ display: 'grid', gap: 18 }} onSubmit={e => { e.preventDefault(); save(); }}>
        <h2>{t('admin:settings.commerce')}</h2>
        <div className="form-grid">
          <label className="field"><span>{t('admin:settings.fee')}</span><input type="number" step={0.5} min={0} max={20} value={pct(s.serviceFeeRate)} disabled={!write} onChange={e => setS({ ...s, serviceFeeRate: Number(e.target.value) / 100 })} aria-invalid={errs.fee} /><span className="hint">{t('admin:settings.feeHint')}</span></label>
          <label className="field"><span>{t('admin:settings.deposit')}</span><input type="number" step={5} min={10} max={100} value={pct(s.depositRate)} disabled={!write} onChange={e => setS({ ...s, depositRate: Number(e.target.value) / 100 })} aria-invalid={errs.deposit} /></label>
          <label className="field"><span>{t('admin:settings.cap')}</span><input type="number" min={1} max={90} value={s.maxPartnerDiscount} disabled={!write} onChange={e => setS({ ...s, maxPartnerDiscount: Number(e.target.value) })} aria-invalid={errs.cap} /></label>
        </div>

        <h2>{t('admin:settings.creators')}</h2>
        <div className="form-grid">
          <label className="field"><span>{t('admin:settings.creatorShare')}</span><input type="number" step={1} min={0} max={60} value={pct(s.creators.subscriptionShareRate)} disabled={!write} onChange={e => setS({ ...s, creators: { ...s.creators, subscriptionShareRate: Number(e.target.value) / 100 } })} aria-invalid={errs.share} /><span className="hint">{t('admin:settings.creatorShareHint')}</span></label>
          <label className="field"><span>{t('admin:settings.viewRate')}</span><input type="number" step={0.1} min={0} max={50} value={s.creators.perThousandViewsUsd} disabled={!write} onChange={e => setS({ ...s, creators: { ...s.creators, perThousandViewsUsd: Number(e.target.value) } })} aria-invalid={errs.views} /><span className="hint">{t('admin:settings.viewRateHint')}</span></label>
          <label className="field"><span>{t('admin:settings.qualifiedView')}</span><input type="number" min={5} max={600} value={s.creators.qualifiedViewSeconds} disabled={!write} onChange={e => setS({ ...s, creators: { ...s.creators, qualifiedViewSeconds: Math.round(Number(e.target.value)) } })} aria-invalid={errs.qualified} /><span className="hint">{t('admin:settings.qualifiedViewHint')}</span></label>
        </div>

        <h2>{t('admin:settings.payments')}</h2>
        <div className="form-grid">
          <label className="field"><span>{t('admin:settings.tzsRate')}</span><input type="number" step={10} min={100} value={s.payments.tzsPerUsd} disabled={!write} onChange={e => setS({ ...s, payments: { ...s.payments, tzsPerUsd: Math.round(Number(e.target.value)) } })} aria-invalid={errs.rate} /><span className="hint">{t('admin:settings.tzsRateHint')}</span></label>
          <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label">{t('admin:settings.bookingCountries')}</legend>
            <div className="checks">{seedIndex.countries.map(c => (
              <label key={c.id} className="check"><input type="checkbox" disabled={!write} checked={s.payments.bookingCountries.includes(c.id)} onChange={e => setS({ ...s, payments: { ...s.payments, bookingCountries: e.target.checked ? [...s.payments.bookingCountries, c.id] : s.payments.bookingCountries.filter(x => x !== c.id) } })} />{countryName(c, f.lang)}</label>
            ))}</div>
            <span className="hint">{t('admin:settings.bookingCountriesHint')}</span>{errs.countries && <span className="err">{t('admin:settings.errCountries')}</span>}
          </fieldset>
        </div>

        <h2>{t('admin:settings.features')}</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {(Object.keys(s.flags) as (keyof PlatformSettings['flags'])[]).map(k => (
            <label key={k} className="check" style={{ alignItems: 'flex-start' }}><input type="checkbox" disabled={!write} checked={s.flags[k]} onChange={e => setS({ ...s, flags: { ...s.flags, [k]: e.target.checked } })} style={{ marginTop: 3 }} />
              <span><b>{t(`admin:settings.flag.${k}`)}</b><br /><small className="muted">{t(`admin:settings.flagText.${k}`)}</small></span></label>
          ))}
        </div>

        <h2>{t('admin:settings.maintenance')}</h2>
        <label className="check"><input type="checkbox" disabled={!write} checked={s.maintenance.on} onChange={e => setS({ ...s, maintenance: { ...s.maintenance, on: e.target.checked } })} />{t('admin:settings.maintenanceOn')}</label>
        <label className="field"><span>{t('admin:settings.maintenanceMsg')}</span><input value={s.maintenance.message} maxLength={160} disabled={!write} placeholder={t('admin:settings.maintenancePh')} onChange={e => setS({ ...s, maintenance: { ...s.maintenance, message: e.target.value } })} aria-invalid={errs.maint} />{errs.maint && <span className="err">{t('business:common.required')}</span>}</label>

        <h2>{t('admin:settings.security')}</h2>
        <div className="form-grid">
          <label className="check"><input type="checkbox" disabled={!write} checked={s.security.require2faForAdmins} onChange={e => setS({ ...s, security: { ...s.security, require2faForAdmins: e.target.checked } })} />{t('admin:settings.require2fa')}</label>
          <span />
          <label className="field"><span>{t('admin:settings.timeout')}</span><select disabled={!write} value={s.security.sessionTimeoutMin} onChange={e => setS({ ...s, security: { ...s.security, sessionTimeoutMin: Number(e.target.value) } })}>{[15, 30, 60, 120].map(v => <option key={v} value={v}>{t('admin:settings.minutes', { count: v })}</option>)}</select></label>
          <label className="field"><span>{t('admin:settings.attempts')}</span><select disabled={!write} value={s.security.maxLoginAttempts} onChange={e => setS({ ...s, security: { ...s.security, maxLoginAttempts: Number(e.target.value) } })}>{[3, 5, 10].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
          <label className="field"><span>{t('admin:settings.lockout')}</span><select disabled={!write} value={s.security.lockoutMinutes} onChange={e => setS({ ...s, security: { ...s.security, lockoutMinutes: Number(e.target.value) } })}>{[15, 30, 60, 120, 240, 1440].map(v => <option key={v} value={v}>{t('admin:settings.lockoutValue', { count: v >= 60 ? v / 60 : v, context: v >= 60 ? 'hours' : 'minutes' })}</option>)}</select><span className="hint">{t('admin:settings.lockoutHint')}</span></label>
        </div>
        <p className="small muted">{t('admin:settings.securityNote')}</p>

        {write && (
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="btn ghost sm" onClick={() => setS(structuredClone(DEFAULT_PLATFORM))}><Icon name="refresh" />{t('admin:settings.defaults')}</button>
            <button type="submit" className="btn solid" disabled={!dirty || invalid}><Icon name="check" />{t('admin:settings.save')}</button>
          </div>
        )}
      </form>

      <section className="panel" aria-labelledby="st-int"><h2 id="st-int" style={{ marginBottom: 12 }}>{t('admin:settings.integrations')}</h2>
        <ul className="list">{integrations.map(i => (
          <li key={i.key} className="list-item"><span className="grow"><b>{t(`admin:settings.int.${i.key}.name`)}</b><small style={{ whiteSpace: 'normal' }}>{t(`admin:settings.int.${i.key}.text`)}</small></span>
            <span className={`status ${i.ok ? 'paid' : 'pending'}`}>{i.ok ? t('admin:settings.connected') : t('admin:settings.demoMode')}</span></li>
        ))}</ul>
        <Notice icon="shield">{t('admin:settings.secrets')}</Notice></section>
    </>
  );
}
