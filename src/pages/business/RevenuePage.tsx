import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { BarChart, Kpi, RankBars } from '@/components/charts/Charts';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { bookingGross, PortalHead, useBizT, useFmt, useListingTitle } from '@/features/portal/shared';
import { effectiveStatus, usePartnerBookings } from '@/services/bookings';
import { counts, lastMonths } from '@/services/businessAnalytics';
import { useSettings } from '@/services/business';
import { todayIso } from '@/lib/random';
import { shiftMonth } from '@/components/ui/MonthCalendar';

export default function BusinessRevenuePage() {
  const { t } = useBizT();
  const f = useFmt();
  const title = useListingTitle();
  const { partner } = usePartnerOrg();
  const all = usePartnerBookings(partner.id);
  const settings = useSettings(partner.id);
  const rate = settings.commissionRate;
  const thisMonth = todayIso().slice(0, 7);

  const data = useMemo(() => {
    const valid = all.filter(b => counts({ ...b, status: effectiveStatus(b) }));
    // Earnings are recognised in the month the stay or activity takes place.
    const months = [...lastMonths(9), shiftMonth(thisMonth, 1), shiftMonth(thisMonth, 2), shiftMonth(thisMonth, 3)];
    const byMonth = months.map(m => {
      const bs = valid.filter(b => b.date.slice(0, 7) === m);
      const gross = bs.reduce((s, b) => s + bookingGross(b), 0);
      return { month: m, gross, commission: gross * rate, net: gross * (1 - rate), count: bs.length };
    });
    const ytd = valid.filter(b => b.date.slice(0, 4) === thisMonth.slice(0, 4));
    const gross = ytd.reduce((s, b) => s + bookingGross(b), 0);
    const outstanding = valid.filter(b => b.date >= todayIso()).reduce((s, b) => s + bookingGross(b), 0);
    const taxes = ytd.reduce((s, b) => s + b.price.taxes, 0);
    const contributions = ytd.reduce((s, b) => s + b.price.contribution, 0);
    const byListing = [...new Set(valid.map(b => b.listingId))].map(id => ({ key: id, value: Math.round(valid.filter(b => b.listingId === id).reduce((s, b) => s + bookingGross(b), 0)) })).sort((a, b) => b.value - a.value);
    return { byMonth, gross, outstanding, taxes, contributions, byListing };
  }, [all, rate, thisMonth]);

  const payouts = data.byMonth.filter(m => m.month <= thisMonth && m.gross > 0).reverse();

  return (
    <>
      <PortalHead title={t('business:nav.revenue')} text={t('business:revenue.text')}
        actions={<Link className="btn ghost sm" to="/business/settings#payouts"><Icon name="settings" />{t('business:revenue.payoutSettings')}</Link>} />
      {!settings.payout.connected && <Notice tone="warn" icon="info">{t('business:revenue.connectFirst')}</Notice>}
      <div className="kpis">
        <Kpi icon="briefcase" label={t('business:revenue.grossYtd')} value={f.m(data.gross)} />
        <Kpi icon="ticket" label={t('business:revenue.commission', { rate: Math.round(rate * 100) })} value={f.m(data.gross * rate)} />
        <Kpi icon="check" label={t('business:revenue.netYtd')} value={f.m(data.gross * (1 - rate))} />
        <Kpi icon="calendar" label={t('business:revenue.upcoming')} value={f.m(data.outstanding * (1 - rate))} hint={t('business:revenue.upcomingHint')} />
      </div>
      <div className="p-split">
        <section className="panel" aria-labelledby="rv-m">
          <h2 id="rv-m" style={{ marginBottom: 12 }}>{t('business:revenue.byMonth')}</h2>
          <BarChart label={t('business:revenue.byMonth')} labels={data.byMonth.map(m => f.mon(m.month))} values={data.byMonth.map(m => Math.round(m.net))} highlight={data.byMonth.findIndex(m => m.month === thisMonth)} format={f.m} />
          <p className="small muted">{t('business:revenue.byMonthNote')}</p>
        </section>
        <section className="panel" aria-labelledby="rv-l">
          <h2 id="rv-l" style={{ marginBottom: 12 }}>{t('business:revenue.byListing')}</h2>
          <RankBars label={t('business:revenue.byListing')} items={data.byListing.map(x => ({ key: x.key, label: title(x.key), value: x.value }))} format={f.m} />
        </section>
      </div>
      <section className="p-section" aria-labelledby="po-h">
        <h2 id="po-h">{t('business:revenue.payouts')}</h2>
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th scope="col">{t('business:revenue.period')}</th><th scope="col" className="num">{t('business:nav.bookings')}</th><th scope="col" className="num">{t('business:revenue.gross')}</th><th scope="col" className="num">{t('business:revenue.commissionShort')}</th><th scope="col" className="num">{t('business:revenue.net')}</th><th scope="col">{t('business:bookings.status')}</th></tr></thead>
            <tbody>{payouts.map(p => (
              <tr key={p.month}>
                <td>{new Intl.DateTimeFormat(f.lang === 'zh' ? 'zh-CN' : f.lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${p.month}-01T00:00:00Z`))}</td>
                <td className="num">{p.count}</td><td className="num">{f.m2(p.gross)}</td><td className="num">−{f.m2(p.commission)}</td><td className="num"><b>{f.m2(p.net)}</b></td>
                <td><span className={`status ${p.month < thisMonth ? 'paid' : 'pending'}`}>{p.month < thisMonth ? t('business:revenue.paidOut') : t('business:revenue.processing')}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="small muted">{t('business:revenue.taxNote', { taxes: f.m(data.taxes), contributions: f.m(data.contributions) })}</p>
      </section>
    </>
  );
}
