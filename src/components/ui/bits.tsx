import { createElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useLocale } from '@/i18n/useLocale';
import { lt } from '@/lib/content';
import { rating as fmtRating } from '@/lib/format';
import type { LocalizedText } from '@/domain/types';
import { useWishlist, type SavedKind } from '@/app/providers/WishlistProvider';
import { useToast } from '@/app/providers/ToastProvider';
import { SITE, SOCIAL, whatsappLink } from '@/config/site';

/** Renders CMS/partner content; marks it lang="en" when no translation exists for the reader's language. */
export function Content({ text, as = 'span', className }: { text: LocalizedText; as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'strong'; className?: string }) {
  const lang = useLocale();
  const value = lt(text, lang);
  const fallback = lang !== 'en' && !(text as Record<string, string | undefined>)[lang];
  return createElement(as, { className, lang: fallback ? 'en' : undefined }, value);
}

export function Stars({ value, count }: { value?: number; count?: number }) {
  const { t } = useTranslation();
  const lang = useLocale();
  if (!value) return <span className="stars" style={{ color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>{t('reviews.none')}</span>;
  return (
    <span className="stars" aria-label={t('reviews.ratingLabel', { rating: fmtRating(value, lang) })}>
      {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" className={i <= Math.round(value) ? 'star' : 'off'} />)}
      <b style={{ marginLeft: 6 }} aria-hidden="true">{fmtRating(value, lang)}</b>
      {count !== undefined && <span style={{ color: 'var(--muted)', marginLeft: 4 }} aria-hidden="true">({count})</span>}
    </span>
  );
}

export function SaveButton({ kind, id, name, className = 'save' }: { kind: SavedKind; id: string; name: string; className?: string }) {
  const { t } = useTranslation();
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const saved = has(kind, id);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={saved ? t('wishlist.remove', { name }) : t('wishlist.save', { name })}
      onClick={e => {
        e.preventDefault(); e.stopPropagation();
        const added = toggle(kind, id);
        toast.show({ icon: 'heart', text: added ? t('wishlist.saved') : t('wishlist.removed'), action: added ? { label: t('wishlist.view'), to: '/wishlist' } : undefined });
      }}
    >
      <Icon name="heart" />
    </button>
  );
}

/** "Chat on WhatsApp" with a prefilled, context-specific message (click-to-chat, no API keys). */
export function WhatsAppButton({ message, label, className = 'btn ghost sm' }: { message: string; label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <a className={className} href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
      <Icon name="whatsapp" />{label ?? t('cta.whatsapp')}
    </a>
  );
}

/** Share via the system sheet when available, otherwise WhatsApp, X and copy link. */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const url = `${SITE.url}${path}`;
  const native = typeof navigator !== 'undefined' && 'share' in navigator;
  return (
    <div className="chip-row">
      {native && (
        <button type="button" className="toggle" onClick={() => void navigator.share({ title, url }).catch(() => {})}>
          <Icon name="share" />{t('share.share')}
        </button>
      )}
      <a className="toggle" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />WhatsApp</a>
      <a className="toggle" href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=${(SOCIAL.x.handle ?? '').replace('@', '')}`} target="_blank" rel="noopener noreferrer"><Icon name="xLogo" />X</a>
      {SOCIAL.facebook.url && <a className="toggle" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Icon name="facebook" />Facebook</a>}
      <button type="button" className="toggle" onClick={() => { void navigator.clipboard?.writeText(url).then(() => toast.show({ icon: 'check', text: t('share.copied') })); }}>
        <Icon name="layers" />{t('share.copy')}
      </button>
    </div>
  );
}

export function Notice({ children, tone, icon = 'info' }: { children: ReactNode; tone?: 'warn' | 'ok'; icon?: Parameters<typeof Icon>[0]['name'] }) {
  return <div className={`notice${tone ? ` ${tone}` : ''}`}><Icon name={icon} /><div>{children}</div></div>;
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  return <span className={`status ${status}`}>{t(`status.${status}`)}</span>;
}
