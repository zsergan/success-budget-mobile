import { pickDay, pickTime } from './pickDateTime';

const now = new Date(2026, 8, 17, 17, 59, 30);
const original = new Date(2026, 8, 10, 9, 30, 42, 123).toISOString();
const bounds = { now, original };

describe('pickDateTime', () => {
  it('moves the day and keeps the time', () => {
    const pending = new Date(2026, 8, 17, 9, 30).toISOString();

    expect(pickDay(pending, new Date(2025, 8, 29), bounds)).toBe(new Date(2025, 8, 29, 9, 30).toISOString());
  });

  it('moves the time and keeps the day', () => {
    const pending = new Date(2025, 8, 29, 9, 30).toISOString();

    expect(pickTime(pending, new Date(2026, 0, 1, 21, 5), bounds)).toBe(new Date(2025, 8, 29, 21, 5).toISOString());
  });

  it('keeps the seconds of the original date when its minute comes back', () => {
    const moved = pickDay(original, new Date(2026, 8, 11), bounds);

    expect(new Date(moved).getSeconds()).toBe(42);
    expect(pickDay(moved, new Date(2026, 8, 10), bounds)).toBe(original);
    expect(pickTime(pickTime(original, new Date(0, 0, 1, 10, 0), bounds), new Date(0, 0, 1, 9, 30), bounds)).toBe(
      original,
    );
  });

  it('never goes past now or before the first date the server stores', () => {
    const lateToday = new Date(2026, 8, 16, 23, 0).toISOString();

    expect(pickDay(lateToday, new Date(2026, 8, 17), bounds)).toBe(now.toISOString());
    expect(pickTime(new Date(2026, 8, 17, 9, 0).toISOString(), new Date(2026, 8, 17, 19, 0), bounds)).toBe(
      now.toISOString(),
    );
    expect(pickDay(original, new Date(1969, 11, 31), bounds)).toBe('1970-01-01T00:00:01.000Z');
  });
});
