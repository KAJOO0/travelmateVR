import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { readLocal, writeLocal } from '@/lib/storage';

// Saved items. Guests keep them on this device; once accounts are connected
// the list syncs through the wishlist service and can be grouped into collections.
export type SavedKind = 'destination' | 'experience' | 'stay' | 'safari' | 'restaurant' | 'activity' | 'event';
export interface SavedItem { kind: SavedKind; id: string; savedAt: number }

interface WishlistApi {
  items: SavedItem[];
  has: (kind: SavedKind, id: string) => boolean;
  toggle: (kind: SavedKind, id: string) => boolean;
}

const KEY = 'tm.wishlist';
const Ctx = createContext<WishlistApi | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>(() => readLocal<SavedItem[]>(KEY, []));
  const has = useCallback((kind: SavedKind, id: string) => items.some(i => i.kind === kind && i.id === id), [items]);
  const toggle = useCallback((kind: SavedKind, id: string) => {
    const exists = items.some(i => i.kind === kind && i.id === id);
    const next = exists ? items.filter(i => !(i.kind === kind && i.id === id)) : [...items, { kind, id, savedAt: Date.now() }];
    writeLocal(KEY, next);
    setItems(next);
    return !exists;
  }, [items]);
  const api = useMemo(() => ({ items, has, toggle }), [items, has, toggle]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWishlist(): WishlistApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWishlist outside provider');
  return v;
}
