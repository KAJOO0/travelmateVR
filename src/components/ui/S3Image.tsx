import { useEffect, useState, type ReactNode } from 'react';
import { getUrl } from 'aws-amplify/storage';

// Module-level: the same key resolves to the same presigned URL for the lifetime of the tab,
// and multiple components can reference the same key (e.g. a header avatar and a profile page)
// without each re-resolving it.
const urlCache = new Map<string, string>();

/** Renders an S3 object by key — the only way to show something uploaded via `uploadData`
 *  (src/lib/media.ts's `<Media>` can't: it only resolves ids through a build-time-generated
 *  static manifest, which a fresh upload never has an entry in). Exact technique already
 *  proven in src/pages/admin/PartnersPage.tsx: `getUrl({ path }).then(r => r.url.toString())`
 *  fed into a plain `<img>`. Shows `fallback` while resolving, on failure, or when `s3Key` is
 *  undefined (e.g. no photo uploaded yet). */
export function S3Image({ s3Key, alt, className, fallback }: { s3Key: string | undefined; alt: string; className?: string; fallback: ReactNode }) {
  const [url, setUrl] = useState<string | undefined>(s3Key ? urlCache.get(s3Key) : undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!s3Key) { setUrl(undefined); return; }
    const cached = urlCache.get(s3Key);
    if (cached) { setUrl(cached); return; }
    let cancelled = false;
    setUrl(undefined);
    getUrl({ path: s3Key }).then(r => {
      if (cancelled) return;
      const resolved = r.url.toString();
      urlCache.set(s3Key, resolved);
      setUrl(resolved);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [s3Key]);

  if (!s3Key || !url || failed) return <>{fallback}</>;
  return <img src={url} alt={alt} className={className} onError={() => setFailed(true)} />;
}
