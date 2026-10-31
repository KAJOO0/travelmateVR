import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Swipeable, snap-scrolling row with optional arrow controls rendered by the caller. */
export function useCarousel() {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft < 8, end = el.scrollLeft + el.clientWidth > el.scrollWidth - 8;
    setEdges(e => (e.start === start && e.end === end ? e : { start, end }));
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [update]);
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return { ref, edges, page, update };
}

export function CarouselArrows({ c, prevLabel, nextLabel }: { c: ReturnType<typeof useCarousel>; prevLabel: string; nextLabel: string }) {
  return (
    <div className="carousel-nav">
      <button type="button" className="edge left" aria-label={prevLabel} disabled={c.edges.start} onClick={() => c.page(-1)}>
        <span className="fill" /><span className="slot"><Icon name="arrowLeft" className="a1" /><Icon name="arrowLeft" className="a2" /></span>
      </button>
      <button type="button" className="edge right" aria-label={nextLabel} disabled={c.edges.end} onClick={() => c.page(1)}>
        <span className="fill" /><span className="slot"><Icon name="arrowRight" className="a1" /><Icon name="arrowRight" className="a2" /></span>
      </button>
    </div>
  );
}

export function CarouselTrack({ c, label, children }: { c: ReturnType<typeof useCarousel>; label: string; children: ReactNode }) {
  const { update } = c;
  useEffect(() => { update(); }, [children, update]);
  return (
    <div className="carousel">
      <ul className="scroller" ref={c.ref} aria-label={label} tabIndex={0}>
        {Children.map(children, (child, i) => <li key={i}>{child}</li>)}
      </ul>
    </div>
  );
}
