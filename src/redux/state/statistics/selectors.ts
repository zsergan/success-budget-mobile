import type {
  ErrorResponse,
  MoneyCount,
  StatisticsBreakdown,
  StatisticsQuery,
  StatisticsSummary,
  StatisticsTrend,
} from '@api/dto';
import type { DateRange } from '@shared/utils';
import { fromPickerDate } from '@shared/utils';

// A standard period is sent as its anchor day, so the server applies its own calendar to it.
export const toStatisticsQuery = (range: DateRange, timeZone: string): StatisticsQuery =>
  range.preset === 'custom'
    ? {
        period: 'custom',
        time_zone: timeZone,
        from_date: fromPickerDate(range.from),
        to_date: fromPickerDate(range.to),
      }
    : { period: range.preset, time_zone: timeZone, anchor_date: fromPickerDate(range.from) };

const sameMoneyCount = (a: MoneyCount, b: MoneyCount) => a.amount === b.amount && a.count === b.count;

// The blocks are separate reads, so a change between them shows up as control sums that disagree. Home reads no
// trend, so summary and breakdown are compared on their own.
export const isBreakdownConsistent = (summary: StatisticsSummary, breakdown: StatisticsBreakdown) =>
  sameMoneyCount(breakdown.total, summary[breakdown.transaction_type]);

export const areStatisticsConsistent = (
  summary: StatisticsSummary,
  trend: StatisticsTrend,
  breakdown: StatisticsBreakdown,
) =>
  sameMoneyCount(trend.totals.income, summary.income) &&
  sameMoneyCount(trend.totals.expense, summary.expense) &&
  isBreakdownConsistent(summary, breakdown);

// A device clock far enough ahead of the server's gets as_of rejected as being in the future.
export const isAsOfRejected = (error: unknown) => {
  const response = error as ErrorResponse | undefined;

  return (
    response?.statusCode === 400 &&
    Array.isArray(response.message) &&
    response.message.some(({ field }) => field === 'as_of')
  );
};
