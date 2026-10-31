import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT, useFmt } from '@/features/portal/shared';
import { team, TEAM_PERMISSIONS, useTeam, type TeamRole } from '@/services/business';

const ROLES: TeamRole[] = ['owner', 'manager', 'reservations', 'guide', 'finance'];
const PERMS = ['bookings', 'messages', 'listings', 'pricing', 'marketing', 'finance', 'team', 'settings'];

export default function BusinessTeamPage() {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const { partner, user } = usePartnerOrg();
  const members = useTeam(partner.id);
  const [form, setForm] = useState({ name: '', email: '', role: 'reservations' as TeamRole });
  const [touched, setTouched] = useState(false);
  const emailErr = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const dup = members.some(m => m.email.toLowerCase() === form.email.toLowerCase());

  const invite = () => {
    setTouched(true);
    if (!form.name.trim() || emailErr || dup) return;
    team.invite(partner.id, form.name.trim(), form.email.trim(), form.role);
    toast.show({ icon: 'mail', text: t('business:team.invited', { email: form.email }) });
    setForm({ name: '', email: '', role: 'reservations' }); setTouched(false);
  };

  return (
    <>
      <PortalHead title={t('business:nav.team')} text={t('business:team.text')} />
      <div className="table-wrap">
        <table className="dtable">
          <thead><tr><th scope="col">{t('business:bookings.name')}</th><th scope="col">{t('business:team.role')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col">{t('business:team.added')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
          <tbody>{members.map(m => (
            <tr key={m.id}>
              <td>{m.name}{m.email === user.email ? ` (${t('business:team.you')})` : ''}<small>{m.email}</small></td>
              <td>
                {m.role === 'owner' ? t('business:team.roles.owner') : (
                  <select className="input" value={m.role} aria-label={t('business:team.roleFor', { name: m.name })} onChange={e => team.setRole(partner.id, m.id, e.target.value as TeamRole)}>
                    {ROLES.filter(r => r !== 'owner').map(r => <option key={r} value={r}>{t(`business:team.roles.${r}`)}</option>)}
                  </select>
                )}
              </td>
              <td><span className={`status ${m.status === 'active' ? 'paid' : 'pending'}`}>{t(`business:team.status.${m.status}`)}</span></td>
              <td>{f.d(m.addedAt)}</td>
              <td>{m.role !== 'owner' && <button type="button" className="icon-btn" onClick={() => team.remove(partner.id, m.id)} aria-label={t('business:team.remove', { name: m.name })}><Icon name="trash" /></button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <form className="panel" style={{ display: 'grid', gap: 12 }} onSubmit={e => { e.preventDefault(); invite(); }} noValidate>
        <h2>{t('business:team.invite')}</h2>
        <div className="form-grid">
          <label className="field"><span>{t('business:bookings.name')}</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} aria-invalid={touched && !form.name.trim()} /></label>
          <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} aria-invalid={touched && (emailErr || dup)} />
            {touched && emailErr && <span className="err">{t('trip:book.errEmail')}</span>}{touched && dup && <span className="err">{t('business:team.dup')}</span>}</label>
          <label className="field"><span>{t('business:team.role')}</span><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as TeamRole })}>{ROLES.filter(r => r !== 'owner').map(r => <option key={r} value={r}>{t(`business:team.roles.${r}`)}</option>)}</select></label>
        </div>
        <button type="submit" className="btn solid" style={{ justifySelf: 'start' }}><Icon name="mail" />{t('business:team.send')}</button>
        <p className="small muted">{t('business:team.inviteNote')}</p>
      </form>

      <section className="p-section" aria-labelledby="perm-h">
        <h2 id="perm-h">{t('business:team.permissions')}</h2>
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th scope="col">{t('business:team.role')}</th>{PERMS.map(p => <th key={p} scope="col">{t(`business:team.perm.${p}`)}</th>)}</tr></thead>
            <tbody>{ROLES.map(r => (
              <tr key={r}><th scope="row">{t(`business:team.roles.${r}`)}</th>{PERMS.map(p => <td key={p} style={{ textAlign: 'center' }}>{TEAM_PERMISSIONS[r].includes(p) ? <><Icon name="check" width={16} height={16} /><span className="sr">{t('business:common.yes')}</span></> : <><span className="muted" aria-hidden="true">—</span><span className="sr">{t('business:common.no')}</span></>}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
        <Notice icon="shield">{t('business:team.enforced')}</Notice>
      </section>
    </>
  );
}
