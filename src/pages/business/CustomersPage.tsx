import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StatusPill } from '@/components/ui/bits';
import { EmptyState } from '@/components/ui/States';
import { Donut } from '@/components/charts/Charts';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { bookingGross, countryLabel, guestName, PortalHead, useBizT, useFmt, useListingTitle } from '@/features/portal/shared';
import { effectiveStatus, usePartnerBookings } from '@/services/bookings';
import { counts, tally } from '@/services/businessAnalytics';
import type { Booking } from '@/domain/types';

interface Customer { key: string; name: string; email: string; country: string; bookings: Booking[]; spend: number; last: string; sample?: boolean }

export default function BusinessCustomersPage() {
  const { t } = useBizT();
  const f = useFmt();
  const title = useListingTitle();
  const { partner } = usePartnerOrg();
  const all = usePartnerBookings(partner.id);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Customer | null>(null);

  const customers = useMemo(() => {
    const m = new Map<string, Customer>();
    for (const b of all) {
      const key = b.lead.email.toLowerCase();
      const c = m.get(key) ?? { key, name: guestName(b), email: b.lead.email, country: b.lead.country, bookings: [], spend: 0, last: '', sample: (b as { sample?: boolean }).sample };
      c.bookings.push(b);
      if (counts(b)) c.spend += bookingGross(b);
      if (b.date > c.last) c.last = b.date;
      m.set(key, c);
    }
    return [...m.values()].sort((a, b) => b.spend - a.spend);
  }, [all]);
  const shown = customers.filter(c => !q.trim() || `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
  const repeat = customers.filter(c => c.bookings.filter(counts).length > 1).length;
  const markets = tally(customers.map(c => c.country)).slice(0, 5);

  return (
    <>
      <PortalHead title={t('business:nav.customers')} text={t('business:customers.text')} />
      <div className="p-split">
        <div className="p-section">
          <div className="filters-row">
            <label className="sr" htmlFor="cq">{t('business:customers.search')}</label>
            <input id="cq" className="input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('business:customers.search')} />
            <span className="muted small">{t('business:customers.count', { count: customers.length })} · {t('business:customers.repeat', { count: repeat })}</span>
          </div>
          {shown.length ? (
            <div className="table-wrap">
              <table className="dtable">
                <thead><tr><th scope="col">{t('business:bookings.guest')}</th><th scope="col">{t('trip:book.country')}</th><th scope="col" className="num">{t('business:nav.bookings')}</th><th scope="col" className="num">{t('business:customers.spend')}</th><th scope="col">{t('business:customers.last')}</th></tr></thead>
                <tbody>{shown.map(c => (
                  <tr key={c.key}>
                    <td><button type="button" className="tlink" onClick={() => setOpen(c)}><span>{c.name}</span></button><small>{c.email}</small></td>
                    <td>{countryLabel(c.country, f.lang)}</td>
                    <td className="num">{c.bookings.length}</td>
                    <td className="num">{f.m(c.spend)}</td>
                    <td>{f.d(c.last)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState icon="user" title={t('business:customers.emptyTitle')} text={t('business:customers.emptyText')} />}
          <p className="small muted">{t('business:customers.privacy')}</p>
        </div>
        <section className="panel" aria-labelledby="mk-h">
          <h2 id="mk-h" style={{ marginBottom: 12 }}>{t('business:analytics.markets')}</h2>
          <Donut label={t('business:analytics.markets')} items={markets.map(m => ({ label: countryLabel(m.key, f.lang), value: m.count }))} />
        </section>
      </div>
      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)}>
          <p className="muted">{open.email} · {countryLabel(open.country, f.lang)}</p>
          <ul className="list">{open.bookings.map(b => (
            <li key={b.id} className="list-item"><span className="grow"><b>{title(b.listingId)}</b><small>{b.id} · {f.d(b.date)} · {f.m2(bookingGross(b))}</small></span><StatusPill status={effectiveStatus(b)} /></li>
          ))}</ul>
        </Modal>
      )}
    </>
  );
}
