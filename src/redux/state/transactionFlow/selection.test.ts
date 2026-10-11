import { mapTransaction } from '@api/models';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { TransactionKind, TransactionType } from '@shared/enums';
import { whereSaved } from './selection';

const january = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.999Z' };
const lunch = mapTransaction(transactionDto({ timestamp: '2026-01-05T10:00:00.000Z' }));

describe('whereSaved', () => {
  it('claims nothing without a selection', () => {
    expect(whereSaved(lunch, null)).toBe('shown');
  });

  it('tells a record outside the period, bounds included, from one inside it', () => {
    expect(whereSaved(lunch, january)).toBe('shown');
    expect(whereSaved({ ...lunch, timestamp: january.to }, january)).toBe('shown');
    expect(whereSaved({ ...lunch, timestamp: '2026-02-01T00:00:00.000Z' }, january)).toBe('otherPeriod');
  });

  it('says a filter hides a record of another type, category or wallet', () => {
    const filter = (extra: object) => ({
      ...january,
      filter: { name: 'Food', transactionType: TransactionType.EXPENSE, ...extra },
    });

    expect(whereSaved(lunch, filter({ categoryId: 1 }))).toBe('shown');
    expect(whereSaved(lunch, filter({ categoryId: 2 }))).toBe('filtered');
    expect(whereSaved(lunch, filter({ walletId: 2 }))).toBe('filtered');
    expect(whereSaved({ ...lunch, wallet: null }, filter({ walletId: 1 }))).toBe('filtered');
    expect(
      whereSaved(lunch, { ...filter({}), filter: { ...filter({}).filter, transactionType: TransactionType.INCOME } }),
    ).toBe('filtered');
  });

  it('says a filter of regular transactions hides a starting balance', () => {
    const regularOnly = {
      ...january,
      filter: { name: 'Cash', transactionType: TransactionType.EXPENSE, kind: TransactionKind.REGULAR, walletId: 1 },
    };

    expect(whereSaved(lunch, regularOnly)).toBe('shown');
    expect(whereSaved({ ...lunch, kind: TransactionKind.INITIAL_BALANCE }, regularOnly)).toBe('filtered');
  });

  it('puts the period first when both would hide the record', () => {
    expect(
      whereSaved(
        { ...lunch, timestamp: '2026-02-01T00:00:00.000Z' },
        { ...january, filter: { name: 'Taxi', transactionType: TransactionType.EXPENSE, categoryId: 2 } },
      ),
    ).toBe('otherPeriod');
  });
});
