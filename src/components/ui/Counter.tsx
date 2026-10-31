import { useTranslation } from 'react-i18next';

export function Counter({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  const { t } = useTranslation();
  return (
    <span className="stepper-num" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t('actions.decrease', { label })}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t('actions.increase', { label })}>+</button>
    </span>
  );
}
