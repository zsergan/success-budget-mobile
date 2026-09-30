import type { DateRange } from './dateRange';
import {
  daysInRange,
  endOfDay,
  getCurrentMonthRange,
  getCurrentWeekRange,
  getCurrentYearRange,
  getMonthRange,
  startOfDay,
} from './dateRange';

export type PeriodUnit = 'week' | 'month' | 'year';

// What the user picked, kept apart from the dates it covers: a current period moves with
// today, a past month stays a Month, and only picked dates make a Custom range.
export type Period =
  | { kind: 'current'; unit: PeriodUnit }
  | { kind: 'month'; year: number; month: number }
  | { kind: 'custom'; from: Date; to: Date };

export const MAX_CUSTOM_DAYS = 366;

export const CURRENT_MONTH: Period = { kind: 'current', unit: 'month' };

export const currentPeriod = (unit: PeriodUnit): Period => ({ kind: 'current', unit });

export const customPeriod = (from: Date, to: Date): Period => ({
  kind: 'custom',
  from: startOfDay(from),
  to: endOfDay(to),
});

// The month `reference` falls in; this month stays relative, so Reset hides and it rolls over.
export const monthPeriodOf = (reference: Date | string, now: Date = new Date()): Period => {
  const date = new Date(reference);

  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) return CURRENT_MONTH;

  return { kind: 'month', year: date.getFullYear(), month: date.getMonth() };
};

export const toDateRange = (period: Period, now: Date = new Date()): DateRange => {
  switch (period.kind) {
    case 'current':
      if (period.unit === 'week') return getCurrentWeekRange(now);
      if (period.unit === 'year') return getCurrentYearRange(now);
      return getCurrentMonthRange(now);
    case 'month':
      return { ...getMonthRange(new Date(period.year, period.month, 1)), preset: 'month' };
    case 'custom':
      return { from: period.from, to: period.to, preset: 'custom' };
  }
};

// The unit its preset chip lights up for; a past month still reads as a Month.
export const getPeriodUnit = (period: Period): PeriodUnit | null => {
  if (period.kind === 'current') return period.unit;
  if (period.kind === 'month') return 'month';
  return null;
};

export const isCurrentMonth = (period: Period) => period.kind === 'current' && period.unit === 'month';

export const isPeriodTooLong = (period: Period) => period.kind === 'custom' && daysInRange(period) > MAX_CUSTOM_DAYS;

// A custom range has no previous period of the same kind to compare with.
export const hasComparison = (period: Period) => period.kind !== 'custom';
