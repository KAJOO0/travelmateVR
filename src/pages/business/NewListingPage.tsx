import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT } from '@/features/portal/shared';
import { inventory, useDrafts, type ListingDraft } from '@/services/inventory';
import { seedIndex } from '@/services/catalog';
import { LANGUAGES } from '@/i18n';
import type { ListingType, Locale, PriceUnit } from '@/domain/types';

const TYPES: ListingType[] = ['stay', 'safari', 'activity', 'local', 'restaurant', 'transport', 'event'];
const SUBTYPES: Record<ListingType, string[]> = {
  stay: ['hotel', 'lodge', 'camp', 'guesthouse', 'resort', 'villa'], safari: ['day', 'private', 'group', 'luxury'],
  activity: ['hiking', 'water', 'cultural', 'diving', 'adventure'], local: ['culture', 'tour', 'food', 'craft'],
  restaurant: ['swahili', 'seafood', 'bush'], transport: ['transfer', 'driver', 'car', 'boat', 'flight'], event: ['music', 'market', 'festival', 'cruise']
};
const UNITS: Record<ListingType, PriceUnit[]> = {
  stay: ['night'], safari: ['person', 'vehicle', 'group'], activity: ['person', 'group'], local: ['person', 'group'],
  restaurant: ['person'], transport: ['vehicle', 'seat'], event: ['ticket', 'person']
};

export default function BusinessNewListingPage() {
  const { t } = useBizT();
  const toast = useToast();
  const navigate = useNavigate();
  const { partner } = usePartnerOrg();
  const [params] = useSearchParams();
  const existing = useDrafts().find(d => d.id === params.get('draft'));
  const [d, setD] = useState<Omit<ListingDraft, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'partnerId'>>(() => existing ?? {
    type: 'stay', subtype: 'lodge', title: '', summary: '', description: '', destinationId: partner.destinationIds[0] ?? 'serengeti',
    priceUsd: 0, unit: 'night', capacity: 2, units: 6, lang: 'en'
  });
  const [touched, setTouched] = useState(false);
  const up = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD(s => ({ ...s, [k]: v }));
  const errs = { title: d.title.trim().length < 4, summary: d.summary.trim().length < 10, description: d.description.trim().length < 40, price: d.priceUsd <= 0 };
  const invalid = Object.values(errs).some(Boolean);

  const save = (submit: boolean) => {
    setTouched(true);
    if (submit && invalid) return;
    inventory.saveDraft({ ...d, id: existing?.id, partnerId: partner.id, status: submit ? 'in_review' : 'draft' });
    toast.show({ icon: 'check', text: t(submit ? 'business:newListing.submitted' : 'business:newListing.draftSaved') });
    navigate('/business/listings');
  };
  const destinations = [...partner.destinationIds.map(id => seedIndex.destById.get(id)!), ...seedIndex.destinations.filter(x => !partner.destinationIds.includes(x.id))];

  return (
    <>
      <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/business/listings">{t('business:nav.listings')}</Link></li><li aria-current="page">{t('business:listings.new')}</li></ol></nav>
      <PortalHead title={t('business:listings.new')} text={t('business:newListing.text')} />
      <form className="panel" style={{ display: 'grid', gap: 16 }} onSubmit={e => { e.preventDefault(); save(true); }} noValidate>
        <div className="form-grid">
          <label className="field"><span>{t('business:listings.type')}</span>
            <select value={d.type} onChange={e => { const type = e.target.value as ListingType; setD(s => ({ ...s, type, subtype: SUBTYPES[type][0]!, unit: UNITS[type][0]! })); }}>
              {TYPES.map(x => <option key={x} value={x}>{t(`common:listingType.${x}`)}</option>)}
            </select></label>
          <label className="field"><span>{t('business:newListing.subtype')}</span>
            <select value={d.subtype} onChange={e => up('subtype', e.target.value)}>{SUBTYPES[d.type].map(x => <option key={x} value={x}>{t(`common:subtype.${x}`)}</option>)}</select></label>
          <label className="field"><span>{t('explore:filters.destination')}</span>
            <select value={d.destinationId} onChange={e => up('destinationId', e.target.value)}>{destinations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="field"><span>{t('business:listing.editLang')}</span>
            <select value={d.lang} onChange={e => up('lang', e.target.value as Locale)}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select></label>
          <label className="field full"><span>{t('business:listing.title')}</span><input value={d.title} maxLength={90} onChange={e => up('title', e.target.value)} aria-invalid={touched && errs.title} />{touched && errs.title && <span className="err">{t('business:newListing.errTitle')}</span>}</label>
          <label className="field full"><span>{t('business:listing.summary')}</span><input value={d.summary} maxLength={160} onChange={e => up('summary', e.target.value)} aria-invalid={touched && errs.summary} />{touched && errs.summary && <span className="err">{t('business:newListing.errSummary')}</span>}</label>
          <label className="field full"><span>{t('business:listing.description')}</span><textarea rows={6} value={d.description} onChange={e => up('description', e.target.value)} aria-invalid={touched && errs.description} />{touched && errs.description && <span className="err">{t('business:newListing.errDescription')}</span>}</label>
          <label className="field"><span>{t('business:newListing.price')}</span><input type="number" min={0} value={d.priceUsd || ''} onChange={e => up('priceUsd', Number(e.target.value))} aria-invalid={touched && errs.price} />{touched && errs.price && <span className="err">{t('business:newListing.errPrice')}</span>}</label>
          <label className="field"><span>{t('business:newListing.unit')}</span>
            <select value={d.unit} onChange={e => up('unit', e.target.value as PriceUnit)}>{UNITS[d.type].map(u => <option key={u} value={u}>{t(`common:price.unit.${u}`)}</option>)}</select></label>
          <label className="field"><span>{d.type === 'stay' ? t('business:listing.capacityRoom') : t('business:listing.capacityGroup')}</span><input type="number" min={1} value={d.capacity} onChange={e => up('capacity', Math.max(1, Number(e.target.value)))} /></label>
          <label className="field"><span>{t('business:listing.units')}</span><input type="number" min={1} value={d.units} onChange={e => up('units', Math.max(1, Number(e.target.value)))} /></label>
        </div>
        <Notice icon="info">{t('business:newListing.reviewNote')}</Notice>
        <div className="row-between" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn ghost" onClick={() => save(false)}>{t('business:newListing.saveDraft')}</button>
          <button type="submit" className="btn solid"><Icon name="check" />{t('business:newListing.submit')}</button>
        </div>
      </form>
    </>
  );
}
