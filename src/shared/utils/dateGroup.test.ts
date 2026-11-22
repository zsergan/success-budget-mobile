import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { formatGroupLabel, formatRowDay, groupRowsByDay } from './dateGroup';

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
  author: { userId: 7, name: 'Zakhar', status: 'member', source: 'recorded' },
  assignment: { kind: 'member', person: { userId: 7, name: 'Zakhar', status: 'member' } },
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

describe('formatRowDay', () => {
  it('names today and yesterday, and otherwise gives the day without its weekday', () => {
    expect(formatRowDay(new Date(2026, 9, 6, 0, 5), NOW)).toBe('Today');
    expect(formatRowDay(new Date(2026, 9, 5, 23, 59), NOW)).toBe('Yesterday');
    expect(formatRowDay(new Date(2026, 7, 29), NOW)).toBe('Aug 29');
  });

  it('adds the year across a year boundary', () => {
    expect(formatRowDay(new Date(2025, 11, 31, 22), new Date(2026, 0, 2, 9))).toBe('Dec 31, 2025');
    expect(formatRowDay(new Date(2025, 11, 31, 22), new Date(2026, 0, 1, 9))).toBe('Yesterday');
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
      { now: NOW },
    );

    expect(groups.map(({ items }) => items.map(({ id }) => id))).toEqual([['a'], ['b', 'c']]);
    expect(groups.map(({ label }) => label)).toEqual(['Today', 'Mon, Oct 6, 2025']);
  });

  it('cuts the days in the given zone rather than on the device', () => {
    const rows = [
      row('late', new Date('2026-09-01T18:00:00Z'), TransactionType.EXPENSE, '10'),
      row('early', new Date('2026-09-01T04:30:00Z'), TransactionType.EXPENSE, '5'),
    ];
    const now = new Date('2026-09-02T03:00:00Z');

    expect(groupRowsByDay(rows, { now, timeZone: 'America/New_York' })).toEqual([
      { key: '2026-09-01', label: 'Today', items: rows },
    ]);
    expect(groupRowsByDay(rows, { now }).map(({ key, label }) => [key, label])).toEqual([
      ['2026-09-01', 'Today'],
      ['2026-08-31', 'Yesterday'],
    ]);
  });
});
