import type {
  CategoryBreakdownItem,
  DeletedWalletsBreakdownItem,
  OtherBreakdownItem,
  StatisticsBreakdown,
  WalletBreakdownItem,
} from '@api/dto';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';

import { toHistoryFilter } from './historyFilter';

const breakdown = (transactionType: TransactionType, actualTo: string | null = '2026-09-30T09:15:42.123Z') =>
  ({
    transaction_type: transactionType,
    period: { from: '2026-08-31T21:00:00.000Z', actual_to: actualTo },
  }) as Pick<StatisticsBreakdown, 'period' | 'transaction_type'>;

const expense = breakdown(TransactionType.EXPENSE);
const income = breakdown(TransactionType.INCOME);

const category = (id: number, name: string, isArchived = false) =>
  ({
    kind: 'category',
    key: `category:${id}`,
    id,
    name,
    is_archived: isArchived,
    opens_history: true,
  }) as CategoryBreakdownItem;
const wallet = {
  kind: 'wallet',
  key: 'wallet:3',
  id: 3,
  name: 'Cash',
  color: AppColor.INDIGO,
  opens_history: true,
} as WalletBreakdownItem;

describe('toHistoryFilter', () => {
  it('passes the space and the period bounds through as they came, with regular transactions only', () => {
    expect(toHistoryFilter(category(12, 'Restaurants'), expense, 7)).toEqual({
      spaceId: 7,
      name: 'Restaurants',
      from: '2026-08-31T21:00:00.000Z',
      to: '2026-09-30T09:15:42.123Z',
      transactionType: TransactionType.EXPENSE,
      kind: TransactionKind.REGULAR,
      categoryId: 12,
    });
  });

  it('takes the type from the breakdown it was shown in', () => {
    expect(toHistoryFilter(wallet, income, 7)).toEqual({
      spaceId: 7,
      name: 'Cash',
      from: '2026-08-31T21:00:00.000Z',
      to: '2026-09-30T09:15:42.123Z',
      transactionType: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      walletId: 3,
    });
    expect(toHistoryFilter(category(20, 'Salary'), income, 7)).toMatchObject({
      transactionType: TransactionType.INCOME,
      categoryId: 20,
    });
  });

  it('opens real groups, archived ones and a category named Other included, but no service group', () => {
    const otherGroup = {
      kind: 'other',
      key: 'other',
      opens_history: false,
      children: [category(31, 'Gifts')],
    } as OtherBreakdownItem<CategoryBreakdownItem>;
    const deletedWallets = {
      kind: 'deleted_wallets',
      key: 'deleted_wallets',
      opens_history: false,
    } as DeletedWalletsBreakdownItem;

    expect(toHistoryFilter(otherGroup, expense, 7)).toBeNull();
    expect(toHistoryFilter(deletedWallets, expense, 7)).toBeNull();
    expect(toHistoryFilter(otherGroup.children[0], expense, 7)).toMatchObject({ categoryId: 31 });
    expect(toHistoryFilter(category(40, 'Other'), expense, 7)).toMatchObject({ name: 'Other', categoryId: 40 });
    expect(toHistoryFilter(category(41, 'Old hobby', true), expense, 7)).toMatchObject({ categoryId: 41 });
  });

  it('opens nothing without a passed part of the period', () => {
    expect(toHistoryFilter(category(12, 'Restaurants'), breakdown(TransactionType.EXPENSE, null), 7)).toBeNull();
  });
});
