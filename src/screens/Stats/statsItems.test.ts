import type { CategoryBreakdownItem, StatisticsBreakdown, WalletBreakdownItem } from '@api/dto';
import { AppColor } from '@shared/enums';
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

const wallet = (id: number): WalletBreakdownItem => ({
  kind: 'wallet',
  key: `wallet:${id}`,
  id,
  name: `Wallet ${id}`,
  icon: null,
  color: AppColor.INDIGO,
  is_archived: false,
  opens_history: true,
  amount: '10.00',
  percent: 10,
});

const service = { id: null, name: null, icon: null, color: null, is_archived: false, opens_history: false } as const;

const breakdown = (sourceCount = 8): StatisticsBreakdown =>
  ({
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
    by_wallet: {
      total_amount: '80.00',
      source_count: sourceCount,
      primary_items: [wallet(1)],
      deleted_wallets: {
        ...service,
        kind: 'deleted_wallets',
        key: 'deleted_wallets',
        amount: '5.00',
        percent: 5,
        wallets_count: 2,
      },
      other: { ...service, kind: 'other', key: 'other', amount: '5.00', percent: 5, children: [wallet(2)] },
    },
  }) as StatisticsBreakdown;

const keys = (items: ReturnType<typeof buildStatsItems>) => items.map((item) => item.key);

describe('buildStatsItems', () => {
  it('lays out the blocks, then the donut and one row per group', () => {
    expect(keys(buildStatsItems({ breakdown: breakdown(), mode: 'category', isOtherExpanded: false }))).toEqual([
      'summary',
      'trend',
      'breakdownHeader',
      'donut',
      'category:category:1',
      'category:category:2',
      'category:other',
    ]);
  });

  it('inserts the expanded children right after Other and closes the card on the last one', () => {
    const items = buildStatsItems({ breakdown: breakdown(), mode: 'category', isOtherExpanded: true });
    const rows = items.filter((item) => item.kind === 'row');

    expect(rows.map((row) => [row.key, row.isChild])).toEqual([
      ['category:category:1', false],
      ['category:category:2', false],
      ['category:other', false],
      ['category:other:category:3', true],
      ['category:other:category:4', true],
    ]);
    expect(rows.map((row) => row.isFirst)).toEqual([true, false, false, false, false]);
    expect(rows.map((row) => row.isLast)).toEqual([false, false, false, false, true]);
  });

  it('puts deleted wallets before Other in the wallet breakdown', () => {
    const items = buildStatsItems({ breakdown: breakdown(), mode: 'wallet', isOtherExpanded: false });

    expect(keys(items).slice(4)).toEqual(['wallet:wallet:1', 'wallet:deleted_wallets', 'wallet:other']);
  });

  it('shows the no-spending message by count, without the mode switch', () => {
    const items = buildStatsItems({ breakdown: breakdown(0), mode: 'category', isOtherExpanded: false });

    expect(items.slice(2)).toEqual([
      { kind: 'breakdownHeader', key: 'breakdownHeader', hasSpending: false },
      { kind: 'breakdownEmpty', key: 'breakdownEmpty' },
    ]);
  });

  it('holds the breakdown place while it has no data', () => {
    expect(keys(buildStatsItems({ breakdown: undefined, mode: 'category', isOtherExpanded: false }))).toEqual([
      'summary',
      'trend',
      'breakdownHeader',
      'breakdownStatus',
    ]);
  });
});
