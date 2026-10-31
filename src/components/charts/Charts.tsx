import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';

// Lightweight, dependency-free SVG charts. Each chart has a visually hidden data table, so the
// numbers are available to screen readers and to anyone who prefers a table.

// Distinct hues (blue, green, amber, violet, rose, grey) so adjacent segments are easy to tell apart.
const PALETTE = ['var(--accent-bright)', 'var(--eco)', 'var(--warning)', '#a78bfa', 'var(--danger)', 'var(--muted)'];
export const chartColor = (i: number) => PALETTE[i % PALETTE.length]!;

type Fmt = (n: number) => string;
const plain: Fmt = n => n.toLocaleString();

function DataTable({ caption, labels, rows, format }: { caption: string; labels: string[]; rows: { name: string; values: number[] }[]; format: Fmt }) {
  return (
    // Tables ignore the 1px width of .sr, so the hidden wrapper is a div.
    <div className="sr"><table>
      <caption>{caption}</caption>
      <thead><tr><th scope="col" />{rows.map(r => <th key={r.name} scope="col">{r.name}</th>)}</tr></thead>
      <tbody>{labels.map((l, i) => <tr key={l}><th scope="row">{l}</th>{rows.map(r => <td key={r.name}>{format(r.values[i] ?? 0)}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

/** Multi-series line chart; the first series is filled. Hover or focus a column to read the values. */
export function LineChart({ labels, series, label, format = plain, height = 220 }: {
  labels: string[]; series: { name: string; values: number[] }[]; label: string; format?: Fmt; height?: number;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, P = { l: 8, r: 8, t: 14, b: 26 };
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const x = (i: number) => P.l + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const step = Math.ceil(labels.length / 6);
  return (
    <figure className="chart" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <title id={`${id}-t`}>{label}</title>
        {[0.25, 0.5, 0.75, 1].map(f => <line key={f} x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} className="grid" />)}
        {series[0] && <path d={`${path(series[0].values)}L${x(labels.length - 1)},${H - P.b}L${x(0)},${H - P.b}Z`} fill={chartColor(0)} opacity={0.14} />}
        {series.map((s, si) => <path key={s.name} d={path(s.values)} fill="none" stroke={chartColor(si)} strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
        {labels.map((l, i) => (
          <g key={l}>
            <rect x={x(i) - (W / labels.length) / 2} y={0} width={W / labels.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
            {i % step === 0 && <text x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} className="axis">{l}</text>}
          </g>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} className="cursor" />}
        {hover !== null && series.map((s, si) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4} fill={chartColor(si)} />)}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{labels[hover]}</b>{series.map((s, si) => <span key={s.name}><i style={{ background: chartColor(si) }} />{s.name}: {format(s.values[hover] ?? 0)}</span>)}
        </div>
      )}
      {series.length > 1 && <Legend items={series.map(s => s.name)} />}
      <DataTable caption={label} labels={labels} rows={series} format={format} />
    </figure>
  );
}

/** Vertical bar chart. `highlight` marks one bar (e.g. the current month). */
export function BarChart({ labels, values, label, format = plain, highlight, height = 180 }: {
  labels: string[]; values: number[]; label: string; format?: Fmt; highlight?: number; height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <figure className="chart" aria-label={label}>
      <div className="bars" style={{ height }} aria-hidden="true">
        {values.map((v, i) => (
          <div key={labels[i]} className={`bar${i === highlight ? ' on' : ''}`} title={`${labels[i]}: ${format(v)}`}>
            <span className="bar-track"><span style={{ height: `${Math.max(2, (v / max) * 100)}%` }} /></span>
            <small>{labels[i]}</small>
          </div>
        ))}
      </div>
      <DataTable caption={label} labels={labels} rows={[{ name: label, values }]} format={format} />
    </figure>
  );
}

/** Horizontal ranked bars with labels and values, for top-N lists. */
export function RankBars({ items, label, format = plain }: { items: { label: ReactNode; value: number; key: string }[]; label: string; format?: Fmt }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <figure className="chart" aria-label={label}>
      <ul className="rank" role="list">
        {items.map(i => (
          <li key={i.key}>
            <span className="rank-label">{i.label}</span>
            <span className="rank-track" aria-hidden="true"><span style={{ width: `${(i.value / max) * 100}%` }} /></span>
            <b>{format(i.value)}</b>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Donut with legend and percentages. */
export function Donut({ items, label, format = plain }: { items: { label: string; value: number }[]; label: string; format?: Fmt }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  const R = 42, C = 2 * Math.PI * R;
  return (
    <figure className="chart donut" aria-label={label}>
      <svg viewBox="0 0 100 100" role="img" aria-label={label}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--panel-line)" strokeWidth="14" />
        {items.map((it, i) => {
          const len = (it.value / total) * C;
          const el = <circle key={it.label} cx="50" cy="50" r={R} fill="none" stroke={chartColor(i)} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" />;
          acc += len;
          return el;
        })}
      </svg>
      <ul className="legend" role="list">
        {items.map((it, i) => <li key={it.label}><i style={{ background: chartColor(i) }} />{it.label}<b>{Math.round((it.value / total) * 100)}%</b><span className="sr"> ({format(it.value)})</span></li>)}
      </ul>
    </figure>
  );
}

export function Legend({ items }: { items: string[] }) {
  return <ul className="legend inline" role="list">{items.map((n, i) => <li key={n}><i style={{ background: chartColor(i) }} />{n}</li>)}</ul>;
}

/** KPI tile with an optional change versus the previous period. */
export function Kpi({ label, value, delta, hint, icon }: { label: string; value: string; delta?: number; hint?: string; icon?: Parameters<typeof Icon>[0]['name'] }) {
  const { t } = useTranslation('business');
  const up = (delta ?? 0) >= 0;
  return (
    <div className="kpi">
      <span className="kpi-label">{icon && <Icon name={icon} />}{label}</span>
      <b>{value}</b>
      {delta !== undefined && Number.isFinite(delta) && (
        <small className={up ? 'up' : 'down'}>{up ? '▲' : '▼'} {Math.abs(Math.round(delta * 100))}% <span>{t('kpi.vsPrev')}</span></small>
      )}
      {hint && <small className="kpi-hint">{hint}</small>}
    </div>
  );
}

/** Small "sample data" marker used next to any generated metric. */
export function SampleTag() {
  const { t } = useTranslation('business');
  return <span className="sample-tag" title={t('sample.tooltip')}><Icon name="info" width={13} height={13} />{t('sample.label')}</span>;
}
