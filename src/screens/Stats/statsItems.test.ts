import type { AssignmentBreakdownItem, CategoryBreakdownItem, StatisticsBreakdown, StatisticsSummary } from '@api/dto';
import { AppColor, TransactionType } from '@shared/enums';
import { buildStatsItems } from './statsItems';

const category = (id: number): CategoryBreakdownItem => ({
  kind: 'category',
  key: `category:${id}`,
  id,
  name: `Category ${id}`,
  icon: 'Grocery',
  color: AppColor.SLATE,
  is_archived: false,
  opens_history: true,
  amount: '10.00',
  percent: 10,
});

const member = (id: number): AssignmentBreakdownItem => ({
  kind: 'member',
  key: `member:${id}`,
  user_id: id,
  name: `Member ${id}`,
  status: 'member',
  opens_history: true,
  amount: '10.00',
  percent: 10,
});

const special = (kind: 'space' | 'unassigned'): AssignmentBreakdownItem => ({
  kind,
  key: kind,
  user_id: null,
  name: null,
  status: null,
  opens_history: true,
  amount: '5.00',
  percent: 5,
});

const service = { id: null, name: null, icon: null, color: null, is_archived: false, opens_history: false } as const;

const breakdown = (sourceCount = 8, type = TransactionType.EXPENSE): StatisticsBreakdown =>
  ({
    transaction_type: type,
    total: { amount: '80.00', count: sourceCount },
    by_category: {
      total_amount: '80.00',
      source_count: sourceCount,
      primary_items: [category(1), category(2)],
      other: {
        ...service,
        kind: 'other',
        key: 'other',
        amount: '20.00',
        percent: 20,
        children: [category(3), category(4)],
      },
    },
    by_assignment: {
      total_amount: '80.00',
      source_count: sourceCount,
      primary_items: [member(1), special('space'), special('unassigned')],
      other: { kind: 'other', key: 'other', opens_history: false, amount: '5.00', percent: 5, children: [member(2)] },
    },
  }) as StatisticsBreakdown;

const keys = (items: ReturnType<typeof buildStatsItems>) => items.map((item) => item.key);

describe('buildStatsItems', () => {
  it('lays out the blocks, then the donut and one row per group', () => {
    expect(
      keys(
        buildStatsItems({ breakdown: breakdown(), cycleSummary: undefined, mode: 'category', isOtherExpanded: false }),
      ),
    ).toEqual([
      'summary',
      'trend',
      'breakdownHeader',
      'donut',
      'expense:category:category:1',
      'expense:category:category:2',
      'expense:category:other',
    ]);
  });

  it('inserts the expanded children right after Other and closes the card on the last one', () => {
    const items = buildStatsItems({
      breakdown: breakdown(),
      cycleSummary: undefined,
      mode: 'category',
      isOtherExpanded: true,
    });
    const rows = items.filter((item) => item.kind === 'row');

    expect(rows.map((row) => [row.key, row.isChild])).toEqual([
      ['expense:category:category:1', false],
      ['expense:category:category:2', false],
      ['expense:category:other', false],
      ['expense:category:other:category:3', true],
      ['expense:category:other:category:4', true],
    ]);
    expect(rows.map((row) => row.isFirst)).toEqual([true, false, false, false, false]);
    expect(rows.map((row) => row.isLast)).toEqual([false, false, false, false, true]);
  });

  it('keeps the whole space and nobody as their own rows, before Other, in the assignment breakdown', () => {
    const items = buildStatsItems({
      breakdown: breakdown(),
      cycleSummary: undefined,
      mode: 'assignment',
      isOtherExpanded: true,
    });

    expect(keys(items).slice(4)).toEqual([
      'expense:assignment:member:1',
      'expense:assignment:space',
      'expense:assignment:unassigned',
      'expense:assignment:other',
      'expense:assignment:other:member:2',
    ]);
  });

  it('keys the rows and the donut data by the breakdown type', () => {
    const items = buildStatsItems({
      breakdown: breakdown(8, TransactionType.INCOME),
      cycleSummary: undefined,
      mode: 'category',
      isOtherExpanded: false,
    });

    expect(items.find((item) => item.kind === 'donut')).toMatchObject({ type: TransactionType.INCOME });
    expect(keys(items).slice(4)).toEqual([
      'income:category:category:1',
      'income:category:category:2',
      'income:category:other',
    ]);
  });

  it('shows the empty message by count, with no donut, telling no data from a zero total', () => {
    const empty = (breakdownData: StatisticsBreakdown, summary?: Partial<StatisticsSummary>) =>
      buildStatsItems({
        breakdown: breakdownData,
        cycleSummary: summary as StatisticsSummary | undefined,
        mode: 'category',
        isOtherExpanded: false,
      }).slice(3);

    expect(empty(breakdown(0))).toEqual([
      {
        kind: 'breakdownEmpty',
        key: 'breakdownEmpty',
        type: TransactionType.EXPENSE,
        isZeroTotal: false,
        canSwitch: false,
      },
    ]);
    expect(
      empty({ ...breakdown(0), total: { amount: '0.00', count: 2 } }, { income: { amount: '17.00', count: 1 } }),
    ).toMatchObject([{ isZeroTotal: true, canSwitch: true }]);
    expect(
      empty(breakdown(0, TransactionType.INCOME), {
        income: { amount: '0.00', count: 0 },
        expense: { amount: '0.00', count: 3 },
      }),
    ).toMatchObject([{ type: TransactionType.INCOME, canSwitch: false }]);
  });

  it('holds the breakdown place while it has no data', () => {
    expect(
      keys(
        buildStatsItems({ breakdown: undefined, cycleSummary: undefined, mode: 'category', isOtherExpanded: false }),
      ),
    ).toEqual(['summary', 'trend', 'breakdownHeader', 'breakdownStatus']);
  });
});
