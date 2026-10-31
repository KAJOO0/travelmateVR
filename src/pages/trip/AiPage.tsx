import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Content, Notice } from '@/components/ui/bits';
import { IntentChips } from '@/features/search/SmartSearch';
import { respond, type AiAnswer, type PlanSpec, type TripPlan } from '@/services/ai';
import { seedIndex } from '@/services/catalog';
import { trips, SLOTS, useTrips } from '@/services/trips';
import { useProfile, hasProfile } from '@/services/account';
import { CLIMATE } from '@/data/seed/reference';
import { useLocale } from '@/i18n/useLocale';
import { useToast } from '@/app/providers/ToastProvider';
import { countryName, lt } from '@/lib/content';
import { money, monthName } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { itemTitle } from '@/features/trips/format';
import { uid } from '@/lib/store';
import { aiTelemetry, useAiLog } from '@/services/aiTelemetry';
import { feature, usePlatform } from '@/services/platform';
import { byFormat } from '@/lib/immersive';
import '@/styles/home.css';
import '@/styles/pages.css';

interface Msg { id: string; role: 'user' | 'ai'; text?: string; answer?: AiAnswer & { logId?: string }; error?: boolean }
const KEY = 'tm.aiChat';
const EXAMPLES = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5'];

export default function AiPage() {
  const { t } = useTranslation(['trip', 'common']);
  const profile = useProfile();
  const [params, setParams] = useSearchParams();
  usePageTitle(t('common:nav.ai'));
  const [msgs, setMsgs] = useState<Msg[]>(() => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); } catch { return []; } });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const aiOn = usePlatform().flags.aiPlanner;
  const input = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-20))); } catch { /* ignore */ } }, [msgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length, busy]);

  const lastSpec = (): PlanSpec | undefined => {
    for (let i = msgs.length - 1; i >= 0; i--) { const a = msgs[i]!.answer; if (a?.type === 'plan') return a.plan.spec; }
    return undefined;
  };

  const send = async (prompt: string, variant = 0, previous = lastSpec()) => {
    const p = prompt.trim();
    if (!p || busy || !feature('aiPlanner')) return;
    setMsgs(m => [...m, { id: uid('m'), role: 'user', text: p }]);
    setText('');
    setBusy(true);
    try {
      const answer = await respond({ prompt: p, previous, profile: profile.consentPersonalisation ? profile : undefined, variant });
      setMsgs(m => [...m, { id: uid('m'), role: 'ai', answer }]);
    } catch {
      setMsgs(m => [...m, { id: uid('m'), role: 'ai', error: true, text: p }]);
    } finally {
      setBusy(false);
    }
  };

  // Deep link: /ai?q=… starts a conversation.
  useEffect(() => {
    const q = params.get('q');
    if (q) { setParams({}, { replace: true }); void send(q, 0, undefined); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page" style={{ gap: 28 }}>
      <section className="block" style={{ gap: 20 }}>
        <div className="head-row">
          <div className="page-head">
            <span className="eyebrow"><Icon name="sparkles" width={14} height={14} /> {t('common:nav.ai')}</span>
            <h1>{t('trip:ai.title')}</h1>
            <p className="lede">{t('trip:ai.text')}</p>
          </div>
          {msgs.length > 0 && <button type="button" className="btn ghost sm" onClick={() => { setMsgs([]); input.current?.focus(); }}><Icon name="refresh" />{t('trip:ai.newChat')}</button>}
        </div>
        {hasProfile(profile) && profile.consentPersonalisation
          ? <Notice icon="user">{t('trip:ai.usingPrefs')} <Link to="/account/preferences">{t('trip:ai.editPrefs')}</Link></Notice>
          : <Notice icon="user">{t('trip:ai.setPrefs')} <Link to="/account/preferences">{t('trip:ai.setPrefsLink')}</Link></Notice>}
      </section>

      <section className="chat" aria-label={t('trip:ai.conversation')}>
        <div className="chat-log" aria-live="polite">
          {msgs.length === 0 && (
            <div className="bubble ai">
              <div className="who"><Icon name="sparkles" />{t('common:nav.ai')}</div>
              <p>{t('trip:ai.hello')}</p>
              <div className="chip-row" style={{ marginTop: 12 }}>
                {EXAMPLES.map(k => <button key={k} type="button" className="chip-btn" onClick={() => void send(t(`trip:ai.${k}`))}><Icon name="sparkles" />{t(`trip:ai.${k}`)}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m, i) => m.role === 'user'
            ? <div key={m.id} className="bubble me">{m.text}</div>
            : (
              <div key={m.id} className="bubble ai">
                <div className="who"><Icon name="sparkles" />{t('common:nav.ai')}</div>
                {m.error ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <p>{t('trip:ai.error')}</p>
                    <button type="button" className="btn solid sm" style={{ width: 'fit-content' }} onClick={() => void send(m.text ?? '')}><Icon name="refresh" />{t('common:errors.retry')}</button>
                  </div>
                ) : m.answer?.type === 'plan' ? (
                  <PlanView plan={m.answer.plan} latest={i === msgs.length - 1}
                    onRegenerate={() => void send(m.answer?.type === 'plan' ? m.answer.plan.prompt : '', Math.floor(Math.random() * 5) + 1, undefined)}
                    onModify={() => { setText(t('trip:ai.modifyPrefill')); input.current?.focus(); }} />
                ) : m.answer?.type === 'compare' ? <CompareView ids={m.answer.destinationIds} />
                  : m.answer?.type === 'season' ? <SeasonView id={m.answer.destinationId} />
                    : m.answer?.type === 'entry' ? <EntryView countryId={m.answer.countryId} destinationId={m.answer.destinationId} />
                      : m.answer?.type === 'weather' ? <WeatherView id={m.answer.destinationId} month={m.answer.month} /> : null}
                {m.answer?.logId && <Feedback logId={m.answer.logId} />}
              </div>
            ))}
          {busy && <div className="bubble ai" role="status"><div className="who"><Icon name="sparkles" />{t('common:nav.ai')}</div><span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}><span className="typing"><i /><i /><i /></span>{t('trip:ai.creating')}</span></div>}
          <div ref={endRef} />
        </div>

        {!aiOn && <Notice tone="warn" icon="info">{t('trip:ai.paused')}</Notice>}
        <form className="composer" onSubmit={e => { e.preventDefault(); if (aiOn) void send(text); }}>
          <label className="sr" htmlFor="ai-input">{t('trip:ai.inputLabel')}</label>
          <textarea
            id="ai-input" ref={input} rows={1} value={text} placeholder={msgs.length ? t('trip:ai.followPh') : t('trip:ai.placeholder')}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (aiOn) void send(text); } }}
          />
          <button type="submit" className="btn solid" disabled={busy || !text.trim() || !aiOn} aria-label={t('trip:ai.send')}><Icon name="arrowUp" /></button>
        </form>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>{t('trip:ai.disclaimer')}</p>
      </section>
    </div>
  );
}

