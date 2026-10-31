import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { useReducedMotion } from '@/lib/hooks';
import type { Category } from '@/domain/types';

export interface ShowcaseCategory extends Category {
  /** Experience opened by the play button. */
  experienceSlug: string;
  place: string;
  is360: boolean;
}

const COPIES = 5, MID = 2, DUR = 5000, TICK = 50;
const RING_C = 2 * Math.PI * 25;
const pad = (n: number) => String(n).padStart(2, '0');

/** Category word rail + hero + caption deck, synchronised (design: "Browse by category"). */
export function Showcase({ cats, index, onIndex }: { cats: ShowcaseCategory[]; index: number; onIndex: (i: number) => void }) {
  const { t } = useTranslation('home');
  const N = cats.length;
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(MID * N + index);
  const [animate, setAnimate] = useState(false);
  const [playing, setPlaying] = useState(!reduce);
  const [progress, setProgress] = useState(0);
  const [capKey, setCapKey] = useState(0);
  const hold = useRef(false);
  const offscreen = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const settle = useRef<number>(0);
  const cur = ((pos % N) + N) % N;

  const layout = useCallback((p: number, smooth: boolean) => {
    const el = itemRefs.current[p], vp = viewportRef.current, tr = trackRef.current;
    if (!el || !vp || !tr) return;
    if (!smooth) tr.style.transition = 'none';
    tr.style.transform = `translate3d(${vp.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2)}px,0,0)`;
    if (!smooth) { void tr.offsetWidth; tr.style.transition = ''; }
  }, []);

  useLayoutEffect(() => { layout(pos, animate); }, [pos, animate, layout]);
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => layout(pos, false));
    ro.observe(vp);
    return () => ro.disconnect();
  }, [pos, layout]);

  const nearest = useCallback((ci: number) => {
    let d = ((ci - cur) % N + N) % N;
    if (d > N / 2) d -= N;
    return d;
  }, [cur, N]);

  const go = useCallback((d: number) => {
    if (!d) return;
    setProgress(0);
    let base = pos;
    const next = pos + d;
    if (next < N || next > (COPIES - 1) * N - 1) { base = MID * N + (pos % N); layout(base, false); }
    const target = base + d;
    setAnimate(true);
    setPos(target);
    setCapKey(k => k + 1);
    onIndex(((target % N) + N) % N);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => { setAnimate(false); setPos(MID * N + (((target % N) + N) % N)); }, 760);
  }, [pos, N, layout, onIndex]);

  // Parent asked for a different category (e.g. the chips below the hero).
  useEffect(() => { if (index !== cur) go(nearest(index)); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stageRef.current) return;
    const io = new IntersectionObserver(es => { offscreen.current = !es[0]?.isIntersecting; });
    io.observe(stageRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      if (hold.current || offscreen.current || document.hidden) return;
      setProgress(p => {
        const n = p + TICK;
        if (n >= DUR) { queueMicrotask(() => goRef.current(1)); return 0; }
        return n;
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [playing]);
  const goRef = useRef(go);
  goRef.current = go;

  const holdHandlers = {
    onPointerEnter: () => { hold.current = true; },
    onPointerLeave: () => { hold.current = false; },
    onFocus: () => { hold.current = true; },
    onBlur: () => { hold.current = false; }
  };

  // Swipe / drag on the word rail.
  const sx = useRef<number | null>(null);
  const moved = useRef(false);

  const catName = (c: Category) => t(`categories.${c.id}.name`);
  const active = cats[cur]!;

  return (
    <div className={`stage${playing ? '' : ' paused'}`} ref={stageRef}>
      <section className="rail" aria-label={t('showcase.browse')} {...holdHandlers}>
        <span className="eyebrow center">{t('showcase.browse')}</span>
        <div className="rail-stage">
          <EdgeButton dir="left" label={t('showcase.prev')} onClick={() => go(-1)} />
          <div
            className="viewport"
            ref={viewportRef}
            tabIndex={0}
            role="group"
            aria-roledescription="carousel"
            aria-label={t('showcase.railLabel', { list: cats.map(catName).join(', ') })}
            onPointerDown={e => { sx.current = e.clientX; moved.current = false; }}
            onPointerUp={e => {
              if (sx.current === null) return;
              const dx = e.clientX - sx.current;
              sx.current = null;
              if (Math.abs(dx) > 40) { moved.current = true; go(dx < 0 ? 1 : -1); }
            }}
            onPointerCancel={() => { sx.current = null; }}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
              if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
            }}
          >
            <ul className="track" ref={trackRef}>
              {Array.from({ length: COPIES * N }, (_, p) => {
                const c = cats[p % N]!;
                const mid = Math.floor(p / N) === MID;
                return (
                  <li key={p} ref={el => { itemRefs.current[p] = el; }} className={p === pos ? 'is-active' : undefined} aria-hidden={mid ? undefined : true}>
                    <button
                      type="button"
                      className="word"
                      tabIndex={mid ? 0 : -1}
                      aria-current={p === pos ? 'true' : undefined}
                      onClick={() => { if (moved.current) { moved.current = false; return; } if (p !== pos) go(p - pos); }}
                    >
                      {catName(c)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <EdgeButton dir="right" label={t('showcase.next')} onClick={() => go(1)} />
        </div>
        <div className="rail-foot">
          <div className="dot-list">
            {cats.map((c, i) => (
              <button key={c.id} type="button" className={`dot${i === cur ? ' on' : ''}`} aria-label={t('showcase.show', { name: catName(c) })} aria-pressed={i === cur} onClick={() => go(nearest(i))} />
            ))}
          </div>
          <button type="button" className="pause" onClick={() => { setPlaying(p => !p); setProgress(0); }} aria-label={playing ? t('showcase.pause') : t('showcase.resume')}>
            <Icon name={playing ? 'pause' : 'play'} />
          </button>
        </div>
      </section>

      <section className="hero" aria-label={t('showcase.featured')} {...holdHandlers}>
        {cats.map((c, i) => (
          <div
            key={c.id}
            className={`layer${i === cur ? ' on' : ''}`}
            aria-hidden={i !== cur}
            style={{ transformOrigin: c.focus, transform: `scale(${i === cur ? c.zoom : 1.02})` }}
          >
            <Media id={c.media} sizes="(max-width: 1300px) 96vw, 1240px" priority={i === cur} focus={c.focus} className="ph" />
          </div>
        ))}
        <div className="hero-tags">
          {active.is360
            ? <><span className="badge media"><Icon name="view360" />360°</span><span className="badge media"><Icon name="vr" />{t('common:badges.vrReady')}</span></>
            : <span className="badge media"><Icon name="view360" />{t('common:badges.panoPreview')}</span>}
        </div>
        <span className="hero-place"><Icon name="pin" />{active.place}</span>
        <Link className="play" to={`/vr/${active.experienceSlug}`} aria-label={t('showcase.play', { name: catName(active) })}>
          <span className="ring-pulse" aria-hidden="true" />
          <Icon name="play" />
        </Link>
      </section>

      <div className="deck" {...holdHandlers}>
        <div className="cap in" key={capKey} aria-live="polite">
          <span className="eyebrow">{pad(cur + 1)} / {pad(N)} · {t('showcase.nowExploring')}</span>
          <strong>{catName(active)}</strong>
          <p>{t(`categories.${active.id}.text`)}</p>
        </div>
        <div className="controls">
          <button type="button" className="nav-pill prev" onClick={() => go(-1)} aria-label={t('showcase.prev')}>
            <span className="nico"><Icon name="arrowLeft" className="arrow" /></span>
            <span className="lbl"><small>{t('showcase.previous')}</small><b>{catName(cats[(cur - 1 + N) % N]!)}</b></span>
          </button>
          <button type="button" className="nav-pill next" onClick={() => go(1)} aria-label={t('showcase.next')}>
            <span className="nico">
              <svg className="ring" viewBox="0 0 54 54" aria-hidden="true">
                <circle className="track-c" cx="27" cy="27" r="25" />
                <circle className="prog" cx="27" cy="27" r="25" strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - progress / DUR)} />
              </svg>
              <Icon name="arrowRight" className="arrow" />
            </span>
            <span className="lbl"><small>{t('showcase.nextLbl')}</small><b>{catName(cats[(cur + 1) % N]!)}</b></span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EdgeButton({ dir, label, onClick }: { dir: 'left' | 'right'; label: string; onClick: () => void }) {
  const icon = dir === 'left' ? 'arrowLeft' : 'arrowRight';
  return (
    <button type="button" className={`edge ${dir}`} aria-label={label} onClick={onClick}>
      <span className="fill" />
      <span className="slot"><Icon name={icon} className="a1" strokeWidth={2.2} /><Icon name={icon} className="a2" strokeWidth={2.2} /></span>
    </button>
  );
}
