import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { formatGroupLabel, groupRowsByDay } from './dateGroup';

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

describe('groupRowsByDay', () => {
  it('groups by calendar day, not by the label, and keeps the list order', () => {
    const groups = groupRowsByDay(
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
});
