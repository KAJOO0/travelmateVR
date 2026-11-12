import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/app/providers/ToastProvider';
import { ErrorState } from '@/components/ui/States';
import { countryLabel, PortalHead, useFmt } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT } from '@/features/portal/admin';
import { adminUsersApi, useAdminUsers, usersAdmin, type RealDirectoryUser } from '@/services/admin';
import type { Role } from '@/domain/types';

const ROLES: Role[] = ['traveller', 'partner', 'partner_staff', 'tourism_board', 'government_dmo', 'conservation_org', 'content_manager', 'support_agent', 'finance', 'admin', 'super_admin'];
const STAFF: Role[] = ['content_manager', 'support_agent', 'finance', 'admin', 'super_admin'];

/** Real Cognito users only have two states (no backing group for the demo's 7-role taxonomy) -
 *  a separate, simpler render path rather than forcing the richer demo table to pretend it has
 *  data it doesn't (country, last-active, booking count, per-user MFA status: none of that
 *  exists for a real user without more infra - see the plan this was built from). */
function RealUsers({ users, loading, error, retry, write }: { users: RealDirectoryUser[]; loading: boolean; error: unknown; retry: () => void; write: boolean }) {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [invite, setInvite] = useState({ name: '', email: '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const shown = useMemo(() => users.filter(u => !q.trim() || `${u.name ?? ''} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [users, q]);
  const newThisMonth = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter(u => new Date(u.createdAt).getTime() >= cutoff).length;
  }, [users]);
  const emailErr = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email);

  const run = async (id: string, fn: () => Promise<void>, okText: string) => {
    setBusy(id);
    try { await fn(); toast.show({ icon: 'check', text: okText }); } catch (e) { toast.show({ icon: 'info', text: e instanceof Error ? e.message : String(e) }); } finally { setBusy(null); }
  };

  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <>
      <div className="filters-row">
        <label className="sr" htmlFor="uq">{t('admin:users.search')}</label>
        <input id="uq" className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('admin:users.search')} />
        <span className="muted small">{t('admin:users.count', { count: shown.length })}</span>
        <span className="muted small">{t('admin:users.newThisMonth', { count: newThisMonth })}</span>
      </div>
      {loading ? <div className="skeleton" style={{ height: 240, borderRadius: 18 }} /> : (
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('admin:users.user')}</th><th scope="col">{t('admin:users.role')}</th><th scope="col">{t('admin:users.joined')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
          <tbody>{shown.map(u => (
            <tr key={u.id}>
              <td>{u.name ?? u.email}<small>{u.email}</small></td>
              <td>{t(u.isAdmin ? 'admin:users.admin' : 'admin:users.traveller')}</td>
              <td>{f.d(u.createdAt)}</td>
              <td><span className={`status ${u.enabled ? 'paid' : 'refunded'}`}>{t(`admin:users.status.${u.enabled ? 'active' : 'suspended'}`)}</span></td>
              <td>{write && (
                <span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                  <button type="button" className="btn ghost sm" disabled={busy === u.id} onClick={() => run(u.id, () => adminUsersApi.setEnabled(u.id, !u.enabled), t(u.enabled ? 'admin:users.suspended' : 'admin:users.reactivated'))}>{t(u.enabled ? 'admin:users.suspend' : 'admin:users.reactivate')}</button>
                  <button type="button" className="btn ghost sm" disabled={busy === u.id} onClick={() => run(u.id, () => adminUsersApi.setAdmin(u.id, !u.isAdmin), t('admin:users.roleChanged'))}>{t(u.isAdmin ? 'admin:users.revokeAdmin' : 'admin:users.makeAdmin')}</button>
                </span>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {write && (
        <form className="panel" style={{ display: 'grid', gap: 12 }} noValidate onSubmit={e => {
          e.preventDefault(); setTouched(true); if (!emailErr) {
            void run('invite', () => adminUsersApi.invite(invite.email.trim(), invite.name.trim()), t('business:team.invited', { email: invite.email }));
            setInvite({ name: '', email: '' }); setTouched(false);
          }
        }}>
          <h2>{t('admin:users.inviteStaff')}</h2>
          <div className="form-grid">
            <label className="field"><span>{t('business:bookings.name')}</span><input value={invite.name} onChange={e => setInvite({ ...invite, name: e.target.value })} /></label>
            <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} aria-invalid={touched && emailErr} />{touched && emailErr && <span className="err">{t('trip:book.errEmail')}</span>}</label>
          </div>
          <button type="submit" className="btn solid" style={{ justifySelf: 'start' }} disabled={busy === 'invite'}><Icon name="mail" />{t('business:team.send')}</button>
          <p className="small muted">{t('admin:users.realRoleNote')}</p>
        </form>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const { write, role } = useAdmin('users');
  const adminUsers = useAdminUsers();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [invite, setInvite] = useState({ name: '', email: '', role: 'support_agent' as Role });
  const [touched, setTouched] = useState(false);
  const demoShown = useMemo(() => (adminUsers.real ? [] : adminUsers.users).filter(u => (filter === 'all' || u.role === filter) && (!q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))), [adminUsers, filter, q]);
  const emailErr = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email);
  // Only super administrators can grant or remove administrator roles.
  const assignable = (r: Role) => role === 'super_admin' || !['admin', 'super_admin'].includes(r);

  return (
    <>
      <PortalHead title={t('admin:nav.users')} text={t('admin:users.text')} />
      <ReadOnly show={!write} />
      {adminUsers.real ? (
        <RealUsers users={adminUsers.users} loading={adminUsers.loading} error={adminUsers.error} retry={adminUsers.retry} write={write} />
      ) : (
        <>
          <div className="filters-row">
            <label className="sr" htmlFor="uq">{t('admin:users.search')}</label>
            <input id="uq" className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('admin:users.search')} />
            <label className="sr" htmlFor="ur">{t('admin:users.role')}</label>
            <select id="ur" className="input" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
              <option value="all">{t('admin:users.allRoles')}</option>{ROLES.map(r => <option key={r} value={r}>{t(`admin:roles.${r}`)}</option>)}
            </select>
            <span className="muted small">{t('admin:users.count', { count: demoShown.length })}</span>
          </div>
          <div className="table-wrap"><table className="dtable">
            <thead><tr><th scope="col">{t('admin:users.user')}</th><th scope="col">{t('admin:users.role')}</th><th scope="col">{t('trip:book.country')}</th><th scope="col">{t('admin:users.joined')}</th><th scope="col">{t('admin:users.lastActive')}</th><th scope="col">2FA</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
            <tbody>{demoShown.map(u => (
              <tr key={u.id}>
                <td>{u.name}<small>{u.email}</small></td>
                <td>{write && assignable(u.role) ? (
                  <select className="input" aria-label={t('admin:users.roleFor', { name: u.name })} value={u.role} onChange={e => { usersAdmin.setRole(u.id, e.target.value as Role); toast.show({ icon: 'check', text: t('admin:users.roleChanged') }); }}>
                    {ROLES.filter(assignable).map(r => <option key={r} value={r}>{t(`admin:roles.${r}`)}</option>)}
                  </select>) : t(`admin:roles.${u.role}`)}</td>
                <td>{countryLabel(u.country, f.lang)}</td>
                <td>{f.d(u.createdAt)}</td>
                <td>{f.d(u.lastActive)}</td>
                <td>{u.mfa ? <Icon name="check" width={16} height={16} /> : <span className="muted">—</span>}<span className="sr">{u.mfa ? t('business:common.yes') : t('business:common.no')}</span></td>
                <td><span className={`status ${u.status === 'active' ? 'paid' : 'refunded'}`}>{t(`admin:users.status.${u.status}`)}</span></td>
                <td>{write && assignable(u.role) && (
                  <span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                    <button type="button" className="btn ghost sm" onClick={() => { usersAdmin.setStatus(u.id, u.status === 'active' ? 'suspended' : 'active'); toast.show({ icon: 'check', text: t(u.status === 'active' ? 'admin:users.suspended' : 'admin:users.reactivated') }); }}>{u.status === 'active' ? t('admin:users.suspend') : t('admin:users.reactivate')}</button>
                    {u.mfa && <button type="button" className="btn ghost sm" onClick={() => { usersAdmin.resetMfa(u.id); toast.show({ icon: 'check', text: t('admin:users.mfaReset') }); }}>{t('admin:users.resetMfa')}</button>}
                  </span>
                )}</td>
              </tr>
            ))}</tbody>
          </table></div>

          {write && (
            <form className="panel" style={{ display: 'grid', gap: 12 }} noValidate onSubmit={e => { e.preventDefault(); setTouched(true); if (!invite.name.trim() || emailErr) return; usersAdmin.invite(invite.name.trim(), invite.email.trim(), invite.role); toast.show({ icon: 'mail', text: t('business:team.invited', { email: invite.email }) }); setInvite({ name: '', email: '', role: 'support_agent' }); setTouched(false); }}>
              <h2>{t('admin:users.inviteStaff')}</h2>
              <div className="form-grid">
                <label className="field"><span>{t('business:bookings.name')}</span><input value={invite.name} onChange={e => setInvite({ ...invite, name: e.target.value })} aria-invalid={touched && !invite.name.trim()} /></label>
                <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} aria-invalid={touched && emailErr} />{touched && emailErr && <span className="err">{t('trip:book.errEmail')}</span>}</label>
                <label className="field"><span>{t('admin:users.role')}</span><select value={invite.role} onChange={e => setInvite({ ...invite, role: e.target.value as Role })}>{STAFF.filter(assignable).map(r => <option key={r} value={r}>{t(`admin:roles.${r}`)}</option>)}</select></label>
              </div>
              <button type="submit" className="btn solid" style={{ justifySelf: 'start' }}><Icon name="mail" />{t('business:team.send')}</button>
              <p className="small muted">{t('admin:users.inviteNote')}</p>
            </form>
          )}
        </>
      )}
    </>
  );
}
