import { getDailyPace, getDaysLeftInMonth, getLimitStatus } from './limitStatus';

describe('getLimitStatus', () => {
  it('is ok below 80%', () => {
    expect(getLimitStatus(60, 100)).toEqual({ level: 'ok', pctActual: 60, pctClamped: 60 });
  });

  it('is near at exactly 80%', () => {
    expect(getLimitStatus(80, 100)).toEqual({ level: 'near', pctActual: 80, pctClamped: 80 });
  });

  it('is near at exactly 100%, not over', () => {
    expect(getLimitStatus(100, 100)).toEqual({ level: 'near', pctActual: 100, pctClamped: 100 });
  });

  it('is over past 100%, clamping the bar width but not the reported percentage', () => {
    expect(getLimitStatus(148, 100)).toEqual({ level: 'over', pctActual: 148, pctClamped: 100 });
  });

  it('treats a zero amount as 0%, not a division-by-zero crash', () => {
    expect(getLimitStatus(50, 0)).toEqual({ level: 'ok', pctActual: 0, pctClamped: 0 });
  });
});

describe('getDaysLeftInMonth', () => {
  it('counts today itself, so the 1st of a 30-day month reports 30', () => {
    expect(getDaysLeftInMonth(new Date(2026, 3, 1))).toBe(30);
  });

  it('reports 1 on the last day of the month', () => {
    expect(getDaysLeftInMonth(new Date(2026, 3, 30))).toBe(1);
  });

  it('accounts for a leap-year February', () => {
    expect(getDaysLeftInMonth(new Date(2028, 1, 1))).toBe(29);
  });
});

describe('getDailyPace', () => {
  it('splits the remaining budget evenly across the remaining days', () => {
    expect(getDailyPace(50, 200, 10)).toBe(15);
  });

  it('goes negative once spending is already past the cap', () => {
    expect(getDailyPace(250, 200, 10)).toBe(-5);
  });

  it('falls back to the raw remainder when there are no days left', () => {
    expect(getDailyPace(180, 200, 0)).toBe(20);
  });
});
