import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Currency } from '@/domain/types';

export type ThemeMode = 'dark' | 'light' | 'system';

interface Prefs {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: ThemeMode) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencies: Currency[];
}

const Ctx = createContext<Prefs | null>(null);
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null;

function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem('tm.theme');
    return v === 'light' || v === 'system' || v === 'dark' ? v : 'dark';
  } catch { return 'dark'; }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);
  const [systemLight, setSystemLight] = useState(() => !!media?.matches);
  const [currency, setCurrencyState] = useState<Currency>('USD');

  useEffect(() => {
    if (!media) return;
    const on = (e: MediaQueryListEvent) => setSystemLight(e.matches);
    media.addEventListener('change', on);
    return () => media.removeEventListener('change', on);
  }, []);

  const resolvedTheme: 'dark' | 'light' = theme === 'system' ? (systemLight ? 'light' : 'dark') : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'light' ? '#f2f7fb' : '#0f2c3f');
  }, [resolvedTheme]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    try { localStorage.setItem('tm.theme', t); } catch { /* ignore */ }
  }, []);

  // USD is the only settlement currency today; the selector is wired for more.
  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, currency, setCurrency, currencies: ['USD'] as Currency[] }),
    [theme, resolvedTheme, setTheme, currency, setCurrency]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePreferences(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePreferences outside provider');
  return v;
}
