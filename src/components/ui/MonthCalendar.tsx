import { useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useLocale } from '@/i18n/useLocale';
import { addDays, todayIso } from '@/lib/random';

interface Props {
  /** YYYY-MM */
  month: string;
  onMonthChange: (month: string) => void;
  /** Extra content inside each day cell (availability, bookings…). */
  renderDay?: (date: string) => ReactNode;
  /** Class names per day, e.g. "blocked" or "full". */
  dayClass?: (date: string) => string;
  selected?: Set<string>;
  /** Called on click; `extend` is true with Shift held (range selection). */
  onSelect?: (date: string, extend: boolean) => void;
  label: string;
  minMonth?: string;
}

export const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
};

/** Month grid (weeks start on Monday) with keyboard navigation between days. */
export function MonthCalendar({ month, onMonthChange, renderDay, dayClass, selected, onSelect, label, minMonth }: Props) {
  const { t } = useTranslation();
  const lang = useLocale();
  const grid = useRef<HTMLDivElement>(null);
  const today = todayIso();

  const { days, title, weekdays } = useMemo(() => {
    const first = `${month}-01`;
    const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
    const start = addDays(first, -offset);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    const trimmed = cells.slice(0, cells[35]!.startsWith(month) ? 42 : 35);
    const fmt = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const wd = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang, { weekday: 'short', timeZone: 'UTC' });
    return {
      days: trimmed, title: fmt.format(new Date(`${first}T00:00:00Z`)),
      weekdays: Array.from({ length: 7 }, (_, i) => wd.format(new Date(Date.UTC(2024, 0, 1 + i)))) // 2024-01-01 is a Monday
    };
  }, [month, lang]);
  const dayLabel = useMemo(() => new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }), [lang]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const by = moves[e.key];
    if (by === undefined) return;
    e.preventDefault();
    const next = addDays(date, by);
    if (!next.startsWith(month)) onMonthChange(next.slice(0, 7));
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus());
  };

  return (
    <div className="mcal">
      <div className="mcal-head">
        <button type="button" className="icon-btn" onClick={() => onMonthChange(shiftMonth(month, -1))} disabled={!!minMonth && month <= minMonth} aria-label={t('calendar.prev')}><Icon name="arrowLeft" /></button>
        <h3 aria-live="polite">{title}</h3>
        <button type="button" className="icon-btn" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label={t('calendar.next')}><Icon name="arrowRight" /></button>
      </div>
      <div className="mcal-grid" role="grid" aria-label={`${label}, ${title}`} ref={grid}>
        <div className="mcal-row" role="row">{weekdays.map(w => <span key={w} role="columnheader" className="mcal-wd">{w}</span>)}</div>
        {Array.from({ length: days.length / 7 }, (_, r) => (
          <div className="mcal-row" role="row" key={r}>
            {days.slice(r * 7, r * 7 + 7).map(d => {
              const out = !d.startsWith(month);
              const cls = ['mcal-day', out ? 'out' : '', d === today ? 'today' : '', d < today ? 'past' : '', selected?.has(d) ? 'sel' : '', dayClass?.(d) ?? ''].filter(Boolean).join(' ');
              return (
                <div role="gridcell" key={d} aria-selected={selected ? selected.has(d) : undefined}>
                  <button type="button" className={cls} data-date={d} tabIndex={d === `${month}-01` ? 0 : -1}
                    aria-label={dayLabel.format(new Date(`${d}T00:00:00Z`))}
                    onClick={e => onSelect?.(d, e.shiftKey)} onKeyDown={e => onKey(e, d)}>
                    <span className="n">{Number(d.slice(8))}</span>
                    {!out && renderDay?.(d)}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
