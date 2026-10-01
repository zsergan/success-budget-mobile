import type { CategoryBreakdownItem, OtherBreakdownItem, WalletBreakdownItem } from '@api/dto';
import { AppColor, TransactionType } from '@shared/enums';

import { toHistoryFilter } from './historyFilter';

const period = { from: '2026-08-31T21:00:00.000Z', actual_to: '2026-09-30T09:15:42.123Z' };

const category = {
  kind: 'category',
  key: 'category:12',
  id: 12,
  name: 'Restaurants',
  opens_history: true,
} as CategoryBreakdownItem;
const wallet = {
  kind: 'wallet',
  key: 'wallet:3',
  id: 3,
  name: 'Cash',
  color: AppColor.INDIGO,
  opens_history: true,
} as WalletBreakdownItem;

describe('toHistoryFilter', () => {
  it('passes the space and the period bounds through as they came and always asks for expenses', () => {
    expect(toHistoryFilter(category, period, 7)).toEqual({
      spaceId: 7,
      name: 'Restaurants',
      from: '2026-08-31T21:00:00.000Z',
      to: '2026-09-30T09:15:42.123Z',
      transactionType: TransactionType.EXPENSE,
      categoryId: 12,
    });
    expect(toHistoryFilter(wallet, period, 7)).toMatchObject({ walletId: 3, name: 'Cash' });
  });

  it('opens nothing for Other or without a passed part of the period', () => {
    const other = { kind: 'other', key: 'other', opens_history: false } as OtherBreakdownItem<CategoryBreakdownItem>;

    expect(toHistoryFilter(other, period, 7)).toBeNull();
    expect(toHistoryFilter(category, { ...period, actual_to: null }, 7)).toBeNull();
  });
});
