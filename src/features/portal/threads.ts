import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { threadStore } from '@/services/account';
import { partnerReadStore, partnerThreadStore, type PartnerThread } from '@/services/business';

/** Conversations for a partner: traveller threads from the app plus the demo's sample guests. */
export function usePartnerThreads(partnerId: string) {
  const live = useStore(threadStore);
  const sample = useStore(partnerThreadStore);
  const read = useStore(partnerReadStore);
  return useMemo(() => {
    const all: PartnerThread[] = [
      ...live.filter(t => t.partnerId === partnerId).map(t => ({ ...t, guest: '' })),
      ...sample.filter(t => t.partnerId === partnerId)
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const isUnread = (t: PartnerThread) => {
      const last = [...t.messages].reverse().find(m => m.from !== 'system');
      if (!last || last.from !== 'me') return false;
      const seen = read[t.id] ?? (t.readByPartner ? t.updatedAt : '');
      return seen < last.at;
    };
    return { threads: all, unread: all.filter(isUnread), isUnread };
  }, [live, sample, read, partnerId]);
}