function PlanView({ plan, latest, onRegenerate, onModify }: { plan: TripPlan; latest: boolean; onRegenerate: () => void; onModify: () => void }) {
  const { t } = useTranslation(['trip', 'common']);
  const lang = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const tripsList = useTrips();
  const [showAll, setShowAll] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const names = plan.route.map(r => seedIndex.destById.get(r.destinationId)!.name);
  const m = (n: number) => money(n, lang);

  const save = () => {
    const trip = trips.create({
      name: t('trip:ai.tripName', { days: plan.spec.days, places: names.join(', ') }), destinationIds: plan.spec.destinationIds, adults: plan.spec.travellers, children: 0,
      budgetUsd: plan.spec.budgetUsd, interests: plan.spec.styles, days: structuredClone(plan.days), startDate: plan.days[0]?.date, endDate: plan.days[plan.days.length - 1]?.date, source: 'ai', prompt: plan.prompt
    });
    toast.show({ icon: 'check', text: t('trip:ai.saved'), action: { label: t('trip:add.open'), to: `/plan/${trip.id}` } });
    return trip;
  };

  const appendTo = (tripId: string) => {
    const target = tripsList.find(x => x.id === tripId);
    if (!target) return;
    trips.update(tripId, { days: [...target.days, ...structuredClone(plan.days)], destinationIds: [...new Set([...target.destinationIds, ...plan.spec.destinationIds])] });
    setAddOpen(false);
    toast.show({ icon: 'calendar', text: t('trip:add.added', { trip: target.name }), action: { label: t('trip:add.open'), to: `/plan/${tripId}` } });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p>
        {t('trip:ai.planIntro', { days: plan.spec.days, travellers: t('trip:ai.people', { count: plan.spec.travellers }), places: names.join(' → ') })}{' '}
        {plan.withinBudget === true && t('trip:ai.withinBudget', { total: m(plan.totals.grandTotal), budget: m(plan.spec.budgetUsd!) })}
        {plan.withinBudget === false && t('trip:ai.overBudget', { total: m(plan.totals.grandTotal), budget: m(plan.spec.budgetUsd!) })}
      </p>
      {(() => {
        // Destinations without bookable partners yet (e.g. the global showcase): say so, and offer the 360° look-around.
        const empty = plan.route.map(r => seedIndex.destById.get(r.destinationId)!).filter(d => !seedIndex.listings.some(l => l.destinationId === d.id && !l.paused));
        if (!empty.length) return null;
        const looks = empty.map(d => seedIndex.experiences.filter(e => e.destinationId === d.id).sort(byFormat)[0]).filter(Boolean);
        return (
          <Notice icon="info">
            {t('trip:ai.noPartners', { places: empty.map(d => d.name).join(', ') })}
            {looks.length > 0 && <> {t('trip:ai.lookFirst')} {looks.map((x, i) => <span key={x!.id}>{i > 0 && ', '}<Link to={`/vr/${x!.slug}`}>{lt(x!.title, lang)}</Link></span>)}</>}
          </Notice>
        );
      })()}
      {plan.intent && <div className="understood" style={{ border: 0, padding: 0 }}><IntentChips intent={plan.intent} /><span className="badge">{t(`trip:tier.${plan.spec.tier}`)}</span></div>}

      <div>
        <h3 className="label" style={{ marginBottom: 8 }}>{t('trip:ai.route')}</h3>
        <div className="plan-route">
          {plan.route.map((r, i) => {
            const d = seedIndex.destById.get(r.destinationId)!;
            const leg = plan.legs[i - 1];
            return (
              <span key={r.destinationId} style={{ display: 'contents' }}>
                {leg && <span className="leg"><Icon name={leg.mode === 'flight' ? 'arrowRight' : leg.mode === 'ferry' ? 'activity' : 'car'} />{t(`trip:mode.${leg.mode}`)} · {t('trip:ai.hours', { count: leg.hours })}</span>}
                <Link className="stop" to={`/destinations/${d.slug}`}><span className="thumb"><Media id={d.media} sizes="30px" decorative /></span>{d.name} · {t('trip:nights', { count: r.nights })}</Link>
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="label" style={{ marginBottom: 8 }}>{t('trip:ai.stays')}</h3>
        <ul className="list">
          {plan.route.map(r => {
            const d = seedIndex.destById.get(r.destinationId)!;
            const stay = r.stayId ? seedIndex.listingById.get(r.stayId) : undefined;
            return (
              <li key={r.destinationId} className="list-item" style={{ background: 'var(--bg)' }}>
                {stay && <span className="thumb"><Media id={stay.media[0]!} sizes="84px" decorative /></span>}
                <span className="grow">
                  <b>{stay ? lt(stay.title, lang) : t('trip:ai.noStay', { place: d.name })}</b>
                  <small>{d.name}{stay ? ` · ${m(stay.price.amountUsd)} / ${t('common:price.unit.night')}` : ''}{r.stayAlternatives.length ? ` · ${t('trip:ai.alternatives', { count: r.stayAlternatives.length })}` : ''}</small>
                </span>
                {stay && <span className="actions"><Link className="btn ghost sm" to={`/listing/${stay.slug}`}>{t('trip:ai.view')}</Link></span>}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="label" style={{ marginBottom: 8 }}>{t('trip:ai.daily')}</h3>
        <div className="plan-days">
          {(showAll ? plan.days : plan.days.slice(0, 4)).map((day, i) => (
            <div key={i} className="plan-day">
              <div><div className="d">{t('trip:day', { n: i + 1 })}</div><small style={{ color: 'var(--muted)', fontSize: 12 }}>{seedIndex.destById.get(day.destinationId)?.name}</small></div>
              <ul>
                {SLOTS.flatMap(s => day.slots[s].map(it => (
                  <li key={it.id}><span className="t">{it.time}</span><span>{it.listingId && !it.titleKey ? <Link to={`/listing/${seedIndex.listingById.get(it.listingId)?.slug}`}>{itemTitle(t, it, lang)}</Link> : itemTitle(t, it, lang)}{it.priceUsd ? ` · ${m(it.priceUsd)}${it.perPerson ? ` ${t('trip:book.perPerson')}` : ''}` : ''}</span></li>
                )))}
              </ul>
            </div>
          ))}
          {plan.days.length > 4 && <button type="button" className="tlink" onClick={() => setShowAll(s => !s)}><span>{showAll ? t('trip:ai.showLess') : t('trip:ai.showAll', { count: plan.days.length })}</span></button>}
        </div>
      </div>

      <div>
        <h3 className="label" style={{ marginBottom: 8 }}>{t('trip:ai.costs')}</h3>
        <div className="plan-cost">
          <div><b>{m(plan.totals.stays)}</b><span>{t('trip:cost.stays')}</span></div>
          <div><b>{m(plan.totals.activities)}</b><span>{t('trip:cost.activities')}</span></div>
          <div><b>{m(plan.totals.transport)}</b><span>{t('trip:cost.transport')}</span></div>
          <div><b>{m(plan.totals.meals)}</b><span>{t('trip:cost.meals')}</span></div>
          <div><b>{m(plan.totals.fees)}</b><span>{t('trip:cost.fees')}</span></div>
          <div style={{ borderColor: 'var(--accent-bright)' }}><b>{m(plan.totals.grandTotal)}</b><span>{t('trip:cost.total')} · {m(plan.totals.perPerson)} {t('trip:book.perPerson')}</span></div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{t('trip:ai.costNote')}</p>
      </div>

      <div className="info-grid">
        <div>
          <h3 className="label" style={{ marginBottom: 6 }}>{t('trip:ai.why')}</h3>
          <ul className="trust-list">{plan.reasons.map((r, i) => <li key={i}><Icon name="check" />{t(`trip:${r.key}`, r.params ?? {})}</li>)}</ul>
        </div>
        <div>
          <h3 className="label" style={{ marginBottom: 6 }}>{t('trip:ai.sustainability')}</h3>
          <ul className="trust-list">{plan.sustainability.map((r, i) => <li key={i}><Icon name="leaf" />{t(`trip:${r.key}`, r.params ?? {})}</li>)}</ul>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{plan.assumptions.map(a => t(`trip:${a.key}`, a.params ?? {})).join(' ')}</p>

      <div className="plan-actions">
        {latest && <button type="button" className="btn ghost sm" onClick={onRegenerate}><Icon name="refresh" />{t('trip:ai.regenerate')}</button>}
        {latest && <button type="button" className="btn ghost sm" onClick={onModify}><Icon name="sparkles" />{t('trip:ai.modify')}</button>}
        <button type="button" className="btn ghost sm" onClick={() => save()}><Icon name="heart" />{t('trip:ai.save')}</button>
        <button type="button" className="btn ghost sm" onClick={() => (tripsList.length ? setAddOpen(true) : save())}><Icon name="calendar" />{t('trip:ai.addToTrip')}</button>
        <button type="button" className="btn solid sm" onClick={() => { const trip = save(); navigate(`/plan/${trip.id}?book=1`); }}><Icon name="ticket" />{t('trip:ai.book')}</button>
      </div>

      {addOpen && (
        <Modal title={t('trip:ai.addToTrip')} onClose={() => setAddOpen(false)}>
          <ul className="list">{tripsList.map(x => <li key={x.id} className="list-item"><span className="grow"><b>{x.name}</b><small>{t('trip:daysCount', { count: x.days.length })}</small></span><button type="button" className="btn solid sm" onClick={() => appendTo(x.id)}>{t('trip:ai.appendHere')}</button></li>)}</ul>
          <button type="button" className="btn ghost sm" onClick={() => { save(); setAddOpen(false); }}>{t('trip:ai.saveNew')}</button>
        </Modal>
      )}
    </div>
  );
}

function CompareView({ ids }: { ids: string[] }) {
  const { t } = useTranslation(['trip', 'explore', 'common']);
  const lang = useLocale();
  const ds = ids.map(id => seedIndex.destById.get(id)!).filter(Boolean);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p>{t('trip:ai.compareIntro', { places: ds.map(d => d.name).join(' / ') })}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-btn)' }}>
          <thead><tr><th scope="col" style={{ textAlign: 'left', padding: 8 }} />{ds.map(d => <th scope="col" key={d.id} style={{ textAlign: 'left', padding: 8 }}><Link to={`/destinations/${d.slug}`}>{d.name}</Link></th>)}</tr></thead>
          <tbody>
            {[
              ['country', (d: typeof ds[0]) => countryName(seedIndex.countries.find(c => c.id === d.countryId)!, lang)],
              ['bestTime', (d: typeof ds[0]) => d.bestMonths.slice().sort((a, b) => a - b).map(mm => monthName(mm, lang)).join(', ')],
              ['from', (d: typeof ds[0]) => `${money(d.fromPriceUsd, lang)} / ${t('common:price.perPersonDay')}`],
              ['stay', (d: typeof ds[0]) => t('explore:dest.daysRange', { min: d.typicalDays[0], max: d.typicalDays[1] })],
              ['goodFor', (d: typeof ds[0]) => d.tags.map(x => t(`common:tags.${x}`)).join(', ')],
              ['rating', (d: typeof ds[0]) => `${d.rating} ★ (${d.reviewCount})`]
            ].map(([k, f]) => (
              <tr key={k as string} style={{ borderTop: '1px solid var(--panel-line)' }}>
                <th scope="row" style={{ textAlign: 'left', padding: 8, color: 'var(--muted)', fontWeight: 500 }}>{t(`trip:ai.cmp.${k}`)}</th>
                {ds.map(d => <td key={d.id} style={{ padding: 8 }}>{(f as (d: typeof ds[0]) => string)(d)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chip-row">{ds.map(d => <Link key={d.id} className="chip-btn" to={`/ai?q=${encodeURIComponent(t('explore:dest.aiPrompt', { days: d.typicalDays[1] + 2, place: d.name }))}`} reloadDocument><Icon name="sparkles" />{t('trip:ai.planFor', { place: d.name })}</Link>)}</div>
    </div>
  );
}

function SeasonView({ id }: { id: string }) {
  const { t } = useTranslation(['trip', 'explore']);
  const lang = useLocale();
  const d = seedIndex.destById.get(id)!;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>{t('trip:ai.seasonAnswer', { place: d.name, months: d.bestMonths.slice().sort((a, b) => a - b).map(m => monthName(m, lang, 'long')).join(', ') })}</p>
      <Content as="p" text={d.overview ?? d.summary} />
      <Link className="tlink" to={`/destinations/${d.slug}#weather`}><span>{t('trip:ai.seeClimate')}</span><Icon name="arrowRight" /></Link>
    </div>
  );
}

function EntryView({ countryId, destinationId }: { countryId: string; destinationId?: string }) {
  const { t } = useTranslation(['trip', 'explore']);
  const lang = useLocale();
  const c = seedIndex.countries.find(x => x.id === countryId);
  if (!c?.entry) return <p>{t('trip:ai.noEntry')}</p>;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <b>{t('explore:dest.requirements')}: {countryName(c, lang)}</b>
      <Content as="p" text={c.entry} />
      <Notice tone="warn">{t('explore:dest.confirmOfficial')}</Notice>
      {destinationId && <Link className="tlink" to={`/destinations/${seedIndex.destById.get(destinationId)?.slug}#practical`}><span>{t('trip:ai.morePractical')}</span><Icon name="arrowRight" /></Link>}
    </div>
  );
}

function WeatherView({ id, month }: { id: string; month?: number }) {
  const { t } = useTranslation(['trip']);
  const lang = useLocale();
  const d = seedIndex.destById.get(id)!;
  const c = CLIMATE[d.climate];
  const mm = month ?? new Date().getMonth() + 1;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>{t('trip:ai.weatherAnswer', { place: d.name, month: monthName(mm, lang, 'long'), high: c.high[mm - 1], rain: c.rain[mm - 1] })} {d.bestMonths.includes(mm) ? t('trip:ai.goodMonth') : t('trip:ai.notIdeal')}</p>
      <Link className="tlink" to={`/destinations/${d.slug}#weather`}><span>{t('trip:ai.seeClimate')}</span><Icon name="arrowRight" /></Link>
    </div>
  );
}

/** Helpful / not helpful on an answer; feeds the Command Center's AI feedback stats. */
function Feedback({ logId }: { logId: string }) {
  const { t } = useTranslation('trip');
  const value = useAiLog().find(x => x.id === logId)?.feedback;
  return (
    <div className="chip-row" style={{ marginTop: 10, alignItems: 'center' }} role="group" aria-label={t('trip:ai.feedback')}>
      <small className="muted">{t('trip:ai.feedback')}</small>
      <button type="button" className="toggle" aria-pressed={value === 'up'} onClick={() => aiTelemetry.feedback(logId, 'up')}>👍 {t('trip:ai.helpful')}</button>
      <button type="button" className="toggle" aria-pressed={value === 'down'} onClick={() => aiTelemetry.feedback(logId, 'down')}>👎 {t('trip:ai.notHelpful')}</button>
    </div>
  );
}
