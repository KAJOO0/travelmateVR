import { useEffect, useState, type RefObject } from 'react';

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}

/** Closes a popover on outside click or Escape, returning focus to the trigger. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void, trigger?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); trigger?.current?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [ref, open, close, trigger]);
}

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduce;
}

/** Loads async data with loading/error states and a retry. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data?: T; error?: unknown; loading: boolean; retry: () => void } {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    // One silent automatic retry before surfacing an error - live-reproduced against
    // production with a fresh guest session: Amplify's own IAM-credentials provider can throw
    // a transient "NoValidAuthTokens: No federated jwt" on the very first call of a brand new
    // (no cached identity yet) session, which otherwise permanently shows <ErrorState> until
    // the visitor happens to click "retry" themselves - confirmed the same call reliably
    // succeeds moments later once the guest identity/credentials exist.
    let autoRetried = false;
    const attempt = () => {
      setState(s => ({ data: s.data, loading: true }));
      fn().then(
        data => { if (alive) setState({ data, loading: false }); },
        error => {
          if (!alive) return;
          if (!autoRetried) { autoRetried = true; setTimeout(() => alive && attempt(), 1200); return; }
          setState({ error, loading: false });
        }
      );
    };
    attempt();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);
  return { ...state, retry: () => setNonce(n => n + 1) };
}
