import {
  calendarDateInZone,
  compareCalendarDates,
  daysBetween,
  deviceToday,
  endOfMonth,
  formatCalendarDate,
  formatLongDate,
  formatRelativeDate,
  fromPickerDate,
  isCalendarDate,
  isSameMonth,
  isWithinDates,
  monthDates,
  shiftDays,
  shiftMonths,
  startOfMonth,
  toPickerDate,
} from './calendarDate';

// Jest runs in America/Chicago (jest.config.js), so the device zone here has daylight saving.

describe('isCalendarDate', () => {
  it.each(['2026-10-08', '2028-02-29', '2000-02-29', '1000-01-01', '9999-12-31', '2026-12-31'])(
    'accepts %s',
    (date) => {
      expect(isCalendarDate(date)).toBe(true);
    },
  );

  it.each([
    '2026-02-29',
    '1900-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-10-8',
    '2026-10-08T00:00:00Z',
    '2026-10-08+03:00',
    ' 2026-10-08',
    '0999-12-31',
    '20261008',
    '',
  ])('refuses %j', (date) => {
    expect(isCalendarDate(date)).toBe(false);
  });

  it('refuses what is not a string', () => {
    expect(isCalendarDate(null)).toBe(false);
    expect(isCalendarDate(20261008)).toBe(false);
    expect(isCalendarDate(new Date(2026, 9, 8))).toBe(false);
  });
});

describe('comparing dates', () => {
  it('orders dates as days', () => {
    expect(compareCalendarDates('2026-01-31', '2026-02-01')).toBe(-1);
    expect(compareCalendarDates('2026-02-01', '2026-02-01')).toBe(0);
    expect(compareCalendarDates('2027-01-01', '2026-12-31')).toBe(1);
  });

  it('includes both ends of a range', () => {
    const range = { fromDate: '2026-10-01', toDate: '2026-10-31' };

    expect(isWithinDates('2026-10-01', range)).toBe(true);
    expect(isWithinDates('2026-10-31', range)).toBe(true);
    expect(isWithinDates('2026-09-30', range)).toBe(false);
    expect(isWithinDates('2026-11-01', range)).toBe(false);
  });

  it('tells months apart across years', () => {
    expect(isSameMonth('2026-10-01', '2026-10-31')).toBe(true);
    expect(isSameMonth('2026-10-01', '2025-10-01')).toBe(false);
  });
});

describe('today', () => {
  it('is the device calendar day, not the UTC one', () => {
    // 23:30 in Chicago is already the next day in UTC.
    expect(deviceToday(new Date(2026, 9, 8, 23, 30))).toBe('2026-10-08');
    expect(deviceToday(new Date(2026, 9, 9, 0, 0))).toBe('2026-10-09');
  });

  it('keeps the day across a daylight saving change', () => {
    expect(deviceToday(new Date(2026, 2, 8, 3, 30))).toBe('2026-03-08');
    expect(deviceToday(new Date(2026, 10, 1, 1, 30))).toBe('2026-11-01');
  });
});

describe('calendarDateInZone', () => {
  const instant = new Date('2026-10-08T21:30:00Z');

  it('reads the day an instant falls on in each zone', () => {
    expect(calendarDateInZone(instant, 'Europe/Moscow')).toBe('2026-10-09');
    expect(calendarDateInZone(instant, 'America/Chicago')).toBe('2026-10-08');
    expect(calendarDateInZone(instant, 'Asia/Tokyo')).toBe('2026-10-09');
    expect(calendarDateInZone(instant, 'Pacific/Honolulu')).toBe('2026-10-08');
    expect(calendarDateInZone(instant, 'UTC')).toBe('2026-10-08');
  });

  it('follows the zone’s daylight saving on the instant’s own day', () => {
    expect(calendarDateInZone(new Date('2026-01-15T05:59:59.999Z'), 'America/Chicago')).toBe('2026-01-14');
    expect(calendarDateInZone(new Date('2026-01-15T06:00:00.000Z'), 'America/Chicago')).toBe('2026-01-15');
    expect(calendarDateInZone(new Date('2026-07-15T04:59:59.999Z'), 'America/Chicago')).toBe('2026-07-14');
    expect(calendarDateInZone(new Date('2026-07-15T05:00:00.000Z'), 'America/Chicago')).toBe('2026-07-15');
    expect(calendarDateInZone(new Date('2026-11-01T06:30:00.000Z'), 'America/Chicago')).toBe('2026-11-01');
    expect(calendarDateInZone(new Date('2027-01-01T05:59:59.999Z'), 'America/Chicago')).toBe('2026-12-31');
  });

  it('throws for a zone the device does not know', () => {
    expect(() => calendarDateInZone(instant, 'Mars/Olympus')).toThrow();
  });
});

