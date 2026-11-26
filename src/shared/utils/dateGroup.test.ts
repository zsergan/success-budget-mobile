import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { formatGroupLabel, groupRowsByDay } from './dateGroup';

const TODAY = '2026-10-06';

const row = (
  id: string,
  date: string,
  transactionType: TransactionType,
  amount: string,
  kind = TransactionKind.REGULAR,
): TransactionModel => ({
  id,
  kind,
  transactionType,
  amount,
  date,
  description: null,
  version: 1,
  author: { userId: 7, name: 'Zakhar', status: 'member', source: 'recorded' },
  assignment: { kind: 'member', person: { userId: 7, name: 'Zakhar', status: 'member' } },
  category: { id: 1, name: 'Food', transactionType, icon: 'grocery', color: AppColor.SLATE, isArchived: false },
});

describe('formatGroupLabel', () => {
  it('names today and yesterday', () => {
    expect(formatGroupLabel('2026-10-06', TODAY)).toBe('Today');
    expect(formatGroupLabel('2026-10-05', TODAY)).toBe('Yesterday');
  });

  it('gives a short date this year and adds the year for older days', () => {
    expect(formatGroupLabel('2026-08-29', TODAY)).toBe('Sat, Aug 29');
    expect(formatGroupLabel('2024-08-29', TODAY)).toBe('Thu, Aug 29, 2024');
  });

  it('names yesterday across a year boundary', () => {
    expect(formatGroupLabel('2025-12-31', '2026-01-01')).toBe('Yesterday');
    expect(formatGroupLabel('2025-12-31', '2026-01-02')).toBe('Wed, Dec 31, 2025');
  });
});

describe('groupRowsByDay', () => {
  it('groups by the stored date, not by the label, and keeps the server’s order', () => {
    const groups = groupRowsByDay(
      [
        row('a', '2026-10-06', TransactionType.EXPENSE, '10'),
        row('b', '2025-10-06', TransactionType.EXPENSE, '5'),
        row('c', '2025-10-06', TransactionType.INCOME, '1'),
      ],
      { today: TODAY },
    );

    expect(groups.map(({ items }) => items.map(({ id }) => id))).toEqual([['a'], ['b', 'c']]);
    expect(groups.map(({ key, label }) => [key, label])).toEqual([
      ['2026-10-06', 'Today'],
      ['2025-10-06', 'Mon, Oct 6, 2025'],
    ]);
  });

  it('keeps a date’s rows together across pages, in the order they came', () => {
    const rows = [
      row('newest', '2026-09-01', TransactionType.EXPENSE, '10'),
      row('older', '2026-09-01', TransactionType.EXPENSE, '5'),
      row('next-page', '2026-09-01', TransactionType.EXPENSE, '1'),
    ];

    expect(groupRowsByDay(rows, { today: '2026-09-02' })).toEqual([
      { key: '2026-09-01', label: 'Yesterday', items: rows },
    ]);
  });
});
