import { useState, type CSSProperties } from 'react';
import { media, srcSet } from '@/lib/media';

interface Props {
  id: string;
  /** `sizes` attribute; defaults to a card-sized slot. */
  sizes?: string;
  alt?: string;
  /** Decorative images get empty alt text. */
  decorative?: boolean;
  priority?: boolean;
  /** Focal point, e.g. "60% 40%". */
  focus?: string;
  zoom?: number;
  className?: string;
}

/** Responsive photo that fills a `.ph` frame: WebP srcset, blurred placeholder, lazy by default. */
export function Media({ id, sizes = '(max-width: 700px) 92vw, 400px', alt, decorative, priority, focus, zoom, className = 'ph' }: Props) {
  const m = media(id);
  const [loaded, setLoaded] = useState(false);
  const style = { '--p': focus, '--z': zoom, backgroundImage: m ? `url("${m.lqip}")` : undefined } as CSSProperties;
  if (!m) return <div className={className} style={style} />;
  return (
    <div className={className} style={style}>
      <img
        src={`/media/${id}-${m.widths[Math.min(1, m.widths.length - 1)]}.webp`}
        srcSet={srcSet(id)}
        sizes={sizes}
        width={m.w}
        height={m.h}
        alt={decorative ? '' : (alt ?? m.alt)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={loaded ? undefined : 'loading'}
        onLoad={() => setLoaded(true)}
        ref={el => { if (el?.complete && el.naturalWidth && !loaded) setLoaded(true); }}
      />
    </div>
  );
}
