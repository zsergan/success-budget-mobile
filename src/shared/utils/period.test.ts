import {
  CURRENT_MONTH,
  currentPeriod,
  customPeriod,
  getPeriodUnit,
  hasComparison,
  isCurrentMonth,
  isPeriodTooLong,
  monthPeriodOf,
  toDateRange,
} from './period';

const now = new Date(2026, 8, 30, 15, 0);

describe('monthPeriodOf', () => {
  it('keeps a past month a Month of that month', () => {
    const period = monthPeriodOf(new Date(2026, 7, 29, 10), now);

    expect(period).toEqual({ kind: 'month', year: 2026, month: 7 });
    expect(toDateRange(period, now)).toEqual({
      from: new Date(2026, 7, 1),
      to: new Date(2026, 7, 31, 23, 59, 59, 999),
      preset: 'month',
    });
    expect(getPeriodUnit(period)).toBe('month');
  });

  it('treats a date in this month as the current month', () => {
    expect(monthPeriodOf(new Date(2026, 8, 2), now)).toEqual(CURRENT_MONTH);
  });

  it('tells the same month of another year apart', () => {
    expect(monthPeriodOf(new Date(2025, 8, 2), now)).toEqual({ kind: 'month', year: 2025, month: 8 });
  });
});

describe('current periods', () => {
  it('follow today instead of the day they were picked', () => {
    const period = currentPeriod('month');

    expect(toDateRange(period, now).from).toEqual(new Date(2026, 8, 1));
    expect(toDateRange(period, new Date(2026, 9, 1)).from).toEqual(new Date(2026, 9, 1));
  });

  it('start the week on Monday', () => {
    expect(toDateRange(currentPeriod('week'), now)).toMatchObject({ from: new Date(2026, 8, 28), preset: 'week' });
  });
});

describe('custom periods', () => {
  it('cover whole days and light no preset', () => {
    const period = customPeriod(new Date(2026, 6, 1, 13), new Date(2026, 8, 28, 9));

    expect(toDateRange(period, now)).toEqual({
      from: new Date(2026, 6, 1),
      to: new Date(2026, 8, 28, 23, 59, 59, 999),
      preset: 'custom',
    });
    expect(getPeriodUnit(period)).toBeNull();
  });

  it('allow at most 366 calendar days', () => {
    expect(isPeriodTooLong(customPeriod(new Date(2024, 0, 1), new Date(2024, 11, 31)))).toBe(false);
    expect(isPeriodTooLong(customPeriod(new Date(2025, 0, 1), new Date(2026, 0, 1)))).toBe(false);
    expect(isPeriodTooLong(customPeriod(new Date(2025, 0, 1), new Date(2026, 0, 2)))).toBe(true);
  });

  it('have no comparison', () => {
    expect(hasComparison(customPeriod(now, now))).toBe(false);
    expect(hasComparison(monthPeriodOf(new Date(2026, 7, 1), now))).toBe(true);
    expect(hasComparison(currentPeriod('year'))).toBe(true);
  });
});

describe('isCurrentMonth', () => {
  it('is only the relative current month', () => {
    expect(isCurrentMonth(CURRENT_MONTH)).toBe(true);
    expect(isCurrentMonth(currentPeriod('week'))).toBe(false);
    expect(isCurrentMonth({ kind: 'month', year: 2026, month: 8 })).toBe(false);
  });
});
