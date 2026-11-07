import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/app/providers/ToastProvider';
import { usePartnerOrg } from '@/components/portal/PortalLayout';
import { PortalHead, useBizT, useFmt, useListingTitle, usePartnerListings } from '@/features/portal/shared';
import { vrContent, vrRequestStore, type VrRequest } from '@/services/business';
import { useStore } from '@/lib/store';
import { addDays, todayIso } from '@/lib/random';

const MAX_MB = { video: 4096, photo360: 200 } as const;
// Equirectangular 360 content is always 2:1 (the full sphere unwrapped) - this is the
// standard heuristic every 360 platform (Facebook, YouTube) checks first. ±5% tolerance
// absorbs off-by-one-pixel encoders without accepting a clearly-wrong shape like 16:9.
const ASPECT_TARGET = 2;
const ASPECT_TOLERANCE = 0.05;
// This project's own static pano pipeline already serves 4096px as its top tier
// (scripts/build-videos.mjs) - 4000px is "as good as the best tier we already publish",
// not an arbitrary number.
const MIN_PHOTO_WIDTH = 4000;
// No existing site convention to anchor this to (unlike the photo width) - a reasonable
// placeholder for "real 4K-equirectangular 360 video", worth a sanity check against actual
// sample footage.
const MIN_VIDEO_BITRATE_MBPS = 20;

function checkAspect(width: number, height: number): boolean {
  if (!width || !height) return false;
  return Math.abs(width / height - ASPECT_TARGET) <= ASPECT_TARGET * ASPECT_TOLERANCE;
}

/** Reads real dimensions (and, for video, an approximate bitrate) straight from the browser's
 *  own decoders - no upload, no new dependency. This is the actual enforcement; the
 *  extension/size regex above it only catches obviously-wrong files cheaply before bothering
 *  to decode anything. */
function checkMediaQuality(file: File, format: NonNullable<VrRequest['format']>): Promise<string> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    if (format === 'photo360') {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (!checkAspect(img.naturalWidth, img.naturalHeight)) resolve('errAspect');
        else if (img.naturalWidth < MIN_PHOTO_WIDTH) resolve('errLowRes');
        else resolve('');
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve('errUnreadable'); };
      img.src = url;
    } else {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const bitrateMbps = (file.size * 8) / video.duration / 1_000_000;
        if (!checkAspect(video.videoWidth, video.videoHeight)) resolve('errAspect');
        else if (bitrateMbps < MIN_VIDEO_BITRATE_MBPS) resolve('errBitrate');
        else resolve('');
      };
      video.onerror = () => { URL.revokeObjectURL(url); resolve('errUnreadable'); };
      video.src = url;
    }
  });
}

function RequestModal({ partnerId, onClose }: { partnerId: string; onClose: () => void }) {
  const { t } = useBizT();
  const toast = useToast();
  const listings = usePartnerListings(partnerId);
  const title = useListingTitle();
  const [kind, setKind] = useState<VrRequest['kind']>('upload');
  const [format, setFormat] = useState<NonNullable<VrRequest['format']>>('video');
  const [listingId, setListingId] = useState(listings[0]?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState('');
  const [checkingFile, setCheckingFile] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(addDays(todayIso(), 21));
  const [busy, setBusy] = useState(false);
  const valid = listingId && (kind === 'capture' || (file && !fileErr && !checkingFile));

  const pick = (f: File | null) => {
    setFile(f);
    if (!f) return setFileErr('');
    const okType = (format === 'video' ? /\.(mp4|mov|insv|360)$/i : /\.(jpe?g|png|webp|tiff?|insp)$/i).test(f.name);
    if (!okType) return setFileErr(t('business:vr.errType'));
    if (f.size > MAX_MB[format] * 1024 * 1024) return setFileErr(t('business:vr.errSize', { mb: MAX_MB[format] }));
    setFileErr('');
    setCheckingFile(true);
    void checkMediaQuality(f, format).then(code => {
      setCheckingFile(false);
      if (code) setFileErr(t(`business:vr.${code}`, format === 'photo360' ? { px: MIN_PHOTO_WIDTH } : { mbps: MIN_VIDEO_BITRATE_MBPS }));
    });
  };
  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await vrContent.submit({ partnerId, listingId, kind, format, file: kind === 'upload' ? file ?? undefined : undefined, notes: notes.trim(), preferredDate: kind === 'capture' ? date : undefined });
      toast.show({ icon: 'check', text: t(kind === 'upload' ? 'business:vr.uploaded' : 'business:vr.captureRequested') });
      onClose();
    } catch {
      setBusy(false);
      toast.show({ icon: 'close', text: t('business:vr.submitFailed') });
    }
  };
  return (
    <Modal title={t('business:vr.new')} onClose={onClose}
      footer={<><button type="button" className="btn ghost" onClick={onClose}>{t('common:actions.cancel')}</button><button type="button" className="btn solid" disabled={!valid || busy} onClick={() => void submit()}>{busy ? t('business:common.working') : t('business:vr.send')}</button></>}>
      <div className="seg" role="radiogroup" aria-label={t('business:vr.kind')} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <button type="button" role="radio" aria-checked={kind === 'upload'} onClick={() => setKind('upload')}><Icon name="upload" /> {t('business:vr.kindUpload')}</button>
        <button type="button" role="radio" aria-checked={kind === 'capture'} onClick={() => setKind('capture')}><Icon name="view360" /> {t('business:vr.kindCapture')}</button>
      </div>
      <fieldset className="field" style={{ border: 0 }}>
        <legend className="label">{t('business:vr.format')}</legend>
        <div className="seg" role="radiogroup" aria-label={t('business:vr.format')} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <button type="button" role="radio" aria-checked={format === 'video'} onClick={() => { setFormat('video'); setFile(null); setFileErr(''); }}><Icon name="video360" /> {t('business:vr.formatVideo')}</button>
          <button type="button" role="radio" aria-checked={format === 'photo360'} onClick={() => { setFormat('photo360'); setFile(null); setFileErr(''); }}><Icon name="view360" /> {t('business:vr.formatPhoto')}</button>
        </div>
        <span className="hint">{t(format === 'video' ? 'business:vr.formatVideoHint' : 'business:vr.formatPhotoHint')}</span>
      </fieldset>
      <label className="field"><span>{t('business:common.listing')}</span><select value={listingId} onChange={e => setListingId(e.target.value)}>{listings.map(l => <option key={l.id} value={l.id}>{title(l.id)}</option>)}</select></label>
      {kind === 'upload' ? (
        <label className="field"><span>{t('business:vr.file')}</span><input key={format} type="file" accept={format === 'video' ? '.mp4,.mov,.insv,.360' : '.jpg,.jpeg,.png,.webp,.tif,.tiff,.insp'} onChange={e => pick(e.target.files?.[0] ?? null)} aria-invalid={!!fileErr} />
          <span className="hint">{t('business:vr.fileHint', { mb: MAX_MB[format] })}</span>
          {checkingFile && <span className="hint">{t('business:vr.checking')}</span>}
          {fileErr && <span className="err">{fileErr}</span>}</label>
      ) : (
        <label className="field"><span>{t('business:vr.preferredDate')}</span><input type="date" value={date} min={addDays(todayIso(), 7)} onChange={e => setDate(e.target.value)} /><span className="hint">{t('business:vr.captureHint')}</span></label>
      )}
      <label className="field"><span>{t('business:vr.notes')}</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('business:vr.notesPh')} /></label>
    </Modal>
  );
}

