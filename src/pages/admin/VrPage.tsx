import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Notice } from '@/components/ui/bits';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { ReadOnly, useAdmin, useAdminT } from '@/features/portal/admin';
import { audit } from '@/services/admin';
import { allManagedExperiences, CONTENT_STATUSES, useAdminExperiences, useExperienceStatus, vrAdmin, type AdminExperience, type ContentStatus } from '@/services/moderation';
import { vrRequestStore, type VrRequest } from '@/services/business';
import { seedIndex } from '@/services/catalog';
import { useStore } from '@/lib/store';
import { lt } from '@/lib/content';
import { LANGUAGES } from '@/i18n';
import panos from '@/data/panos.generated.json';
import { formatOf, VIDEOS } from '@/lib/immersive';
import { creatorApplications, useCreatorApplications, type CreatorApplication } from '@/services/creators';
import media from '@/data/media.generated.json';
import type { ExperienceKind, Hotspot, Locale } from '@/domain/types';

const KINDS: ExperienceKind[] = ['wildlife', 'culture', 'landscape', 'beach', 'adventure', 'city'];
const PANO_IDS = Object.keys(panos as Record<string, unknown>);
const VIDEO_IDS = Object.keys(VIDEOS);
const FORMAT_KEY = { video: 'common:badges.video360', photo360: 'common:badges.photo360', preview: 'common:badges.panoPreview' } as const;
const PHOTO_IDS = Object.keys(media as Record<string, unknown>).filter(id => !id.startsWith('pano-') && !id.startsWith('logo-'));
/** Next statuses an editor can move an item to. */
const NEXT: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review'], review: ['approved', 'draft'], approved: ['published', 'draft'], published: ['archived'], archived: ['draft', 'published']
};

