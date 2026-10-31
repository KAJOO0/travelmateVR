import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT } from '@/features/portal/shared';
import { settings as settingsApi, useSettings, type PartnerSettings, type PlanTier } from '@/services/business';
import { LANGUAGES } from '@/i18n';
import { demoLatency } from '@/services/http';
import { Modal } from '@/components/ui/Modal';
import { seedIndex } from '@/services/catalog';
import { bookingOpenIn, MOBILE_NETWORKS, normalizeTzMobile, TZ_BANKS, type MobileNetwork } from '@/services/payments';
import type { Locale } from '@/domain/types';

const PLANS: { id: PlanTier; features: string[] }[] = [
  { id: 'starter', features: ['f1', 'f2', 'f3'] },
  { id: 'growth', features: ['f1', 'f2', 'f3', 'f4', 'f5'] },
  { id: 'enterprise', features: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'] }
];
const EVENTS = ['newBooking', 'request', 'message', 'review'] as const;
const CHANNELS = ['email', 'sms', 'whatsapp'];

export default function BusinessSettingsPage() {
  const { t } = useBizT();
  const toast = useToast();
  const { partner } = usePartnerOrg();
  const s = useSettings(partner.id);
  const [connecting, setConnecting] = useState(false);
  const [payoutForm, setPayoutForm] = useState<{ method: 'mobile_money' | 'bank'; network: MobileNetwork; phone: string; bank: string; account: string; holder: string } | null>(null);
  const [touched, setTouched] = useState(false);
  // Payouts are available to businesses operating where bookings and payments are open.
  const payoutsOpen = partner.destinationIds.some(id => bookingOpenIn(seedIndex.destById.get(id)?.countryId));
  const up = (patch: Partial<PartnerSettings>) => { settingsApi.update(partner.id, patch); toast.show({ icon: 'check', text: t('business:settings.saved') }); };

  const formErrs = payoutForm ? (payoutForm.method === 'mobile_money'
    ? { phone: !normalizeTzMobile(payoutForm.phone) }
    : { account: !/^\d{8,20}$/.test(payoutForm.account.replace(/\s/g, '')), holder: payoutForm.holder.trim().length < 3 }) : {};
  const connect = async () => {
    if (!payoutForm) return;
    setTouched(true);
    if (Object.values(formErrs).some(Boolean)) return;
    setConnecting(true);
    // Production: the details go to the payment partner, which verifies the account (KYC, name match) before payouts start.
    await demoLatency(800, 1200);
    const digits = payoutForm.method === 'mobile_money' ? normalizeTzMobile(payoutForm.phone)! : payoutForm.account.replace(/\s/g, '');
    const provider = payoutForm.method === 'mobile_money' ? MOBILE_NETWORKS.find(n => n.id === payoutForm.network)!.name : payoutForm.bank;
    settingsApi.update(partner.id, { payout: { ...s.payout, connected: true, method: payoutForm.method, provider, masked: `•••• ${digits.slice(-4)}` } });
    setConnecting(false); setPayoutForm(null); setTouched(false);
    toast.show({ icon: 'check', text: t('business:settings.payoutConnected') });
  };

  return (
    <>
      <PortalHead title={t('business:nav.settings')} text={t('business:settings.text')} />

      <section className="p-section" aria-labelledby="plan-h">
        <h2 id="plan-h">{t('business:settings.plan')}</h2>
        <div className="plan-cards">
          {PLANS.map(p => (
            <article key={p.id} className={`plan-card${s.plan === p.id ? ' current' : ''}`}>
              <div className="row-between"><h3>{t(`business:settings.plans.${p.id}.name`)}</h3>{s.plan === p.id && <span className="badge accent">{t('business:settings.current')}</span>}</div>
              <p className="small muted">{t(`business:settings.plans.${p.id}.text`)}</p>
              <ul>{p.features.map(k => <li key={k}><Icon name="check" />{t(`business:settings.features.${k}`)}</li>)}</ul>
              {s.plan !== p.id && (p.id === 'enterprise'
                ? <Link className="btn ghost sm" to="/contact">{t('business:settings.contactSales')}</Link>
                : <button type="button" className="btn ghost sm" onClick={() => up({ plan: p.id })}>{t('business:settings.switch')}</button>)}
            </article>
          ))}
        </div>
        <p className="small muted">{t('business:settings.planNote')}</p>
      </section>

      <section className="panel" id="payouts" aria-labelledby="pay-h" style={{ display: 'grid', gap: 12 }}>
        <h2 id="pay-h">{t('business:settings.payouts')}</h2>
        <dl className="kv">
          <dt>{t('business:settings.commission')}</dt><dd>{Math.round(s.commissionRate * 100)}% <span className="muted small">· {t('business:settings.commissionNote')}</span></dd>
          <dt>{t('business:settings.account')}</dt><dd>{s.payout.connected ? `${t(`business:settings.method.${s.payout.method ?? 'bank'}`)}${s.payout.provider ? ` · ${s.payout.provider}` : ''} ${s.payout.masked ?? ''}` : t('business:settings.notConnected')}</dd>
        </dl>
        <label className="field" style={{ maxWidth: 280 }}><span>{t('business:settings.schedule')}</span>
          <select value={s.payout.schedule} onChange={e => up({ payout: { ...s.payout, schedule: e.target.value as 'weekly' | 'monthly' } })}>
            <option value="weekly">{t('business:settings.weekly')}</option><option value="monthly">{t('business:settings.monthly')}</option>
          </select></label>
        {!payoutsOpen && <Notice icon="globe">{t('business:settings.payoutsClosed')}</Notice>}
        {!s.payout.connected
          ? <button type="button" className="btn solid sm" style={{ justifySelf: 'start' }} disabled={!payoutsOpen} onClick={() => setPayoutForm({ method: 'mobile_money', network: 'mpesa', phone: '', bank: TZ_BANKS[0]!, account: '', holder: partner.name })}><Icon name="shield" />{t('business:settings.connect')}</button>
          : <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => up({ payout: { ...s.payout, connected: false, masked: undefined } })}>{t('business:settings.disconnect')}</button>}
        <Notice icon="shield">{t('business:settings.payoutSecurity')}</Notice>
      </section>

      {payoutForm && (
        <Modal title={t('business:settings.connect')} onClose={() => setPayoutForm(null)}
          footer={<><button type="button" className="btn ghost" onClick={() => setPayoutForm(null)}>{t('common:actions.cancel')}</button><button type="button" className="btn solid" disabled={connecting} onClick={() => void connect()}>{connecting ? t('business:common.working') : t('business:settings.connectSave')}</button></>}>
          <div className="seg" role="radiogroup" aria-label={t('business:settings.account')} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {(['mobile_money', 'bank'] as const).map(m => <button key={m} type="button" role="radio" aria-checked={payoutForm.method === m} onClick={() => { setPayoutForm({ ...payoutForm, method: m }); setTouched(false); }}><Icon name={m === 'bank' ? 'building' : 'phone'} /> {t(`business:settings.method.${m}`)}</button>)}
          </div>
          {payoutForm.method === 'mobile_money' ? (
            <div className="form-grid">
              <label className="field"><span>{t('trip:pay.network')}</span><select value={payoutForm.network} onChange={e => setPayoutForm({ ...payoutForm, network: e.target.value as MobileNetwork })}>{MOBILE_NETWORKS.map(n => <option key={n.id} value={n.id}>{n.name} ({n.operator})</option>)}</select></label>
              <label className="field"><span>{t('business:settings.payoutPhone')}</span><input type="tel" inputMode="tel" placeholder="07XX XXX XXX" value={payoutForm.phone} onChange={e => setPayoutForm({ ...payoutForm, phone: e.target.value })} aria-invalid={touched && !!(formErrs as { phone?: boolean }).phone} />{touched && (formErrs as { phone?: boolean }).phone && <span className="err">{t('trip:pay.errPhone')}</span>}</label>
            </div>
          ) : (
            <div className="form-grid">
              <label className="field"><span>{t('business:settings.bank')}</span><select value={payoutForm.bank} onChange={e => setPayoutForm({ ...payoutForm, bank: e.target.value })}>{[...TZ_BANKS, t('business:settings.otherBank')].map(b => <option key={b} value={b}>{b}</option>)}</select></label>
              <label className="field"><span>{t('business:settings.accountNumber')}</span><input inputMode="numeric" autoComplete="off" value={payoutForm.account} onChange={e => setPayoutForm({ ...payoutForm, account: e.target.value })} aria-invalid={touched && !!(formErrs as { account?: boolean }).account} />{touched && (formErrs as { account?: boolean }).account && <span className="err">{t('business:settings.errAccount')}</span>}</label>
              <label className="field full"><span>{t('business:settings.accountHolder')}</span><input value={payoutForm.holder} onChange={e => setPayoutForm({ ...payoutForm, holder: e.target.value })} aria-invalid={touched && !!(formErrs as { holder?: boolean }).holder} /><span className="hint">{t('business:settings.accountHolderHint')}</span></label>
            </div>
          )}
          <Notice icon="shield">{t('business:settings.payoutSecurity')}</Notice>
        </Modal>
      )}

      <section className="panel" aria-labelledby="ntf-h" style={{ display: 'grid', gap: 12 }}>
        <h2 id="ntf-h">{t('business:settings.notifications')}</h2>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="dtable">
            <thead><tr><th scope="col">{t('business:settings.event')}</th>{CHANNELS.map(c => <th key={c} scope="col" style={{ textAlign: 'center' }}>{t(`account:channel.${c}`)}</th>)}</tr></thead>
            <tbody>{EVENTS.map(ev => (
              <tr key={ev}><th scope="row">{t(`business:settings.events.${ev}`)}</th>{CHANNELS.map(c => (
                <td key={c} style={{ textAlign: 'center' }}>
                  <input type="checkbox" aria-label={`${t(`business:settings.events.${ev}`)} · ${t(`account:channel.${c}`)}`} checked={s.notify[ev].includes(c)}
                    onChange={e => up({ notify: { ...s.notify, [ev]: e.target.checked ? [...s.notify[ev], c] : s.notify[ev].filter(x => x !== c) } })} />
                </td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
        <label className="check"><input type="checkbox" checked={s.autoReply} onChange={e => up({ autoReply: e.target.checked })} />{t('business:settings.autoReply')}</label>
        <label className="field" style={{ maxWidth: 280 }}><span>{t('business:settings.defaultLang')}</span>
          <select value={s.defaultLang} onChange={e => up({ defaultLang: e.target.value as Locale })}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select></label>
      </section>

      <section className="panel" aria-labelledby="sec-h" style={{ display: 'grid', gap: 10 }}>
        <h2 id="sec-h">{t('business:settings.security')}</h2>
        <ul className="prose" style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>{['s1', 's2', 's3'].map(k => <li key={k}>{t(`business:settings.${k}`)}</li>)}</ul>
        <Link className="tlink" to="/security"><span>{t('common:footer.links.security')}</span><Icon name="arrowRight" /></Link>
      </section>
    </>
  );
}