export default function BusinessVrPage() {
  const { t } = useBizT();
  const f = useFmt();
  const title = useListingTitle();
  const { partner } = usePartnerOrg();
  const listings = usePartnerListings(partner.id);
  const requests = useStore(vrRequestStore).filter(r => r.partnerId === partner.id);
  const [open, setOpen] = useState(false);
  const STEPS: VrRequest['status'][] = ['submitted', 'scheduled', 'processing', 'live'];

  return (
    <>
      <PortalHead title={t('business:nav.vr')} text={t('business:vr.text')} actions={<button type="button" className="btn solid sm" onClick={() => setOpen(true)}><Icon name="plus" />{t('business:vr.new')}</button>} />
      <section className="p-section" aria-labelledby="vr-cov">
        <h2 id="vr-cov">{t('business:vr.coverage')}</h2>
        <div className="p-grid3">
          {listings.map(l => (
            <article key={l.id} className="card lcard">
              <div className="pic"><Media id={l.pano ? `pano-${l.pano}` : l.media[0]!} sizes="360px" decorative /></div>
              <div className="body">
                <h3>{title(l.id)}</h3>
                <span className={`status ${l.pano ? 'paid' : 'pending'}`} style={{ justifySelf: 'start' }}>{l.pano ? t('business:vr.has360') : t('business:vr.previewOnly')}</span>
                <p className="small muted">{l.pano ? t('business:vr.has360Text') : t('business:vr.previewOnlyText')}</p>
                <Link className="tlink" to={`/listing/${l.slug}`}><span>{t('business:listing.viewPublic')}</span><Icon name="arrowRight" /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="p-section" aria-labelledby="vr-req">
        <h2 id="vr-req">{t('business:vr.requests')}</h2>
        {requests.length ? <ul className="list">{requests.map(r => (
          <li key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
            <span className="ico"><Icon name={r.format === 'video' ? 'video360' : r.kind === 'upload' ? 'upload' : 'view360'} /></span>
            <span className="grow">
              <b>{title(r.listingId)} · {t(r.kind === 'upload' ? 'business:vr.kindUpload' : 'business:vr.kindCapture')}{r.format ? ` · ${t(r.format === 'video' ? 'business:vr.formatVideo' : 'business:vr.formatPhoto')}` : ''}</b>
              <small>{r.fileName ? `${r.fileName} · ` : ''}{r.preferredDate ? `${t('business:vr.preferredDate')}: ${f.d(r.preferredDate)} · ` : ''}{f.d(r.createdAt)}</small>
              {r.notes && <small>{r.notes}</small>}
              <ol className="steps" style={{ marginTop: 6 }}>
                {STEPS.map((s, i) => { const at = STEPS.indexOf(r.status); return <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}>{i <= at ? <Icon name="check" width={14} height={14} /> : null}{t(`business:vr.status.${s}`)}</li>; })}
              </ol>
            </span>
            {r.status === 'submitted' && <button type="button" className="btn ghost sm" onClick={() => vrContent.cancel(r.id)}>{t('common:actions.cancel')}</button>}
          </li>
        ))}</ul> : <p className="muted">{t('business:vr.noRequests')}</p>}
      </section>
      <section className="panel" aria-labelledby="vr-guide">
        <h2 id="vr-guide" style={{ marginBottom: 10 }}>{t('business:vr.guideTitle')}</h2>
        <ul className="prose" style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>
          {['g1', 'g2', 'g3', 'g4'].map(k => <li key={k}>{t(`business:vr.${k}`)}</li>)}
        </ul>
      </section>
      <Notice icon="shield">{t('business:vr.privacy')}</Notice>
      {open && <RequestModal partnerId={partner.id} onClose={() => setOpen(false)} />}
    </>
  );
}
