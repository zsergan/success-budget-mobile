import type { TransactionModel } from '@api/models';

// The period the screen a transaction was created from lists or counts.
export interface ViewSelection {
  from: string;
  to: string;
}

export type SavedPlace = 'shown' | 'otherPeriod';

export const whereSaved = (
  { timestamp }: Pick<TransactionModel, 'timestamp'>,
  selection: ViewSelection | null,
): SavedPlace => {
  if (!selection) return 'shown';

  const time = Date.parse(timestamp);

  return time < Date.parse(selection.from) || time > Date.parse(selection.to) ? 'otherPeriod' : 'shown';
};

export const rangeSelection = ({ from, to }: { from: Date; to: Date }): ViewSelection => ({
  from: from.toISOString(),
  to: to.toISOString(),
});
