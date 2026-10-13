import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { TransactionFeedPage } from './api';
import { getFeedView, getPeriodTotals } from './selectors';

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
});

describe('getFeedView', () => {
  const page = (
    sequence: number,
    items: TransactionModel[],
    overrides: Partial<TransactionFeedPage> = {},
  ): TransactionFeedPage => ({
    items,
    nextCursor: null,
    previousCursor: null,
    summary: { count: items.length, income: '0.00', expense: '0.00' },
    dayTotals: [],
    sequence,
    ...overrides,
  });
  const ids = (items: TransactionModel[]) => items.map(({ id, amount }) => `${id}:${amount}`);

  it('lists the pages in order', () => {
    const view = getFeedView([
      page(1, [row('a', TransactionType.EXPENSE, '1.00')]),
      page(2, [row('b', TransactionType.EXPENSE, '2.00')]),
    ]);

    expect(ids(view.items)).toEqual(['a:1.00', 'b:2.00']);
  });

  it('shows a record returned on two pages once, as and where the newest response has it', () => {
    const view = getFeedView([
      page(3, [row('a', TransactionType.EXPENSE, '1.00'), row('b', TransactionType.EXPENSE, '9.00')]),
      page(1, [row('b', TransactionType.EXPENSE, '2.00'), row('c', TransactionType.EXPENSE, '3.00')]),
    ]);

    expect(ids(view.items)).toEqual(['a:1.00', 'b:9.00', 'c:3.00']);
  });

  it("takes the summary and each day's net from the newest response that has them", () => {
    const view = getFeedView([
      page(2, [], {
        summary: { count: 74, income: '2500.00', expense: '1196.75' },
        dayTotals: [{ date: '2026-10-03', net: '-43.80' }],
      }),
      page(1, [], {
        summary: { count: 73, income: '2500.00', expense: '1184.45' },
        dayTotals: [
          { date: '2026-10-03', net: '-31.50' },
          { date: '2026-10-01', net: '0.00' },
        ],
      }),
    ]);

    expect(view.summary).toEqual({ count: 74, income: '2500.00', expense: '1196.75' });
    expect(view.dayNets).toEqual({ '2026-10-03': '-43.80', '2026-10-01': '0.00' });
  });

  it('has no summary before a page arrives', () => {
    expect(getFeedView([])).toEqual({ items: [], summary: null, dayNets: {} });
  });

  it('keeps the totals and the nets of the days still listed after older pages are dropped', () => {
    const view = getFeedView([
      page(12, [row('k', TransactionType.EXPENSE, '1.00')], {
        summary: { count: 900, income: '2500.00', expense: '1184.45' },
        dayTotals: [{ date: '2026-10-03', net: '-31.50' }],
      }),
    ]);

    expect(view.summary).toEqual({ count: 900, income: '2500.00', expense: '1184.45' });
    expect(view.dayNets).toEqual({ '2026-10-03': '-31.50' });
  });
});
