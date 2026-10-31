import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/bits';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/app/providers/ToastProvider';
import { PortalHead, useFmt } from '@/features/portal/shared';
import { useBoardData, useBoardT } from '@/features/portal/board';
import { posts as postsApi, usePosts, type BoardPost } from '@/services/board';
import { seedIndex } from '@/services/catalog';
import { LANGUAGES } from '@/i18n';
import { ltp } from '@/lib/content';
import { addDays, todayIso } from '@/lib/random';
import type { Locale } from '@/domain/types';

const KINDS: BoardPost['kind'][] = ['news', 'event', 'alert', 'story'];

function PostModal({ post, onClose, defaultDest }: { post?: BoardPost; onClose: () => void; defaultDest: string }) {
  const { t } = useBoardT();
  const f = useFmt();
  const toast = useToast();
  const d = useBoardData();
  const [lang, setLang] = useState<Locale>(post?.lang ?? (f.lang as Locale));
  const [p, setP] = useState(() => ({
    kind: post?.kind ?? 'news' as BoardPost['kind'], destinationId: post?.destinationId ?? defaultDest,
    title: ltp(post?.title, lang), body: ltp(post?.body, lang), date: post?.date ?? '', expires: post?.expires ?? addDays(todayIso(), 60)
  }));
  const [touched, setTouched] = useState(false);
  const errs = { title: p.title.trim().length < 4, body: p.body.trim().length < 20, date: p.kind === 'event' && !p.date, expires: !!p.expires && !!p.date && p.expires < p.date };
  const save = (status: BoardPost['status']) => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    postsApi.save({
      id: post?.id, destinationId: p.destinationId, kind: p.kind, lang, status,
      title: { ...post?.title, [lang]: p.title.trim() }, body: { ...post?.body, [lang]: p.body.trim() },
      date: p.date || undefined, expires: p.expires || undefined
    });
    toast.show({ icon: 'check', text: t(status === 'published' ? 'board:content.publishedToast' : 'board:content.draftToast') });
    onClose();
  };
  return (
    <Modal title={post ? t('board:content.edit') : t('board:content.new')} onClose={onClose} wide
      footer={<><button type="button" className="btn ghost" onClick={() => save('draft')}>{t('business:newListing.saveDraft')}</button><button type="button" className="btn solid" onClick={() => save('published')}><Icon name="check" />{t('board:content.publish')}</button></>}>
      <div className="form-grid">
        <label className="field"><span>{t('board:content.kind')}</span><select value={p.kind} onChange={e => setP({ ...p, kind: e.target.value as BoardPost['kind'] })}>{KINDS.map(k => <option key={k} value={k}>{t(`board:content.kinds.${k}`)}</option>)}</select></label>
        <label className="field"><span>{t('explore:filters.destination')}</span><select value={p.destinationId} onChange={e => setP({ ...p, destinationId: e.target.value })}>{d.destinations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="field"><span>{t('business:listing.editLang')}</span><select value={lang} onChange={e => { const l = e.target.value as Locale; setLang(l); setP(s => ({ ...s, title: (post?.title as Record<string, string> | undefined)?.[l] ?? '', body: (post?.body as Record<string, string> | undefined)?.[l] ?? '' })); }}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}</select></label>
        <label className="field"><span>{p.kind === 'event' ? t('board:content.eventDate') : t('board:content.visibleFrom')}</span><input type="date" value={p.date} onChange={e => setP({ ...p, date: e.target.value })} aria-invalid={touched && errs.date} />{touched && errs.date && <span className="err">{t('board:content.errDate')}</span>}</label>
        <label className="field full"><span>{t('board:content.titleLabel')}</span><input value={p.title} maxLength={100} onChange={e => setP({ ...p, title: e.target.value })} aria-invalid={touched && errs.title} />{touched && errs.title && <span className="err">{t('board:content.errTitle')}</span>}</label>
        <label className="field full"><span>{t('board:content.body')}</span><textarea rows={5} value={p.body} maxLength={1200} onChange={e => setP({ ...p, body: e.target.value })} aria-invalid={touched && errs.body} />{touched && errs.body && <span className="err">{t('board:content.errBody')}</span>}</label>
        <label className="field"><span>{t('board:content.expires')}</span><input type="date" value={p.expires} onChange={e => setP({ ...p, expires: e.target.value })} aria-invalid={touched && errs.expires} />{touched && errs.expires && <span className="err">{t('business:common.errDates')}</span>}</label>
      </div>
      {p.kind === 'alert' && <Notice tone="warn" icon="info">{t('board:content.alertNote')}</Notice>}
      <p className="small muted">{t('board:content.publishNote')}</p>
    </Modal>
  );
}

