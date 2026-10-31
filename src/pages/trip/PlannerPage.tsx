import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Counter } from '@/components/ui/Counter';
import { StatusPill } from '@/components/ui/bits';
import { ai } from '@/services/ai';
import { seedIndex } from '@/services/catalog';
import { emptyDay, trips, tripStatus, tripTotals, useTrips } from '@/services/trips';
import { useProfile } from '@/services/account';
import { useLocale } from '@/i18n/useLocale';
import { money } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel, nightsBetween } from '@/features/trips/format';
import type { InterestTag } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

const INTERESTS: InterestTag[] = ['wildlife', 'beach', 'culture', 'mountain', 'adventure', 'eco', 'family', 'luxury', 'lake'];
const todayPlus = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

/** "Plan My Journey": create a trip (manually or with AI) and see existing trips. */
export default function PlannerPage() {
  const { t } = useTranslation(['trip', 'common']);
  const lang = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const profile = useProfile();
  const list = useTrips();
  usePageTitle(t('trip:plan.title'));
  const pre = params.get('destination');
  const [name, setName] = useState('');
  const [dests, setDests] = useState<string[]>(pre ? [pre] : []);
  const [start, setStart] = useState(todayPlus(45));
  const [end, setEnd] = useState(todayPlus(51));
  const [adults, setAdults] = useState(profile.adults || 2);
  const [children, setChildren] = useState(profile.children || 0);
  const [budget, setBudget] = useState<number | ''>('');
  const [interests, setInterests] = useState<InterestTag[]>(profile.interests);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const days = Math.min(21, nightsBetween(start, end) + 1);
  const valid = end >= start && start >= todayPlus(0);

  const autoName = () => name.trim() || (dests.length ? dests.map(id => seedIndex.destById.get(id)?.name).join(' & ') : t('trip:plan.untitled'));

  const startEmpty = () => {
    setTouched(true);
    if (!valid) return;
    const ids = dests.length ? dests : ['zanzibar'];
    const perDest = Math.ceil(days / ids.length);
    const dayList = Array.from({ length: days }, (_, i) => emptyDay(ids[Math.min(ids.length - 1, Math.floor(i / perDest))]!, new Date(new Date(start).getTime() + i * 86400000).toISOString().slice(0, 10)));
    const trip = trips.create({ name: autoName(), destinationIds: ids, startDate: start, endDate: end, adults, children, budgetUsd: budget || undefined, interests, days: dayList, source: 'manual' });
    navigate(`/plan/${trip.id}`);
  };

  const generate = async () => {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const placeNames = dests.map(id => seedIndex.destById.get(id)?.name).join(', ');
    const prompt = `${days} days ${placeNames ? `in ${placeNames}` : ''} for ${adults + children} people ${budget ? `under $${budget}` : ''} ${interests.join(' ')}`.trim();
    const plan = await ai.plan({ prompt, profile });
    const shift = (iso: string | undefined, i: number) => (iso ? new Date(new Date(start).getTime() + i * 86400000).toISOString().slice(0, 10) : iso);
    const trip = trips.create({
      name: autoName(), destinationIds: plan.spec.destinationIds, startDate: start, endDate: end, adults, children, budgetUsd: budget || undefined, interests,
      days: plan.days.map((d, i) => ({ ...d, date: shift(d.date, i) })), source: 'ai', prompt
    });
    setBusy(false);
    navigate(`/plan/${trip.id}`);
  };

  return (
    <div className="page">
      <section className="block">
        <div className="page-head">
          <span className="eyebrow">{t('trip:plan.eyebrow')}</span>
          <h1>{t('trip:plan.title')}</h1>
          <p className="lede">{t('trip:plan.text')}</p>
        </div>

        <div className="panel" style={{ display: 'grid', gap: 18 }}>
          <h2 className="group-title">{t('trip:plan.create')}</h2>
          <div className="form-grid">
            <label className="field full"><span>{t('trip:plan.name')}</span><input value={name} onChange={e => setName(e.target.value)} placeholder={t('trip:plan.namePh')} maxLength={80} /></label>
            <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label" style={{ marginBottom: 8 }}>{t('trip:plan.destinations')}</legend>
              <div className="chip-row">
                {seedIndex.destinations.filter(d => seedIndex.countries.find(c => c.id === d.countryId)?.region === 'east-africa' || d.id === pre).map(d => (
                  <button key={d.id} type="button" className="toggle" aria-pressed={dests.includes(d.id)} onClick={() => setDests(x => (x.includes(d.id) ? x.filter(y => y !== d.id) : [...x, d.id]))}>{d.name}</button>
                ))}
              </div>
              <span className="hint">{t('trip:plan.destHint')}</span>
            </fieldset>
            <label className="field"><span>{t('trip:plan.start')}</span><input type="date" value={start} min={todayPlus(1)} onChange={e => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); }} aria-invalid={touched && !valid} /></label>
            <label className="field"><span>{t('trip:plan.end')}</span><input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)} aria-invalid={touched && !valid} /><span className="hint">{t('trip:daysCount', { count: days })}</span></label>
            <div className="field"><span>{t('trip:travellers.adults')}</span><Counter value={adults} min={1} max={20} onChange={setAdults} label={t('trip:travellers.adults')} /></div>
            <div className="field"><span>{t('trip:travellers.children')}</span><Counter value={children} min={0} max={10} onChange={setChildren} label={t('trip:travellers.children')} /></div>
            <label className="field"><span>{t('trip:plan.budget')}</span><input type="number" inputMode="numeric" min={0} step={100} value={budget} onChange={e => setBudget(e.target.value ? Number(e.target.value) : '')} placeholder="USD" /></label>
            <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label" style={{ marginBottom: 8 }}>{t('trip:plan.interests')}</legend>
              <div className="chip-row">{INTERESTS.map(i => <button key={i} type="button" className="toggle" aria-pressed={interests.includes(i)} onClick={() => setInterests(x => (x.includes(i) ? x.filter(y => y !== i) : [...x, i]))}>{t(`common:tags.${i}`)}</button>)}</div>
            </fieldset>
          </div>
          {touched && !valid && <p className="err" style={{ color: 'var(--danger)' }}>{t('trip:plan.errDates')}</p>}
          <div className="chip-row">
            <button type="button" className="btn solid" disabled={busy} onClick={() => void generate()}><Icon name="sparkles" />{busy ? t('trip:ai.creating') : t('trip:plan.generate')}</button>
            <button type="button" className="btn ghost" disabled={busy} onClick={startEmpty}><Icon name="calendar" />{t('trip:plan.empty')}</button>
            <Link className="btn ghost" to="/ai"><Icon name="sparkles" />{t('trip:plan.chat')}</Link>
          </div>
        </div>
      </section>

      {list.length > 0 && (
        <section className="block" aria-labelledby="mine-h">
          <h2 className="sec-title" id="mine-h">{t('trip:plan.yourTrips')}</h2>
          <div className="grid3">
            {list.map(tr => {
              const d = seedIndex.destById.get(tr.destinationIds[0] ?? '');
              const total = tripTotals(tr).total;
              return (
                <article key={tr.id} className="card lcard">
                  <div className="pic">{d && <Media id={d.media} sizes="400px" decorative />}<div className="badges"><StatusPill status={tripStatus(tr)} /></div></div>
                  <div className="body">
                    <h3><Link to={`/plan/${tr.id}`}>{tr.name}</Link></h3>
                    <div className="meta"><span><Icon name="calendar" />{tr.startDate ? `${dateLabel(tr.startDate, lang)} → ${dateLabel(tr.endDate, lang)}` : t('trip:daysCount', { count: tr.days.length })}</span><span><Icon name="users" />{tr.adults + tr.children}</span></div>
                    <div className="price"><span className="price-tag"><small>{t('trip:cost.estimate')} </small><b>{money(total, lang)}</b></span>{tr.source === 'ai' && <span className="sample">AI</span>}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
