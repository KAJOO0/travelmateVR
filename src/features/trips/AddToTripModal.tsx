import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/app/providers/ToastProvider';
import { emptyDay, SLOTS, trips, useTrips } from '@/services/trips';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import type { ItineraryItem, Slot } from '@/domain/types';
import { dayLabel } from './format';

export function AddToTripModal({ item, label, onClose }: { item: Omit<ItineraryItem, 'id'>; label: string; onClose: () => void }) {
  const { t } = useTranslation(['trip', 'common']);
  const lang = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const list = useTrips();
  const [tripId, setTripId] = useState(list[0]?.id ?? '');
  const trip = list.find(x => x.id === tripId);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<Slot>(item.time < '12:00' ? 'morning' : item.time < '17:00' ? 'afternoon' : 'evening');

  const add = () => {
    if (!trip) return;
    trips.addItem(trip.id, Math.min(day, trip.days.length - 1), slot, item);
    toast.show({ icon: 'calendar', text: t('trip:add.added', { trip: trip.name }), action: { label: t('trip:add.open'), to: `/plan/${trip.id}` } });
    onClose();
  };

  const createNew = () => {
    const dest = item.destinationId ?? 'zanzibar';
    const d = emptyDay(dest);
    const created = trips.create({
      name: t('trip:add.newName', { place: seedIndex.destById.get(dest)?.name ?? '' }), destinationIds: [dest], adults: 2, children: 0,
      interests: [], days: [d], source: 'manual'
    });
    trips.addItem(created.id, 0, slot, item);
    onClose();
    navigate(`/plan/${created.id}`);
  };

  return (
    <Modal title={t('trip:add.title', { name: label })} onClose={onClose}>
      {list.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{t('trip:add.noTrips')}</p>
      ) : (
        <div className="form-grid">
          <label className="field full">
            <span>{t('trip:add.trip')}</span>
            <select value={tripId} onChange={e => { setTripId(e.target.value); setDay(0); }}>
              {list.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('trip:add.day')}</span>
            <select value={day} onChange={e => setDay(Number(e.target.value))}>
              {trip?.days.map((d, i) => <option key={i} value={i}>{dayLabel(t, i, d.date, lang)} · {seedIndex.destById.get(d.destinationId)?.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('trip:add.slot')}</span>
            <select value={slot} onChange={e => setSlot(e.target.value as Slot)}>
              {SLOTS.map(s => <option key={s} value={s}>{t(`trip:slot.${s}`)}</option>)}
            </select>
          </label>
        </div>
      )}
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn ghost sm" onClick={createNew}><Icon name="sparkles" />{t('trip:add.createNew')}</button>
        {list.length > 0 && <button type="button" className="btn solid sm" onClick={add}><Icon name="calendar" />{t('trip:add.confirm')}</button>}
      </div>
    </Modal>
  );
}
