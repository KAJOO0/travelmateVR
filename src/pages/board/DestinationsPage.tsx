import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Media } from '@/components/ui/Media';
import { Notice } from '@/components/ui/bits';
import { NotFoundState } from '@/components/ui/States';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { useBoardData, useBoardT } from '@/features/portal/board';
import { destinationContent, livePosts, useDestinationEdits, usePosts } from '@/services/board';
import { LANGUAGES } from '@/i18n';
import { lt } from '@/lib/content';
import { monthName } from '@/lib/format';
import type { Locale } from '@/domain/types';

export default function BoardDestinationsPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const d = useBoardData();
  const edits = useDestinationEdits();
  const posts = usePosts();
  return (
    <>
      <PortalHead title={t('board:nav.destinations')} text={t('board:destinations.text')} />
      <div className="table-wrap">
        <table className="dtable">
          <thead><tr><th scope="col">{t('explore:filters.destination')}</th><th scope="col" className="num">{t('board:kpi.interest')}</th><th scope="col" className="num">{t('business:kpi.rating')}</th><th scope="col">{t('board:destinations.bestTime')}</th><th scope="col">{t('board:destinations.content')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
          <tbody>{d.interest.map(({ destination: x, total }) => {
            const e = edits[x.id];
            const state = !e ? 'catalogue' : e.status === 'published' ? 'published' : 'draft';
            return (
              <tr key={x.id}>
                <td><Link to={`/board/destinations/${x.id}`}>{x.name}</Link><small>{lt(x.area, f.lang)} · {t('board:destinations.posts', { count: livePosts(x.id, posts).length })}</small></td>
                <td className="num">{f.n(total)}</td>
                <td className="num">{x.rating.toFixed(1)}</td>
                <td>{x.bestMonths.map(m => monthName(m, f.lang)).join(', ')}</td>
                <td><span className={`status ${state === 'published' ? 'paid' : state === 'draft' ? 'pending' : 'draft'}`}>{t(`board:destinations.state.${state}`)}</span></td>
                <td><Link className="btn ghost sm" to={`/board/destinations/${x.id}`}><Icon name="edit" />{t('business:common.edit')}</Link></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="small muted">{t('board:destinations.interestNote')}</p>
    </>
  );
}

export function BoardDestinationEditPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const toast = useToast();
  const { id } = useParams();
  const d = useBoardData();
  const edits = useDestinationEdits();
  const dest = d.destinations.find(x => x.id === id);
  const [lang, setLang] = useState<Locale>(f.lang as Locale);
  const read = (l: Locale) => {
    const g = (v?: Partial<Record<Locale, string>>) => (v?.[l] ?? '');
    return { summary: dest ? g(dest.summary) : '', overview: dest ? g(dest.overview) : '', safety: dest ? g(dest.safety) : '', sustainability: dest ? g(dest.sustainability) : '' };
  };
  const [form, setForm] = useState(() => read(lang));
  const [best, setBest] = useState<number[]>(dest?.bestMonths ?? []);
  if (!dest) return <NotFoundState title={t('explore:dest.notFound')} to="/board/destinations" label={t('board:nav.destinations')} />;
  const e = edits[dest.id];

  const draft = () => {
    const pick = (k: keyof typeof form) => (form[k].trim() ? { [k]: { [lang]: form[k].trim() } } : {});
    destinationContent.saveDraft(dest.id, { ...pick('summary'), ...pick('overview'), ...pick('safety'), ...pick('sustainability'), bestMonths: best.length ? [...best].sort((a, b) => a - b) : undefined });
  };

  return (
    <>
      <nav aria-label={t('common:a11y.breadcrumbs')}><ol className="crumbs"><li><Link to="/board/destinations">{t('board:nav.destinations')}</Link></li><li aria-current="page">{dest.name}</li></ol></nav>
      <PortalHead title={dest.name} text={t('board:destinations.editText')}
        actions={<Link className="btn ghost sm" to={`/destinations/${dest.slug}`}><Icon name="external" />{t('board:destinations.viewPublic')}</Link>} />
      {e && <Notice icon="info">{e.status === 'draft' ? t('board:destinations.draftNote', { date: f.dt(e.updatedAt) }) : t('board:destinations.publishedNote', { date: f.dt(e.updatedAt) })}</Notice>}
      <div className="p-split">
        <form className="panel" style={{ display: 'grid', gap: 14 }} onSubmit={ev => { ev.preventDefault(); draft(); destinationContent.publish(dest.id); toast.show({ icon: 'check', text: t('board:destinations.published') }); }}>
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <h2>{t('board:destinations.content')}</h2>
            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><span>{t('business:listing.editLang')}</span>
              <select value={lang} onChange={ev => { const l = ev.target.value as Locale; setLang(l); setForm(read(l)); }}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select></label>
          </div>
          <label className="field"><span>{t('board:destinations.summary')}</span><input value={form.summary} maxLength={180} placeholder={dest.summary.en} onChange={ev => setForm({ ...form, summary: ev.target.value })} /></label>
          <label className="field"><span>{t('board:destinations.overview')}</span><textarea rows={5} value={form.overview} placeholder={dest.overview?.en ?? dest.summary.en} onChange={ev => setForm({ ...form, overview: ev.target.value })} /></label>
          <label className="field"><span>{t('explore:dest.safety')}</span><textarea rows={3} value={form.safety} placeholder={dest.safety?.en ?? ''} onChange={ev => setForm({ ...form, safety: ev.target.value })} /></label>
          <label className="field"><span>{t('explore:dest.sustainability')}</span><textarea rows={3} value={form.sustainability} placeholder={dest.sustainability?.en ?? t('explore:dest.sustainabilityDefault')} onChange={ev => setForm({ ...form, sustainability: ev.target.value })} /></label>
          <fieldset className="field" style={{ border: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>{t('board:destinations.bestTime')}</legend>
            <div className="checks">{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <label key={m} className="check"><input type="checkbox" checked={best.includes(m)} onChange={ev => setBest(ev.target.checked ? [...best, m] : best.filter(x => x !== m))} />{monthName(m, f.lang)}</label>)}</div>
          </fieldset>
          <Notice icon="shield">{t('board:destinations.accuracy')}</Notice>
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <span className="chip-row">
              <button type="button" className="btn ghost sm" onClick={() => { draft(); toast.show({ icon: 'check', text: t('board:destinations.draftSaved') }); }}>{t('business:newListing.saveDraft')}</button>
              {e && <button type="button" className="btn ghost sm danger" onClick={() => { destinationContent.revert(dest.id); setForm(read(lang)); setBest(dest.bestMonths); toast.show({ icon: 'refresh', text: t('board:destinations.reverted') }); }}><Icon name="refresh" />{t('board:destinations.revert')}</button>}
            </span>
            <button type="submit" className="btn solid"><Icon name="check" />{t('board:destinations.publish')}</button>
          </div>
        </form>
        <aside className="p-section" aria-label={t('business:profile.preview')}>
          <h2>{t('business:profile.preview')}</h2>
          <article className="card">
            <div style={{ position: 'relative', aspectRatio: '16 / 9' }}><Media id={dest.media} sizes="420px" decorative /></div>
            <div style={{ padding: 18, display: 'grid', gap: 6 }}>
              <h3 style={{ fontSize: 'var(--fs-h3)' }}>{dest.name}</h3>
              <p className="muted small">{form.summary || lt(dest.summary, lang)}</p>
              <small className="muted">{t('explore:dest.bestTime')}: {best.map(m => monthName(m, f.lang)).join(', ')}</small>
            </div>
          </article>
          <Link className="btn ghost sm" to={`/board/content?destination=${dest.id}`}><Icon name="layers" />{t('board:destinations.managePosts')}</Link>
        </aside>
      </div>
    </>
  );
}
