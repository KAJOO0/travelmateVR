import { usePlatform } from '@/services/platform';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Modal } from '@/components/ui/Modal';
import { Content, ShareButtons, Stars } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { PanoViewer, type PanoViewerHandle, type VideoState, type ViewerHotspot } from '@/features/vr/PanoViewer';
import { FormatBadge } from '@/components/cards/ExperienceCard';
import { byFormat, formatOf, is360, videoOf } from '@/lib/immersive';
import { AddToTripModal } from '@/features/trips/AddToTripModal';
import { useWishlist } from '@/app/providers/WishlistProvider';
import { useToast } from '@/app/providers/ToastProvider';
import { useLocale } from '@/i18n/useLocale';
import { countryName, lt } from '@/lib/content';
import { media, mediaUrl } from '@/lib/media';
import { monthName } from '@/lib/format';
import { seedIndex } from '@/services/catalog';
import { usePageTitle } from '@/app/usePageTitle';
import panos from '@/data/panos.generated.json';
import '@/styles/pages.css';
import '@/styles/viewer.css';

const PANOS = panos as Record<string, { name: string; author: string; source: string; license: string; licenseUrl?: string }>;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function ExperienceModePage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  const toast = useToast();
  const headsetOn = usePlatform().flags.headsetMode;
  const { has, toggle } = useWishlist();
  const xp = seedIndex.experiences.find(e => e.slug === slug);
  const dest = xp ? seedIndex.destById.get(xp.destinationId) : undefined;
  const country = dest ? seedIndex.countries.find(c => c.id === dest.countryId) : undefined;
  const viewer = useRef<PanoViewerHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [caps, setCaps] = useState({ xr: false, gyro: false });
  const [gyroOn, setGyroOn] = useState(false);
  const [full, setFull] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [modal, setModal] = useState<'share' | 'trip' | null>(null);
  const [retry, setRetry] = useState(0);
  const [vstate, setVstate] = useState<VideoState | null>(null);
  const title = xp ? lt(xp.title, lang) : '';
  usePageTitle(title || t('explore:vr.notFound'));

  const hotspots: ViewerHotspot[] = useMemo(() => (xp?.hotspots ?? []).map((h, i) => ({ id: `h${i}`, yaw: h.yaw, pitch: h.pitch, kind: h.kind, label: lt(h.title, lang) })), [xp, lang]);
  const activeHotspot = active ? xp?.hotspots?.[Number(active.slice(1))] : undefined;
  const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => () => { if (canSpeak) speechSynthesis.cancel(); }, [canSpeak]);
  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleNarration = useCallback(() => {
    if (!xp?.narration || !canSpeak) return;
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(lt(xp.narration, lang));
    u.lang = (xp.narration as Record<string, string | undefined>)[lang] ? lang : 'en-GB';
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
  }, [xp, canSpeak, speaking, lang]);

  const toggleFull = async () => {
    const el = stageRef.current?.closest('.xp-mode') as HTMLElement | null;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (el.requestFullscreen) await el.requestFullscreen().catch(() => setFull(f => !f));
    else setFull(f => !f);
  };

  if (!xp || !dest) {
    return <div className="page"><NotFoundState title={t('explore:vr.notFound')} to="/vr" label={t('explore:vr.eyebrow')} /></div>;
  }

  const listings = (xp.listingIds ?? []).map(id => seedIndex.listingById.get(id)).filter(Boolean);
  const related = seedIndex.experiences.filter(e => e.id !== xp.id && (e.destinationId === xp.destinationId || e.kind === xp.kind)).sort(byFormat).slice(0, 3);
  const format = formatOf(xp);
  const vid = videoOf(xp);
  const sphere = is360(xp);
  const playing = vstate?.status === 'playing';
  const nearby = (dest.nearby ?? []).map(id => seedIndex.destById.get(id)).filter(Boolean);
  const credit: { author: string; license: string; licenseUrl?: string; source: string } | undefined = vid ?? (xp.pano ? PANOS[xp.pano] : media(xp.media)?.credit);
  const saved = has('experience', xp.id);

  return (
    <div className="page" style={{ gap: 32 }}>
      <nav aria-label={t('common:a11y.breadcrumbs')}>
        <ol className="crumbs">
          <li><Link to="/">{t('common:nav.home')}</Link></li>
          <li><Link to="/vr">{t('common:nav.vr')}</Link></li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>

      <section className={`xp-mode${full ? ' full' : ''}`} aria-label={t('explore:vr.modeLabel')}>
        <div className="xp-stage" ref={stageRef}>
          <PanoViewer
            key={retry}
            ref={viewer}
            pano={xp.pano}
            video={vid ? { src: vid.src, poster: vid.poster } : undefined}
            autoPlay
            onVideoState={setVstate}
            photo={sphere ? undefined : xp.media}
            startYaw={xp.startYaw}
            hotspots={hotspots}
            activeHotspot={active}
            onHotspot={setActive}
            onReady={c => { setCaps(c); setState('ready'); }}
            onError={() => setState('error')}
            onProgress={setProgress}
            autoRotate
            label={t('explore:vr.viewerLabel', { title })}
          />
          {state === 'loading' && (
            <div className="xp-loading" style={{ backgroundImage: `url("${mediaUrl(xp.media, 960)}")` }}>
              <div className="inner" role="status">
                <span className="spinner" aria-hidden="true" />
                <b>{t('explore:vr.preparing')}</b>
                {progress > 0 && <progress max={1} value={progress} aria-label={t('explore:vr.loadingProgress')} />}
              </div>
            </div>
          )}
          {state === 'error' && (
            <div className="xp-loading">
              <div className="inner" role="alert">
                <b>{t('explore:vr.loadError')}</b>
                <button type="button" className="btn solid sm" onClick={() => { setState('loading'); setRetry(r => r + 1); }}><Icon name="refresh" />{t('common:errors.retry')}</button>
              </div>
            </div>
          )}
          {state === 'ready' && vid && vstate && vstate.status !== 'error' && (
            <div className="xp-video" role="group" aria-label={t('explore:vr.videoControls')}>
              <button type="button" className="play" onClick={() => (playing ? viewer.current?.pause() : viewer.current?.play())} aria-label={playing ? t('explore:vr.pauseVideo') : t('explore:vr.playVideo')}>
                <Icon name={playing ? 'pause' : 'play'} />
              </button>
              <button type="button" onClick={() => viewer.current?.setMuted(!vstate.muted)} aria-pressed={!vstate.muted} aria-label={vstate.muted ? t('explore:vr.unmute') : t('explore:vr.mute')} disabled={!vid.audio}>
                <Icon name={vstate.muted || !vid.audio ? 'volumeOff' : 'volume'} />
              </button>
              {vstate.buffering || vstate.status === 'loading' ? <span className="spinner" role="status" aria-label={t('explore:vr.buffering')} /> : null}
              <input type="range" min={0} max={vstate.duration || vid.duration} step={0.1} value={vstate.time} onChange={e => viewer.current?.seek(Number(e.target.value))} aria-label={t('explore:vr.seek')} aria-valuetext={`${clock(vstate.time)} / ${clock(vstate.duration || vid.duration)}`} />
              <span className="time" aria-hidden="true">{clock(vstate.time)} / {clock(vstate.duration || vid.duration)}</span>
              <span className="live">{t('common:badges.video360')}</span>
            </div>
          )}
          {state === 'ready' && (
            <>
              <button type="button" className="xp-look left" onClick={() => viewer.current?.pan(-30, 0)} aria-label={t('explore:vr.lookLeft')}><Icon name="arrowLeft" /></button>
              <button type="button" className="xp-look right" onClick={() => viewer.current?.pan(30, 0)} aria-label={t('explore:vr.lookRight')}><Icon name="arrowRight" /></button>
            </>
          )}
          {state === 'ready' && <span className="xp-hint" aria-hidden="true">{isTouch ? t('explore:vr.hintTouch') : t('explore:vr.hintDrag')}</span>}

          <div className="xp-overlay-top">
            <div className="xp-title">
              <h1>{title}</h1>
              <span><Icon name="pin" />{dest.name}{country && countryName(country, lang) !== dest.name ? `, ${countryName(country, lang)}` : ''}</span>
              <div className="xp-tags">
                <FormatBadge x={xp} />
                {sphere && <span className="badge media"><Icon name="vr" />{t('common:badges.vrReady')}</span>}
                {xp.hasNarration && <span className="badge media"><Icon name="headphones" />{t('common:badges.audio')}</span>}
              </div>
            </div>
            {full && <button type="button" className="btn on-media sm" onClick={toggleFull}><Icon name="close" />{t('explore:vr.exitFull')}</button>}
          </div>

          <div className="xp-toolbar" role="toolbar" aria-label={t('explore:vr.controls')}>
            {xp.narration && canSpeak && (
              <button type="button" aria-pressed={speaking} onClick={toggleNarration}><Icon name={speaking ? 'pause' : 'headphones'} /><span className="lbl">{t('explore:vr.audio')}</span></button>
            )}
            <button type="button" className="icon-only zoom" onClick={() => viewer.current?.zoom(-10)} aria-label={t('explore:vr.zoomIn')}>+</button>
            <button type="button" className="icon-only zoom" onClick={() => viewer.current?.zoom(10)} aria-label={t('explore:vr.zoomOut')}>−</button>
            {caps.gyro && isTouch && (
              <button type="button" aria-pressed={gyroOn} onClick={async () => setGyroOn(await viewer.current?.toggleGyro() ?? false)}><Icon name="compass" /><span className="lbl">{t('explore:vr.motion')}</span></button>
            )}
            {caps.xr && sphere && headsetOn && (
              <button type="button" onClick={() => viewer.current?.enterXR().catch(() => toast.show({ icon: 'info', text: t('explore:vr.xrFailed') }))}><Icon name="vr" /><span className="lbl">{t('explore:vr.headset')}</span></button>
            )}
            <button type="button" onClick={toggleFull} aria-pressed={full}><Icon name={full ? 'fullscreenExit' : 'fullscreen'} /><span className="lbl">{t('explore:vr.fullscreen')}</span></button>
            <button type="button" aria-pressed={saved} onClick={() => { const a = toggle('experience', xp.id); toast.show({ icon: 'heart', text: a ? t('common:wishlist.saved') : t('common:wishlist.removed') }); }}><Icon name="heart" /><span className="lbl">{t('explore:vr.save')}</span></button>
            <button type="button" onClick={() => setModal('share')}><Icon name="share" /><span className="lbl">{t('common:share.share')}</span></button>
            <button type="button" onClick={() => setModal('trip')}><Icon name="calendar" /><span className="lbl">{t('explore:vr.addToTrip')}</span></button>
            {listings[0] && <Link className="primary" to={`/listing/${listings[0].slug}`}><Icon name="ticket" /><span className="lbl">{t('explore:vr.book')}</span></Link>}
          </div>
        </div>

        <aside className="xp-side" aria-label={t('explore:vr.info')}>
          {activeHotspot && (
            <div className="hs-card" aria-live="polite">
              <div className="row-between"><b>{lt(activeHotspot.title, lang)}</b><button type="button" className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setActive(null)} aria-label={t('common:a11y.close')}><Icon name="close" /></button></div>
              <Content as="p" text={activeHotspot.text} />
            </div>
          )}
          <div>
            <h2>{t('explore:vr.about')}</h2>
            <p>{lt(xp.tagline, lang)}</p>
            {xp.narration && <Content as="p" text={xp.narration} />}
            <div style={{ marginTop: 8 }}><Stars value={xp.rating} count={xp.reviewCount} /></div>
          </div>
          {format === 'video' && vstate?.status !== 'error' && <div className="notice"><Icon name="video360" /><div>{t('explore:vr.videoNote')}</div></div>}
          {vstate?.status === 'error' && <div className="notice" role="status"><Icon name="info" /><div>{t('explore:vr.videoFallback')}</div></div>}
          {format === 'preview' && (
            <div className="notice">
              <Icon name="info" />
              <div>{t('explore:vr.previewNote')} <Link to={`/creators?dest=${dest.id}`}>{t('explore:vr.captureThis')}</Link></div>
            </div>
          )}
          {hotspots.length > 0 && (
            <div>
              <h3>{t('explore:vr.points')}</h3>
              <ul className="facts" style={{ marginTop: 8 }}>
                {xp.hotspots!.map((h, i) => (
                  <li key={i}>
                    <button type="button" className="tlink" onClick={() => { setActive(`h${i}`); viewer.current?.lookAt(h.yaw, h.pitch); }}>
                      <Icon name={h.kind === 'nearby' ? 'arrowRight' : 'info'} /><span>{lt(h.title, lang)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(xp.facts?.length ?? 0) > 0 && (
            <div>
              <h3>{t('explore:vr.facts')}</h3>
              <ul className="facts" style={{ marginTop: 8 }}>{xp.facts!.map((f, i) => <li key={i}><Icon name="check" /><Content text={f} /></li>)}</ul>
            </div>
          )}
          <div>
            <h3>{t('explore:vr.destination')}</h3>
            <p style={{ marginTop: 6 }}><Content text={dest.summary} /></p>
            <p style={{ marginTop: 6 }}>{t('explore:dest.bestTime')}: {dest.bestMonths.slice().sort((a, b) => a - b).map(m => monthName(m, lang)).join(', ')}</p>
            <Link className="tlink" to={`/destinations/${dest.slug}`} style={{ marginTop: 6 }}><span>{t('explore:vr.openDestination', { name: dest.name })}</span><Icon name="arrowRight" /></Link>
          </div>
          {listings.length > 0 && (
            <div>
              <h3>{t('explore:vr.bookThis')}</h3>
              <ul className="mini-list" style={{ marginTop: 8 }}>
                {listings.map(l => (
                  <li key={l!.id}><Link to={`/listing/${l!.slug}`}><span className="thumb"><Media id={l!.media[0]!} sizes="64px" decorative /></span><span><b>{lt(l!.title, lang)}</b><small>{t(`common:listingType.${l!.type}`)}</small></span></Link></li>
                ))}
              </ul>
            </div>
          )}
          {related.length > 0 && (
            <div>
              <h3>{t('explore:vr.related')}</h3>
              <ul className="mini-list" style={{ marginTop: 8 }}>
                {related.map(r => (
                  <li key={r.id}><Link to={`/vr/${r.slug}`}><span className="thumb"><Media id={r.media} sizes="64px" decorative /></span><span><b>{lt(r.title, lang)}</b><small>{t(`common:badges.${formatOf(r) === 'video' ? 'video360' : formatOf(r) === 'photo360' ? 'photo360' : 'panoPreview'}`)} · {t('common:units.minutes', { count: r.durationMin })}</small></span></Link></li>
                ))}
              </ul>
            </div>
          )}
          {nearby.length > 0 && (
            <div>
              <h3>{t('explore:vr.nearby')}</h3>
              <ul className="mini-list" style={{ marginTop: 8 }}>
                {nearby.map(n => (
                  <li key={n!.id}><Link to={`/destinations/${n!.slug}`}><span className="thumb"><Media id={n!.media} sizes="64px" decorative /></span><span><b>{n!.name}</b><small>{lt(n!.area, lang)}</small></span></Link></li>
                ))}
              </ul>
            </div>
          )}
          {credit && (
            <p style={{ fontSize: 12 }}>
              {vid ? t('explore:vr.videoCredit', { author: credit.author }) : xp.pano ? t('explore:vr.panoCredit', { author: credit.author }) : t('common:credits.by', { author: credit.author })}{' '}
              · <a href={credit.source} target="_blank" rel="noopener noreferrer">{credit.license}</a>
              {vid?.modified && <> · {t('explore:vr.videoModified')}</>}
              {' '}· <Link to="/credits">{t('common:footer.links.credits')}</Link>
            </p>
          )}
          {!caps.xr && sphere && <p style={{ fontSize: 12 }}>{t('explore:vr.xrHint')}</p>}
        </aside>
      </section>

      {modal === 'share' && <Modal title={t('common:share.title', { name: title })} onClose={() => setModal(null)}><ShareButtons title={title} path={`/vr/${xp.slug}`} /></Modal>}
      {modal === 'trip' && (
        <AddToTripModal
          onClose={() => setModal(null)}
          item={{ experienceId: xp.id, title: xp.title.en, titleKey: undefined, kind: 'free', time: '10:00', durationHours: Math.max(1, Math.round(xp.durationMin / 60)), priceUsd: 0, perPerson: false, destinationId: xp.destinationId, media: xp.media }}
          label={title}
        />
      )}
    </div>
  );
}
