import { useTranslation } from 'react-i18next';
import { allCredits, mediaUrl } from '@/lib/media';
import { VIDEOS } from '@/lib/immersive';
import { usePageTitle } from '@/app/usePageTitle';

interface Row { id: string; thumb: string; title: string; author: string; license: string; licenseUrl?: string; source: string; note?: string }

const sourceName = (url: string) => (url.includes('polyhaven.com') ? 'Poly Haven' : url.includes('wikimedia.org') ? 'Wikimedia Commons' : new URL(url).hostname);

/** Attribution for openly licensed 360° videos, 360° photos and photography (required by CC BY / BY-SA). */
export default function CreditsPage() {
  const { t } = useTranslation();
  usePageTitle(t('credits.title'));
  const all = allCredits();
  const row = ([id, m]: (typeof all)[number]): Row => ({ id, thumb: mediaUrl(id, 400), title: m.alt, author: m.credit!.author, license: m.credit!.license, licenseUrl: m.credit!.licenseUrl, source: m.credit!.source });
  const groups: { key: string; rows: Row[]; note?: string }[] = [
    {
      key: 'videos',
      rows: Object.entries(VIDEOS).map(([id, v]) => ({ id, thumb: mediaUrl(`video-${id}`, 400), title: v.name, author: v.author, license: v.license, licenseUrl: v.licenseUrl, source: v.source, note: t('credits.videoModified') }))
    },
    { key: 'panos', rows: all.filter(([id]) => id.startsWith('pano-')).map(row), note: t('credits.panoModified') },
    { key: 'photos', rows: all.filter(([id]) => !id.startsWith('pano-') && !id.startsWith('video-')).map(row), note: t('credits.modified') }
  ];

  return (
    <div className="page">
      <section className="block" aria-labelledby="cr-h" style={{ maxWidth: 980, marginInline: 'auto', width: '100%' }}>
        <h1 className="sec-title" id="cr-h">{t('credits.title')}</h1>
        <p className="lede">{t('credits.text')}</p>
        {groups.filter(g => g.rows.length).map(g => (
          <section key={g.key} aria-labelledby={`cr-${g.key}`} style={{ display: 'grid', gap: 12 }}>
            <h2 className="group-title" id={`cr-${g.key}`}>{t(`credits.group.${g.key}`)}</h2>
            {g.note && <p className="small muted">{g.note}</p>}
            <ul style={{ listStyle: 'none', display: 'grid', gap: 12 }}>
              {g.rows.map(r => (
                <li key={r.id} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12 }}>
                  <img src={r.thumb} alt="" width={120} height={80} loading="lazy" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 12, flex: 'none' }} />
                  <div style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{r.title}</b>
                    <small style={{ color: 'var(--muted)', display: 'block' }}>
                      {t('credits.byAny', { author: r.author || t('credits.unknown') })} ·{' '}
                      <a href={r.licenseUrl || r.source} target="_blank" rel="noopener noreferrer">{r.license}</a> ·{' '}
                      <a href={r.source} target="_blank" rel="noopener noreferrer">{sourceName(r.source)}</a>
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="lede">{t('credits.own')}</p>
      </section>
    </div>
  );
}
