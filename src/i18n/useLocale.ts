import { useTranslation } from 'react-i18next';
import type { Locale } from '@/domain/types';
import { LANGUAGES } from './index';

export function useLocale(): Locale {
  const { i18n } = useTranslation();
  const l = (i18n.resolvedLanguage || 'en').slice(0, 2);
  return (LANGUAGES.some(x => x.code === l) ? l : 'en') as Locale;
}
