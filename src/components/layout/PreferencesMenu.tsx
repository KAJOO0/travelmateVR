import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LANGUAGES } from '@/i18n';
import { useDismiss } from '@/lib/hooks';
import { usePreferences, type ThemeMode } from '@/app/providers/PreferencesProvider';

const THEMES: { mode: ThemeMode; icon: IconName }[] = [
  { mode: 'dark', icon: 'moon' },
  { mode: 'light', icon: 'sun' },
  { mode: 'system', icon: 'monitor' }
];

/** Language, display theme and currency in one place (globe button in the header). */
export function PreferencesMenu() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, currency, currencies, setCurrency } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close, btn);
  const lang = i18n.resolvedLanguage ?? 'en';

  return (
    <div className="pop-anchor" ref={ref}>
      <button
        ref={btn}
        type="button"
        className="icon-btn"
        aria-label={t('prefs.title')}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="globe" />
      </button>
      {open && (
        <div className="popover prefs" role="dialog" aria-label={t('prefs.title')}>
          <div>
            <h3 id="pref-lang">{t('prefs.language')}</h3>
            <ul className="menu-list" role="radiogroup" aria-labelledby="pref-lang">
              {LANGUAGES.map(l => (
                <li key={l.code}>
                  <button type="button" role="radio" aria-checked={lang === l.code} lang={l.code} onClick={() => void i18n.changeLanguage(l.code)}>
                    <span><b>{l.native}</b>{l.code !== lang && <small lang="en">{l.english}</small>}</span>
                    {lang === l.code && <Icon name="check" className="tick" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 id="pref-theme">{t('prefs.display')}</h3>
            <div className="seg" role="radiogroup" aria-labelledby="pref-theme">
              {THEMES.map(x => (
                <button key={x.mode} type="button" role="radio" aria-checked={theme === x.mode} onClick={() => setTheme(x.mode)}>
                  <Icon name={x.icon} /> {t(`prefs.theme.${x.mode}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 id="pref-cur">{t('prefs.currency')}</h3>
            <div className="seg" role="radiogroup" aria-labelledby="pref-cur" style={{ gridTemplateColumns: `repeat(${currencies.length}, minmax(0, 1fr))` }}>
              {currencies.map(c => (
                <button key={c} type="button" role="radio" aria-checked={currency === c} onClick={() => setCurrency(c)}>
                  {c} $
                </button>
              ))}
            </div>
            <p className="note" style={{ marginTop: 8 }}>{t('prefs.currencyNote')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
