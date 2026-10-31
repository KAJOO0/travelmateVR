import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { boardAnalytics, boardDestinations } from '@/services/board';
import { lastMonths } from '@/services/businessAnalytics';
import { useDestinationEdits } from '@/services/board';

export function useBoardT() {
  return useTranslation(['board', 'business', 'common', 'explore']);
}

/** Destinations in the board's area and the (sample) analytics for the last 12 months. */
export function useBoardData() {
  const edits = useDestinationEdits();
  return useMemo(() => {
    void edits;
    const destinations = boardDestinations();
    const months = lastMonths(12);
    return { destinations, months, ...boardAnalytics(destinations, months) };
  }, [edits]);
}
