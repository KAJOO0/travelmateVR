import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode } from '@/components/ui/QrCode';
import { Notice } from '@/components/ui/bits';
import { mfa } from '@/services/account';
import { usePageTitle } from '@/app/usePageTitle';
import type { User } from '@/domain/types';

/** Blocks the admin dashboard until the signed-in admin enrolls TOTP — see
 *  PortalLayout.tsx. Backend enforcement (amplify/functions/login-guard/handler.ts) only
 *  kicks in once mfa.confirmEnrollment() below sets TOTP as this user's preferred method;
 *  this screen is what gets them there instead of leaving enrollment undiscoverable. */
export function AdminMfaSetup({ user, onDone }: { user: User; onDone: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
  usePageTitle(t('admin:mfa.title'));
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    mfa.startEnrollment(user.email)
      .then(d => { if (alive) { setSecret(d.secret); setUri(d.uri); setLoading(false); } })
      .catch(() => { if (alive) { setErr(true); setLoading(false); } });
    return () => { alive = false; };
  }, [user.email]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;
    setBusy(true); setErr(false);
    try {
      await mfa.confirmEnrollment(code.trim());
      onDone();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main" className="portal-gate" tabIndex={-1}>
      <div className="auth">
        <div className="form">
          <span className="eyebrow">{t('admin:mfa.eyebrow')}</span>
          <h1>{t('admin:mfa.title')}</h1>
          <p style={{ color: 'var(--muted)' }}>{t('admin:mfa.text')}</p>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
          ) : !uri ? (
            <Notice tone="warn">{t('admin:mfa.startErr')}</Notice>
          ) : (
            <>
              <QrCode value={uri} label={t('admin:mfa.qrAlt')} />
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>{t('admin:mfa.manualHint')} <code>{secret}</code></p>
              <form onSubmit={confirm} noValidate>
                {err && <div role="alert"><Notice tone="warn">{t('admin:mfa.err')}</Notice></div>}
                <label className="field">
                  <span>{t('admin:mfa.code')}</span>
                  <input value={code} maxLength={6} inputMode="numeric" autoComplete="one-time-code" onChange={e => setCode(e.target.value)} />
                </label>
                <button type="submit" className="btn solid" disabled={busy || code.trim().length !== 6}>{busy ? t('admin:mfa.verifying') : t('admin:mfa.confirm')}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
