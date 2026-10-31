import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT, useFmt, usePartnerListings } from '@/features/portal/shared';
import { currentOffer, inventory, unitsFor, useDrafts, usePromotions } from '@/services/inventory';
import { lt } from '@/lib/content';

export default function BusinessListingsPage() {
  const { t } = useBizT();
  const f = useFmt();
  const toast = useToast();
  const { partner } = usePartnerOrg();
  const listings = usePartnerListings(partner.id);
  const drafts = useDrafts().filter(d => d.partnerId === partner.id && d.status !== 'published');
  usePromotions();

  const togglePause = (id: string, paused: boolean) => {
    inventory.update(id, { paused: !paused });
    toast.show({ icon: 'check', text: t(paused ? 'business:listings.resumed' : 'business:listings.paused') });
  };

  return (
    <>
      <PortalHead title={t('business:nav.listings')} text={t('business:listings.text')}
        actions={<Link className="btn solid sm" to="/business/listings/new"><Icon name="plus" />{t('business:listings.new')}</Link>} />
      <div className="table-wrap">
        <table className="dtable">
          <thead><tr>
            <th scope="col">{t('business:common.listing')}</th><th scope="col">{t('business:listings.type')}</th><th scope="col" className="num">{t('business:listings.price')}</th>
            <th scope="col" className="num">{t('business:listings.units')}</th><th scope="col">{t('business:listings.booking')}</th><th scope="col">{t('business:listings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th>
          </tr></thead>
          <tbody>
            {listings.map(l => {
              const offer = currentOffer(l);
              return (
                <tr key={l.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="thumb" style={{ position: 'relative', width: 64, height: 46, borderRadius: 10, overflow: 'hidden', flex: 'none' }}><Media id={l.media[0]!} sizes="64px" decorative /></span>
                      <span><Link to={`/business/listings/${l.id}`}>{lt(l.title, f.lang)}</Link><small>{offer ? t('business:listings.offer', { percent: offer.percent }) : l.pano ? '360°' : t('common:badges.panoPreview')}</small></span>
                    </div>
                  </td>
                  <td>{t(`common:listingType.${l.type}`)}<small>{t(`common:subtype.${l.subtype}`)}</small></td>
                  <td className="num">{f.m(l.price.amountUsd)}<small>/ {t(`common:price.unit.${l.price.unit}`)}</small></td>
                  <td className="num">{f.n(unitsFor(l))}</td>
                  <td>{l.instantBook ? t('explore:listing.instant') : t('business:listings.request')}</td>
                  <td><span className={`status ${l.paused ? 'draft' : 'paid'}`}>{l.paused ? t('business:listings.statusPaused') : t('business:listings.statusLive')}</span></td>
                  <td>
                    <span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                      <Link className="btn ghost sm" to={`/business/listings/${l.id}`}><Icon name="edit" />{t('business:common.edit')}</Link>
                      <button type="button" className="btn ghost sm" onClick={() => togglePause(l.id, !!l.paused)}><Icon name={l.paused ? 'play' : 'pause'} />{l.paused ? t('business:listings.resume') : t('business:listings.pause')}</button>
                      <Link className="icon-btn" to={`/listing/${l.slug}`} aria-label={t('business:listings.viewPublic', { title: lt(l.title, f.lang) })}><Icon name="external" /></Link>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Notice icon="info">{t('business:listings.liveNote')}</Notice>

      {drafts.length > 0 && (
        <section className="p-section" aria-labelledby="drafts-h">
          <h2 id="drafts-h">{t('business:listings.drafts')}</h2>
          <ul className="list">
            {drafts.map(d => (
              <li key={d.id} className="list-item">
                <span className="ico"><Icon name="edit" /></span>
                <span className="grow"><b>{d.title || t('business:listings.untitled')}</b><small>{t(`common:listingType.${d.type}`)} · {f.m(d.priceUsd)} · {f.d(d.updatedAt)}</small></span>
                <span className="actions">
                  <span className={`status ${d.status === 'in_review' ? 'pending' : d.status === 'rejected' ? 'refunded' : 'draft'}`} title={d.reviewNote}>{t(`business:listings.draftStatus.${d.status}`)}</span>
                  <Link className="btn ghost sm" to={`/business/listings/new?draft=${d.id}`}>{t('business:common.edit')}</Link>
                  <button type="button" className="icon-btn" onClick={() => inventory.removeDraft(d.id)} aria-label={t('business:common.delete')}><Icon name="trash" /></button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
