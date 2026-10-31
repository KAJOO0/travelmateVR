import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui/Icon';

interface Toast { id: number; text: string; icon?: IconName; action?: { label: string; to?: string; onClick?: () => void } }
interface ToastApi { show: (t: Omit<Toast, 'id'>) => void }

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq.current;
    setItems(list => [...list.slice(-2), { ...t, id }]);
    setTimeout(() => setItems(list => list.filter(x => x.id !== id)), 4200);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map(t => (
          <div className="toast" key={t.id}>
            <Icon name={t.icon ?? 'check'} />
            <p>{t.text}</p>
            {t.action && (t.action.to
              ? <Link to={t.action.to}>{t.action.label}</Link>
              : <button type="button" onClick={t.action.onClick}>{t.action.label}</button>)}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast outside provider');
  return v;
}
