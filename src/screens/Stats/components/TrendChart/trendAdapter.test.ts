import type { StatisticsPeriodType, StatisticsTimeState, StatisticsTrend } from '@api/dto';
import { colorThemes } from '@shared/theme';

import {
  BAR_AREA_HEIGHT,
  MIN_BAR_HEIGHT,
  getTrendGeometry,
  getTrendMax,
  toBarData,
  toTrendGroups,
} from './trendAdapter';

const now = new Date(2026, 8, 30, 12);

type BucketSpec = [
  start: string,
  end: string,
  state: StatisticsTimeState,
  income: string | null,
  expense: string | null,
];

const trendOf = (
  type: StatisticsPeriodType,
  granularity: StatisticsTrend['granularity'],
  buckets: BucketSpec[],
): StatisticsTrend => ({
  period: {
    type,
    time_zone: 'Europe/Moscow',
    start_date: buckets[0][0],
    end_date: buckets[buckets.length - 1][1],
    from: '',
    to: '',
    as_of: '',
    actual_to: null,
    state: 'current',
  },
  currency: 'USD',
  totals: { income: { amount: '0.00', count: 0 }, expense: { amount: '0.00', count: 0 } },
  granularity,
  buckets: buckets.map(([start_date, end_date, state, income, expense]) => ({
    key: start_date,
    start_date,
    end_date,
    from: '',
    to: '',
    state,
    income,
    expense,
  })),
});

describe('toTrendGroups', () => {
  it('numbers the weeks of a month and gives each its days', () => {
    const groups = toTrendGroups(
      trendOf('month', 'week', [
        ['2026-08-01', '2026-08-02', 'past', '0.00', '84.20'],
        ['2026-08-03', '2026-08-09', 'past', '3200.00', '1612.40'],
        ['2026-08-31', '2026-08-31', 'past', '0.00', '43.20'],
      ]),
      now,
    );

    expect(groups.map(({ label, sub, dates }) => [label, sub, dates])).toEqual([
      ['W1', '1–2', '1–2 Aug 2026'],
      ['W2', '3–9', '3–9 Aug 2026'],
      ['W3', '31', '31 Aug 2026'],
    ]);
  });

  it('labels days by weekday and date', () => {
    const [monday] = toTrendGroups(
      trendOf('week', 'day', [['2026-09-28', '2026-09-28', 'current', '0.00', '38.60']]),
      now,
    );

    expect(monday).toMatchObject({ label: 'M', sub: '28', dates: 'Mon, 28 Sep', isCurrent: true });
  });

  it('names the month under the first custom week that falls in it', () => {
    const groups = toTrendGroups(
      trendOf('custom', 'week', [
        ['2026-07-27', '2026-08-02', 'past', '850.00', '510.70'],
        ['2026-08-03', '2026-08-09', 'past', '0.00', '0.00'],
        ['2026-08-10', '2026-08-16', 'past', '0.00', '0.00'],
      ]),
      now,
    );

    expect(groups.map(({ label, sub }) => [label, sub])).toEqual([
      ['27', 'Jul'],
      ['3', 'Aug'],
      ['10', ''],
    ]);
    expect(groups[0].dates).toBe('27 Jul – 2 Aug');
  });

  it('gives a year its month initials and names whole months', () => {
    const [january] = toTrendGroups(
      trendOf('year', 'month', [['2026-01-01', '2026-01-31', 'past', '1.00', '2.00']]),
      now,
    );

    expect(january).toMatchObject({ label: 'J', sub: '', dates: 'Jan 2026' });
  });

  it('keeps a future interval apart from a past zero', () => {
    const [zero, future] = toTrendGroups(
      trendOf('week', 'day', [
        ['2026-09-28', '2026-09-28', 'past', '0.00', '0.00'],
        ['2026-09-29', '2026-09-29', 'future', null, null],
      ]),
      now,
    );

    expect(zero).toMatchObject({ isZero: true, isFuture: false });
    expect(future).toMatchObject({ isZero: false, isFuture: true, incomeValue: 0, expenseValue: 0 });
  });
});

describe('getTrendMax', () => {
  it('takes the tallest bar of either series and skips the future', () => {
    const groups = toTrendGroups(
      trendOf('week', 'day', [
        ['2026-09-28', '2026-09-28', 'past', '120.00', '880.10'],
        ['2026-09-29', '2026-09-29', 'current', '3200.00', '0.00'],
        ['2026-09-30', '2026-09-30', 'future', null, null],
      ]),
      now,
    );

    expect(getTrendMax(groups)).toEqual({ value: 3200, amount: '3200.00' });
    expect(getTrendMax([])).toBeNull();
  });
});

describe('getTrendGeometry', () => {
  const groupsOf = (count: number) =>
    toTrendGroups(
      trendOf(
        'custom',
        'week',
        Array.from({ length: count }, (_, k): BucketSpec => {
          const day = `2026-07-${String(k + 1).padStart(2, '0')}`;
          return [day, day, 'past', '1.00', '1.00'];
        }),
      ),
      now,
    );

  it('fits fourteen weeks into a regular phone', () => {
    const geometry = getTrendGeometry(groupsOf(14), 323);

    expect(geometry.isScrollable).toBe(false);
    expect(geometry.contentWidth).toBe(323);
  });

  it('scrolls once a group would get narrower than its labels and tap target', () => {
    const geometry = getTrendGeometry(groupsOf(31), 305);

    expect(geometry.isScrollable).toBe(true);
    expect(geometry.columnWidth).toBeGreaterThanOrEqual(18);
    expect(geometry.contentWidth).toBe(geometry.columnWidth * 31 + geometry.columnGap * 30);
  });
});

describe('toBarData', () => {
  it('draws both series upward on one scale, lifting tiny amounts and leaving zeroes flat', () => {
    const groups = toTrendGroups(trendOf('week', 'day', [['2026-09-28', '2026-09-28', 'past', '0.00', '1.00']]), now);
    const geometry = getTrendGeometry(groups, 300);
    const [income, expense] = toBarData(groups, geometry, 1000, colorThemes.dark.colors);

    expect(income.value).toBe(0);
    expect(expense.value).toBe((1000 * MIN_BAR_HEIGHT) / BAR_AREA_HEIGHT);
    expect([income.frontColor, expense.frontColor]).toEqual([
      colorThemes.dark.colors.ok,
      colorThemes.dark.colors.danger,
    ]);
  });
});
