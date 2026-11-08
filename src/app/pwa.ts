import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

// Service worker lifecycle + install prompt, exposed as a tiny observable store.
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

type State = { needRefresh: boolean; offlineReady: boolean; canInstall: boolean; installed: boolean; isIos: boolean };
// iOS Safari never fires 'beforeinstallprompt' (no such API there) - canInstall alone would
// stay permanently false on iPhone/iPad even though "Add to Home Screen" is available, just
// through the share sheet instead of a programmatic prompt. isIos lets the UI show manual
// instructions there instead of silently showing nothing.
const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
let state: State = { needRefresh: false, offlineReady: false, canInstall: false, installed: false, isIos };
let deferred: BeforeInstallPromptEvent | null = null;
let update: ((reload?: boolean) => Promise<void>) | null = null;
const subs = new Set<(s: State) => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach(f => f(state)); };

export function initPwa() {
  if (typeof window === 'undefined') return;
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    update = registerSW({
      onNeedRefresh: () => set({ needRefresh: true }),
      onOfflineReady: () => set({ offlineReady: true })
    });
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; set({ canInstall: true }); });
  window.addEventListener('appinstalled', () => { deferred = null; set({ canInstall: false, installed: true }); });
  if (window.matchMedia('(display-mode: standalone)').matches) set({ installed: true });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  set({ canInstall: false });
  return outcome === 'accepted';
}

export function applyUpdate() { void update?.(true); }
export function dismissPwa() { set({ needRefresh: false, offlineReady: false }); }

export function usePwa(): State {
  const [s, setS] = useState(state);
  useEffect(() => { subs.add(setS); return () => { subs.delete(setS); }; }, []);
  return s;
}
