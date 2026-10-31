import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { EmptyState } from '@/components/ui/States';
import { seedIndex } from '@/services/catalog';
import { useLocale } from '@/i18n/useLocale';
import { countryName } from '@/lib/content';
import { byFormat, formatOf, FORMATS, type ImmersiveFormat } from '@/lib/immersive';
import { usePageTitle } from '@/app/usePageTitle';
import type { ExperienceKind, Region } from '@/domain/types';
import '@/styles/home.css';
import '@/styles/pages.css';

const KINDS: ExperienceKind[] = ['wildlife', 'culture', 'landscape', 'beach', 'adventure', 'city'];
const DEVICES: { key: string; icon: IconName }[] = [{ key: 'phone', icon: 'install' }, { key: 'desktop', icon: 'monitor' }, { key: 'headset', icon: 'vr' }];
const FORMAT_ICON: Record<ImmersiveFormat, IconName> = { video: 'video360', photo360: 'view360', preview: 'layers' };
const REGION_ORDER: Region[] = ['east-africa', 'southern-africa', 'southeast-asia', 'middle-east', 'europe'];

export default function VrLibraryPage() {
  const { t } = useTranslation(['explore', 'common']);
  const lang = useLocale();
  usePageTitle(t('explore:vr.title'));
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<ExperienceKind | null>(null);
  const [country, setCountry] = useState('');
  const fmtParam = params.get('format') as ImmersiveFormat | null;
  const format: ImmersiveFormat | null = fmtParam && FORMATS.includes(fmtParam) ? fmtParam : null;
  const setFormat = (f: ImmersiveFormat | null) => setParams(p => { const n = new URLSearchParams(p); if (f) n.set('format', f); else n.delete('format'); return n; }, { replace: true });

  const countryOf = (destId: string) => seedIndex.destById.get(destId)?.countryId;
  const regions = useMemo(() => REGION_ORDER.map(r => ({
    r, countries: seedIndex.countries.filter(c => c.region === r && seedIndex.experiences.some(e => countryOf(e.destinationId) === c.id))
  })).filter(g => g.countries.length), []);
  const base = useMemo(() => seedIndex.experiences.filter(e => (!kind || e.kind === kind) && (!country || countryOf(e.destinationId) === country)), [kind, country]);
  const counts = useMemo(() => Object.fromEntries(FORMATS.map(f => [f, base.filter(e => formatOf(e) === f).length])) as Record<ImmersiveFormat, number>, [base]);
  const list = useMemo(() => base.filter(e => !format || formatOf(e) === format).sort((a, b) => byFormat(a, b) || b.rating - a.rating), [base, format]);
  const videos = useMemo(() => seedIndex.experiences.filter(e => formatOf(e) === 'video'), []);
  const previews = seedIndex.experiences.filter(e => formatOf(e) === 'preview').length;
  const clear = () => { setKind(null); setCountry(''); setFormat(null); };

  return (
    <div className="page">
      <section className="block">
        <div className="page-head">
          <span className="eyebrow">{t('explore:vr.eyebrow')}</span>
          <h1>{t('explore:vr.title')}</h1>
          <p className="lede">{t('explore:vr.text')}</p>
        </div>

        {videos.length > 0 && (
          <section className="block" aria-labelledby="vr-video-h" style={{ gap: 16 }}>
            <div className="sec-head">
              <div>
                <span className="eyebrow"><Icon name="video360" width={14} height={14} /> {t('common:badges.video360')}</span>
                <h2 className="sec-title" id="vr-video-h">{t('explore:vr.videoTitle')}</h2>
                <p className="lede">{t('explore:vr.videoText')}</p>
              </div>
            </div>
            <div className="grid3 m-swipe">{videos.map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
          </section>
        )}

        <div className="grid3 m-swipe m-swipe-narrow">
          {DEVICES.map(d => (
            <div className="panel" key={d.key} style={{ display: 'grid', gap: 8 }}>
              <span className="ico"><Icon name={d.icon} /></span>
              <h3>{t(`explore:vr.device.${d.key}.title`)}</h3>
              <p>{t(`explore:vr.device.${d.key}.text`)}</p>
            </div>
          ))}
        </div>

        <h2 className="sec-title" id="vr-all-h">{t('explore:vr.allTitle')}</h2>
        <div className="chip-row" role="group" aria-label={t('explore:vr.format')}>
          <button type="button" className="toggle" aria-pressed={!format} onClick={() => setFormat(null)}>{t('explore:vr.allFormats')}</button>
          {FORMATS.map(f => (
            <button key={f} type="button" className="toggle" aria-pressed={format === f} onClick={() => setFormat(format === f ? null : f)}>
              <Icon name={FORMAT_ICON[f]} />{t(`explore:vr.formatLabel.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="results-bar">
          <div className="chip-row" role="group" aria-label={t('explore:filters.type')}>
            <button type="button" className="toggle" aria-pressed={!kind} onClick={() => setKind(null)}>{t('explore:filters.all')}</button>
            {KINDS.map(k => <button key={k} type="button" className="toggle" aria-pressed={kind === k} onClick={() => setKind(kind === k ? null : k)}>{t(`common:kindLabel.${k}`)}</button>)}
          </div>
          <label className="select">
            <Icon name="globe" /><span className="sr">{t('explore:filters.country')}</span>
            <select value={country} onChange={e => setCountry(e.target.value)}>
              <option value="">{t('explore:filters.allCountries')}</option>
              {regions.map(g => (
                <optgroup key={g.r} label={t(`explore:region.${g.r}`)}>
                  {g.countries.map(c => <option key={c.id} value={c.id}>{countryName(c, lang)}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        <p className="count" aria-live="polite">{t('explore:vr.count', { count: list.length })}</p>
        {list.length ? (
          <div className="grid3">{list.map(x => <ExperienceCard key={x.id} xp={x} />)}</div>
        ) : (
          <EmptyState icon="vr" title={t('explore:empty.title')} text={t('explore:empty.text')} action={<button type="button" className="btn solid sm" onClick={clear}>{t('explore:filters.clear')}</button>} />
        )}
        <div className="notice"><Icon name="info" /><div>{t('explore:vr.captureNote')} <Link to="/credits">{t('common:footer.links.credits')}</Link></div></div>

        <section className="band" aria-labelledby="vr-creators-h">
          <div>
            <span className="eyebrow">{t('explore:vr.creatorsEyebrow')}</span>
            <h2 id="vr-creators-h">{t('explore:vr.creatorsTitle')}</h2>
            <p>{t('explore:vr.creatorsText', { count: previews })}</p>
          </div>
          <Link className="btn light" to="/creators"><Icon name="video360" />{t('explore:vr.creatorsCta')}</Link>
        </section>
      </section>
    </div>
  );
}
