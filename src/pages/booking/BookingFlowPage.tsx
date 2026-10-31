import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Counter } from '@/components/ui/Counter';
import { Content, Notice } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { PriceBreakdownView } from '@/features/booking/PriceBreakdownView';
import { seedIndex } from '@/services/catalog';
import { quote } from '@/services/pricing';
import { bookings, depositRate } from '@/services/bookings';
import { useSession } from '@/services/account';
import { useTrips } from '@/services/trips';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { money, tzs } from '@/lib/format';
import { usePageTitle } from '@/app/usePageTitle';
import { dateLabel, nightsBetween } from '@/features/trips/format';
import { checkAvailability } from '@/services/availability';
import type { PaymentMethod } from '@/domain/types';
import { bookingOpen, CARD_SCHEMES, maskNumber, MOBILE_NETWORKS, networkById, networkForNumber, normalizeTzMobile, payments, TZ_BANKS, usdToTzs, type MobileNetwork, type PaymentIntent } from '@/services/payments';
import { PreviewOnlyNotice } from '@/features/booking/PreviewOnly';
import { usePlatform } from '@/services/platform';
import '@/styles/pages.css';

const STEPS = ['select', 'customize', 'travellers', 'review', 'payment'] as const;
type Step = (typeof STEPS)[number];
/** Payment methods offered in Tanzania: mobile money and Visa / Mastercard cards (direct bank payments follow later). */
const METHODS: { id: PaymentMethod; icon: IconName }[] = [{ id: 'mobile_money', icon: 'phone' }, { id: 'card', icon: 'shield' }];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const todayPlus = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

interface Draft {
  date: string; nights: number; adults: number; children: number; startTime?: string; extras: string[]; requests: string;
  firstName: string; lastName: string; email: string; phone: string; country: string; travellers: string[];
  method: PaymentMethod; deposit: boolean; agree: boolean; tripId: string;
  network: MobileNetwork | ''; momoPhone: string;
}

