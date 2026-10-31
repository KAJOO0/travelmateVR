import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT, useAllBookings } from '@/features/portal/admin';
import { audit, platformMetrics } from '@/services/admin';
import { destinationContent, livePosts, posts, useDestinationEdits, usePosts } from '@/services/board';
import { lastMonths } from '@/services/businessAnalytics';
import { seedIndex } from '@/services/catalog';
import { countryName, ltp } from '@/lib/content';

/** All destinations: performance, board edits and published updates (with moderation). */
export default function AdminDestinationsPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const { write } = useAdmin('destinations');
  const bookings = useAllBookings();
  const edits = useDestinationEdits();
  const allPosts = usePosts();
  const m = useMemo(() => platformMetrics(bookings, lastMonths(12)), [bookings]);
  const published = allPosts.filter(p => p.status === 'published');

  return (
    <>
      <PortalHead title={t('admin:nav.destinations')} text={t('admin:destinations.text')} />
      <ReadOnly show={!write} />
      <div className="table-wrap"><table className="dtable">
        <thead><tr><th scope="col">{t('explore:filters.destination')}</th><th scope="col">{t('explore:filters.country')}</th><th scope="col" className="num">{t('board:kpi.interest')}</th><th scope="col" className="num">{t('business:kpi.bookings')}</th><th scope="col" className="num">{t('admin:kpi.gmv')}</th><th scope="col">{t('board:destinations.content')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
        <tbody>{m.byDestination.map(({ destination: d, bookings: bk, gmv, interest }) => {
          const e = edits[d.id];
          const country = seedIndex.countries.find(c => c.id === d.countryId);
          return (
            <tr key={d.id}>
              <td><Link to={`/destinations/${d.slug}`}>{d.name}</Link><small>{t('board:destinations.posts', { count: livePosts(d.id, allPosts).length })}</small></td>
              <td>{country ? countryName(country, f.lang) : d.countryId}</td>
              <td className="num">{f.n(interest)}</td><td className="num">{bk}</td><td className="num">{f.m(gmv)}</td>
              <td><span className={`status ${e?.status === 'published' ? 'paid' : e ? 'pending' : 'draft'}`}>{t(`board:destinations.state.${!e ? 'catalogue' : e.status === 'published' ? 'published' : 'draft'}`)}</span></td>
              <td>{write && e && <button type="button" className="btn ghost sm danger" onClick={() => { destinationContent.revert(d.id); audit('destination.revert', d.id); toast.show({ icon: 'refresh', text: t('board:destinations.reverted') }); }}><Icon name="refresh" />{t('admin:destinations.revert')}</button>}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
      <p className="small muted">{t('admin:destinations.interestNote')}</p>

      <section className="p-section" aria-labelledby="ad-posts">
        <h2 id="ad-posts">{t('admin:destinations.posts')}</h2>
        {published.length ? <ul className="list">{published.map(p => (
          <li key={p.id} className="list-item" style={{ alignItems: 'flex-start' }}>
            <span className="ico"><Icon name={p.kind === 'alert' ? 'info' : 'layers'} /></span>
            <span className="grow"><b style={{ whiteSpace: 'normal' }}>{ltp(p.title, f.lang)}</b><small style={{ whiteSpace: 'normal' }}>{t(`board:content.kinds.${p.kind}`)} · {seedIndex.destById.get(p.destinationId)?.name} · {p.publishedAt ? f.dt(p.publishedAt) : ''}</small></span>
            {write && <button type="button" className="btn ghost sm danger" onClick={() => { posts.save({ ...p, status: 'draft' }); audit('post.unpublish', p.id, ltp(p.title, 'en')); toast.show({ icon: 'check', text: t('admin:destinations.unpublished') }); }}>{t('board:content.unpublish')}</button>}
          </li>
        ))}</ul> : <p className="muted">{t('admin:destinations.noPosts')}</p>}
      </section>
    </>
  );
}
