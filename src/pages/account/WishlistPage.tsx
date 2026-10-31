import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/States';
import { DestinationCard, ListingCard } from '@/components/cards/ListingCard';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { useWishlist, type SavedItem } from '@/app/providers/WishlistProvider';
import { collectionStore, useCollections } from '@/services/collections';
import { seedIndex } from '@/services/catalog';
import { usePageTitle } from '@/app/usePageTitle';
import { uid } from '@/lib/store';
import '@/styles/home.css';
import '@/styles/pages.css';

const KINDS = ['all', 'destination', 'experience', 'stay', 'safari', 'activity', 'restaurant', 'event'] as const;
const keyOf = (i: Pick<SavedItem, 'kind' | 'id'>) => `${i.kind}:${i.id}`;

export default function WishlistPage() {
  const { t } = useTranslation(['account', 'common']);
  usePageTitle(t('account:wishlist.title'));
  const { items } = useWishlist();
  const collections = useCollections();
  const [kind, setKind] = useState<(typeof KINDS)[number]>('all');
  const [col, setCol] = useState<string | null>(null);
  const [modal, setModal] = useState<'new' | { addKey: string } | null>(null);
  const [name, setName] = useState('');
  const active = collections.find(c => c.id === col);
  const shown = useMemo(() => items.filter(i => (kind === 'all' || i.kind === kind) && (!active || active.keys.includes(keyOf(i)))).sort((a, b) => b.savedAt - a.savedAt), [items, kind, active]);

  const create = () => {
    if (name.trim().length < 2) return;
    const id = uid('col_');
    const addKey = typeof modal === 'object' && modal ? modal.addKey : undefined;
    collectionStore.set(list => [...list, { id, name: name.trim(), keys: addKey ? [addKey] : [] }]);
    setName(''); setModal(null); setCol(id);
  };
  const toggleIn = (colId: string, key: string) => collectionStore.set(list => list.map(c => (c.id === colId ? { ...c, keys: c.keys.includes(key) ? c.keys.filter(k => k !== key) : [...c.keys, key] } : c)));

  return (
    <div className="page">
      <section className="block">
        <div className="page-head"><span className="eyebrow">{t('common:nav.wishlist')}</span><h1>{t('account:wishlist.title')}</h1><p className="lede">{t('account:wishlist.text')}</p></div>

        <div className="chip-row" role="group" aria-label={t('account:wishlist.collections')}>
          <button type="button" className="toggle" aria-pressed={!col} onClick={() => setCol(null)}><Icon name="heart" />{t('account:wishlist.allSaved', { count: items.length })}</button>
          {collections.map(c => <button key={c.id} type="button" className="toggle" aria-pressed={col === c.id} onClick={() => setCol(c.id)}>{c.name} ({c.keys.length})</button>)}
          <button type="button" className="toggle" onClick={() => setModal('new')}>+ {t('account:wishlist.newCollection')}</button>
        </div>
        <div className="chip-row" role="group" aria-label={t('account:wishlist.type')}>
          {KINDS.map(k => <button key={k} type="button" className="toggle" aria-pressed={kind === k} onClick={() => setKind(k)}>{t(`account:wishlist.k.${k}`)}</button>)}
        </div>
        {active && <div className="row-between"><p style={{ color: 'var(--muted)' }}>{t('account:wishlist.inCollection', { name: active.name })}</p><button type="button" className="tlink" onClick={() => { collectionStore.set(l => l.filter(c => c.id !== active.id)); setCol(null); }}><span>{t('account:wishlist.deleteCollection')}</span></button></div>}

        {shown.length ? (
          <div className="grid3">
            {shown.map(i => {
              const key = keyOf(i);
              const card = i.kind === 'destination' ? (seedIndex.destById.get(i.id) && <DestinationCard d={seedIndex.destById.get(i.id)!} />)
                : i.kind === 'experience' ? (seedIndex.experienceById.get(i.id) && <ExperienceCard xp={seedIndex.experienceById.get(i.id)!} />)
                  : seedIndex.listingById.get(i.id) && <ListingCard listing={seedIndex.listingById.get(i.id)!} />;
              if (!card) return null;
              return (
                <div key={key} style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                  {card}
                  <div className="chip-row">
                    {collections.map(c => <button key={c.id} type="button" className="toggle" aria-pressed={c.keys.includes(key)} onClick={() => toggleIn(c.id, key)}>{c.keys.includes(key) ? '✓ ' : '+ '}{c.name}</button>)}
                    <button type="button" className="toggle" onClick={() => setModal({ addKey: key })}>+ {t('account:wishlist.newCollection')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyState icon="heart" title={t('account:wishlist.emptyTitle')} text={t('account:wishlist.emptyText')} action={<Link className="btn solid sm" to="/explore">{t('common:nav.explore')}</Link>} />}
      </section>

      {modal && (
        <Modal title={t('account:wishlist.newCollection')} onClose={() => setModal(null)}>
          <label className="field"><span>{t('account:wishlist.collectionName')}</span><input value={name} onChange={e => setName(e.target.value)} placeholder={t('account:wishlist.collectionPh')} maxLength={60} onKeyDown={e => { if (e.key === 'Enter') create(); }} /></label>
          <div className="row-between"><button type="button" className="btn ghost sm" onClick={() => setModal(null)}>{t('common:actions.cancel')}</button><button type="button" className="btn solid sm" onClick={create}>{t('account:wishlist.create')}</button></div>
        </Modal>
      )}
    </div>
  );
}
