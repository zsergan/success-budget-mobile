import type { AssignmentKey, TransactionModel } from '@api/models';
import { assignmentKeyOf } from '@api/models';
import type { TransactionType } from '@shared/enums';

// What the screen a transaction was opened or created from lists: its period, and the filters it narrows that by.
export interface ViewSelection {
  from: string;
  to: string;
  transactionType?: TransactionType;
  categoryId?: number;
  assignment?: AssignmentKey;
}

// `otherFilter`: in the period, but no longer of the type, category or assignment the list is narrowed to.
export type SavedPlace = 'shown' | 'otherPeriod' | 'otherFilter';

export const whereSaved = (
  transaction: Pick<TransactionModel, 'timestamp' | 'transactionType' | 'category' | 'assignment'>,
  selection: ViewSelection | null,
): SavedPlace => {
  if (!selection) return 'shown';

  const time = Date.parse(transaction.timestamp);
  if (time < Date.parse(selection.from) || time > Date.parse(selection.to)) return 'otherPeriod';

  const { transactionType, categoryId, assignment } = selection;
  const isFiltered =
    (transactionType !== undefined && transaction.transactionType !== transactionType) ||
    (categoryId !== undefined && transaction.category.id !== categoryId) ||
    (assignment !== undefined && assignmentKeyOf(transaction.assignment) !== assignment);

  return isFiltered ? 'otherFilter' : 'shown';
};

export const rangeSelection = ({ from, to }: { from: Date; to: Date }): ViewSelection => ({
  from: from.toISOString(),
  to: to.toISOString(),
});
