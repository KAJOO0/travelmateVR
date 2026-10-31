import { createStore, useStore } from '@/lib/store';

export interface Collection { id: string; name: string; keys: string[] }

// Wishlist collections (e.g. "Dream Tanzania Trip"). Device-local in demo mode; synced per account in production.
export const collectionStore = createStore<Collection[]>('tm.collections', () => [
  { id: 'col-dream-tz', name: 'Dream Tanzania Trip', keys: [] },
  { id: 'col-2027', name: '2027 Africa Adventure', keys: [] }
]);
export const useCollections = () => useStore(collectionStore);
