import { MIN_TIMESTAMP } from '@redux/state/transactionFlow/draft';

export interface PickBounds {
  now: Date;
  // The record's own date: a pick on its minute keeps its seconds and milliseconds.
  original: string;
}

const MINUTE_MS = 60_000;

// Between the server's first instant and now: a transaction cannot be in the future.
const withinBounds = (date: Date, { now, original }: PickBounds) => {
  const min = Date.parse(MIN_TIMESTAMP);
  const clamped = Math.min(Math.max(date.getTime(), min), now.getTime());
  const originalTime = Date.parse(original);

  return Math.floor(clamped / MINUTE_MS) === Math.floor(originalTime / MINUTE_MS) && originalTime <= now.getTime()
    ? original
    : new Date(clamped).toISOString();
};

// A day keeps the time already picked.
export const pickDay = (pending: string, day: Date, bounds: PickBounds) => {
  const next = new Date(pending);
  next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());

  return withinBounds(next, bounds);
};

// A time keeps the day already picked.
export const pickTime = (pending: string, time: Date, bounds: PickBounds) => {
  const next = new Date(pending);
  next.setHours(time.getHours(), time.getMinutes(), 0, 0);

  return withinBounds(next, bounds);
};
