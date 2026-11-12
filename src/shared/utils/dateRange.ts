import { compareDays } from './compare';

export type PeriodPreset = 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  preset: PeriodPreset;
}

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
}

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
export const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const monthShort = (date: Date) => date.toLocaleString('en-US', { month: 'short' });

// The device's local calendar day as YYYY-MM-DD, the form the statistics API takes for dates.
export const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const zoneFormats = new Map<string, Intl.DateTimeFormat>();

// An instant's calendar fields by a zone's own rules, daylight saving included; the device's zone when none is given
// or the device does not know the zone.
export const toZonedParts = (date: Date, timeZone?: string) => {
  try {
    if (timeZone) {
      let format = zoneFormats.get(timeZone);
      if (!format) {
        format = new Intl.DateTimeFormat('en-US', {
          timeZone,
          hourCycle: 'h23',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        });
        zoneFormats.set(timeZone, format);
      }
      const parts = Object.fromEntries(format.formatToParts(date).map(({ type, value }) => [type, Number(value)]));

      return { year: parts.year, month: parts.month - 1, day: parts.day, hour: parts.hour % 24, minute: parts.minute };
    }
  } catch {
    // Falls through to the device's zone.
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
};

// The zone's calendar day of an instant as a device date, for helpers that read local fields. Noon, so no
// daylight saving gap on the device moves it to another day.
export const toZonedDay = (date: Date, timeZone?: string) => {
  if (!timeZone) return date;

  const { year, month, day } = toZonedParts(date, timeZone);

  return new Date(year, month, day, 12);
};

/** Month boundaries for whatever month `reference` falls in, no preset attached. */
export const getMonthRange = (reference: Date | string): { from: Date; to: Date } => {
  const date = new Date(reference);

  return {
    from: new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0),
    // Day 0 of next month = the last day of this month.
    to: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
  };
};

export const getCurrentMonthRange = (reference: Date = new Date()): DateRange => ({
  ...getMonthRange(reference),
  preset: 'month',
});

export const getCurrentWeekRange = (reference: Date = new Date()): DateRange => {
  const mondayIndex = (reference.getDay() + 6) % 7; // Mon=0 .. Sun=6
  const monday = startOfDay(reference);
  monday.setDate(monday.getDate() - mondayIndex);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { from: monday, to: endOfDay(sunday), preset: 'week' };
};

export const getCurrentYearRange = (reference: Date = new Date()): DateRange => ({
  from: new Date(reference.getFullYear(), 0, 1, 0, 0, 0, 0),
  to: new Date(reference.getFullYear(), 11, 31, 23, 59, 59, 999),
  preset: 'year',
});

// With a zone, the days the range's ends fall on there; otherwise on the device.
export const formatRangeLabel = (range: Pick<DateRange, 'from' | 'to'>, timeZone?: string): string => {
  const from = toZonedDay(range.from, timeZone);
  const to = toZonedDay(range.to, timeZone);
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  if (sameMonth) {
    return `${from.getDate()}–${to.getDate()} ${monthShort(to)} ${to.getFullYear()}`;
  }

  if (sameYear) {
    return `${from.getDate()} ${monthShort(from)} – ${to.getDate()} ${monthShort(to)} ${to.getFullYear()}`;
  }

  return `${from.getDate()} ${monthShort(from)} ${from.getFullYear()} – ${to.getDate()} ${monthShort(to)} ${to.getFullYear()}`;
};

export const daysInRange = (range: Pick<DateRange, 'from' | 'to'>): number => {
  const start = startOfDay(range.from);
  const end = startOfDay(range.to);
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
};

// Normalizes to day 1 — naive setMonth() on e.g. the 31st can overflow into the following month.
export const addMonths = (date: Date, delta: number): Date => new Date(date.getFullYear(), date.getMonth() + delta, 1);

// Always a flat 42-cell (6×7) grid so the calendar's height never jumps between 5- and 6-week months.
export const getCalendarMonthGrid = (monthDate: Date, range?: Pick<DateRange, 'from' | 'to'>): CalendarDay[] => {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - mondayIndex);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);

    const isRangeStart = !!range && compareDays(date, range.from);
    const isRangeEnd = !!range && compareDays(date, range.to);
    const isInRange = !!range && date.getTime() >= range.from.getTime() && date.getTime() <= range.to.getTime();

    return {
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isRangeStart,
      isRangeEnd,
      isInRange,
    };
  });
};
