import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Sets document.title; null uses the home title. */
export function usePageTitle(title: string | null) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = title ? `${title} · TravelMateVR` : `TravelMateVR — ${t('meta.homeTitle')}`;
  }, [title, t]);
}
