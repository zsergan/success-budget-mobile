// A day of the Gregorian calendar as the API stores it: exactly `YYYY-MM-DD`, with no time and no zone. Dates of one
// layout compare as strings; arithmetic goes through UTC fields, where every day is the same length.
export type CalendarDate = string;

export interface CalendarDateRange {
  fromDate: CalendarDate;
  toDate: CalendarDate;
}

// The range of the server's `DATE` column.
export const MIN_CALENDAR_DATE: CalendarDate = '1000-01-01';
export const MAX_CALENDAR_DATE: CalendarDate = '9999-12-31';

const LAYOUT = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

interface DateFields {
  year: number;
  // 1–12.
  month: number;
  day: number;
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const fromFields = ({ year, month, day }: DateFields): CalendarDate => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

// Date.UTC reads years 0–99 as 1900–1999; every year the API takes has four digits, so setUTCFullYear is enough.
const utcOf = ({ year, month, day }: DateFields) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  return date;
};

const fieldsOfUtc = (date: Date): DateFields => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

const daysInMonth = (year: number, month: number) => utcOf({ year, month: month + 1, day: 0 }).getUTCDate();

export const isCalendarDate = (value: unknown): value is CalendarDate => {
  if (typeof value !== 'string') return false;

  const match = LAYOUT.exec(value);
  if (!match) return false;

  const [year, month, day] = match.slice(1).map(Number);

  return (
    value >= MIN_CALENDAR_DATE &&
    value <= MAX_CALENDAR_DATE &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
};

const fieldsOf = (date: CalendarDate): DateFields => {
  if (!isCalendarDate(date)) throw new RangeError(`Not a calendar date: ${String(date)}`);

  const [year, month, day] = date.split('-').map(Number);

  return { year, month, day };
};

export const compareCalendarDates = (a: CalendarDate, b: CalendarDate) => (a < b ? -1 : a > b ? 1 : 0);

export const isWithinDates = (date: CalendarDate, { fromDate, toDate }: CalendarDateRange) =>
  date >= fromDate && date <= toDate;

// The device calendar's day at an instant: what "today" means on this phone.
export const deviceCalendarDate = (instant: Date): CalendarDate =>
  fromFields({ year: instant.getFullYear(), month: instant.getMonth() + 1, day: instant.getDate() });

export const deviceToday = (now: Date = new Date()): CalendarDate => deviceCalendarDate(now);

const zoneFormats = new Map<string, Intl.DateTimeFormat>();

const zoneFormat = (timeZone: string) => {
  let format = zoneFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
    zoneFormats.set(timeZone, format);
  }

  return format;
};

// The day an instant falls on in a zone, by that zone's own rules on that day; throws for a zone the device lacks.
export const calendarDateInZone = (instant: Date, timeZone: string): CalendarDate => {
  const parts = Object.fromEntries(
    zoneFormat(timeZone)
      .formatToParts(instant)
      .map(({ type, value }) => [type, Number(value)]),
  );

  return fromFields({ year: parts.year, month: parts.month, day: parts.day });
};

export const shiftDays = (date: CalendarDate, days: number): CalendarDate => {
  const utc = utcOf(fieldsOf(date));
  utc.setUTCDate(utc.getUTCDate() + days);

  return fromFields(fieldsOfUtc(utc));
};

// A missing day clamps to the end of the month: Jan 31 plus one month is Feb 28 (29 in a leap year).
export const shiftMonths = (date: CalendarDate, months: number): CalendarDate => {
  const { year, month, day } = fieldsOf(date);
  const index = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12 + 1;

  return fromFields({ year: nextYear, month: nextMonth, day: Math.min(day, daysInMonth(nextYear, nextMonth)) });
};

export const daysBetween = (from: CalendarDate, to: CalendarDate) =>
  Math.round((utcOf(fieldsOf(to)).getTime() - utcOf(fieldsOf(from)).getTime()) / DAY_MS);

export const startOfMonth = (date: CalendarDate): CalendarDate => fromFields({ ...fieldsOf(date), day: 1 });

export const endOfMonth = (date: CalendarDate): CalendarDate => {
  const { year, month } = fieldsOf(date);

  return fromFields({ year, month, day: daysInMonth(year, month) });
};

export const monthDates = (date: CalendarDate): CalendarDateRange => ({
  fromDate: startOfMonth(date),
  toDate: endOfMonth(date),
});

export const isSameMonth = (a: CalendarDate, b: CalendarDate) => a.slice(0, 7) === b.slice(0, 7);

// A calendar picker's day (a device-local Date) as the calendar date it shows, and back. Only picker values cross
// here; a stored date never goes through an instant.
export const fromPickerDate = (date: Date): CalendarDate => deviceCalendarDate(date);

export const toPickerDate = (date: CalendarDate): Date => {
  const { year, month, day } = fieldsOf(date);
  const local = new Date(2000, 0, 1);
  local.setFullYear(year, month - 1, day);

  return local;
};

export type CalendarDateFormat = Pick<Intl.DateTimeFormatOptions, 'weekday' | 'day' | 'month' | 'year'>;

// Formatted from its own fields at UTC midnight in UTC, so no zone of the device can move it to another day.
export const formatCalendarDate = (date: CalendarDate, options: CalendarDateFormat) =>
  utcOf(fieldsOf(date)).toLocaleString('en-US', { ...options, timeZone: 'UTC' });

export const calendarYear = (date: CalendarDate) => fieldsOf(date).year;

// "Today", "Yesterday", else "Aug 29" (with the weekday where asked), and the year only when it is not this one.
export const formatRelativeDate = (
  date: CalendarDate,
  { now = deviceToday(), withWeekday = false }: { now?: CalendarDate; withWeekday?: boolean } = {},
) => {
  if (date === now) return 'Today';
  if (date === shiftDays(now, -1)) return 'Yesterday';

  return formatCalendarDate(date, {
    ...(withWeekday && { weekday: 'short' }),
    day: 'numeric',
    month: 'short',
    ...(calendarYear(date) !== calendarYear(now) && { year: 'numeric' }),
  });
};

// "Aug 29, 2026": a day named in full wherever it stands alone.
export const formatLongDate = (date: CalendarDate) =>
  formatCalendarDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
