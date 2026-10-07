import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { groupTransactionsByDay } from '@shared/utils';
import { getPeriodTotals } from './selectors';

const row = (
  id: string,
  transactionType: TransactionType,
  amount: string,
  kind = TransactionKind.REGULAR,
): TransactionModel => ({
  id,
  kind,
  transactionType,
  amount,
  timestamp: '2026-01-05T10:00:00.000Z',
  description: null,
  version: 1,
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE },
  category: {
    id: 1,
    name: 'Food',
    transactionType,
    icon: 'grocery',
    color: AppColor.SLATE,
    isArchived: false,
  },
});

const rows = [
  row('salary', TransactionType.INCOME, '100.00'),
  row('start', TransactionType.INCOME, '500.00', TransactionKind.INITIAL_BALANCE),
  row('lunch', TransactionType.EXPENSE, '12.50'),
];

describe('initial balances in totals', () => {
  it('leaves them out of the period income', () => {
    expect(getPeriodTotals(rows)).toEqual({ income: 100, expense: 12.5 });
  });

  it('adds amounts in exact cents', () => {
    const cents = [row('a', TransactionType.EXPENSE, '0.10'), row('b', TransactionType.EXPENSE, '0.20')];

    expect(getPeriodTotals(cents).expense).toBe(0.3);
  });

  it('lists them in their day but leaves them out of its total', () => {
    const [day] = groupTransactionsByDay(rows);

    expect(day.items.map(({ id }) => id)).toEqual(['salary', 'start', 'lunch']);
    expect(day.total).toBe(87.5);
  });
});
