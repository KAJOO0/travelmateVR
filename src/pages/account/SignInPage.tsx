import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { auth, AuthError, loginGuard, useLoginGuard, useSession } from '@/services/account';
import { isAcceptablePassword, isEmail, isUsername, PASSWORD_MAX } from '@/lib/security';
import { useLocale } from '@/i18n/useLocale';
import { usePageTitle } from '@/app/usePageTitle';
import '@/styles/pages.css';

export default function SignInPage() {
  const { t } = useTranslation(['account', 'common', 'trip']);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/account';
  const user = useSession();
  const [mode, setMode] = useState<'signin' | 'register'>(params.get('mode') === 'register' ? 'register' : 'signin');
  const [name, setName] = useState('');
  const lang = useLocale();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<{ key: string; params?: Record<string, unknown> } | null>(null);
  const guard = useLoginGuard();
  const [now, setNow] = useState(Date.now());
  usePageTitle(mode === 'signin' ? t('common:nav.signIn') : t('account:signin.register'));
  // Sign-in takes an email or a username; registration needs an email and allows an optional username.
  const errs = mode === 'signin'
    ? { name: false, email: !(isEmail(email) || isUsername(email)), username: false, password: password.length === 0 }
    : { name: name.trim().length < 2, email: !isEmail(email), username: !!username.trim() && !isUsername(username), password: !isAcceptablePassword(password) };
  const lockedUntil = mode === 'signin' && guard.lockedUntil && Date.parse(guard.lockedUntil) > now ? guard.lockedUntil : undefined;
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => { setNow(Date.now()); loginGuard.lockedUntil(); }, 30_000);
    return () => clearInterval(id);
  }, [lockedUntil]);
  const until = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : lang, { hour: '2-digit', minute: '2-digit' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setTouched(true); setFormError(null);
    if (lockedUntil || Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      if (mode === 'signin') await auth.signIn(email, password); else await auth.register(name, email, password, username.trim() || undefined);
      navigate(next, { replace: true });
    } catch (err) {
      setPassword('');
      if (err instanceof AuthError) {
        if (err.code === 'locked') { setNow(Date.now()); setFormError(null); }
        else if (err.code === 'invalid_credentials') setFormError({ key: 'account:signin.errCredentials', params: err.attemptsLeft !== undefined && err.attemptsLeft <= 2 ? { left: err.attemptsLeft } : undefined });
        else setFormError({ key: 'account:signin.errRegister' });
      } else setFormError({ key: 'account:signin.errGeneric' });
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="page"><section className="block" style={{ maxWidth: 560, marginInline: 'auto', width: '100%' }}>
        <Notice tone="ok" icon="check">{t('account:signin.already', { email: user.email })}</Notice>
        <div className="chip-row"><Link className="btn solid sm" to="/account">{t('account:title')}</Link><button type="button" className="btn ghost sm" onClick={() => auth.signOut()}>{t('account:security.signOut')}</button></div>
      </section></div>
    );
  }

  return (
    <div className="page">
      <section className="auth">
        <div className="pic"><Media id="safari-crew" sizes="520px" priority alt={t('account:signin.photoAlt')} /></div>
        <form onSubmit={submit} noValidate>
          <h1>{mode === 'signin' ? t('account:signin.welcome') : t('account:signin.create')}</h1>
          <p style={{ color: 'var(--muted)' }}>{t('account:signin.why')}</p>
          <button type="button" className="btn google-btn" disabled={busy} onClick={async () => { setBusy(true); await auth.signInWithGoogle(); navigate(next, { replace: true }); }}>
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.4 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" /><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z" /></svg>
            {t('account:signin.google')}
          </button>
          <div className="divider">{t('account:signin.or')}</div>
          {lockedUntil && <Notice tone="warn" icon="shield">{t('account:signin.locked', { time: until(lockedUntil), count: loginGuard.maxAttempts() })}</Notice>}
          {formError && <div role="alert"><Notice tone="warn">{t(formError.key)}{formError.params ? ` ${t('account:signin.attemptsLeft', { count: formError.params.left as number })}` : ''}</Notice></div>}
          {mode === 'register' && <label className="field"><span>{t('account:signin.name')}</span><input value={name} maxLength={80} autoComplete="name" onChange={e => setName(e.target.value)} aria-invalid={touched && errs.name} />{touched && errs.name && <span className="err">{t('trip:book.errRequired')}</span>}</label>}
          {mode === 'signin' ? (
            <label className="field"><span>{t('account:signin.identifier')}</span><input value={email} maxLength={254} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={e => setEmail(e.target.value)} aria-invalid={touched && errs.email} disabled={!!lockedUntil} />{touched && errs.email && <span className="err">{t('account:signin.errIdentifier')}</span>}</label>
          ) : (
            <>
              <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={email} maxLength={254} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} onChange={e => setEmail(e.target.value)} aria-invalid={touched && errs.email} />{touched && errs.email && <span className="err">{t('trip:book.errEmail')}</span>}</label>
              <label className="field"><span>{t('account:signin.username')}</span><input value={username} maxLength={30} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={e => setUsername(e.target.value)} aria-invalid={touched && errs.username} /><span className="hint">{t('account:signin.usernameHint')}</span>{touched && errs.username && <span className="err">{t('account:signin.errUsername')}</span>}</label>
            </>
          )}
          <label className="field"><span>{t('account:signin.password')}</span><input type="password" value={password} maxLength={PASSWORD_MAX} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} onChange={e => setPassword(e.target.value)} aria-invalid={touched && errs.password} disabled={!!lockedUntil} />{mode === 'register' && <span className="hint">{t('account:signin.passwordHint')}</span>}{touched && errs.password && <span className="err">{t(mode === 'signin' ? 'trip:book.errRequired' : 'account:signin.errPassword')}</span>}</label>
          <button type="submit" className="btn solid" disabled={busy || !!lockedUntil}>{busy ? t('account:signin.working') : mode === 'signin' ? t('common:nav.signIn') : t('account:signin.register')}</button>
          <p style={{ fontSize: 'var(--fs-small)' }}>
            {mode === 'signin' ? t('account:signin.noAccount') : t('account:signin.haveAccount')}{' '}
            <button type="button" className="tlink" onClick={() => { setMode(m => (m === 'signin' ? 'register' : 'signin')); setTouched(false); setFormError(null); }}><span>{mode === 'signin' ? t('account:signin.register') : t('common:nav.signIn')}</span></button>
          </p>
          <Notice icon="info">{t('account:signin.demo')}</Notice>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{t('account:signin.terms')} <Link to="/terms">{t('common:footer.links.terms')}</Link> · <Link to="/privacy">{t('common:footer.links.privacy')}</Link> · <Link to="/partners">{t('account:signin.partner')}</Link></p>
        </form>
      </section>
    </div>
  );
}
