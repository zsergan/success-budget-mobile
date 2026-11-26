import type { TransactionModel } from '@api/models';
import type { CalendarDate } from './calendarDate';
import { deviceToday, formatRelativeDate } from './calendarDate';

export interface DayGroup {
  // The records' stored date, so two days never merge over an equal label.
  key: CalendarDate;
  label: string;
  items: TransactionModel[];
}

// A day header: "Today", "Yesterday", or "Sat, Aug 29" (with the year when it is not this one).
export const formatGroupLabel = (date: CalendarDate, now: CalendarDate = deviceToday()) =>
  formatRelativeDate(date, { now, withWeekday: true });

// Rows of one date stay together in list order, wherever a page boundary fell; the order is the server's.
export const groupRowsByDay = (
  transactions: TransactionModel[],
  { today = deviceToday() }: { today?: CalendarDate } = {},
): DayGroup[] => {
  const groups = new Map<CalendarDate, DayGroup>();

  transactions.forEach((transaction) => {
    const key = transaction.date;
    const group = groups.get(key);

    if (group) group.items.push(transaction);
    else groups.set(key, { key, label: formatGroupLabel(key, today), items: [transaction] });
  });

  return [...groups.values()];
};
