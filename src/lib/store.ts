import { useSyncExternalStore } from 'react';
import { readLocal, writeLocal } from './storage';

/**
 * Tiny observable store persisted to localStorage, synced across tabs.
 * Used by the demo service implementations; the http implementations replace it with API calls.
 */
export function createStore<T>(key: string, initial: () => T) {
  let state: T = readLocal<T>(key, initial());
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', e => {
      if (e.key === key) { state = readLocal<T>(key, initial()); emit(); }
    });
  }

  return {
    get: () => state,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      writeLocal(key, state);
      emit();
    },
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    reset() { state = initial(); writeLocal(key, state); emit(); }
  };
}

export type Store<T> = ReturnType<typeof createStore<T>>;

export function useStore<T, S = T>(store: Store<T>, select: (s: T) => S = s => s as unknown as S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()), () => select(store.get()));
}

export function uid(prefix = ''): string {
  const r = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix + r.slice(0, 12);
}

export const nowIso = () => new Date().toISOString();
