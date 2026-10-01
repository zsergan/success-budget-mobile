import type {
  ErrorResponse,
  MoneyCount,
  StatisticsBreakdown,
  StatisticsQuery,
  StatisticsSummary,
  StatisticsTrend,
} from '@api/dto';
import type { DateRange } from '@shared/utils';
import { toLocalDateKey } from '@shared/utils';

// The device's IANA zone; the API rejects fixed offsets, so there is no offset fallback.
export const getDeviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// A standard period is sent as its anchor day, so the server applies its own calendar to it.
export const toStatisticsQuery = (range: DateRange, timeZone: string): StatisticsQuery =>
  range.preset === 'custom'
    ? {
        period: 'custom',
        time_zone: timeZone,
        from_date: toLocalDateKey(range.from),
        to_date: toLocalDateKey(range.to),
      }
    : { period: range.preset, time_zone: timeZone, anchor_date: toLocalDateKey(range.from) };

const sameMoneyCount = (a: MoneyCount, b: MoneyCount) => a.amount === b.amount && a.count === b.count;

// The blocks are separate reads, so a change between them shows up as control sums that disagree.
export const areStatisticsConsistent = (
  summary: StatisticsSummary,
  trend: StatisticsTrend,
  breakdown: StatisticsBreakdown,
) =>
  sameMoneyCount(trend.totals.income, summary.income) &&
  sameMoneyCount(trend.totals.expense, summary.expense) &&
  sameMoneyCount(breakdown.total, summary.expense);

// A device clock far enough ahead of the server's gets as_of rejected as being in the future.
export const isAsOfRejected = (error: unknown) => {
  const response = error as ErrorResponse | undefined;

  return (
    response?.statusCode === 400 &&
    Array.isArray(response.message) &&
    response.message.some(({ field }) => field === 'as_of')
  );
};
