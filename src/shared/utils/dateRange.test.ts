import {
  addMonths,
  daysInRange,
  formatRangeLabel,
  getCalendarMonthGrid,
  getCurrentMonthRange,
  getCurrentWeekRange,
  getCurrentYearRange,
  getMonthRange,
  toLocalDateKey,
  toZonedParts,
} from './dateRange';

describe('getCurrentWeekRange', () => {
  it('starts on Monday and ends on Sunday for a mid-week reference', () => {
    const wednesday = new Date(2026, 8, 2); // Wed 2 Sep 2026
    const range = getCurrentWeekRange(wednesday);

    expect(range.from).toEqual(new Date(2026, 7, 31, 0, 0, 0, 0)); // Mon 31 Aug 2026
    expect(range.to).toEqual(new Date(2026, 8, 6, 23, 59, 59, 999)); // Sun 6 Sep 2026
    expect(range.preset).toBe('week');
  });

  it('keeps a Monday reference as the range start', () => {
    const monday = new Date(2026, 8, 7);
    const range = getCurrentWeekRange(monday);

    expect(range.from).toEqual(new Date(2026, 8, 7, 0, 0, 0, 0));
  });

  it('spans a month boundary correctly', () => {
    const range = getCurrentWeekRange(new Date(2026, 0, 1)); // Thu 1 Jan 2026
    expect(range.from).toEqual(new Date(2025, 11, 29, 0, 0, 0, 0)); // Mon 29 Dec 2025
    expect(range.to).toEqual(new Date(2026, 0, 4, 23, 59, 59, 999)); // Sun 4 Jan 2026
  });
});

describe('getCurrentMonthRange / getMonthRange', () => {
  it('covers the first through last day of the month', () => {
    const range = getCurrentMonthRange(new Date(2026, 8, 15));

    expect(range.from).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0));
    expect(range.to).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999));
    expect(range.preset).toBe('month');
  });

  it('handles a 31-day month and a leap-year February', () => {
    expect(getMonthRange(new Date(2026, 0, 10)).to).toEqual(new Date(2026, 0, 31, 23, 59, 59, 999));
    expect(getMonthRange(new Date(2024, 1, 10)).to).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('accepts an ISO string reference without crashing (API timestamps arrive as strings)', () => {
    expect(getMonthRange('2026-09-10T12:00:00.000Z').to.getMonth()).toBe(
      new Date('2026-09-10T12:00:00.000Z').getMonth(),
    );
  });
});

describe('getCurrentYearRange', () => {
  it('covers Jan 1 through Dec 31', () => {
    const range = getCurrentYearRange(new Date(2026, 5, 20));

    expect(range.from).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
    expect(range.to).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
    expect(range.preset).toBe('year');
  });
});

describe('formatRangeLabel', () => {
  it('collapses to one month+year when the range stays within a month', () => {
    const label = formatRangeLabel({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) });
    expect(label).toBe('1–30 Sep 2026');
  });

  it('shows both months once when the range crosses months in the same year', () => {
    const label = formatRangeLabel({ from: new Date(2026, 7, 12), to: new Date(2026, 8, 3) });
    expect(label).toBe('12 Aug – 3 Sep 2026');
  });

  it('shows both years when the range crosses a year boundary', () => {
    const label = formatRangeLabel({ from: new Date(2025, 11, 20), to: new Date(2026, 0, 5) });
    expect(label).toBe('20 Dec 2025 – 5 Jan 2026');
  });
});

describe('daysInRange', () => {
  it('counts a single day as 1', () => {
    expect(daysInRange({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 1, 23, 59, 59, 999) })).toBe(1);
  });

  it('counts inclusively across multiple days', () => {
    expect(daysInRange({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30, 23, 59, 59, 999) })).toBe(30);
  });
});

describe('addMonths', () => {
  it('normalizes to day 1 regardless of the input day', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 1));
  });

  it('rolls over a year boundary', () => {
    expect(addMonths(new Date(2026, 11, 1), 1)).toEqual(new Date(2027, 0, 1));
    expect(addMonths(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 1));
  });
});

describe('getCalendarMonthGrid', () => {
  it('always returns 42 cells starting on a Monday', () => {
    const grid = getCalendarMonthGrid(new Date(2026, 8, 1)); // Sep 2026 starts on a Tuesday
    expect(grid).toHaveLength(42);
    expect(grid[0].date.getDay()).toBe(1); // Monday
    expect(grid[0].inCurrentMonth).toBe(false); // Mon 31 Aug, leading day
    expect(grid[1].inCurrentMonth).toBe(true); // Tue 1 Sep
  });

  it('flags range start/end and in-range membership', () => {
    const range = { from: new Date(2026, 8, 12, 0, 0, 0, 0), to: new Date(2026, 8, 15, 23, 59, 59, 999) };
    const grid = getCalendarMonthGrid(new Date(2026, 8, 1), range);

    const sep12 = grid.find((d) => d.date.getDate() === 12 && d.inCurrentMonth);
    const sep13 = grid.find((d) => d.date.getDate() === 13 && d.inCurrentMonth);
    const sep15 = grid.find((d) => d.date.getDate() === 15 && d.inCurrentMonth);
    const sep16 = grid.find((d) => d.date.getDate() === 16 && d.inCurrentMonth);

    expect(sep12).toMatchObject({ isRangeStart: true, isRangeEnd: false, isInRange: true });
    expect(sep13).toMatchObject({ isRangeStart: false, isRangeEnd: false, isInRange: true });
    expect(sep15).toMatchObject({ isRangeStart: false, isRangeEnd: true, isInRange: true });
    expect(sep16).toMatchObject({ isRangeStart: false, isRangeEnd: false, isInRange: false });
  });
});

describe('toLocalDateKey', () => {
  it('formats the local calendar day with zero padding', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
});

describe('a zone other than the device’s', () => {
  it('reads an instant by the zone’s own rules on either side of a daylight saving change', () => {
    expect(toZonedParts(new Date('2026-03-08T06:30:00Z'), 'America/New_York')).toEqual({
      year: 2026,
      month: 2,
      day: 8,
      hour: 1,
      minute: 30,
    });
    expect(toZonedParts(new Date('2026-03-08T07:30:00Z'), 'America/New_York')).toMatchObject({ day: 8, hour: 3 });
    expect(toZonedParts(new Date('2026-11-01T04:30:00Z'), 'America/New_York')).toMatchObject({ day: 1, hour: 0 });
    expect(toZonedParts(new Date('2026-11-02T04:30:00Z'), 'America/New_York')).toMatchObject({ day: 1, hour: 23 });
  });

  it('falls back to the device for a zone it does not know', () => {
    const date = new Date(2026, 8, 1, 7, 5);

    expect(toZonedParts(date, 'Nowhere/Unknown')).toEqual({ year: 2026, month: 8, day: 1, hour: 7, minute: 5 });
  });

  it('labels a range by the days its ends fall on in the zone, across a daylight saving change', () => {
    const march = { from: new Date('2026-03-01T05:00:00.000Z'), to: new Date('2026-04-01T03:59:59.999Z') };

    expect(formatRangeLabel(march, 'America/New_York')).toBe('1–31 Mar 2026');
    expect(formatRangeLabel(march)).toBe('28 Feb – 31 Mar 2026');
  });
});
