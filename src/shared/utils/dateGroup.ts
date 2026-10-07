import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { TransactionType } from '@shared/enums';
import { compareDays } from './compare';
import { toLocalDateKey } from './dateRange';
import { toCents } from './money';

export interface TransactionGroup {
  // The calendar day on the device, so two days never merge over an equal label.
  key: string;
  label: string;
  // Income minus expense of the whole day, initial balances left out.
  total: number;
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

export const groupTransactionsByDay = (transactions: TransactionModel[], now = new Date()): TransactionGroup[] => {
  const groups = new Map<string, { group: TransactionGroup; cents: number }>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.timestamp);
    const key = toLocalDateKey(date);
    let entry = groups.get(key);

    if (!entry) {
      entry = { group: { key, label: formatGroupLabel(date, now), total: 0, items: [] }, cents: 0 };
      groups.set(key, entry);
    }

    entry.group.items.push(transaction);
    if (!isInitialBalance(transaction)) {
      const sign = transaction.transactionType === TransactionType.EXPENSE ? -1 : 1;
      entry.cents += sign * toCents(transaction.amount);
    }
  });

  return [...groups.values()].map(({ group, cents }) => ({ ...group, total: cents / 100 }));
};

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
