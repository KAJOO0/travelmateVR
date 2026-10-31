import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { mediaUrl } from '@/lib/media';
import { money } from '@/lib/format';
import { isNaturalLanguage, parseIntent, suggest } from '@/services/search';
import { useLocale } from '@/i18n/useLocale';
import type { SearchIntent } from '@/domain/types';

const EXAMPLES = ['Serengeti', 'Zanzibar', 'Kilimanjaro', 'Katavi', 'Cape Town', 'Maasai Mara'];

export function IntentChips({ intent }: { intent: SearchIntent }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const chips: string[] = [
    ...intent.places.map(p => p.label),
    ...(intent.days ? [t('search.days', { count: intent.days })] : []),
    ...(intent.travellers ? [t('search.travellers', { count: intent.travellers })] : []),
    ...(intent.budgetUsd ? [t(intent.budgetMode === 'max' ? 'search.budgetMax' : 'search.budgetAbout', { amount: money(intent.budgetUsd, lang) })] : []),
    ...intent.styles.map(s => t(`tags.${s}`)),
    ...intent.kinds.map(k => t(`kinds.${k}`))
  ];
  const unique = [...new Set(chips)];
  if (!unique.length) return null;
  return (
    <>
      {unique.map(c => <span className="badge" key={c}>{c}</span>)}
    </>
  );
}

/** "Where do you want to experience?" — understands places and plain-language trip requests. */
export function SmartSearch({ autoFocus, onDone, showExamples = true }: { autoFocus?: boolean; onDone?: () => void; showExamples?: boolean }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const deferred = useDeferredValue(q);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const intent = useMemo(() => parseIntent(deferred), [deferred]);
  const nl = deferred.trim().length > 0 && isNaturalLanguage(intent);
  const results = useMemo(() => suggest(deferred, lang), [deferred, lang]);
  // Option list: optional "ask AI" row first for plain-language requests, then matches.
  const options = useMemo(() => [...(nl ? [{ id: 'ask', href: `/ai?q=${encodeURIComponent(deferred)}` }] : []), ...results.map(r => ({ id: r.id, href: r.href }))], [nl, results, deferred]);

  useEffect(() => { setActive(-1); }, [deferred]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const go = (href: string) => { setOpen(false); onDone?.(); navigate(href); };
  const submit = () => {
    const text = q.trim();
    if (!text) { inputRef.current?.focus(); return; }
    const opt = active >= 0 ? options[active] : undefined;
    go(opt ? opt.href : `/search?q=${encodeURIComponent(text)}`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
  };

  const showPanel = open && q.trim().length >= 2;

  return (
    <div className="smart">
      <div className="smart-box" ref={boxRef}>
      <form role="search" onSubmit={e => { e.preventDefault(); submit(); }}>
        <Icon name="search" />
        <label className="sr" htmlFor={`${listId}-input`}>{t('search.label')}</label>
        <input
          id={`${listId}-input`}
          ref={inputRef}
          type="search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t('search.placeholder')}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && options[active] ? `${listId}-${options[active].id}` : undefined}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
        {q && (
          <button type="button" className="icon-btn clear" aria-label={t('search.clear')} onClick={() => { setQ(''); inputRef.current?.focus(); }}>
            <Icon name="close" />
          </button>
        )}
        <button type="submit" className="btn solid go">{t('search.submit')}</button>
      </form>

      {showPanel && (
        <div className="suggest">
          {(intent.places.length > 0 || intent.days || intent.travellers || intent.budgetUsd || intent.styles.length > 0) && (
            <div className="understood" aria-live="polite">
              <span><Icon name="sparkles" />{t('search.understood')}</span>
              <IntentChips intent={intent} />
            </div>
          )}
          <ul id={listId} role="listbox" aria-label={t('search.suggestions')}>
            {nl && (
              <li role="presentation">
                <button type="button" id={`${listId}-ask`} role="option" aria-selected={active === 0} className="ask" onClick={() => go(options[0]!.href)}>
                  <span className="thumb"><Icon name="sparkles" /></span>
                  <span className="s-text"><b>{t('search.askAi')}</b><small>“{deferred}”</small></span>
                  <Icon name="arrowRight" width={18} height={18} />
                </button>
              </li>
            )}
            {results.map((r, i) => {
              const idx = i + (nl ? 1 : 0);
              return (
                <li key={r.id} role="presentation">
                  <Link id={`${listId}-${r.id}`} role="option" aria-selected={active === idx} to={r.href} onClick={e => { e.preventDefault(); go(r.href); }}>
                    <span className="thumb"><img src={mediaUrl(r.media, 400)} alt="" loading="lazy" /></span>
                    <span className="s-text"><b>{r.label}</b><small>{r.sublabel}</small></span>
                    <span className="kind">{t(`search.type.${r.type}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {!nl && results.length === 0 && <p className="empty">{t('search.noMatch')}</p>}
        </div>
      )}
      </div>

      {showExamples && (
        <div className="examples">
          <span>{t('search.try')}</span>
          {EXAMPLES.map(x => (
            <button key={x} type="button" className="chip-btn" onClick={() => { setQ(x); setOpen(true); inputRef.current?.focus(); }}>
              <Icon name="pin" />{x}
            </button>
          ))}
          <button type="button" className="chip-btn" onClick={() => { setQ(t('search.nlExample')); setOpen(true); inputRef.current?.focus(); }}>
            <Icon name="sparkles" />{t('search.nlExampleShort')}
          </button>
        </div>
      )}
    </div>
  );
}
