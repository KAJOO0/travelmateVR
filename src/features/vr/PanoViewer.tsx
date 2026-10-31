import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { mediaUrl } from '@/lib/media';

export interface ViewerHotspot { id: string; yaw: number; pitch: number; label: string; kind: string }

export interface PanoViewerHandle {
  enterXR(): Promise<void>;
  toggleGyro(): Promise<boolean>;
  lookAt(yaw: number, pitch: number): void;
  zoom(delta: number): void;
  /** Turns the view by the given degrees (on-screen look-around buttons). */
  pan(dYaw: number, dPitch: number): void;
  /** 360° video controls (no-ops without a video). */
  play(): void;
  pause(): void;
  setMuted(muted: boolean): void;
  seek(seconds: number): void;
}

export interface VideoState {
  /** idle: 360° poster shown, not started · loading · playing · paused · error: stays on the 360° still */
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  muted: boolean;
  time: number;
  duration: number;
  buffering: boolean;
}

interface Props {
  /** Equirectangular panorama id (/pano/<id>-<w>.jpg). */
  pano?: string;
  /**
   * Equirectangular 360° video. The panorama (or the video's own 360° poster frame) is shown first,
   * so the scene can be explored straight away; if the video cannot play, that still stays.
   */
  video?: { src: string; poster: string };
  /** Start the video muted as soon as it can play (skipped with reduced motion or data saver). */
  autoPlay?: boolean;
  onVideoState?: (s: VideoState) => void;
  /** Regular photo shown as a partial panorama when no 360° capture exists. */
  photo?: string;
  startYaw?: number;
  hotspots?: ViewerHotspot[];
  activeHotspot?: string | null;
  onHotspot?: (id: string) => void;
  onReady?: (info: { xr: boolean; gyro: boolean }) => void;
  onError?: () => void;
  onProgress?: (p: number) => void;
  autoRotate?: boolean;
  label: string;
}

const deg = THREE.MathUtils.degToRad;

/**
 * Lightweight 360° viewer on three.js: drag / touch / pinch / wheel / keyboard, device-orientation,
 * WebXR headset sessions, and HTML hotspots. Photos without a 360° capture are mapped onto a sphere
 * segment ("panoramic preview") with the view clamped to the photo's edges.
 */
