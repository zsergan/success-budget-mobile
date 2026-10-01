import type { StatisticsPeriod } from '@api/dto';
import { TransactionType } from '@shared/enums';
import type { HistoryFilter } from '@shared/types';

import type { BreakdownGroup } from './statsItems';

// Only real categories and wallets open History; the bounds pass through untouched so its sum matches the row.
export const toHistoryFilter = (
  group: BreakdownGroup,
  period: Pick<StatisticsPeriod, 'from' | 'actual_to'>,
): HistoryFilter | null => {
  if (!group.opens_history || period.actual_to === null) return null;

  return {
    from: period.from,
    to: period.actual_to,
    transactionType: TransactionType.EXPENSE,
    ...(group.kind === 'category' ? { categoryId: group.id } : { walletId: group.id }),
  };
};
