import i18n, { type BackendModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { Locale } from '@/domain/types';

export const LANGUAGES: { code: Locale; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'zh', native: '中文', english: 'Chinese (Mandarin)' },
  { code: 'it', native: 'Italiano', english: 'Italian' }
];
export const NAMESPACES = ['common', 'home', 'explore', 'trip', 'account', 'pages'] as const;

// Locale files live in src/locales/<lang>/<namespace>.json and are split into
// separate chunks, so a visitor only downloads their own language.
const files = import.meta.glob<{ default: Record<string, unknown> }>('../locales/*/*.json');

const bundledBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(lng, ns, cb) {
    const load = files[`../locales/${lng}/${ns}.json`];
    if (!load) return cb(null, {});
    load().then(m => cb(null, m.default)).catch(err => cb(err, null));
  }
};

void i18n
  .use(bundledBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: LANGUAGES.map(l => l.code),
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    ns: [...NAMESPACES],
    defaultNS: 'common',
    fallbackNS: 'common',
    detection: { order: ['querystring', 'localStorage', 'navigator'], lookupQuerystring: 'lng', lookupLocalStorage: 'tm.lang', caches: ['localStorage'] },
    interpolation: { escapeValue: false },
    react: { useSuspense: true }
  });

const syncHtml = (lng: string) => {
  document.documentElement.lang = lng === 'zh' ? 'zh-Hans' : lng;
};
i18n.on('languageChanged', syncHtml);
if (i18n.resolvedLanguage) syncHtml(i18n.resolvedLanguage);

export function currentLocale(): Locale {
  const l = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);
  return (LANGUAGES.some(x => x.code === l) ? l : 'en') as Locale;
}

export default i18n;
