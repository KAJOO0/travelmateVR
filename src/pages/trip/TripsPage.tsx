import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { StatusPill } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { tripStatus, tripTotals, useTrips } from '@/services/trips';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { money } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel } from '@/features/trips/format';
import type { Trip } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

export default function TripsPage() {
  const { t } = useTranslation(['trip', 'common']);
  usePageTitle(t('trip:trips.title'));
  const list = useTrips();
  const groups: { key: ReturnType<typeof tripStatus>; items: Trip[] }[] = (['ongoing', 'upcoming', 'draft', 'past'] as const).map(key => ({ key, items: list.filter(x => tripStatus(x) === key) }));
  return (
    <div className="page">
      <section className="block">
        <div className="head-row">
          <div className="page-head"><span className="eyebrow">{t('common:nav.trips')}</span><h1>{t('trip:trips.title')}</h1><p className="lede">{t('trip:trips.text')}</p></div>
          <Link className="btn solid" to="/plan"><Icon name="sparkles" />{t('common:cta.planJourney')}</Link>
        </div>
        {list.length === 0 && <EmptyState icon="suitcase" title={t('trip:trips.emptyTitle')} text={t('trip:trips.emptyText')} action={<Link className="btn solid sm" to="/plan">{t('common:cta.planJourney')}</Link>} />}
        {groups.filter(g => g.items.length).map(g => (
          <div key={g.key} className="group" style={{ display: 'grid', gap: 14 }}>
            <h2 className="group-title">{t(`trip:trips.group.${g.key}`)}</h2>
            <div className="grid3">{g.items.map(tr => <TripCard key={tr.id} trip={tr} />)}</div>
          </div>
        ))}
        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}><Icon name="wifiOff" width={14} height={14} /> {t('trip:trips.offline')}</p>
      </section>
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const { t } = useTranslation(['trip', 'common']);
  const lang = useLocale();
  const d = seedIndex.destById.get(trip.destinationIds[0] ?? '');
  return (
    <article className="card lcard">
      <div className="pic">{d && <Media id={d.media} sizes="400px" decorative />}<div className="badges"><StatusPill status={tripStatus(trip)} />{trip.sample && <span className="sample">{t('common:badges.sampleData')}</span>}</div></div>
      <div className="body">
        <h3><Link to={`/trips/${trip.id}`}>{trip.name}</Link></h3>
        <div className="meta">
          <span><Icon name="calendar" />{trip.startDate ? `${dateLabel(trip.startDate, lang)} → ${dateLabel(trip.endDate, lang)}` : t('trip:daysCount', { count: trip.days.length })}</span>
          <span><Icon name="pin" />{trip.destinationIds.map(id => seedIndex.destById.get(id)?.name).filter(Boolean).join(', ')}</span>
        </div>
        <div className="price">
          <span className="price-tag"><small>{t('trip:cost.estimate')} </small><b>{money(tripTotals(trip).total, lang)}</b></span>
          <Link className="tlink" style={{ position: 'relative', zIndex: 2 }} to={`/plan/${trip.id}`}><span>{t('trip:trips.edit')}</span><Icon name="arrowRight" /></Link>
        </div>
      </div>
    </article>
  );
}
