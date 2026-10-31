import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { AppError } from '@/services/http';

/** Human-readable error with a retry; never shows technical details to travellers. */
export function ErrorState({ error, onRetry, title }: { error?: unknown; onRetry?: () => void; title?: string }) {
  const { t } = useTranslation();
  const code = error instanceof AppError ? error.code : 'unknown';
  return (
    <div className="state" role="alert">
      <span className="ico"><Icon name={code === 'offline' ? 'wifiOff' : 'info'} /></span>
      <h3>{title ?? t(`errors.${code === 'offline' ? 'offline' : 'generic'}.title`)}</h3>
      <p>{t(`errors.${code === 'offline' ? 'offline' : 'generic'}.text`)}</p>
      {onRetry && <button type="button" className="btn solid sm" onClick={onRetry}><Icon name="refresh" />{t('errors.retry')}</button>}
    </div>
  );
}

/** A record that doesn't exist (old or mistyped link): no retry, just a way back. */
export function NotFoundState({ title, to, label }: { title: string; to: string; label: string }) {
  const { t } = useTranslation();
  return (
    <div className="state" role="status">
      <span className="ico"><Icon name="compass" /></span>
      <h3>{title}</h3>
      <p>{t('notFound.text')}</p>
      <Link className="btn solid sm" to={to}><Icon name="arrowLeft" />{label}</Link>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="state">
      <span className="ico"><Icon name={icon} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function CardSkeleton({ ratio = '16 / 10' }: { ratio?: string }) {
  return (
    <div className="card" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ aspectRatio: ratio, borderRadius: 0 }} />
      <div style={{ padding: 20, display: 'grid', gap: 10 }}>
        <div className="skeleton" style={{ height: 12, width: '45%' }} />
        <div className="skeleton" style={{ height: 20, width: '80%' }} />
        <div className="skeleton" style={{ height: 12, width: '65%' }} />
      </div>
    </div>
  );
}
