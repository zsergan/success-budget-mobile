import type { DateRange } from './dateRange';
import {
  addMonths,
  daysInRange,
  endOfDay,
  getCurrentMonthRange,
  getCurrentWeekRange,
  getCurrentYearRange,
  startOfDay,
} from './dateRange';

export type PeriodUnit = 'week' | 'month' | 'year';

// What the user picked, kept apart from the dates it covers: a current period moves with
// today, a past week, month or year stays that unit, and only picked dates make a Custom range.
export type Period =
  | { kind: 'current'; unit: PeriodUnit }
  // `anchor` is the first day of that past week, month or year.
  | { kind: 'past'; unit: PeriodUnit; anchor: Date }
  | { kind: 'custom'; from: Date; to: Date };

export const MAX_CUSTOM_DAYS = 366;

export const CURRENT_MONTH: Period = { kind: 'current', unit: 'month' };

export const currentPeriod = (unit: PeriodUnit): Period => ({ kind: 'current', unit });

export const customPeriod = (from: Date, to: Date): Period => ({
  kind: 'custom',
  from: startOfDay(from),
  to: endOfDay(to),
});

const unitRange = (unit: PeriodUnit, reference: Date): DateRange => {
  if (unit === 'week') return getCurrentWeekRange(reference);
  if (unit === 'year') return getCurrentYearRange(reference);
  return getCurrentMonthRange(reference);
};

// The week, month or year `reference` falls in. The current one, or a later date, stays
// relative so it rolls over with today; there is no future period to pick.
export const unitPeriodOf = (unit: PeriodUnit, reference: Date | string, now: Date = new Date()): Period => {
  const { from } = unitRange(unit, new Date(reference));

  if (from.getTime() >= unitRange(unit, now).from.getTime()) return currentPeriod(unit);

  return { kind: 'past', unit, anchor: from };
};

export const monthPeriodOf = (reference: Date | string, now: Date = new Date()): Period =>
  unitPeriodOf('month', reference, now);

const shiftAnchor = (unit: PeriodUnit, anchor: Date, delta: number) => {
  if (unit === 'week') return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * delta);
  if (unit === 'year') return new Date(anchor.getFullYear() + delta, 0, 1);
  return addMonths(anchor, delta);
};

// The previous or next week, month or year; a custom range has no step and stays as it is.
export const shiftPeriod = (period: Period, delta: -1 | 1, now: Date = new Date()): Period => {
  if (period.kind === 'custom') return period;

  return unitPeriodOf(period.unit, shiftAnchor(period.unit, toDateRange(period, now).from, delta), now);
};

export const toDateRange = (period: Period, now: Date = new Date()): DateRange => {
  switch (period.kind) {
    case 'current':
      return unitRange(period.unit, now);
    case 'past':
      return unitRange(period.unit, period.anchor);
    case 'custom':
      return { from: period.from, to: period.to, preset: 'custom' };
  }
};

// The unit its preset chip lights up for; a past month still reads as a Month.
export const getPeriodUnit = (period: Period): PeriodUnit | null => (period.kind === 'custom' ? null : period.unit);

export const isCurrentMonth = (period: Period) => period.kind === 'current' && period.unit === 'month';

export const isPeriodTooLong = (period: Period) => period.kind === 'custom' && daysInRange(period) > MAX_CUSTOM_DAYS;

// A custom range has no previous period of the same kind to compare with.
export const hasComparison = (period: Period) => period.kind !== 'custom';
