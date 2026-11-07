import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getUrl } from 'aws-amplify/storage';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT, useAllBookings } from '@/features/portal/admin';
import { partnersAdmin, platformMetrics, audit } from '@/services/admin';
import { settingsStore, useApplications, type PartnerApplication } from '@/services/business';
import { draftStore, partnerAdminStore, type ListingDraft } from '@/services/inventory';
import { lastMonths } from '@/services/businessAnalytics';
import { seedIndex } from '@/services/catalog';
import { useStore } from '@/lib/store';

const TABS = ['directory', 'applications', 'listings'] as const;
type Tab = (typeof TABS)[number];

function ApplicationModal({ app, write, onClose }: { app: PartnerApplication; write: boolean; onClose: () => void }) {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const [note, setNote] = useState(app.decisionNote ?? '');
  const [busy, setBusy] = useState(false);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [revoking, setRevoking] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  useEffect(() => {
    let cancelled = false;
    Promise.all(app.certificationDocs.map(path => getUrl({ path }).then(r => r.url.toString())))
      .then(urls => { if (!cancelled) setDocUrls(urls); })
      .catch(() => { /* a stale/missing doc shouldn't block viewing the rest of the application */ });
    return () => { cancelled = true; };
  }, [app.certificationDocs]);
  const decide = async (d: 'approved' | 'rejected' | 'in_review') => {
    setBusy(true);
    try {
      await partnersAdmin.decideApplication(app.id, d, note.trim() || undefined);
      toast.show({ icon: 'check', text: t(`admin:partners.decided.${d}`, { name: app.businessName }) });
      onClose();
    } catch {
      setBusy(false);
      toast.show({ icon: 'close', text: t('admin:partners.decideFailed') });
    }
  };
  const revoke = async () => {
    setBusy(true);
    try {
      await partnersAdmin.revokeApplication(app.id, revokeReason.trim());
      toast.show({ icon: 'check', text: t('admin:partners.revoked', { name: app.businessName }) });
      onClose();
    } catch {
      setBusy(false);
      toast.show({ icon: 'close', text: t('admin:partners.revokeFailed') });
    }
  };
  return (
    <Modal title={app.businessName} onClose={onClose} wide footer={write ? (
      revoking ? (
        <span className="chip-row" style={{ flexWrap: 'nowrap', width: '100%' }}>
          <button type="button" className="btn ghost sm" disabled={busy} onClick={() => setRevoking(false)}>{t('common:actions.cancel')}</button>
          <button type="button" className="btn solid sm danger" disabled={busy || !revokeReason.trim()} onClick={revoke}>{t('admin:partners.confirmRevoke')}</button>
        </span>
      ) : (
        <>
          <button type="button" className="btn ghost sm danger" disabled={busy} onClick={() => decide('rejected')}>{t('admin:partners.reject')}</button>
          <span className="chip-row">
            <button type="button" className="btn ghost sm" disabled={busy} onClick={() => decide('in_review')}>{t('admin:partners.startReview')}</button>
            {app.status === 'approved'
              ? <button type="button" className="btn ghost sm danger" disabled={busy} onClick={() => setRevoking(true)}>{t('admin:partners.revoke')}</button>
              : <button type="button" className="btn solid sm" disabled={busy} onClick={() => decide('approved')}><Icon name="check" />{t('admin:partners.approve')}</button>}
          </span>
        </>
      )
    ) : undefined}>
      <dl className="kv">
        <dt>{t('business:listings.type')}</dt><dd>{t(`explore:partnerKind.${app.kind}`)}</dd>
        <dt>{t('business:join.area')}</dt><dd>{app.area} · {app.destinations.map(id => seedIndex.destById.get(id)?.name).join(', ')}</dd>
        <dt>{t('business:join.services')}</dt><dd>{app.services.map(s => t(`common:listingTypePlural.${s}`)).join(', ')}</dd>
        <dt>{t('business:join.licence')}</dt><dd>{app.licence || '—'}</dd>
        <dt>{t('business:join.registration')}</dt><dd>{app.registration || '—'}</dd>
        <dt>{t('business:join.certDocs')}</dt><dd>{docUrls.length ? docUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">{t('admin:partners.viewDoc', { n: i + 1 })}</a>).reduce((prev, cur) => <>{prev} · {cur}</>) : '—'}</dd>
        <dt>{t('business:join.contactName')}</dt><dd>{app.contact.name} · {app.contact.email} · {app.contact.phone}</dd>
        <dt>{t('admin:partners.submitted')}</dt><dd>{f.dt(app.createdAt)}</dd>
        <dt>{t('business:join.community')}</dt><dd>{app.communityOwned ? t('business:common.yes') : t('business:common.no')}</dd>
        {app.ecoCertification && <><dt>{t('business:join.eco')}</dt><dd>{app.ecoCertification}</dd></>}
      </dl>
      <p>{app.about}</p>
      {write && !revoking && <label className="field"><span>{t('admin:partners.note')}</span><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={t('admin:partners.notePh')} /></label>}
      {revoking && <label className="field"><span>{t('admin:partners.revokeReason')}</span><textarea rows={2} value={revokeReason} onChange={e => setRevokeReason(e.target.value)} placeholder={t('admin:partners.revokeReasonPh')} /></label>}
      <p className="small muted">{t('admin:partners.checks')}</p>
    </Modal>
  );
}

function DraftModal({ draft, write, onClose }: { draft: ListingDraft; write: boolean; onClose: () => void }) {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const [note, setNote] = useState(draft.reviewNote ?? '');
  const decide = (status: 'published' | 'rejected') => {
    draftStore.set(l => l.map(d => (d.id === draft.id ? { ...d, status, reviewNote: note.trim() || undefined, updatedAt: new Date().toISOString() } : d)));
    audit(status === 'published' ? 'listing.publish' : 'listing.reject', draft.id, draft.title);
    toast.show({ icon: 'check', text: t(status === 'published' ? 'admin:partners.listingPublished' : 'admin:partners.listingRejected') });
    onClose();
  };
  return (
    <Modal title={draft.title} onClose={onClose} wide footer={write ? <><button type="button" className="btn ghost sm danger" onClick={() => decide('rejected')}>{t('admin:partners.reject')}</button><button type="button" className="btn solid sm" onClick={() => decide('published')}><Icon name="check" />{t('admin:partners.publishListing')}</button></> : undefined}>
      <dl className="kv">
        <dt>{t('admin:partners.partner')}</dt><dd>{seedIndex.partnerById.get(draft.partnerId)?.name}</dd>
        <dt>{t('business:listings.type')}</dt><dd>{t(`common:listingType.${draft.type}`)} · {t(`common:subtype.${draft.subtype}`)}</dd>
        <dt>{t('explore:filters.destination')}</dt><dd>{seedIndex.destById.get(draft.destinationId)?.name}</dd>
        <dt>{t('business:listings.price')}</dt><dd>{f.m(draft.priceUsd)} / {t(`common:price.unit.${draft.unit}`)}</dd>
        <dt>{t('business:listing.units')}</dt><dd>{draft.units}</dd>
      </dl>
      <p><b>{draft.summary}</b></p>
      <p style={{ whiteSpace: 'pre-line' }}>{draft.description}</p>
      {write && <label className="field"><span>{t('admin:partners.note')}</span><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={t('admin:partners.notePh')} /></label>}
      <p className="small muted">{t('admin:partners.listingChecks')}</p>
    </Modal>
  );
}

export default function AdminPartnersPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const { write } = useAdmin('partners');
  const bookings = useAllBookings();
  const admin = useStore(partnerAdminStore);
  const settings = useStore(settingsStore);
  const apps = useApplications();
  const drafts = useStore(draftStore).filter(d => d.status === 'in_review');
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'directory') as Tab;
  const [openApp, setOpenApp] = useState<PartnerApplication | null>(null);
  const [openDraft, setOpenDraft] = useState<ListingDraft | null>(null);
  const m = platformMetrics(bookings, lastMonths(12));
  const pendingApps = apps.filter(a => a.status === 'submitted' || a.status === 'in_review');

  return (
    <>
      <PortalHead title={t('admin:nav.partners')} text={t('admin:partners.text')} />
      <ReadOnly show={!write} />
      <div className="tabs" role="tablist" aria-label={t('admin:nav.partners')}>
        {TABS.map(k => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}>{t(`admin:partners.tab.${k}`)}{k === 'applications' && pendingApps.length ? ` (${pendingApps.length})` : k === 'listings' && drafts.length ? ` (${drafts.length})` : ''}</button>)}
      </div>

      {tab === 'directory' && (
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('admin:partners.partner')}</th><th scope="col">{t('business:listings.type')}</th><th scope="col" className="num">{t('business:nav.listings')}</th><th scope="col" className="num">{t('business:kpi.bookings')}</th><th scope="col" className="num">{t('admin:kpi.gmv')}</th><th scope="col">{t('business:settings.commission')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
          <tbody>{m.byPartner.map(({ partner: p, bookings: bk, gmv, listings }) => {
            const a = admin[p.id] ?? {};
            const rate = settings[p.id]?.commissionRate ?? 0.1;
            return (
              <tr key={p.id}>
                <td><Link to={`/partner/${p.slug}`}>{p.name}</Link><small>{p.real ? t('common:badges.founding') : t('common:badges.sample')}</small></td>
                <td>{t(`explore:partnerKind.${p.kind}`)}</td>
                <td className="num">{listings}</td><td className="num">{bk}</td><td className="num">{f.m(gmv)}</td>
                <td>{write ? (
                  <select className="input" aria-label={t('admin:partners.commissionFor', { name: p.name })} value={Math.round(rate * 100)} onChange={e => { partnersAdmin.setCommission(p.id, Number(e.target.value) / 100); toast.show({ icon: 'check', text: t('admin:partners.commissionSaved') }); }}>
                    {[0, 5, 8, 10, 12, 15, 18, 20].map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>) : `${Math.round(rate * 100)}%`}</td>
                <td>{a.suspended ? <span className="status refunded">{t('admin:partners.suspended')}</span> : p.verified ? <span className="status paid">{t('common:badges.verified')}</span> : <span className="status draft">{t('board:partners.unverified')}</span>}</td>
                <td>{write && <span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                  <button type="button" className="btn ghost sm" onClick={() => partnersAdmin.setVerified(p.id, !p.verified)}>{p.verified ? t('admin:partners.unverify') : t('admin:partners.verify')}</button>
                  <button type="button" className="btn ghost sm danger" onClick={() => { partnersAdmin.setSuspended(p.id, !a.suspended); toast.show({ icon: 'check', text: t(a.suspended ? 'admin:partners.reinstated' : 'admin:partners.suspendedToast', { name: p.name }) }); }}>{a.suspended ? t('admin:partners.reinstate') : t('admin:partners.suspend')}</button>
                </span>}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
      {tab === 'directory' && <p className="small muted">{t('admin:partners.suspendNote')}</p>}

      {tab === 'applications' && (apps.length ? (
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('business:join.businessName')}</th><th scope="col">{t('business:listings.type')}</th><th scope="col">{t('business:join.area')}</th><th scope="col">{t('admin:partners.submitted')}</th><th scope="col">{t('business:bookings.status')}</th></tr></thead>
          <tbody>{apps.map(a => (
            <tr key={a.id}><td><button type="button" className="tlink" onClick={() => setOpenApp(a)}><span>{a.businessName}</span></button><small>{a.id}</small></td><td>{t(`explore:partnerKind.${a.kind}`)}</td><td>{a.area}</td><td>{f.d(a.createdAt)}</td>
              <td><span className={`status ${a.status === 'approved' ? 'paid' : a.status === 'rejected' || a.status === 'revoked' ? 'refunded' : 'pending'}`}>{t(`admin:partners.appStatus.${a.status}`)}</span></td></tr>
          ))}</tbody>
        </table></div>
      ) : <p className="muted">{t('admin:partners.noApplications')}</p>)}

      {tab === 'listings' && (drafts.length ? (
        <ul className="list">{drafts.map(d => (
          <li key={d.id} className="list-item"><span className="ico"><Icon name="building" /></span>
            <span className="grow"><b>{d.title}</b><small>{seedIndex.partnerById.get(d.partnerId)?.name} · {t(`common:listingType.${d.type}`)} · {f.m(d.priceUsd)} · {f.d(d.updatedAt)}</small></span>
            <button type="button" className="btn solid sm" onClick={() => setOpenDraft(d)}>{t('admin:partners.review')}</button></li>
        ))}</ul>
      ) : <p className="muted">{t('admin:partners.noListings')}</p>)}

      {openApp && <ApplicationModal app={openApp} write={write} onClose={() => setOpenApp(null)} />}
      {openDraft && <DraftModal draft={openDraft} write={write} onClose={() => setOpenDraft(null)} />}
    </>
  );
}
