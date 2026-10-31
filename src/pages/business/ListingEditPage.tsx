import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT, useFmt, usePartnerListings } from '@/features/portal/shared';
import { PriceBreakdownView } from '@/features/booking/PriceBreakdownView';
import { AvailabilityCalendar } from './CalendarPage';
import { defaultUnits, inventory, useOverrides, usePromotions, useSeasonal } from '@/services/inventory';
import { quote } from '@/services/pricing';
import { LANGUAGES } from '@/i18n';
import { addDays, todayIso } from '@/lib/random';
import { monthName } from '@/lib/format';
import type { Cancellation, Listing, Locale } from '@/domain/types';

export const AMENITIES = ['ensuite', 'meals', 'breakfast', 'dinner', 'guide', 'solar', 'wifi', 'wifi_limited', 'laundry', 'pool', 'family', 'ac', 'beach', 'accessible', 'restaurant', 'parking', 'vehicle', 'park_fees', 'water', 'equipment', 'vegetarian', 'halal', 'meet_greet'];
const TABS = ['details', 'pricing', 'availability', 'offers'] as const;
type Tab = (typeof TABS)[number];

function DetailsTab({ listing }: { listing: Listing }) {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const [lang, setLang] = useState<Locale>(f.lang as Locale);
  const text = (k: 'title' | 'summary' | 'description') => (listing[k] as Record<string, string | undefined>)[lang] ?? '';
  const [form, setForm] = useState(() => ({
    title: text('title'), summary: text('summary'), description: text('description'),
    amenities: listing.amenities, cancellation: listing.cancellation, instantBook: listing.instantBook,
    capacity: listing.capacity ?? 2, startTimes: (listing.startTimes ?? []).join(', '), closedMonths: listing.closedMonths ?? []
  }));
  const switchLang = (l: Locale) => {
    setLang(l);
    const pick = (k: 'title' | 'summary' | 'description') => (listing[k] as Record<string, string | undefined>)[l] ?? '';
    setForm(s => ({ ...s, title: pick('title'), summary: pick('summary'), description: pick('description') }));
  };
  const up = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(s => ({ ...s, [k]: v }));
  const save = () => {
    inventory.update(listing.id, {
      ...(form.title.trim() ? { title: { [lang]: form.title.trim() } } : {}),
      ...(form.summary.trim() ? { summary: { [lang]: form.summary.trim() } } : {}),
      ...(form.description.trim() ? { description: { [lang]: form.description.trim() } } : {}),
      amenities: form.amenities, cancellation: form.cancellation, instantBook: form.instantBook, capacity: form.capacity,
      startTimes: form.startTimes.split(',').map(s => s.trim()).filter(s => /^\d{1,2}:\d{2}$/.test(s)), closedMonths: form.closedMonths
    });
    toast.show({ icon: 'check', text: t('business:listing.saved') });
  };
  const en = (k: 'title' | 'summary' | 'description') => listing[k].en;

  return (
    <form className="panel" style={{ display: 'grid', gap: 18 }} onSubmit={e => { e.preventDefault(); save(); }}>
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <h2>{t('business:listing.content')}</h2>
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <span>{t('business:listing.editLang')}</span>
          <select value={lang} onChange={e => switchLang(e.target.value as Locale)}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select>
        </label>
      </div>
      <p className="small muted">{t('business:listing.langHint')}</p>
      <label className="field"><span>{t('business:listing.title')}</span><input value={form.title} maxLength={90} placeholder={en('title')} onChange={e => up('title', e.target.value)} /></label>
      <label className="field"><span>{t('business:listing.summary')}</span><input value={form.summary} maxLength={160} placeholder={en('summary')} onChange={e => up('summary', e.target.value)} /><span className="hint">{t('business:listing.summaryHint')}</span></label>
      <label className="field"><span>{t('business:listing.description')}</span><textarea rows={6} value={form.description} placeholder={en('description')} onChange={e => up('description', e.target.value)} /></label>

      <fieldset className="field" style={{ border: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>{t('explore:listing.amenities')}</legend>
        <div className="checks">
          {[...new Set([...AMENITIES, ...listing.amenities])].map(a => (
            <label key={a} className="check"><input type="checkbox" checked={form.amenities.includes(a)} onChange={e => up('amenities', e.target.checked ? [...form.amenities, a] : form.amenities.filter(x => x !== a))} />{t(`common:amenity.${a}`)}</label>
          ))}
        </div>
      </fieldset>

      <div className="form-grid">
        <label className="field"><span>{t('explore:listing.cancellation')}</span>
          <select value={form.cancellation} onChange={e => up('cancellation', e.target.value as Cancellation)}>
            {(['flexible', 'moderate', 'strict'] as const).map(c => <option key={c} value={c}>{t(`explore:cancellationShort.${c}`)}</option>)}
          </select>
        </label>
        <label className="field"><span>{listing.type === 'stay' ? t('business:listing.capacityRoom') : t('business:listing.capacityGroup')}</span>
          <input type="number" min={1} max={500} value={form.capacity} onChange={e => up('capacity', Math.max(1, Number(e.target.value)))} />
        </label>
        {listing.type !== 'stay' && <label className="field full"><span>{t('explore:listing.startTimes')}</span><input value={form.startTimes} placeholder="07:00, 15:00" onChange={e => up('startTimes', e.target.value)} /></label>}
      </div>

      <fieldset className="field" style={{ border: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>{t('business:listing.bookingMode')}</legend>
        <div className="checks" role="radiogroup">
          <label className="check"><input type="radio" name="mode" checked={form.instantBook} onChange={() => up('instantBook', true)} />{t('explore:listing.instant')}</label>
          <label className="check"><input type="radio" name="mode" checked={!form.instantBook} onChange={() => up('instantBook', false)} />{t('business:listings.request')}</label>
        </div>
        <span className="hint">{t('business:listing.bookingModeHint')}</span>
      </fieldset>

      <fieldset className="field" style={{ border: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>{t('business:listing.closedMonths')}</legend>
        <div className="checks">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <label key={m} className="check"><input type="checkbox" checked={form.closedMonths.includes(m)} onChange={e => up('closedMonths', e.target.checked ? [...form.closedMonths, m] : form.closedMonths.filter(x => x !== m))} />{monthName(m, f.lang)}</label>
          ))}
        </div>
      </fieldset>

      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn ghost sm" onClick={() => { inventory.reset(listing.id); toast.show({ icon: 'refresh', text: t('business:listing.reverted') }); }}><Icon name="refresh" />{t('business:listing.revert')}</button>
        <button type="submit" className="btn solid"><Icon name="check" />{t('business:listing.publish')}</button>
      </div>
    </form>
  );
}

function PricingTab({ listing }: { listing: Listing }) {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const overrides = useOverrides();
  const rates = useSeasonal().filter(r => r.listingId === listing.id);
  const [price, setPrice] = useState(listing.price.amountUsd);
  const [units, setUnits] = useState(overrides[listing.id]?.units ?? defaultUnits(listing));
  const [rate, setRate] = useState({ from: addDays(todayIso(), 30), to: addDays(todayIso(), 60), priceUsd: Math.round(listing.price.amountUsd * 1.2), label: '' });
  const sample = useMemo(() => quote({ listing: { ...listing, price: { ...listing.price, amountUsd: price } }, adults: 2, children: 0, nights: 2, units: 1, extras: [], date: addDays(todayIso(), 14) }), [listing, price]);
  const rateErr = rate.to < rate.from || rate.priceUsd <= 0;

  return (
    <div className="p-grid2">
      <form className="panel" style={{ display: 'grid', gap: 14, alignContent: 'start' }} onSubmit={e => { e.preventDefault(); inventory.update(listing.id, { priceUsd: price, units }); toast.show({ icon: 'check', text: t('business:listing.saved') }); }}>
        <h2>{t('business:listing.basePricing')}</h2>
        <label className="field"><span>{t('business:listing.basePrice', { unit: t(`common:price.unit.${listing.price.unit}`) })}</span>
          <input type="number" min={0} step={1} value={price} onChange={e => setPrice(Math.max(0, Number(e.target.value)))} /></label>
        <label className="field"><span>{t('business:listing.units')}</span>
          <input type="number" min={1} max={1000} value={units} onChange={e => setUnits(Math.max(1, Number(e.target.value)))} />
          <span className="hint">{t(`business:listing.unitsHint.${listing.type === 'stay' ? 'stay' : listing.price.unit === 'person' ? 'person' : 'other'}`)}</span></label>
        {listing.price.indicative && <Notice icon="info">{t('business:listing.indicative')}</Notice>}
        <button type="submit" className="btn solid"><Icon name="check" />{t('business:listing.publish')}</button>
        <h3 style={{ marginTop: 8 }}>{t('business:listing.exampleQuote')}</h3>
        <PriceBreakdownView price={sample} />
      </form>
      <div className="panel" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <h2>{t('business:listing.seasonal')}</h2>
        <p className="small muted">{t('business:listing.seasonalHint')}</p>
        {rates.length ? (
          <ul className="list">{rates.map(r => (
            <li key={r.id} className="list-item">
              <span className="grow"><b>{r.label || t('business:listing.seasonalRate')}</b><small>{f.d(r.from)} → {f.d(r.to)} · {f.m(r.priceUsd)} / {t(`common:price.unit.${listing.price.unit}`)}</small></span>
              <button type="button" className="icon-btn" onClick={() => inventory.removeSeasonal(r.id)} aria-label={t('business:common.delete')}><Icon name="trash" /></button>
            </li>
          ))}</ul>
        ) : <p className="muted">{t('business:listing.noSeasonal')}</p>}
        <form style={{ display: 'grid', gap: 10 }} onSubmit={e => { e.preventDefault(); if (rateErr) return; inventory.addSeasonal({ listingId: listing.id, ...rate, label: rate.label.trim() || undefined }); toast.show({ icon: 'check', text: t('business:listing.rateAdded') }); }}>
          <div className="form-grid">
            <label className="field"><span>{t('business:common.from')}</span><input type="date" value={rate.from} min={todayIso()} onChange={e => setRate(r => ({ ...r, from: e.target.value }))} /></label>
            <label className="field"><span>{t('business:common.to')}</span><input type="date" value={rate.to} min={rate.from} onChange={e => setRate(r => ({ ...r, to: e.target.value }))} aria-invalid={rate.to < rate.from} /></label>
            <label className="field"><span>{t('business:listing.ratePrice')}</span><input type="number" min={1} value={rate.priceUsd} onChange={e => setRate(r => ({ ...r, priceUsd: Number(e.target.value) }))} /></label>
            <label className="field"><span>{t('business:listing.rateLabel')}</span><input value={rate.label} placeholder={t('business:listing.rateLabelPh')} onChange={e => setRate(r => ({ ...r, label: e.target.value }))} /></label>
          </div>
          {rate.to < rate.from && <span className="err small">{t('business:common.errDates')}</span>}
          <button type="submit" className="btn ghost sm" disabled={rateErr}><Icon name="plus" />{t('business:listing.addRate')}</button>
        </form>
      </div>
    </div>
  );
}

function OffersTab({ listing }: { listing: Listing }) {
  const { t } = useBizT();
  const f = useFmt();
  const promos = usePromotions().filter(p => p.listingIds.includes(listing.id));
  return (
    <div className="panel" style={{ display: 'grid', gap: 12 }}>
      <div className="panel-head"><h2>{t('business:marketing.promotions')}</h2><Link className="btn ghost sm" to="/business/marketing"><Icon name="plus" />{t('business:marketing.newPromotion')}</Link></div>
      {promos.length ? <ul className="list">{promos.map(p => (
        <li key={p.id} className="list-item"><span className="grow"><b>{p.name} · −{p.percent}%</b><small>{f.d(p.from)} → {f.d(p.to)}</small></span><span className={`status ${p.active ? 'paid' : 'draft'}`}>{p.active ? t('business:common.active') : t('business:common.inactive')}</span></li>
      ))}</ul> : <p className="muted">{t('business:marketing.noPromotions')}</p>}
    </div>
  );
}

export default function BusinessListingEditPage() {
  const { t } = useBizT();
  const f = useFmt();
  const { id } = useParams();
  const { partner } = usePartnerOrg();
  const listing = usePartnerListings(partner.id).find(l => l.id === id);
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'details') as Tab;
  if (!listing) return <NotFoundState title={t('explore:listing.notFound')} to="/business/listings" label={t('business:nav.listings')} />;
  const title = (listing.title as Record<string, string>)[f.lang] ?? listing.title.en;

  return (
    <>
      <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/business/listings">{t('business:nav.listings')}</Link></li><li aria-current="page">{title}</li></ol></nav>
      <PortalHead title={title} text={listing.paused ? t('business:listing.pausedNote') : t('business:listing.text')}
        actions={<Link className="btn ghost sm" to={`/listing/${listing.slug}`}><Icon name="external" />{t('business:listing.viewPublic')}</Link>} />
      <div className="tabs" role="tablist" aria-label={t('business:listing.sections')}>
        {TABS.map(k => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}>{t(`business:listing.tab.${k}`)}</button>)}
      </div>
      {tab === 'details' && <DetailsTab key={listing.id} listing={listing} />}
      {tab === 'pricing' && <PricingTab key={listing.id} listing={listing} />}
      {tab === 'availability' && <div className="panel"><AvailabilityCalendar listingId={listing.id} partnerId={partner.id} compact /></div>}
      {tab === 'offers' && <OffersTab listing={listing} />}
    </>
  );
}
