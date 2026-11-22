import type { TransactionModel } from '@api/models';
import { compareDays } from './compare';
import { toLocalDateKey, toZonedDay } from './dateRange';

export interface DayGroup {
  // The calendar day, on the device or in the given zone, so two days never merge over an equal label.
  key: string;
  label: string;
  items: TransactionModel[];
}

const formatDay = (value: Date | string, now: Date, withWeekday: boolean) => {
  const date = new Date(value);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (compareDays(date, now)) return 'Today';
  if (compareDays(date, yesterday)) return 'Yesterday';

  return date.toLocaleString('en-US', {
    ...(withWeekday && { weekday: 'short' }),
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
};

export const formatGroupLabel = (value: Date | string, now = new Date()) => formatDay(value, now, true);

// A row's own day where no day header names it: "Today", "Yesterday", "Aug 29", or "Aug 29, 2024" in another year.
export const formatRowDay = (value: Date | string, now = new Date()) => formatDay(value, now, false);

// Rows of one day stay together in list order, wherever a page boundary fell.
// Days are the device's unless a zone is given, e.g. the one the server summed its day totals in.
export const groupRowsByDay = (
  transactions: TransactionModel[],
  { now = new Date(), timeZone }: { now?: Date; timeZone?: string } = {},
): DayGroup[] => {
  const groups = new Map<string, DayGroup>();
  const today = toZonedDay(now, timeZone);

  transactions.forEach((transaction) => {
    const date = toZonedDay(new Date(transaction.timestamp), timeZone);
    const key = toLocalDateKey(date);
    const group = groups.get(key);

    if (group) group.items.push(transaction);
    else groups.set(key, { key, label: formatGroupLabel(date, today), items: [transaction] });
  });

  return [...groups.values()];
};
