import type { TransactionModel } from '@api/models';
import { compareDays } from './compare';
import { toLocalDateKey } from './dateRange';

export interface DayGroup {
  // The calendar day on the device, so two days never merge over an equal label.
  key: string;
  label: string;
  items: TransactionModel[];
}

export const formatGroupLabel = (value: Date | string, now = new Date()) => {
  const date = new Date(value);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (compareDays(date, now)) return 'Today';
  if (compareDays(date, yesterday)) return 'Yesterday';

  return date.toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
};

// Rows of one day stay together in list order, wherever a page boundary fell.
export const groupRowsByDay = (transactions: TransactionModel[], now = new Date()): DayGroup[] => {
  const groups = new Map<string, DayGroup>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.timestamp);
    const key = toLocalDateKey(date);
    const group = groups.get(key);

    if (group) group.items.push(transaction);
    else groups.set(key, { key, label: formatGroupLabel(date, now), items: [transaction] });
  });

  return [...groups.values()];
};