describe('calendar arithmetic', () => {
  it('steps days across months, years and leap days', () => {
    expect(shiftDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(shiftDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(shiftDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('steps one day over a daylight saving change, whatever its length', () => {
    expect(shiftDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(shiftDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(shiftDays('2026-11-02', -1)).toBe('2026-11-01');
  });

  it('steps months and clamps a missing day', () => {
    expect(shiftMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(shiftMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(shiftMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(shiftMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(shiftMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(shiftMonths('2026-05-10', -17)).toBe('2024-12-10');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2028-01-01', '2029-01-01')).toBe(366);
    expect(daysBetween('2026-10-09', '2026-10-08')).toBe(-1);
  });

  it('finds month bounds', () => {
    expect(startOfMonth('2026-02-17')).toBe('2026-02-01');
    expect(endOfMonth('2026-02-17')).toBe('2026-02-28');
    expect(endOfMonth('2028-02-01')).toBe('2028-02-29');
    expect(endOfMonth('2026-12-01')).toBe('2026-12-31');
    expect(monthDates('2026-04-30')).toEqual({ fromDate: '2026-04-01', toDate: '2026-04-30' });
  });

  it('refuses what is not a calendar date', () => {
    expect(() => shiftDays('2026-02-30', 1)).toThrow(RangeError);
    expect(() => shiftMonths('2026-10-08T00:00:00Z', 1)).toThrow(RangeError);
  });
});

describe('picker values', () => {
  it('round-trips every day of a year with both daylight saving changes', () => {
    let date = '2026-01-01';

    while (date !== '2027-01-01') {
      expect(fromPickerDate(toPickerDate(date))).toBe(date);
      date = shiftDays(date, 1);
    }
  });

  it('round-trips leap days and far years', () => {
    ['2028-02-29', '1000-01-01', '9999-12-31', '1970-01-01'].forEach((date) => {
      expect(fromPickerDate(toPickerDate(date))).toBe(date);
    });
  });

  it('reads a picked day by the device calendar, whatever its time of day', () => {
    expect(fromPickerDate(new Date(2026, 9, 8, 0, 0))).toBe('2026-10-08');
    expect(fromPickerDate(new Date(2026, 9, 8, 23, 59, 59, 999))).toBe('2026-10-08');
  });

  it('gives a device-local day for the picker', () => {
    const picked = toPickerDate('2026-10-08');

    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([2026, 9, 8]);
  });
});

describe('formatting', () => {
  it('names the stored day, never the one before it in a zone west of UTC', () => {
    expect(formatLongDate('2026-10-01')).toBe('Oct 1, 2026');
    expect(formatCalendarDate('2026-01-01', { month: 'long', year: 'numeric' })).toBe('January 2026');
  });

  it('says Today and Yesterday relative to the given day', () => {
    const now = '2026-03-01';

    expect(formatRelativeDate('2026-03-01', { now })).toBe('Today');
    expect(formatRelativeDate('2026-02-28', { now })).toBe('Yesterday');
    expect(formatRelativeDate('2026-02-27', { now })).toBe('Feb 27');
    expect(formatRelativeDate('2026-02-27', { now, withWeekday: true })).toBe('Fri, Feb 27');
    expect(formatRelativeDate('2025-12-31', { now })).toBe('Dec 31, 2025');
    expect(formatRelativeDate('2026-12-31', { now: '2027-01-01' })).toBe('Yesterday');
  });
});
