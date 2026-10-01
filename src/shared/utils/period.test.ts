import {
  CURRENT_MONTH,
  currentPeriod,
  customPeriod,
  getPeriodUnit,
  hasComparison,
  isCurrentMonth,
  isPeriodTooLong,
  monthPeriodOf,
  shiftPeriod,
  toDateRange,
  unitPeriodOf,
} from './period';

const now = new Date(2026, 8, 30, 15, 0);

describe('monthPeriodOf', () => {
  it('keeps a past month a Month of that month', () => {
    const period = monthPeriodOf(new Date(2026, 7, 29, 10), now);

    expect(period).toEqual({ kind: 'past', unit: 'month', anchor: new Date(2026, 7, 1) });
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
    expect(monthPeriodOf(new Date(2025, 8, 2), now)).toEqual({
      kind: 'past',
      unit: 'month',
      anchor: new Date(2025, 8, 1),
    });
  });
});

describe('past weeks and years', () => {
  it('cover the whole unit a date falls in, starting the week on Monday', () => {
    const week = unitPeriodOf('week', new Date(2026, 8, 24), now);
    const year = unitPeriodOf('year', new Date(2025, 4, 9), now);

    expect(toDateRange(week, now)).toEqual({
      from: new Date(2026, 8, 21),
      to: new Date(2026, 8, 27, 23, 59, 59, 999),
      preset: 'week',
    });
    expect(toDateRange(year, now)).toEqual({
      from: new Date(2025, 0, 1),
      to: new Date(2025, 11, 31, 23, 59, 59, 999),
      preset: 'year',
    });
    expect(getPeriodUnit(week)).toBe('week');
    expect(hasComparison(year)).toBe(true);
  });

  it('never run ahead of the current one', () => {
    expect(unitPeriodOf('week', new Date(2026, 9, 3), now)).toEqual(currentPeriod('week'));
    expect(unitPeriodOf('year', new Date(2027, 0, 5), now)).toEqual(currentPeriod('year'));
  });
});

describe('shiftPeriod', () => {
  it('steps back and forth by its own unit and lands on the current one again', () => {
    const lastMonth = shiftPeriod(CURRENT_MONTH, -1, now);
    const lastWeek = shiftPeriod(currentPeriod('week'), -1, now);
    const lastYear = shiftPeriod(currentPeriod('year'), -1, now);

    expect(toDateRange(lastMonth, now).from).toEqual(new Date(2026, 7, 1));
    expect(toDateRange(lastWeek, now).from).toEqual(new Date(2026, 8, 21));
    expect(toDateRange(lastYear, now).from).toEqual(new Date(2025, 0, 1));
    expect(shiftPeriod(lastMonth, 1, now)).toEqual(CURRENT_MONTH);
    expect(shiftPeriod(CURRENT_MONTH, 1, now)).toEqual(CURRENT_MONTH);
  });

  it('keeps a week whole across a month and a year boundary', () => {
    const period = shiftPeriod(unitPeriodOf('week', new Date(2026, 0, 7), now), -1, now);

    expect(toDateRange(period, now)).toMatchObject({
      from: new Date(2025, 11, 29),
      to: new Date(2026, 0, 4, 23, 59, 59, 999),
    });
  });

  it('leaves a custom range alone', () => {
    const period = customPeriod(new Date(2026, 6, 1), new Date(2026, 8, 28));

    expect(shiftPeriod(period, -1, now)).toBe(period);
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
    expect(isCurrentMonth({ kind: 'past', unit: 'month', anchor: new Date(2026, 7, 1) })).toBe(false);
  });
});
