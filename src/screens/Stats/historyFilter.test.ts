import type { CategoryBreakdownItem, OtherBreakdownItem, WalletBreakdownItem } from '@api/dto';
import { AppColor, TransactionType } from '@shared/enums';

import { toHistoryFilter } from './historyFilter';

const period = { from: '2026-08-31T21:00:00.000Z', actual_to: '2026-09-30T09:15:42.123Z' };

const category = { kind: 'category', key: 'category:12', id: 12, opens_history: true } as CategoryBreakdownItem;
const wallet = {
  kind: 'wallet',
  key: 'wallet:3',
  id: 3,
  color: AppColor.INDIGO,
  opens_history: true,
} as WalletBreakdownItem;

describe('toHistoryFilter', () => {
  it('passes the period bounds through as they came and always asks for expenses', () => {
    expect(toHistoryFilter(category, period)).toEqual({
      from: '2026-08-31T21:00:00.000Z',
      to: '2026-09-30T09:15:42.123Z',
      transactionType: TransactionType.EXPENSE,
      categoryId: 12,
    });
    expect(toHistoryFilter(wallet, period)).toMatchObject({ walletId: 3 });
  });

  it('opens nothing for Other or without a passed part of the period', () => {
    const other = { kind: 'other', key: 'other', opens_history: false } as OtherBreakdownItem<CategoryBreakdownItem>;

    expect(toHistoryFilter(other, period)).toBeNull();
    expect(toHistoryFilter(category, { ...period, actual_to: null })).toBeNull();
  });
});
