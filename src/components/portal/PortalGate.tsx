import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { auth } from '@/services/account';
import { ADMIN_ROLES } from '@/services/admin';
import { usePageTitle } from '@/app/usePageTitle';
import type { Role, User } from '@/domain/types';

/** Shown instead of a portal page when nobody (or someone without the right role) is signed in. */
export function PortalGate({ kind, signedInAs }: { kind: 'partner' | 'board' | 'admin'; signedInAs: User | null }) {
  const ns = kind === 'partner' ? 'business' : kind === 'board' ? 'board' : 'admin';
  const { t } = useTranslation([ns, 'business', 'admin', 'common']);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role>('super_admin');
  usePageTitle(t(`${ns}:shell.title`));
  const enter = async () => { setBusy(true); await auth.signInPortal(kind, role); setBusy(false); };

  return (
    <main id="main" className="portal-gate" tabIndex={-1}>
      <div className="auth">
        <div className="pic"><Media id={kind === 'partner' ? 'safari-crew' : kind === 'board' ? 'serengeti-herds' : 'ngorongoro'} sizes="520px" priority decorative /></div>
        <div className="form">
          <span className="eyebrow">{t(`${ns}:shell.title`)}</span>
          <h1>{t(`${ns}:gate.title`)}</h1>
          <p style={{ color: 'var(--muted)' }}>{t(`${ns}:gate.text`)}</p>
          {signedInAs && <Notice icon="info">{t('business:gate.noAccess', { email: signedInAs.email })}</Notice>}
          {kind === 'admin' && (
            <fieldset className="field" style={{ border: 0 }}>
              <legend className="label" style={{ marginBottom: 8 }}>{t('admin:gate.role')}</legend>
              <div style={{ display: 'grid', gap: 6 }}>
                {ADMIN_ROLES.map(r => (
                  <label key={r} className="check" style={{ alignItems: 'flex-start' }}>
                    <input type="radio" name="admin-role" checked={role === r} onChange={() => setRole(r)} style={{ marginTop: 3 }} />
                    <span><b>{t(`admin:roles.${r}`)}</b><br /><small className="muted">{t(`admin:roleText.${r}`)}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <button type="button" className="btn solid" disabled={busy} onClick={() => void enter()}>
            <Icon name={kind === 'admin' ? 'shield' : 'briefcase'} />{busy ? t('business:gate.opening') : t(`${ns}:gate.demo`)}
          </button>
          <Notice icon="shield">{t(`${ns}:gate.demoNote`)}</Notice>
          {kind !== 'admin' && (
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>
              {t(`${ns}:gate.noAccount`)}{' '}
              <Link to={kind === 'partner' ? '/partners/join' : '/tourism-boards#contact'}>{t(`${ns}:gate.apply`)}</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