export default function BookingFlowPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const { t } = useTranslation(['trip', 'explore', 'common']);
  const lang = useLocale();
  const navigate = useNavigate();
  const user = useSession();
  const tripsList = useTrips();
  const listing = seedIndex.listings.find(l => l.slug === slug || l.id === slug);
  usePageTitle(t('trip:book.title'));
  const draftKey = `tm.bookingDraft.${slug}`;
  const [step, setStep] = useState<Step>('select');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  usePlatform();
  const [touched, setTouched] = useState<Partial<Record<Step, boolean>>>({});
  const [d, setD] = useState<Draft>(() => {
    let saved: Partial<Draft> = {};
    try { saved = JSON.parse(sessionStorage.getItem(draftKey) ?? '{}'); } catch { /* ignore */ }
    const [first = '', ...rest] = (user?.name ?? '').split(' ');
    return {
      date: listing?.date ?? params.get('date') ?? todayPlus(30), nights: Number(params.get('nights') ?? 2), adults: Number(params.get('adults') ?? 2), children: Number(params.get('children') ?? 0),
      startTime: listing?.startTimes?.[0], extras: [], requests: '', firstName: first, lastName: rest.join(' '), email: user?.email ?? '', phone: '', country: '',
      travellers: [], method: 'card', deposit: false, agree: false, tripId: params.get('trip') ?? '', network: '', momoPhone: '', ...saved,
      // Older drafts may hold methods that are no longer offered.
      ...(saved.method && !METHODS.some(m => m.id === saved.method) ? { method: 'card' as PaymentMethod } : {})
    };
  });
  useEffect(() => { try { sessionStorage.setItem(draftKey, JSON.stringify({ ...d, agree: false })); } catch { /* ignore */ } }, [d, draftKey]);
  const up = (patch: Partial<Draft>) => setD(x => ({ ...x, ...patch }));

  const units = listing?.price.unit === 'night' ? Math.max(1, Math.ceil((d.adults + d.children) / Math.max(1, listing.capacity ?? 2))) : 1;
  const usesNights = listing?.price.unit === 'night' || listing?.price.unit === 'vehicle';
  const price = useMemo(() => (listing ? quote({ listing, adults: d.adults, children: d.children, nights: usesNights ? d.nights : 1, units, extras: d.extras, date: d.date }) : null), [listing, d.adults, d.children, d.nights, d.extras, units, usesNights, d.date]);
  if (!listing || !price) return <div className="page"><NotFoundState title={t('explore:listing.notFound')} to="/marketplace" label={t('explore:market.title.all')} /></div>;
  if (!bookingOpen(listing)) {
    const dst = seedIndex.destById.get(listing.destinationId);
    return (
      <div className="page"><section className="block" style={{ maxWidth: 760, marginInline: 'auto', width: '100%', gap: 16 }}>
        <h1 className="sec-title">{lt(listing.title, lang)}</h1>
        <PreviewOnlyNotice countryId={dst?.countryId} destinationSlug={dst?.slug} />
        <Link className="btn ghost" style={{ justifySelf: 'start' }} to={`/listing/${listing.slug}`}><Icon name="arrowLeft" />{t('common:actions.back')}</Link>
      </section></div>
    );
  }
  const partner = seedIndex.partnerById.get(listing.partnerId)!;
  const title = lt(listing.title, lang);
  const guests = d.adults + d.children;
  const endDate = usesNights ? new Date(new Date(d.date).getTime() + d.nights * 86400000).toISOString().slice(0, 10) : listing.durationDays ? new Date(new Date(d.date).getTime() + (listing.durationDays - 1) * 86400000).toISOString().slice(0, 10) : undefined;
  const travellerNames = Array.from({ length: guests }, (_, i) => d.travellers[i] ?? (i === 0 ? `${d.firstName} ${d.lastName}`.trim() : ''));
  const free = price.total === 0;
  const needed = ['night', 'vehicle', 'group'].includes(listing.price.unit) ? units : listing.price.unit === 'trip' ? 1 : guests;
  const avail = d.date ? checkAvailability(listing, d.date, usesNights ? d.nights : 1, needed) : { ok: true as const };

  const errors: Record<Step, string[]> = {
    select: [!d.date || d.date < todayPlus(0) ? 'date' : '', listing.closedMonths?.includes(new Date(d.date).getMonth() + 1) ? 'closed' : '', listing.paused ? 'paused' : '', !avail.ok ? 'unavailable' : ''].filter(Boolean),
    customize: [],
    travellers: [
      d.firstName.trim().length < 2 ? 'firstName' : '', d.lastName.trim().length < 2 ? 'lastName' : '', !EMAIL.test(d.email.trim()) ? 'email' : '',
      d.phone.replace(/\D/g, '').length < 7 ? 'phone' : '', ...travellerNames.map((n, i) => (n.trim().length < 2 ? `traveller${i}` : ''))
    ].filter(Boolean),
    review: [!d.agree ? 'agree' : ''].filter(Boolean),
    payment: d.method === 'mobile_money' ? [!normalizeTzMobile(d.momoPhone) ? 'momoPhone' : '', !d.network ? 'network' : ''].filter(Boolean) : []
  };
  const momo = normalizeTzMobile(d.momoPhone);
  const payNow = listing.instantBook ? (d.deposit ? Math.round(price.total * depositRate() * 100) / 100 : price.total) : 0;
  const err = (s: Step, k: string) => touched[s] && errors[s].includes(k);
  const idx = STEPS.indexOf(step);
  const next = () => {
    setTouched(x => ({ ...x, [step]: true }));
    if (errors[step].length) { document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    if (step === 'review' && free) { void submit(); return; }
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]!);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Instant bookings are paid first (mobile-money PIN prompt or the card provider's page); requests are sent without payment. */
  const pay = async () => {
    setTouched(x => ({ ...x, payment: true }));
    if (errors.payment.length) { document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    if (!payNow) { void submit(); return; }
    setError(false);
    try {
      setIntent(await payments.start({ bookingRef: listing.id, amountUsd: payNow, channel: d.method === 'mobile_money' ? { method: 'mobile_money', network: d.network as MobileNetwork, phone: momo! } : { method: 'card' } }));
    } catch { setError(true); }
  };
  const confirmPaid = async () => {
    if (!intent) return;
    setBusy(true);
    const status = await payments.status(intent).catch(() => 'failed' as const);
    if (status !== 'succeeded') { setBusy(false); setIntent(null); setError(true); return; }
    void submit();
  };

  const submit = async () => {
    setBusy(true); setError(false);
    try {
      const b = await bookings.create({
        listing, date: d.date, endDate, startTime: d.startTime, adults: d.adults, children: d.children, nights: usesNights ? d.nights : 1, units, extras: d.extras,
        lead: { firstName: d.firstName.trim(), lastName: d.lastName.trim(), email: d.email.trim(), phone: d.phone.trim(), country: d.country },
        travellers: travellerNames.map(name => ({ name: name.trim() })), requests: d.requests.trim() || undefined,
        method: free ? 'pay_later' : d.method, payDeposit: d.deposit, tripId: d.tripId || undefined,
        network: d.method === 'mobile_money' && d.network ? d.network : undefined, payerPhone: d.method === 'mobile_money' && momo ? maskNumber(momo) : undefined,
        amountTzs: intent?.amountTzs, paymentRef: intent?.id
      });
      sessionStorage.removeItem(draftKey);
      navigate(`/bookings/${b.id}?new=1`, { replace: true });
    } catch {
      setError(true); setBusy(false);
    }
  };

  if (busy) {
    return <div className="page"><div className="panel securing" role="status"><span className="spinner" aria-hidden="true" /><h1 style={{ fontSize: 'var(--fs-h3)' }}>{t('trip:book.securing')}</h1><p style={{ color: 'var(--muted)' }}>{t('trip:book.securingText')}</p></div></div>;
  }

  return (
    <div className="page" style={{ gap: 28 }}>
      <div className="page-head">
        <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to={`/listing/${listing.slug}`}>{title}</Link></li><li aria-current="page">{t('trip:book.title')}</li></ol></nav>
        <h1>{listing.instantBook ? t('trip:book.title') : t('trip:book.requestTitle')}</h1>
        <ol className="steps-bar" aria-label={t('trip:book.progress')}>
          {STEPS.filter(s => !(free && s === 'payment')).map((s, i) => (
            <li key={s} aria-current={s === step ? 'step' : undefined} className={i < idx ? 'done' : undefined}><span className="n">{i < idx ? '✓' : i + 1}</span>{t(`trip:book.step.${s}`)}</li>
          ))}
        </ol>
      </div>

      <div className="detail-grid">
        <div className="detail-main" style={{ gap: 24 }}>
          {error && <Notice tone="warn" icon="info">{t('trip:book.error')}</Notice>}

          {step === 'select' && (
            <section className="panel" style={{ display: 'grid', gap: 16 }}>
              <h2 className="group-title">{t('trip:book.step.select')}</h2>
              <div className="form-grid">
                <label className="field">
                  <span>{listing.type === 'stay' ? t('explore:listing.checkIn') : t('explore:listing.date')}</span>
                  <input type="date" value={d.date} min={todayPlus(1)} disabled={!!listing.date} onChange={e => up({ date: e.target.value })} aria-invalid={err('select', 'date') || err('select', 'closed') || err('select', 'unavailable')} />
                  {err('select', 'closed') && <span className="err">{t('explore:listing.closedWarn')}</span>}
                  {err('select', 'paused') && <span className="err">{t('explore:listing.pausedWarn')}</span>}
                  {err('select', 'unavailable') && !avail.ok && <span className="err">{t(avail.reason === 'blackout' ? 'explore:listing.blackoutWarn' : 'explore:listing.soldOutWarn', { date: dateLabel(avail.date, lang) })}</span>}
                </label>
                {usesNights && (
                  <div className="field"><span>{listing.price.unit === 'night' ? t('explore:listing.nights') : t('explore:listing.days')}</span><Counter value={d.nights} min={1} max={30} onChange={n => up({ nights: n })} label={t('explore:listing.nights')} /></div>
                )}
                {listing.startTimes && listing.startTimes.length > 1 && (
                  <label className="field"><span>{t('explore:listing.startTimes')}</span>
                    <select value={d.startTime} onChange={e => up({ startTime: e.target.value })}>{listing.startTimes.map(s => <option key={s}>{s}</option>)}</select>
                  </label>
                )}
                <div className="field"><span>{t('trip:travellers.adults')}</span><Counter value={d.adults} min={1} max={listing.type === 'stay' ? 12 : listing.capacity ?? 12} onChange={n => up({ adults: n })} label={t('trip:travellers.adults')} /></div>
                <div className="field"><span>{t('trip:travellers.children')}</span><Counter value={d.children} min={0} max={8} onChange={n => up({ children: n })} label={t('trip:travellers.children')} /></div>
              </div>
              {listing.price.unit === 'night' && units > 1 && <Notice>{t('trip:book.rooms', { count: units })}</Notice>}
            </section>
          )}

          {step === 'customize' && (
            <section className="panel" style={{ display: 'grid', gap: 16 }}>
              <h2 className="group-title">{t('trip:book.step.customize')}</h2>
              {listing.extras?.length ? (
                <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                  <legend className="label" style={{ marginBottom: 8 }}>{t('trip:book.extras')}</legend>
                  {listing.extras.map(x => (
                    <label key={x.id} className="check">
                      <input type="checkbox" checked={d.extras.includes(x.id)} onChange={e => up({ extras: e.target.checked ? [...d.extras, x.id] : d.extras.filter(y => y !== x.id) })} />
                      <span><Content text={x.label} /> · <b>{money(x.priceUsd, lang)}</b> {x.per === 'person' ? t('trip:book.perPerson') : t('trip:book.perBooking')}</span>
                    </label>
                  ))}
                </fieldset>
              ) : <p style={{ color: 'var(--muted)' }}>{t('trip:book.noExtras')}</p>}
              <label className="field"><span>{t('trip:book.requests')}</span><textarea value={d.requests} maxLength={600} onChange={e => up({ requests: e.target.value })} placeholder={t('trip:book.requestsPh')} /></label>
              {tripsList.length > 0 && (
                <label className="field"><span>{t('trip:book.addToTrip')}</span>
                  <select value={d.tripId} onChange={e => up({ tripId: e.target.value })}>
                    <option value="">{t('trip:book.noTrip')}</option>
                    {tripsList.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </label>
              )}
            </section>
          )}

          {step === 'travellers' && (
            <section className="panel" style={{ display: 'grid', gap: 16 }}>
              <h2 className="group-title">{t('trip:book.step.travellers')}</h2>
              {!user && <Notice>{t('trip:book.guestNote')} <Link to={`/signin?next=${encodeURIComponent(`/book/${listing.slug}`)}`}>{t('common:nav.signIn')}</Link></Notice>}
              <div className="form-grid">
                <label className="field"><span>{t('trip:book.firstName')}</span><input value={d.firstName} autoComplete="given-name" onChange={e => up({ firstName: e.target.value })} aria-invalid={err('travellers', 'firstName')} />{err('travellers', 'firstName') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
                <label className="field"><span>{t('trip:book.lastName')}</span><input value={d.lastName} autoComplete="family-name" onChange={e => up({ lastName: e.target.value })} aria-invalid={err('travellers', 'lastName')} />{err('travellers', 'lastName') && <span className="err">{t('trip:book.errRequired')}</span>}</label>
                <label className="field"><span>{t('trip:book.email')}</span><input type="email" value={d.email} autoComplete="email" inputMode="email" onChange={e => up({ email: e.target.value })} aria-invalid={err('travellers', 'email')} />{err('travellers', 'email') && <span className="err">{t('trip:book.errEmail')}</span>}</label>
                <label className="field"><span>{t('trip:book.phone')}</span><input type="tel" value={d.phone} autoComplete="tel" inputMode="tel" placeholder="+255…" onChange={e => up({ phone: e.target.value })} aria-invalid={err('travellers', 'phone')} /><span className="hint">{t('trip:book.phoneHint')}</span>{err('travellers', 'phone') && <span className="err">{t('trip:book.errPhone')}</span>}</label>
                <label className="field full"><span>{t('trip:book.country')}</span><input value={d.country} autoComplete="country-name" onChange={e => up({ country: e.target.value })} /></label>
              </div>
              {guests > 1 && (
                <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                  <legend className="label" style={{ marginBottom: 8 }}>{t('trip:book.travellerNames')}</legend>
                  <div className="form-grid">
                    {travellerNames.map((n, i) => (
                      <label className="field" key={i}><span>{t('trip:book.traveller', { n: i + 1 })}</span>
                        <input value={n} autoComplete={i === 0 ? 'name' : 'off'} onChange={e => { const tr = [...travellerNames]; tr[i] = e.target.value; up({ travellers: tr }); }} aria-invalid={err('travellers', `traveller${i}`)} />
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <p className="hint" style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('trip:book.privacy')}</p>
            </section>
          )}

          {step === 'review' && (
            <section className="panel" style={{ display: 'grid', gap: 16 }}>
              <h2 className="group-title">{t('trip:book.step.review')}</h2>
              <dl className="kv">
                <dt>{t('trip:book.what')}</dt><dd>{title}</dd>
                <dt>{t('trip:book.provider')}</dt><dd>{partner.name}</dd>
                <dt>{t('trip:book.when')}</dt><dd>{dateLabel(d.date, lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}{endDate ? ` → ${dateLabel(endDate, lang, { day: 'numeric', month: 'long' })}` : ''}{d.startTime ? ` · ${d.startTime}` : ''}</dd>
                <dt>{t('trip:book.who')}</dt><dd>{t('trip:travellers.summary', { adults: d.adults, children: d.children })}</dd>
                <dt>{t('trip:book.contact')}</dt><dd>{d.firstName} {d.lastName} · {d.email} · {d.phone}</dd>
                {d.requests && <><dt>{t('trip:book.requests')}</dt><dd>{d.requests}</dd></>}
              </dl>
              <div className="info-grid">
                <div className="panel" style={{ boxShadow: 'none' }}><h3>{t('explore:listing.cancellation')}</h3><p>{t(`explore:cancellation.${listing.cancellation}`)}</p></div>
                <div className="panel" style={{ boxShadow: 'none' }}><h3>{t('explore:listing.confirmation')}</h3><p>{listing.instantBook ? t('explore:listing.instant') : t('explore:listing.request', { partner: partner.name })}</p></div>
              </div>
              <label className="check">
                <input type="checkbox" checked={d.agree} onChange={e => up({ agree: e.target.checked })} aria-invalid={err('review', 'agree')} />
                <span>{t('trip:book.agree')} <Link to="/terms" target="_blank">{t('common:footer.links.terms')}</Link> · <Link to="/privacy" target="_blank">{t('common:footer.links.privacy')}</Link></span>
              </label>
              {err('review', 'agree') && <span className="err" style={{ color: 'var(--danger)', fontSize: 'var(--fs-small)' }}>{t('trip:book.errAgree')}</span>}
            </section>
          )}

          {step === 'payment' && (
            <section className="panel" style={{ display: 'grid', gap: 16 }}>
              <h2 className="group-title">{t('trip:book.step.payment')}</h2>
              <Notice icon="info">{t('trip:book.demoPayment')}</Notice>
              {!listing.instantBook && <Notice tone="ok" icon="check">{t('trip:book.requestPayment', { partner: partner.name })}</Notice>}
              {intent ? (
                <div className="pay-approve" role="status" aria-live="polite">
                  {intent.next === 'approve_on_phone' && intent.channel.method === 'mobile_money' ? (() => {
                    const n = networkById(intent.channel.network);
                    return (
                      <>
                        <span className="ico" style={{ background: n.color }}><Icon name="phone" /></span>
                        <h3>{t('trip:pay.approveTitle')}</h3>
                        <p>{t('trip:pay.approveText', { amount: tzs(intent.amountTzs, lang), usd: money(intent.amountUsd, lang, 'USD', { maximumFractionDigits: 2 }), phone: maskNumber(intent.channel.phone), network: n.name })}</p>
                        <p className="small muted">{t('trip:pay.approveFallback', { ussd: n.ussd, network: n.name })}</p>
                      </>
                    );
                  })() : (
                    <>
                      <span className="ico"><Icon name="shield" /></span>
                      <h3>{t('trip:pay.cardTitle')}</h3>
                      <p>{t('trip:pay.cardText', { amount: money(intent.amountUsd, lang, 'USD', { maximumFractionDigits: 2 }) })}</p>
                    </>
                  )}
                  <div className="chip-row">
                    <button type="button" className="btn solid" onClick={() => void confirmPaid()}><Icon name="check" />{intent.next === 'approve_on_phone' ? t('trip:pay.approved') : t('trip:pay.cardDone')}</button>
                    <button type="button" className="btn ghost" onClick={() => setIntent(null)}>{t('trip:pay.changeMethod')}</button>
                  </div>
                  <p className="small muted">{t('trip:pay.demoNote')}</p>
                </div>
              ) : (
              <>
              <div className="pay-options" role="radiogroup" aria-label={t('trip:book.method')}>
                {METHODS.map(m => (
                  <label key={m.id} className="pay-option">
                    <input type="radio" name="method" value={m.id} checked={d.method === m.id} onChange={() => up({ method: m.id })} />
                    <span className="ico"><Icon name={m.icon} /></span>
                    <span><b>{t(`trip:pay.${m.id}.title`)}</b><small>{m.id === 'card' ? `${CARD_SCHEMES.join(' · ')}: ${t('trip:pay.card.text')}` : MOBILE_NETWORKS.map(n => n.name).join(' · ')}</small></span>
                  </label>
                ))}
              </div>
              {d.method === 'mobile_money' && (
                <div className="form-grid">
                  <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend className="label">{t('trip:pay.network')}</legend>
                    <div className="momo-grid" role="radiogroup" aria-label={t('trip:pay.network')}>
                      {MOBILE_NETWORKS.map(n => (
                        <label key={n.id} className={`momo${d.network === n.id ? ' on' : ''}`} style={{ '--brand': n.color } as React.CSSProperties}>
                          <input type="radio" name="network" value={n.id} checked={d.network === n.id} onChange={() => up({ network: n.id })} aria-invalid={err('payment', 'network')} />
                          <b>{n.name}</b><small>{n.operator} · {n.ussd}</small>
                        </label>
                      ))}
                    </div>
                    {err('payment', 'network') && <span className="err">{t('trip:pay.errNetwork')}</span>}
                  </fieldset>
                  <label className="field full"><span>{t('trip:pay.momoPhone')}</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXX" value={d.momoPhone} onChange={e => { const v = e.target.value; const guess = networkForNumber(normalizeTzMobile(v)); up({ momoPhone: v, ...(guess && !d.network ? { network: guess } : {}) }); }} aria-invalid={err('payment', 'momoPhone')} />
                    <span className="hint">{t('trip:pay.momoHint')}</span>{err('payment', 'momoPhone') && <span className="err">{t('trip:pay.errPhone')}</span>}
                  </label>
                  {payNow > 0 && <Notice icon="info">{t('trip:pay.tzsNote', { tzs: tzs(usdToTzs(payNow), lang), usd: money(payNow, lang, 'USD', { maximumFractionDigits: 2 }) })}</Notice>}
                </div>
              )}
              {d.method === 'card' && <Notice icon="shield">{t('trip:pay.cardNote')}</Notice>}
              <p className="small muted">{t('trip:pay.banksNote', { banks: TZ_BANKS.slice(0, 5).join(', ') })}</p>
              </>
              )}
              {!intent && listing.instantBook && (
                <label className="check"><input type="checkbox" checked={d.deposit} onChange={e => up({ deposit: e.target.checked })} /><span>{t('trip:book.deposit', { rate: depositRate() * 100, amount: money(Math.round(price.total * depositRate() * 100) / 100, lang, 'USD', { maximumFractionDigits: 2 }) })}</span></label>
              )}
              <ul className="trust-list">
                <li><Icon name="shield" />{t('trip:book.secure1')}</li>
                <li><Icon name="shield" />{t('trip:book.secure2')}</li>
              </ul>
            </section>
          )}

          <div className="row-between">
            {idx > 0 ? <button type="button" className="btn ghost" onClick={() => setStep(STEPS[idx - 1]!)}><Icon name="arrowLeft" />{t('common:actions.back')}</button> : <Link className="btn ghost" to={`/listing/${listing.slug}`}><Icon name="arrowLeft" />{t('common:actions.back')}</Link>}
            {step === 'payment'
              ? (!intent && <button type="button" className="btn solid" onClick={() => void pay()}><Icon name="shield" />{listing.instantBook ? t('trip:book.pay', { amount: money(payNow, lang, 'USD', { maximumFractionDigits: 2 }) }) : t('trip:book.sendRequest')}</button>)
              : <button type="button" className="btn solid" onClick={next}>{step === 'review' && free ? t('trip:book.reserve') : t('common:actions.continue')}<Icon name="arrowRight" className="go" /></button>}
          </div>
        </div>

        <aside className="detail-side">
          <div className="panel book-box">
            <div className="list-item" style={{ border: 0, padding: 0, background: 'none' }}>
              <span className="thumb"><Media id={listing.media[0]!} sizes="84px" decorative /></span>
              <span className="grow"><b>{title}</b><small>{partner.name} · {seedIndex.destById.get(listing.destinationId)?.name}</small></span>
            </div>
            <dl className="kv">
              <dt>{t('trip:book.when')}</dt><dd>{dateLabel(d.date, lang)}{endDate ? ` → ${dateLabel(endDate, lang)}` : ''}{usesNights ? ` (${t(listing.price.unit === 'night' ? 'trip:nights' : 'trip:daysCount', { count: nightsBetween(d.date, endDate) })})` : ''}</dd>
              <dt>{t('trip:book.who')}</dt><dd>{t('trip:travellers.summary', { adults: d.adults, children: d.children })}</dd>
            </dl>
            <PriceBreakdownView price={price} indicative={listing.price.indicative} />
          </div>
        </aside>
      </div>
    </div>
  );
}