export default function BoardContentPage() {
  const { t } = useBoardT();
  const f = useFmt();
  const all = usePosts();
  const d = useBoardData();
  const [params] = useSearchParams();
  const [dest, setDest] = useState(params.get('destination') ?? '');
  const [modal, setModal] = useState<{ post?: BoardPost } | null>(null);
  const shown = all.filter(p => !dest || p.destinationId === dest);

  return (
    <>
      <PortalHead title={t('board:nav.content')} text={t('board:content.text')} actions={<button type="button" className="btn solid sm" onClick={() => setModal({})}><Icon name="plus" />{t('board:content.new')}</button>} />
      <div className="filters-row">
        <label className="sr" htmlFor="cd">{t('explore:filters.destination')}</label>
        <select id="cd" className="input" value={dest} onChange={e => setDest(e.target.value)}><option value="">{t('explore:filters.allDestinations')}</option>{d.destinations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      </div>
      {shown.length ? (
        <div className="table-wrap"><table className="dtable">
          <thead><tr><th scope="col">{t('board:content.titleLabel')}</th><th scope="col">{t('board:content.kind')}</th><th scope="col">{t('explore:filters.destination')}</th><th scope="col">{t('board:content.dates')}</th><th scope="col">{t('business:bookings.status')}</th><th scope="col"><span className="sr">{t('business:common.actions')}</span></th></tr></thead>
          <tbody>{shown.map(p => {
            const expired = !!p.expires && p.expires < todayIso();
            const x = seedIndex.destById.get(p.destinationId);
            return (
              <tr key={p.id}>
                <td>{ltp(p.title, f.lang)}<small>{LANGUAGES.filter(l => (p.title as Record<string, string>)[l.code]).map(l => l.code.toUpperCase()).join(' · ')}</small></td>
                <td>{t(`board:content.kinds.${p.kind}`)}</td>
                <td>{x ? <Link to={`/destinations/${x.slug}`}>{x.name}</Link> : p.destinationId}</td>
                <td>{p.date ? f.d(p.date) : '—'}{p.expires ? <small>{t('board:content.until', { date: f.d(p.expires) })}</small> : null}</td>
                <td><span className={`status ${p.status === 'published' && !expired ? 'paid' : 'draft'}`}>{expired ? t('board:content.expired') : t(`board:content.status.${p.status}`)}</span></td>
                <td><span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                  <button type="button" className="icon-btn" onClick={() => setModal({ post: p })} aria-label={t('business:common.edit')}><Icon name="edit" /></button>
                  {p.status === 'published' && <button type="button" className="btn ghost sm" onClick={() => postsApi.save({ ...p, status: 'draft' })}>{t('board:content.unpublish')}</button>}
                  <button type="button" className="icon-btn" onClick={() => postsApi.remove(p.id)} aria-label={t('business:common.delete')}><Icon name="trash" /></button>
                </span></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : <EmptyState icon="layers" title={t('board:content.emptyTitle')} text={t('board:content.emptyText')} />}
      {modal && <PostModal post={modal.post} defaultDest={dest || d.destinations[0]!.id} onClose={() => setModal(null)} />}
    </>
  );
}
