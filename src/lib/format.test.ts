import { describe, expect, it } from 'vitest';
import { hoursLabel, money, monthName, num, rating } from './format';

describe('money', () => {
  it('formats USD with no decimal places by default', () => {
    expect(money(1250, 'en')).toBe('$1,250');
  });

  it('maps the zh language code to the zh-CN locale', () => {
    expect(money(1250, 'zh')).toContain('1,250');
  });
});

describe('num / rating', () => {
  it('formats a plain number for the given locale', () => {
    expect(num(1234.5, 'en')).toBe('1,234.5');
  });

  it('always shows exactly one decimal place for a rating', () => {
    expect(rating(4, 'en')).toBe('4.0');
    expect(rating(4.567, 'en')).toBe('4.6');
  });
});

describe('monthName', () => {
  it('returns the short form by default', () => {
    expect(monthName(1, 'en')).toBe('Jan');
  });

  it('returns the long form when asked', () => {
    expect(monthName(12, 'en', 'long')).toBe('December');
  });
});

describe('hoursLabel', () => {
  const t = (key: string, opts?: Record<string, unknown>) => `${key}:${JSON.stringify(opts)}`;

  it('uses the plain hours key for a whole number of hours', () => {
    expect(hoursLabel(3, t)).toBe('common:units.hours:{"count":3}');
  });

  it('uses the minutes-only key for less than an hour', () => {
    expect(hoursLabel(0.25, t)).toBe('common:units.min:{"m":15}');
  });

  it('uses the combined hours-and-minutes key for a fractional duration', () => {
    expect(hoursLabel(1.25, t)).toBe('common:units.hm:{"h":1,"m":15}');
  });
});
