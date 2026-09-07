import {
  addMonths,
  daysInRange,
  formatRangeLabel,
  getCalendarMonthGrid,
  getCurrentMonthRange,
  getCurrentWeekRange,
  getCurrentYearRange,
  getMonthRange,
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
