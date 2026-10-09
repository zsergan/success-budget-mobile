import type { TransactionModel } from '@api/models';
import type { TransactionType } from '@shared/enums';

// What the screen a transaction was created from lists or counts: its period, and the filter on top of it.
export interface ViewSelection {
  from: string;
  to: string;
  filter?: {
    // The filter's name, as the screen shows it.
    name: string;
    transactionType: TransactionType;
    categoryId?: number;
    walletId?: number;
  };
}

// `otherPeriod` wins over `filtered`: moving to the record's month is the first thing that makes it visible.
export type SavedPlace = 'shown' | 'otherPeriod' | 'filtered';

export const whereSaved = (
  {
    timestamp,
    transactionType,
    category,
    wallet,
  }: Pick<TransactionModel, 'timestamp' | 'transactionType' | 'category' | 'wallet'>,
  selection: ViewSelection | null,
): SavedPlace => {
  if (!selection) return 'shown';

  const time = Date.parse(timestamp);
  if (time < Date.parse(selection.from) || time > Date.parse(selection.to)) return 'otherPeriod';

  const { filter } = selection;
  if (!filter) return 'shown';

  const matches =
    filter.transactionType === transactionType &&
    (filter.categoryId === undefined || filter.categoryId === category.id) &&
    (filter.walletId === undefined || filter.walletId === wallet?.id);

  return matches ? 'shown' : 'filtered';
};

export const rangeSelection = ({ from, to }: { from: Date; to: Date }): ViewSelection => ({
  from: from.toISOString(),
  to: to.toISOString(),
});
