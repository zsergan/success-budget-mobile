import type { StatisticsBreakdown } from '@api/dto';
import { TransactionKind } from '@shared/enums';
import type { HistoryFilter } from '@shared/types';

import type { BreakdownGroup } from './statsItems';

// Only real categories and wallets open History; the bounds pass through untouched so its sum matches the row.
export const toHistoryFilter = (
  group: BreakdownGroup,
  { period, transaction_type: transactionType }: Pick<StatisticsBreakdown, 'period' | 'transaction_type'>,
  spaceId: number,
): HistoryFilter | null => {
  if (!group.opens_history || period.actual_to === null) return null;

  return {
    spaceId,
    name: group.name,
    from: period.from,
    to: period.actual_to,
    transactionType,
    kind: TransactionKind.REGULAR,
    ...(group.kind === 'category' ? { categoryId: group.id } : { walletId: group.id }),
  };
};
