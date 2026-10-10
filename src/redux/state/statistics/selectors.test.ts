import type { StatisticsBreakdown, StatisticsSummary, StatisticsTrend } from '@api/dto';
import { TransactionType } from '@shared/enums';
import type { PeriodUnit } from '@shared/utils';
import { toDateRange, unitPeriodOf } from '@shared/utils';
import { areStatisticsConsistent, isAsOfRejected, toStatisticsQuery } from './selectors';

const money = (amount: string, count: number) => ({ amount, count });

const summary = { income: money('100.00', 1), expense: money('40.50', 3) } as StatisticsSummary;
const trend = { totals: { income: money('100.00', 1), expense: money('40.50', 3) } } as StatisticsTrend;
const breakdown = { transaction_type: TransactionType.EXPENSE, total: money('40.50', 3) } as StatisticsBreakdown;

describe('toStatisticsQuery', () => {
  it('sends a standard period as its anchor day', () => {
    const range = { from: new Date(2026, 8, 1), to: new Date(2026, 8, 30, 23, 59, 59, 999), preset: 'month' as const };

    expect(toStatisticsQuery(range, 'Europe/Moscow')).toEqual({
      period: 'month',
      time_zone: 'Europe/Moscow',
      anchor_date: '2026-09-01',
    });
  });

  it('sends a past week, month or year as that unit with its first day, not as custom', () => {
    const now = new Date(2026, 8, 30);
    const query = (unit: PeriodUnit, reference: Date) =>
      toStatisticsQuery(toDateRange(unitPeriodOf(unit, reference, now), now), 'UTC');

    expect(query('month', new Date(2026, 7, 14))).toMatchObject({ period: 'month', anchor_date: '2026-08-01' });
    expect(query('week', new Date(2026, 8, 24))).toMatchObject({ period: 'week', anchor_date: '2026-09-21' });
    expect(query('year', new Date(2025, 4, 9))).toMatchObject({ period: 'year', anchor_date: '2025-01-01' });
  });

  it('sends a custom period as its first and last local days', () => {
    const range = { from: new Date(2026, 6, 1), to: new Date(2026, 8, 28, 23, 59, 59, 999), preset: 'custom' as const };

    expect(toStatisticsQuery(range, 'UTC')).toEqual({
      period: 'custom',
      time_zone: 'UTC',
      from_date: '2026-07-01',
      to_date: '2026-09-28',
    });
  });
});

describe('areStatisticsConsistent', () => {
  it('accepts blocks whose control sums match the summary', () => {
    expect(areStatisticsConsistent(summary, trend, breakdown)).toBe(true);
  });

  it('rejects a trend total that differs in amount', () => {
    const changed = { totals: { ...trend.totals, income: money('120.00', 1) } } as StatisticsTrend;

    expect(areStatisticsConsistent(summary, changed, breakdown)).toBe(false);
  });

  it('rejects a breakdown total that differs only in count', () => {
    expect(areStatisticsConsistent(summary, trend, { ...breakdown, total: money('40.50', 4) })).toBe(false);
  });

  it('checks a breakdown against the summary total of its own type', () => {
    const income = { transaction_type: TransactionType.INCOME, total: money('100.00', 1) } as StatisticsBreakdown;

    expect(areStatisticsConsistent(summary, trend, income)).toBe(true);
    expect(areStatisticsConsistent(summary, trend, { ...income, total: summary.expense })).toBe(false);
  });
});

describe('isAsOfRejected', () => {
  it('recognizes a 400 naming as_of', () => {
    expect(isAsOfRejected({ statusCode: 400, message: [{ field: 'as_of', error: 'in the future' }] })).toBe(true);
  });

  it('ignores other validation errors and other statuses', () => {
    expect(isAsOfRejected({ statusCode: 400, message: [{ field: 'time_zone', error: 'unknown' }] })).toBe(false);
    expect(isAsOfRejected({ statusCode: 500, message: 'boom' })).toBe(false);
    expect(isAsOfRejected(undefined)).toBe(false);
  });
});
