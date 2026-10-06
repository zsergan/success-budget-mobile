import { pickDay, pickTime } from './pickDateTime';

const now = new Date(2026, 8, 17, 17, 59);

describe('pickDateTime', () => {
  it('moves the day and keeps the time', () => {
    const pending = new Date(2026, 8, 17, 9, 30).toISOString();

    expect(pickDay(pending, new Date(2025, 8, 29), now)).toBe(new Date(2025, 8, 29, 9, 30).toISOString());
  });

  it('moves the time and keeps the day', () => {
    const pending = new Date(2025, 8, 29, 9, 30).toISOString();

    expect(pickTime(pending, new Date(2026, 0, 1, 21, 5), now)).toBe(new Date(2025, 8, 29, 21, 5).toISOString());
  });

  it('never goes past now', () => {
    const lateToday = new Date(2026, 8, 16, 23, 0).toISOString();

    expect(pickDay(lateToday, new Date(2026, 8, 17), now)).toBe(now.toISOString());
    expect(pickTime(new Date(2026, 8, 17, 9, 0).toISOString(), new Date(2026, 8, 17, 19, 0), now)).toBe(
      now.toISOString(),
    );
  });
});
