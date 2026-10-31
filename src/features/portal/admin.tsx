import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Notice } from '@/components/ui/bits';
import { usePortal } from '@/components/portal/PortalLayout';
import { canWrite, type AdminSection } from '@/services/admin';
import { useStore } from '@/lib/store';
import { bookingStore, partnerBookingStore } from '@/services/bookings';
import type { Booking } from '@/domain/types';

export function useAdminT() {
  return useTranslation(['admin', 'business', 'common', 'explore', 'trip', 'account', 'board']);
}

/** The signed-in admin's role and whether they may change things in a section. */
export function useAdmin(section: AdminSection) {
  const { adminRole, user } = usePortal();
  return { role: adminRole, user, write: canWrite(adminRole, section) };
}

/** Shown on sections the current role can view but not change. */
export function ReadOnly({ show }: { show: boolean }) {
  const { t } = useAdminT();
  return show ? <Notice icon="shield">{t('admin:readOnly')}</Notice> : null;
}

/** All bookings on the platform (this device's travellers + the demo partner's sample guests). */
export function useAllBookings(): (Booking & { sample?: boolean })[] {
  const own = useStore(bookingStore);
  const sample = useStore(partnerBookingStore);
  return useMemo(() => [...own, ...sample.map(b => ({ ...b, sample: true }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [own, sample]);
}