export const PanoViewer = forwardRef<PanoViewerHandle, Props>(function PanoViewer(
  { pano, photo, video, autoPlay, onVideoState, startYaw = 0, hotspots = [], activeHotspot, onHotspot, onReady, onError, onProgress, autoRotate, label }, ref
) {
  const host = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const api = useRef<PanoViewerHandle | null>(null);
  const [, setTick] = useState(0);

  useImperativeHandle(ref, () => ({
    enterXR: () => api.current?.enterXR() ?? Promise.resolve(),
    toggleGyro: () => api.current?.toggleGyro() ?? Promise.resolve(false),
    lookAt: (y, p) => api.current?.lookAt(y, p),
    zoom: d => api.current?.zoom(d),
    pan: (y, p) => api.current?.pan(y, p),
    play: () => api.current?.play(),
    pause: () => api.current?.pause(),
    setMuted: m => api.current?.setMuted(m),
    seek: t => api.current?.seek(t)
  }), []);
  const videoStateRef = useRef(onVideoState);
  videoStateRef.current = onVideoState;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      // No WebGL (very old device, or the browser ran out of 3D contexts): show the error state with a retry.
      onError?.();
      return;
    }
    // A lost context (GPU reset, too many contexts) would leave a frozen or blank viewer: report it instead.
    const onContextLost = (e: Event) => { e.preventDefault(); if (!disposed) onError?.(); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    // Slow connections: if the image hasn't arrived after 30 s, offer a retry rather than an endless spinner.
    const loadTimer = window.setTimeout(() => { if (!disposed && !mesh) onError?.(); }, 30_000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#071a2f');
    const camera = new THREE.PerspectiveCamera(75, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 1100);

    // View state (degrees). yaw 0 = centre of the image; lon = 180 + yaw in three's sphere mapping.
    const state = { yaw: startYaw, pitch: 0, fov: 75, minYaw: -Infinity, maxYaw: Infinity, minPitch: -85, maxPitch: 85, gyro: false, interacting: false, lastInteraction: performance.now() };
    let photoSpan = { h: 360, v: 180 };

    const geometryFor = (h: number, v: number) => {
      const g = h >= 360
        ? new THREE.SphereGeometry(500, 72, 48)
        : new THREE.SphereGeometry(500, 72, 48, Math.PI - deg(h) / 2, deg(h), Math.PI / 2 - deg(v) / 2, deg(v));
      g.scale(-1, 1, 1);
      return g;
    };

    let mesh: THREE.Mesh | null = null;
    /** Full 360° sphere (panorama or video) rather than a partial photo preview. */
    const sphere = !!pano || !!video;
    const maxFov = sphere ? 95 : 70;
    const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const small = Math.min(window.innerWidth, window.innerHeight) < 900 || saveData;
    // With a video, the panorama (if any) or the video's own 360° poster frame is the first image.
    const url = pano ? `/pano/${pano}-${small ? 2048 : 4096}.jpg` : video ? video.poster : photo ? mediaUrl(photo, 2400) : '';

    // ---- 360° video ----
    let vid: HTMLVideoElement | null = null;
    let vtex: THREE.VideoTexture | null = null;
    let stillTex: THREE.Texture | null = null;
    const vstate: VideoState = { status: 'idle', muted: true, time: 0, duration: 0, buffering: false };
    const emit = (patch: Partial<VideoState>) => { Object.assign(vstate, patch); videoStateRef.current?.({ ...vstate }); };
    const setMap = (tex: THREE.Texture | null) => {
      if (!mesh || !tex) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat.map !== tex) { mat.map = tex; mat.needsUpdate = true; }
    };
    const ensureVideo = () => {
      if (vid || !video) return vid;
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.muted = true;
      v.loop = true;
      v.preload = 'auto';
      v.src = video.src;
      v.addEventListener('playing', () => {
        if (disposed) return;
        if (!vtex) { vtex = new THREE.VideoTexture(v); vtex.colorSpace = THREE.SRGBColorSpace; }
        setMap(vtex);
        emit({ status: 'playing', buffering: false });
      });
      v.addEventListener('pause', () => { if (vstate.status !== 'error') emit({ status: 'paused' }); });
      v.addEventListener('waiting', () => emit({ buffering: true }));
      v.addEventListener('canplay', () => emit({ buffering: false }));
      v.addEventListener('loadedmetadata', () => emit({ duration: v.duration || 0 }));
      v.addEventListener('timeupdate', () => emit({ time: v.currentTime }));
      v.addEventListener('volumechange', () => emit({ muted: v.muted }));
      v.addEventListener('error', () => { setMap(stillTex); emit({ status: 'error', buffering: false }); });
      vid = v;
      return v;
    };
    const play = () => {
      const v = ensureVideo();
      if (!v || vstate.status === 'error') return;
      if (vstate.status === 'idle') emit({ status: 'loading', buffering: true });
      // Autoplay can be refused (e.g. low-power mode): stay on the 360° still and offer the play button.
      v.play().catch(() => { if (vstate.status !== 'error') emit({ status: 'paused', buffering: false }); });
    };
    const onVisibility = () => { if (document.hidden && vid && !vid.paused) vid.pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      tex => {
        if (disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        stillTex = tex;
        if (!sphere) {
          // Partial panorama: about 70° of vertical view, width from the photo's aspect ratio.
          const img = tex.image as { width: number; height: number };
          const aspect = img.width / img.height;
          const v = 70;
          photoSpan = { h: Math.min(200, v * aspect * 1.05), v };
          state.minYaw = -photoSpan.h / 2; state.maxYaw = photoSpan.h / 2;
          state.minPitch = -v / 2; state.maxPitch = v / 2;
          // A narrower view leaves room to look around the photo, especially on portrait phones.
          state.fov = 52;
        }
        mesh = new THREE.Mesh(geometryFor(photoSpan.h, photoSpan.v), new THREE.MeshBasicMaterial({ map: tex }));
        scene.add(mesh);
        clamp();
        onReady?.({ xr: xrSupported, gyro: 'DeviceOrientationEvent' in window });
        if (video) {
          emit({});
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (autoPlay && !reduced && !saveData) play();
        }
      },
      e => { if (e.total) onProgress?.(e.loaded / e.total); },
      () => { if (!disposed) onError?.(); }
    );

    function clamp() {
      const halfV = state.fov / 2;
      const halfH = THREE.MathUtils.radToDeg(Math.atan(Math.tan(deg(halfV)) * camera.aspect));
      if (Number.isFinite(state.minYaw)) {
        const lo = state.minYaw + halfH, hi = state.maxYaw - halfH;
        state.yaw = lo > hi ? 0 : THREE.MathUtils.clamp(state.yaw, lo, hi);
        const plo = state.minPitch + halfV, phi = state.maxPitch - halfV;
        state.pitch = plo > phi ? 0 : THREE.MathUtils.clamp(state.pitch, plo, phi);
      } else {
        state.pitch = THREE.MathUtils.clamp(state.pitch, state.minPitch, state.maxPitch);
      }
    }

    const dirFor = (yaw: number, pitch: number, r = 500) => {
      const lon = deg(180 + yaw), lat = deg(pitch);
      return new THREE.Vector3(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon));
    };

    // ---- device orientation (gyroscope) ----
    const zee = new THREE.Vector3(0, 0, 1);
    const euler = new THREE.Euler();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    let orient: { alpha: number; beta: number; gamma: number } | null = null;
    let alphaOffset = 0;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha === null) return;
      if (!orient) alphaOffset = (e.alpha ?? 0) - (-state.yaw + 0);
      orient = { alpha: e.alpha ?? 0, beta: e.beta ?? 0, gamma: e.gamma ?? 0 };
    };

    // ---- WebXR ----
    let xrSupported = false;
    const xr = (navigator as Navigator & { xr?: { isSessionSupported(m: string): Promise<boolean>; requestSession(m: string, o?: object): Promise<XRSession> } }).xr;
    xr?.isSessionSupported('immersive-vr').then(ok => { xrSupported = ok; setTick(t => t + 1); onReady && mesh && onReady({ xr: ok, gyro: 'DeviceOrientationEvent' in window }); }).catch(() => {});

    api.current = {
      async enterXR() {
        if (!xr) throw new Error('xr');
        const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
        await renderer.xr.setSession(session);
      },
      async toggleGyro() {
        if (state.gyro) {
          window.removeEventListener('deviceorientation', onOrient);
          state.gyro = false; orient = null;
          return false;
        }
        const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
        if (DOE?.requestPermission) {
          const res = await DOE.requestPermission();
          if (res !== 'granted') return false;
        }
        window.addEventListener('deviceorientation', onOrient);
        state.gyro = true;
        return true;
      },
      lookAt(yaw, pitch) { state.yaw = yaw; state.pitch = pitch; state.lastInteraction = performance.now(); clamp(); },
      pan(dYaw, dPitch) { state.yaw += dYaw; state.pitch += dPitch; state.lastInteraction = performance.now(); clamp(); },
      zoom(d) { state.fov = THREE.MathUtils.clamp(state.fov + d, 30, maxFov); clamp(); },
      play,
      pause() { vid?.pause(); },
      setMuted(m) { const v = ensureVideo(); if (v) v.muted = m; },
      seek(t) { if (vid && Number.isFinite(t)) vid.currentTime = THREE.MathUtils.clamp(t, 0, vid.duration || t); }
    };

    // ---- pointer / touch / wheel / keyboard ----
    const pointers = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0, yaw: 0, pitch: 0, dist: 0, fov: 75 };
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = [...pointers.values()];
      start = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch, dist: pts.length === 2 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0, fov: state.fov };
      state.interacting = true; canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = [...pointers.values()];
      if (pts.length === 2 && start.dist) {
        const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        state.fov = THREE.MathUtils.clamp(start.fov * (start.dist / d), 30, maxFov);
      } else if (pts.length === 1) {
        const k = state.fov / el.clientHeight;
        state.yaw = start.yaw - (e.clientX - start.x) * k;
        state.pitch = start.pitch + (e.clientY - start.y) * k;
      }
      state.lastInteraction = performance.now();
      clamp();
    };
    const onUp = (e: PointerEvent) => { pointers.delete(e.pointerId); if (!pointers.size) { state.interacting = false; canvas.style.cursor = 'grab'; } };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); state.fov = THREE.MathUtils.clamp(state.fov + e.deltaY * 0.03, 30, maxFov); state.lastInteraction = performance.now(); clamp(); };
    const onKey = (e: KeyboardEvent) => {
      const step = 10;
      if (e.key === 'ArrowLeft') state.yaw -= step;
      else if (e.key === 'ArrowRight') state.yaw += step;
      else if (e.key === 'ArrowUp') state.pitch += step;
      else if (e.key === 'ArrowDown') state.pitch -= step;
      else if (e.key === '+' || e.key === '=') state.fov = Math.max(30, state.fov - 5);
      else if (e.key === '-') state.fov = Math.min(maxFov, state.fov + 5);
      else return;
      e.preventDefault(); state.lastInteraction = performance.now(); clamp();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('keydown', onKey);

    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      clamp();
    });
    ro.observe(el);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let sweepDir = 1;
    const v = new THREE.Vector3();
    let last = performance.now();
    renderer.setAnimationLoop(now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!renderer.xr.isPresenting) {
        if (state.gyro && orient) {
          const screenOrient = deg((screen.orientation?.angle ?? 0));
          euler.set(deg(orient.beta), deg(orient.alpha - alphaOffset), -deg(orient.gamma), 'YXZ');
          camera.quaternion.setFromEuler(euler);
          camera.quaternion.multiply(q1);
          camera.quaternion.multiply(q0.setFromAxisAngle(zee, -screenOrient));
        } else {
          if (autoRotate && !reduce && sphere && !state.interacting && now - state.lastInteraction > 4000) state.yaw += dt * 3;
          // Photo previews sweep gently from edge to edge while idle, so it's clear they can be explored.
          if (autoRotate && !reduce && !sphere && mesh && !state.interacting && now - state.lastInteraction > 2500) {
            const before = state.yaw;
            state.yaw += sweepDir * dt * 6;
            clamp();
            if (Math.abs(state.yaw - before) < 1e-4) sweepDir = -sweepDir;
          }
          camera.fov += (state.fov - camera.fov) * 0.2;
          camera.updateProjectionMatrix();
          camera.lookAt(dirFor(state.yaw, state.pitch));
        }
      }
      renderer.render(scene, camera);
      // Position HTML hotspot markers.
      for (const h of hotspotsRef.current) {
        const m = markerRefs.current.get(h.id);
        if (!m) continue;
        v.copy(dirFor(h.yaw, h.pitch)).project(camera);
        const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 && !renderer.xr.isPresenting;
        m.style.opacity = visible ? '1' : '0';
        m.style.pointerEvents = visible ? 'auto' : 'none';
        m.style.transform = `translate(${((v.x + 1) / 2) * el.clientWidth}px, ${((1 - v.y) / 2) * el.clientHeight}px) translate(-50%, -50%)`;
      }
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      window.removeEventListener('deviceorientation', onOrient);
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('keydown', onKey);
      if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); vid = null; }
      vtex?.dispose();
      if (stillTex && mesh && (mesh.material as THREE.MeshBasicMaterial).map !== stillTex) stillTex.dispose();
      void renderer.xr.getSession()?.end().catch(() => {});
      if (mesh) { (mesh.material as THREE.MeshBasicMaterial).map?.dispose(); (mesh.material as THREE.Material).dispose(); mesh.geometry.dispose(); }
      window.clearTimeout(loadTimer);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
      // Release the GPU context now: browsers allow only about 16 at once, and without this, opening
      // several experiences in a row leaves later viewers blank.
      renderer.forceContextLoss();
      canvas.remove();
      api.current = null;
    };
    // The scene is rebuilt only when the source changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pano, photo, video?.src]);

  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;

  return (
    <div ref={host} className="pano" tabIndex={0} role="application" aria-roledescription="360° viewer" aria-label={label}>
      {hotspots.map(h => (
        <button
          key={h.id}
          ref={b => { if (b) markerRefs.current.set(h.id, b); else markerRefs.current.delete(h.id); }}
          type="button"
          className={`hotspot ${h.kind}${activeHotspot === h.id ? ' on' : ''}`}
          onClick={() => onHotspot?.(h.id)}
          aria-label={h.label}
          style={{ opacity: 0 }}
        >
          <span className="dot" aria-hidden="true" />
          <span className="lbl">{h.label}</span>
        </button>
      ))}
    </div>
  );
});