function Editor({ xp, onClose }: { xp?: AdminExperience; onClose: () => void }) {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const [lang, setLang] = useState<Locale>(xp?.lang ?? (f.lang as Locale));
  const [d, setD] = useState(() => ({
    title: xp?.title[lang] ?? '', tagline: xp?.tagline[lang] ?? '', narration: xp?.narration?.[lang] ?? '',
    destinationId: xp?.destinationId ?? seedIndex.destinations[0]!.id, kind: xp?.kind ?? 'landscape' as ExperienceKind,
    media: xp?.media ?? PHOTO_IDS[0]!, video: xp?.video ?? '', pano: xp?.pano ?? '', startYaw: xp?.startYaw ?? 0, durationMin: xp?.durationMin ?? 5,
    hotspots: xp?.hotspots ?? [] as Hotspot[], listingIds: xp?.listingIds ?? [] as string[], sourceFile: xp?.sourceFile ?? ''
  }));
  const [hs, setHs] = useState({ yaw: 0, pitch: 0, kind: 'info' as Hotspot['kind'], title: '', text: '' });
  const [fileErr, setFileErr] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = d.title.trim().length < 4 || d.tagline.trim().length < 6;

  const save = () => {
    setTouched(true);
    if (invalid || fileErr) return;
    const id = vrAdmin.save({
      id: xp?.id, lang, destinationId: d.destinationId, kind: d.kind, media: d.media, video: d.video || undefined, pano: d.pano || undefined, startYaw: d.startYaw, durationMin: d.durationMin,
      hotspots: d.hotspots, listingIds: d.listingIds, sourceFile: d.sourceFile || undefined,
      title: { ...xp?.title, [lang]: d.title.trim() }, tagline: { ...xp?.tagline, [lang]: d.tagline.trim() },
      narration: d.narration.trim() ? { ...xp?.narration, [lang]: d.narration.trim() } : xp?.narration
    });
    audit(xp ? 'experience.update' : 'experience.create', id, d.title.trim());
    toast.show({ icon: 'check', text: t('admin:vr.saved') });
    onClose();
  };
  const listings = seedIndex.listings.filter(l => l.destinationId === d.destinationId);

  return (
    <Modal title={xp ? t('admin:vr.edit') : t('admin:vr.create')} onClose={onClose} wide
      footer={<><button type="button" className="btn ghost" onClick={onClose}>{t('common:actions.cancel')}</button><button type="button" className="btn solid" onClick={save}>{t('common:actions.save')}</button></>}>
      <div className="form-grid">
        <label className="field"><span>{t('business:listing.editLang')}</span><select value={lang} onChange={e => { const l = e.target.value as Locale; setLang(l); setD(s => ({ ...s, title: xp?.title[l] ?? '', tagline: xp?.tagline[l] ?? '', narration: xp?.narration?.[l] ?? '' })); }}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select></label>
        <label className="field"><span>{t('explore:filters.destination')}</span><select value={d.destinationId} onChange={e => setD({ ...d, destinationId: e.target.value, listingIds: [] })}>{seedIndex.destinations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="field full"><span>{t('business:listing.title')}</span><input value={d.title} maxLength={80} onChange={e => setD({ ...d, title: e.target.value })} aria-invalid={touched && d.title.trim().length < 4} /></label>
        <label className="field full"><span>{t('admin:vr.tagline')}</span><input value={d.tagline} maxLength={120} onChange={e => setD({ ...d, tagline: e.target.value })} aria-invalid={touched && d.tagline.trim().length < 6} /></label>
        <label className="field"><span>{t('admin:vr.category')}</span><select value={d.kind} onChange={e => setD({ ...d, kind: e.target.value as ExperienceKind })}>{KINDS.map(k => <option key={k} value={k}>{t(`common:kindLabel.${k}`)}</option>)}</select></label>
        <label className="field"><span>{t('admin:vr.duration')}</span><input type="number" min={1} max={120} value={d.durationMin} onChange={e => setD({ ...d, durationMin: Math.max(1, Number(e.target.value)) })} /></label>
        <label className="field"><span>{t('admin:vr.video')}</span><select value={d.video} onChange={e => setD({ ...d, video: e.target.value, media: e.target.value ? `video-${e.target.value}` : d.media })}><option value="">{t('admin:vr.noVideo')}</option>{VIDEO_IDS.map(v => <option key={v} value={v}>{v} · {Math.round(VIDEOS[v]!.duration)} s</option>)}</select><span className="hint">{t('admin:vr.videoHint')}</span></label>
        <label className="field"><span>{t('admin:vr.pano')}</span><select value={d.pano} onChange={e => setD({ ...d, pano: e.target.value })}><option value="">{t('admin:vr.noPano')}</option>{PANO_IDS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
        <label className="field"><span>{t('admin:vr.photo')}</span><select value={d.media} onChange={e => setD({ ...d, media: e.target.value })}>{PHOTO_IDS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
        <div className="full" style={{ position: 'relative', height: 160, borderRadius: 14, overflow: 'hidden' }}><Media id={d.video ? `video-${d.video}` : d.pano ? `pano-${d.pano}` : d.media} sizes="600px" decorative /></div>
        <label className="field full"><span>{t('admin:vr.upload')}</span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.mp4,.mov,.insv" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const ok = /\.(jpe?g|png|webp|tiff?|mp4|mov|insv)$/i.test(file.name) && file.size < 2 * 1024 ** 3; setFileErr(ok ? '' : t('admin:vr.fileErr')); setD(s => ({ ...s, sourceFile: ok ? file.name : '' })); }} />
          <span className="hint">{t('admin:vr.uploadHint')}</span>{fileErr && <span className="err">{fileErr}</span>}{d.sourceFile && <span className="hint">{t('admin:vr.queued', { name: d.sourceFile })}</span>}</label>
        <label className="field"><span>{t('admin:vr.startYaw')}</span><input type="number" min={-180} max={180} value={d.startYaw} onChange={e => setD({ ...d, startYaw: Number(e.target.value) })} /></label>
        <label className="field full"><span>{t('admin:vr.narration')}</span><textarea rows={3} value={d.narration} onChange={e => setD({ ...d, narration: e.target.value })} placeholder={t('admin:vr.narrationPh')} /></label>
      </div>

      <fieldset className="field" style={{ border: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>{t('admin:vr.hotspots')}</legend>
        {d.hotspots.length > 0 && <ul className="list">{d.hotspots.map((h, i) => (
          <li key={i} className="list-item"><span className="grow"><b>{lt(h.title, lang)}</b><small>{t(`admin:vr.hsKind.${h.kind}`)} · yaw {h.yaw}° · pitch {h.pitch}°</small></span>
            <button type="button" className="icon-btn" onClick={() => setD({ ...d, hotspots: d.hotspots.filter((_, j) => j !== i) })} aria-label={t('business:common.delete')}><Icon name="trash" /></button></li>
        ))}</ul>}
        <div className="inline-form">
          <label className="field"><span>{t('admin:vr.hsTitle')}</span><input value={hs.title} onChange={e => setHs({ ...hs, title: e.target.value })} /></label>
          <label className="field"><span>{t('admin:vr.hsKindLabel')}</span><select value={hs.kind} onChange={e => setHs({ ...hs, kind: e.target.value as Hotspot['kind'] })}>{(['info', 'wildlife', 'culture', 'nearby'] as const).map(k => <option key={k} value={k}>{t(`admin:vr.hsKind.${k}`)}</option>)}</select></label>
          <label className="field" style={{ maxWidth: 110 }}><span>Yaw (°)</span><input type="number" min={-180} max={180} value={hs.yaw} onChange={e => setHs({ ...hs, yaw: Number(e.target.value) })} /></label>
          <label className="field" style={{ maxWidth: 110 }}><span>Pitch (°)</span><input type="number" min={-60} max={60} value={hs.pitch} onChange={e => setHs({ ...hs, pitch: Number(e.target.value) })} /></label>
        </div>
        <label className="field"><span>{t('admin:vr.hsText')}</span><input value={hs.text} onChange={e => setHs({ ...hs, text: e.target.value })} /></label>
        <button type="button" className="btn ghost sm" style={{ justifySelf: 'start', marginTop: 8 }} disabled={!hs.title.trim()} onClick={() => { setD({ ...d, hotspots: [...d.hotspots, { yaw: hs.yaw, pitch: hs.pitch, kind: hs.kind, title: { en: hs.title.trim(), [lang]: hs.title.trim() } as Hotspot['title'], text: { en: hs.text.trim(), [lang]: hs.text.trim() } as Hotspot['text'] }] }); setHs({ yaw: 0, pitch: 0, kind: 'info', title: '', text: '' }); }}><Icon name="plus" />{t('admin:vr.addHotspot')}</button>
      </fieldset>

      {listings.length > 0 && (
        <fieldset className="field" style={{ border: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>{t('admin:vr.bookable')}</legend>
          <div className="checks">{listings.map(l => <label key={l.id} className="check"><input type="checkbox" checked={d.listingIds.includes(l.id)} onChange={e => setD({ ...d, listingIds: e.target.checked ? [...d.listingIds, l.id] : d.listingIds.filter(x => x !== l.id) })} />{lt(l.title, lang)}</label>)}</div>
        </fieldset>
      )}
      <Notice icon="info">{t('admin:vr.workflowNote')}</Notice>
    </Modal>
  );
}

/** Creator programme applications (public form at /creators/apply), reviewed by the content team. */
function CreatorApplications({ write }: { write: boolean }) {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const apps = useCreatorApplications();
  const [open, setOpen] = useState<CreatorApplication | null>(null);
  const [note, setNote] = useState('');
  const pending = apps.filter(a => a.status === 'submitted' || a.status === 'in_review').length;
  const places = (a: CreatorApplication) => [...a.destinations.map(id => seedIndex.destById.get(id)?.name ?? id), a.otherPlaces].filter(Boolean).join(', ');
  const decide = (a: CreatorApplication, s: CreatorApplication['status']) => {
    creatorApplications.decide(a.id, s, note.trim() || undefined);
    audit(`creator.${s}`, a.id, a.name);
    toast.show({ icon: 'check', text: t(`admin:creators.decided.${s}`, { name: a.name }) });
    setOpen(null); setNote('');
  };
  return (
    <section className="p-section" aria-labelledby="cr-apps">
      <div className="row-between"><h2 id="cr-apps">{t('admin:creators.title')}{pending ? ` (${pending})` : ''}</h2><Link className="tlink" to="/creators"><span>{t('admin:creators.public')}</span><Icon name="external" /></Link></div>
      {apps.length ? (
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('admin:creators.creator')}</th><th scope="col">{t('admin:creators.places')}</th><th scope="col">{t('board:attractions.format')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
          <tbody>{apps.map(a => (
            <tr key={a.id}>
              <td className="wide"><b>{a.name}</b><small>{t(`pages:creators.type.${a.type}`)} · {a.base} · {f.d(a.createdAt)}</small></td>
              <td>{places(a)}</td>
              <td>{a.formats.map(x => t(FORMAT_KEY[x])).join(', ')}</td>
              <td><span className={`status ${a.status === 'approved' ? 'paid' : a.status === 'rejected' ? 'cancelled' : 'pending'}`}>{t(`admin:creators.status.${a.status}`)}</span></td>
              <td><button type="button" className="btn ghost sm" onClick={() => { setOpen(a); setNote(a.decisionNote ?? ''); }}>{t('admin:creators.review')}</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="muted">{t('admin:creators.none')}</p>}
      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)} wide
          footer={write ? <>
            <button type="button" className="btn ghost" onClick={() => decide(open, 'rejected')}>{t('admin:creators.reject')}</button>
            <button type="button" className="btn ghost" onClick={() => decide(open, 'in_review')}>{t('admin:creators.inReview')}</button>
            <button type="button" className="btn solid" onClick={() => decide(open, 'approved')}>{t('admin:creators.approve')}</button>
          </> : undefined}>
          <dl className="kv">
            <dt>{t('admin:creators.id')}</dt><dd>{open.id}</dd>
            <dt>{t('trip:book.email')}</dt><dd><a href={`mailto:${open.email}`}>{open.email}</a></dd>
            <dt>{t('pages:creators.form.type')}</dt><dd>{t(`pages:creators.type.${open.type}`)} · {t(`pages:creators.audience.${open.audience}`)}</dd>
            <dt>{t('admin:creators.places')}</dt><dd>{places(open)}</dd>
            <dt>{t('pages:creators.form.links')}</dt><dd style={{ display: 'grid', gap: 4 }}>{open.links.map(l => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow">{l}</a>)}</dd>
            {open.gear && <><dt>{t('pages:creators.form.gear')}</dt><dd>{open.gear}</dd></>}
            <dt>{t('explore:dest.languages')}</dt><dd>{open.languages.join(', ')}</dd>
            <dt>{t('pages:creators.form.about')}</dt><dd style={{ whiteSpace: 'pre-line' }}>{open.about}</dd>
            <dt>{t('admin:creators.rights')}</dt><dd>{open.rightsConfirmed ? t('admin:creators.yes') : '—'}</dd>
          </dl>
          {write && <label className="field"><span>{t('admin:creators.note')}</span><input value={note} maxLength={200} onChange={e => setNote(e.target.value)} placeholder={t('admin:creators.notePh')} /></label>}
          <Notice icon="info">{t('admin:creators.nextNote')}</Notice>
        </Modal>
      )}
    </section>
  );
}

export default function AdminVrPage() {
  const { t } = useAdminT();
  const f = useFmt();
  const toast = useToast();
  const { write } = useAdmin('vr');
  const statuses = useExperienceStatus();
  const created = useAdminExperiences();
  const requests = useStore(vrRequestStore);
  const [params, setParams] = useSearchParams();
  const filter = (params.get('status') ?? 'all') as ContentStatus | 'all';
  const [editing, setEditing] = useState<{ xp?: AdminExperience } | null>(null);
  const items = useMemo(() => { void statuses; void created; return allManagedExperiences(); }, [statuses, created]);
  const shown = items.filter(i => filter === 'all' || i.status === filter);
  const move = (id: string, s: ContentStatus, name: string) => { vrAdmin.setStatus(id, s); audit(`experience.${s}`, id, name); toast.show({ icon: 'check', text: t('admin:vr.moved', { name, status: t(`admin:vr.status.${s}`) }) }); };
  const setReq = (r: VrRequest, status: VrRequest['status']) => { vrRequestStore.set(l => l.map(x => (x.id === r.id ? { ...x, status } : x))); audit('vrRequest.status', r.id, status); };

  return (
    <>
      <PortalHead title={t('admin:nav.vr')} text={t('admin:vr.text')} actions={write ? <button type="button" className="btn solid sm" onClick={() => setEditing({})}><Icon name="plus" />{t('admin:vr.create')}</button> : undefined} />
      <ReadOnly show={!write} />
      <div className="tabs" role="tablist" aria-label={t('business:bookings.status')}>
        {(['all', ...CONTENT_STATUSES] as const).map(s => <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setParams(s === 'all' ? {} : { status: s })}>{s === 'all' ? t('business:bookings.tab.all') : t(`admin:vr.status.${s}`)} ({s === 'all' ? items.length : items.filter(i => i.status === s).length})</button>)}
      </div>
      <div className="table-wrap"><table className="dtable">
        <thead><tr><th scope="col">{t('admin:vr.experience')}</th><th scope="col">{t('explore:filters.destination')}</th><th scope="col">{t('board:attractions.format')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
        <tbody>{shown.map(({ xp, status, created: isNew }) => {
          const name = lt(xp.title, f.lang);
          return (
            <tr key={xp.id}>
              <td className="wide">{status === 'published' ? <Link to={`/vr/${xp.slug}`}>{name}</Link> : name}<small>{isNew ? t('admin:vr.createdHere') : t('admin:vr.catalogue')}{xp.hotspots?.length ? ` · ${t('admin:vr.hotspotCount', { count: xp.hotspots.length })}` : ''}</small></td>
              <td>{seedIndex.destById.get(xp.destinationId)?.name}</td>
              <td>{t(FORMAT_KEY[formatOf(xp)])}</td>
              <td><span className={`status ${status === 'published' ? 'paid' : status === 'archived' ? 'draft' : status === 'approved' ? 'confirmed' : 'pending'}`}>{t(`admin:vr.status.${status}`)}</span></td>
              <td>{write && <span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                {NEXT[status].map(s => <button key={s} type="button" className={`btn sm ${s === 'published' || s === 'approved' ? 'solid' : 'ghost'}`} onClick={() => move(xp.id, s, name)}>{t(`admin:vr.action.${s}`)}</button>)}
                {isNew && <button type="button" className="icon-btn" onClick={() => setEditing({ xp: created.find(c => c.id === xp.id) })} aria-label={t('business:common.edit')}><Icon name="edit" /></button>}
              </span>}</td>
            </tr>
          );
        })}</tbody>
      </table></div>

      <section className="p-section" aria-labelledby="vr-req">
        <h2 id="vr-req">{t('admin:vr.partnerRequests')}</h2>
        {requests.length ? <ul className="list">{requests.map(r => (
          <li key={r.id} className="list-item">
            <span className="ico"><Icon name={r.kind === 'upload' ? 'upload' : 'view360'} /></span>
            <span className="grow"><b>{seedIndex.partnerById.get(r.partnerId)?.name} · {seedIndex.listingById.get(r.listingId)?.title.en}</b><small>{t(r.kind === 'upload' ? 'business:vr.kindUpload' : 'business:vr.kindCapture')}{r.format ? ` · ${t(FORMAT_KEY[r.format])}` : ''}{r.fileName ? ` · ${r.fileName}` : ''}{r.preferredDate ? ` · ${f.d(r.preferredDate)}` : ''}{r.notes ? ` · ${r.notes}` : ''}</small></span>
            {write ? <select className="input" value={r.status} aria-label={t('business:bookings.status')} onChange={e => setReq(r, e.target.value as VrRequest['status'])}>{(['submitted', 'scheduled', 'processing', 'live'] as const).map(s => <option key={s} value={s}>{t(`business:vr.status.${s}`)}</option>)}</select>
              : <span className="status pending">{t(`business:vr.status.${r.status}`)}</span>}
          </li>
        ))}</ul> : <p className="muted">{t('business:vr.noRequests')}</p>}
      </section>
      <CreatorApplications write={write} />
      {editing && <Editor xp={editing.xp} onClose={() => setEditing(null)} />}
    </>
  );
}
