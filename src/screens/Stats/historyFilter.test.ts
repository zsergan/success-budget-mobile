import type {
  AssignmentBreakdownItem,
  AssignmentOtherItem,
  CategoryBreakdownItem,
  OtherBreakdownItem,
  StatisticsBreakdown,
} from '@api/dto';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';

import { toHistoryFilter } from './historyFilter';

const breakdown = (transactionType: TransactionType, actualEndDate: string | null = '2026-09-28') =>
  ({
    transaction_type: transactionType,
    period: { start_date: '2026-09-01', end_date: '2026-09-30', actual_end_date: actualEndDate },
  }) as Pick<StatisticsBreakdown, 'period' | 'transaction_type'>;

const expense = breakdown(TransactionType.EXPENSE);
const income = breakdown(TransactionType.INCOME);

const category = (id: number, name: string, isArchived = false) =>
  ({
    kind: 'category',
    key: `category:${id}`,
    id,
    name,
    icon: 'Home goods',
    color: AppColor.EVERGREEN,
    is_archived: isArchived,
    opens_history: true,
  }) as CategoryBreakdownItem;
const assignee = (overrides: Partial<AssignmentBreakdownItem>) =>
  ({
    kind: 'member',
    key: 'member:31',
    user_id: 31,
    name: 'Lena',
    status: 'member',
    opens_history: true,
    ...overrides,
  }) as AssignmentBreakdownItem;
const lena = assignee({});

describe('toHistoryFilter', () => {
  it('passes the space and the period’s counted dates through as they came, with regular transactions only', () => {
    expect(toHistoryFilter(category(12, 'Restaurants'), expense, 7, 1)).toEqual({
      spaceId: 7,
      name: 'Restaurants',
      icon: 'home-goods',
      color: AppColor.EVERGREEN,
      fromDate: '2026-09-01',
      toDate: '2026-09-28',
      transactionType: TransactionType.EXPENSE,
      kind: TransactionKind.REGULAR,
      categoryId: 12,
    });
  });

  it('takes the type from the breakdown it was shown in', () => {
    expect(toHistoryFilter(lena, income, 7, 1)).toEqual({
      spaceId: 7,
      name: 'Lena',
      fromDate: '2026-09-01',
      toDate: '2026-09-28',
      transactionType: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      assignment: 'member:31',
    });
    expect(toHistoryFilter(category(20, 'Salary'), income, 7, 1)).toMatchObject({
      transactionType: TransactionType.INCOME,
      categoryId: 20,
    });
  });

  it('opens every assignment group by its key, named as the list shows it', () => {
    const none = { user_id: null, name: null, status: null } as const;

    expect(toHistoryFilter(assignee({ user_id: 1, key: 'member:1' }), expense, 7, 1)).toMatchObject({
      name: 'You',
      assignment: 'member:1',
    });
    expect(toHistoryFilter(assignee({ status: 'former_member' }), expense, 7, 1)).toMatchObject({
      name: 'Lena · Former member',
      assignment: 'member:31',
    });
    expect(toHistoryFilter(assignee({ ...none, kind: 'space', key: 'space' }), expense, 7, 1)).toMatchObject({
      name: 'Whole space',
      assignment: 'space',
    });
    expect(toHistoryFilter(assignee({ ...none, kind: 'unassigned', key: 'unassigned' }), expense, 7, 1)).toMatchObject({
      name: 'No member assigned',
      assignment: 'unassigned',
    });
    expect(
      toHistoryFilter(assignee({ ...none, kind: 'deleted_member', key: 'deleted_member' }), expense, 7, 1),
    ).toMatchObject({ name: 'Deleted member', assignment: 'deleted_member' });
  });

  it('opens real groups, archived ones and a category named Other included, but not Other itself', () => {
    const otherGroup = {
      kind: 'other',
      key: 'other',
      opens_history: false,
      children: [category(31, 'Gifts')],
    } as OtherBreakdownItem<CategoryBreakdownItem>;
    const otherAssignees = {
      kind: 'other',
      key: 'other',
      opens_history: false,
      children: [lena],
    } as AssignmentOtherItem;

    expect(toHistoryFilter(otherGroup, expense, 7, 1)).toBeNull();
    expect(toHistoryFilter(otherAssignees, expense, 7, 1)).toBeNull();
    expect(toHistoryFilter(otherAssignees.children[0], expense, 7, 1)).toMatchObject({ assignment: 'member:31' });
    expect(toHistoryFilter(otherGroup.children[0], expense, 7, 1)).toMatchObject({ categoryId: 31 });
    expect(toHistoryFilter(category(40, 'Other'), expense, 7, 1)).toMatchObject({ name: 'Other', categoryId: 40 });
    expect(toHistoryFilter(category(41, 'Old hobby', true), expense, 7, 1)).toMatchObject({ categoryId: 41 });
  });

  it('opens nothing without a passed part of the period', () => {
    expect(toHistoryFilter(category(12, 'Restaurants'), breakdown(TransactionType.EXPENSE, null), 7, 1)).toBeNull();
  });
});
