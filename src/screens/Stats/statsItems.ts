import type {
  CategoryBreakdownItem,
  Money,
  DeletedWalletsBreakdownItem,
  OtherBreakdownItem,
  StatisticsBreakdown,
  WalletBreakdownItem,
} from '@api/dto';
import type { TransactionType } from '@shared/enums';

export type BreakdownMode = 'category' | 'wallet';

export type BreakdownGroup =
  | CategoryBreakdownItem
  | WalletBreakdownItem
  | DeletedWalletsBreakdownItem
  | OtherBreakdownItem<CategoryBreakdownItem | WalletBreakdownItem>;

export type BreakdownRowItem = {
  kind: 'row';
  key: string;
  group: BreakdownGroup;
  currency: string;
  isChild: boolean;
  isFirst: boolean;
  isLast: boolean;
};

export type StatsItem =
  | { kind: 'summary'; key: 'summary' }
  | { kind: 'trend'; key: 'trend' }
  | { kind: 'breakdownHeader'; key: 'breakdownHeader' }
  | { kind: 'breakdownStatus'; key: 'breakdownStatus' }
  | { kind: 'breakdownEmpty'; key: 'breakdownEmpty' }
  | {
      kind: 'donut';
      key: 'donut';
      type: TransactionType;
      groups: BreakdownGroup[];
      totalAmount: Money;
      sourceCount: number;
      currency: string;
    }
  | BreakdownRowItem;

const toGroups = (breakdown: StatisticsBreakdown, mode: BreakdownMode): BreakdownGroup[] => {
  if (mode === 'category') {
    const { primary_items, other } = breakdown.by_category;

    return other ? [...primary_items, other] : primary_items;
  }

  const { primary_items, deleted_wallets, other } = breakdown.by_wallet;

  return [...primary_items, ...(deleted_wallets ? [deleted_wallets] : []), ...(other ? [other] : [])];
};

// Every block is its own list item, and Other's children follow it as plain rows,
// so expanding Other only inserts items instead of growing a nested list.
export const buildStatsItems = ({
  breakdown,
  mode,
  isOtherExpanded,
}: {
  breakdown: StatisticsBreakdown | undefined;
  mode: BreakdownMode;
  isOtherExpanded: boolean;
}): StatsItem[] => {
  const hasSources = !!breakdown && breakdown.by_category.source_count > 0;
  const items: StatsItem[] = [
    { kind: 'summary', key: 'summary' },
    { kind: 'trend', key: 'trend' },
    { kind: 'breakdownHeader', key: 'breakdownHeader' },
  ];

  if (!breakdown) return [...items, { kind: 'breakdownStatus', key: 'breakdownStatus' }];
  if (!hasSources) return [...items, { kind: 'breakdownEmpty', key: 'breakdownEmpty' }];

  const { currency, transaction_type: type } = breakdown;
  const groups = toGroups(breakdown, mode);
  const { total_amount, source_count } = mode === 'category' ? breakdown.by_category : breakdown.by_wallet;

  const rows: Omit<BreakdownRowItem, 'isFirst' | 'isLast'>[] = [];
  groups.forEach((group) => {
    rows.push({ kind: 'row', key: `${type}:${mode}:${group.key}`, group, currency, isChild: false });

    if (group.kind === 'other' && isOtherExpanded) {
      group.children.forEach((child) =>
        rows.push({ kind: 'row', key: `${type}:${mode}:other:${child.key}`, group: child, currency, isChild: true }),
      );
    }
  });

  return [
    ...items,
    { kind: 'donut', key: 'donut', type, groups, totalAmount: total_amount, sourceCount: source_count, currency },
    ...rows.map((row, index) => ({ ...row, isFirst: index === 0, isLast: index === rows.length - 1 })),
  ];
};
