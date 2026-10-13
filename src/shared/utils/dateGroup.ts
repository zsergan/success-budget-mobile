import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { TransactionType } from '@shared/enums';
import { compareDays } from './compare';
import { toLocalDateKey } from './dateRange';
import { toCents } from './money';

export interface DayGroup {
  // The calendar day on the device, so two days never merge over an equal label.
  key: string;
  label: string;
  items: TransactionModel[];
}

export interface TransactionGroup extends DayGroup {
  // Income minus expense of the whole day, initial balances left out.
  total: number;
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

const dayCents = (items: TransactionModel[]) =>
  items
    .filter((transaction) => !isInitialBalance(transaction))
    .reduce(
      (cents, { transactionType, amount }) =>
        cents + (transactionType === TransactionType.EXPENSE ? -1 : 1) * toCents(amount),
      0,
    );

export const groupTransactionsByDay = (transactions: TransactionModel[], now = new Date()): TransactionGroup[] =>
  groupRowsByDay(transactions, now).map((group) => ({ ...group, total: dayCents(group.items) / 100 }));

// The first `limit` rows of whole-day groups; a day cut short keeps the total of all its rows.
export const limitGroupRows = (groups: TransactionGroup[], limit: number): TransactionGroup[] => {
  const limited: TransactionGroup[] = [];
  let left = limit;

  for (const group of groups) {
    if (left <= 0) break;
    limited.push({ ...group, items: group.items.slice(0, left) });
    left -= group.items.length;
  }

  return limited;
};
