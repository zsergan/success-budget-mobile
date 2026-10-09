import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { formatGroupLabel, groupTransactionsByDay, limitGroupRows } from './dateGroup';

const NOW = new Date(2026, 9, 6, 15, 0);

const row = (
  id: string,
  timestamp: Date,
  transactionType: TransactionType,
  amount: string,
  kind = TransactionKind.REGULAR,
): TransactionModel => ({
  id,
  kind,
  transactionType,
  amount,
  timestamp: timestamp.toISOString(),
  description: null,
  version: 1,
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE },
  category: { id: 1, name: 'Food', transactionType, icon: 'grocery', color: AppColor.SLATE, isArchived: false },
});

describe('formatGroupLabel', () => {
  it('names today and yesterday', () => {
    expect(formatGroupLabel(new Date(2026, 9, 6, 0, 5), NOW)).toBe('Today');
    expect(formatGroupLabel(new Date(2026, 9, 5, 23, 59), NOW)).toBe('Yesterday');
  });

  it('gives a short date this year and adds the year for older days', () => {
    expect(formatGroupLabel(new Date(2026, 7, 29), NOW)).toBe('Sat, Aug 29');
    expect(formatGroupLabel(new Date(2024, 7, 29), NOW)).toBe('Thu, Aug 29, 2024');
  });
});

describe('groupTransactionsByDay', () => {
  it('groups by calendar day, not by the label, and keeps the list order', () => {
    const groups = groupTransactionsByDay(
      [
        row('a', new Date(2026, 9, 6, 12), TransactionType.EXPENSE, '10'),
        row('b', new Date(2025, 9, 6, 12), TransactionType.EXPENSE, '5'),
        row('c', new Date(2025, 9, 6, 9), TransactionType.INCOME, '1'),
      ],
      NOW,
    );

    expect(groups.map(({ items }) => items.map(({ id }) => id))).toEqual([['a'], ['b', 'c']]);
    expect(groups.map(({ label }) => label)).toEqual(['Today', 'Mon, Oct 6, 2025']);
  });

  it('nets income and expense in exact cents, leaving initial balances out', () => {
    const day = new Date(2026, 9, 6, 10);
    const [group] = groupTransactionsByDay(
      [
        row('a', day, TransactionType.INCOME, '0.10'),
        row('b', day, TransactionType.INCOME, '0.20'),
        row('c', day, TransactionType.INCOME, '500', TransactionKind.INITIAL_BALANCE),
      ],
      NOW,
    );

    expect(group.total).toBe(0.3);
  });

  it('gives a day of only an initial balance a zero total', () => {
    const [group] = groupTransactionsByDay(
      [row('a', NOW, TransactionType.INCOME, '500', TransactionKind.INITIAL_BALANCE)],
      NOW,
    );

    expect(group.total).toBe(0);
  });
});

describe('limitGroupRows', () => {
  it('keeps the whole-day total of a day it cuts short', () => {
    const today = new Date(2026, 9, 6, 10);
    const yesterday = new Date(2026, 9, 5, 10);
    const groups = groupTransactionsByDay(
      [
        row('a', today, TransactionType.EXPENSE, '10'),
        row('b', yesterday, TransactionType.EXPENSE, '1'),
        row('c', yesterday, TransactionType.EXPENSE, '2'),
        row('d', yesterday, TransactionType.EXPENSE, '4'),
      ],
      NOW,
    );

    const limited = limitGroupRows(groups, 2);

    expect(limited.map(({ items }) => items.map(({ id }) => id))).toEqual([['a'], ['b']]);
    expect(limited[1].total).toBe(-7);
  });
});
