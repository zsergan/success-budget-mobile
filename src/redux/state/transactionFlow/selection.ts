import type { AssignmentKey, TransactionModel } from '@api/models';
import { assignmentKeyOf } from '@api/models';
import type { TransactionType } from '@shared/enums';
import type { CalendarDateRange } from '@shared/utils/calendarDate';
import { isWithinDates, pickerRangeDates } from '@shared/utils/calendarDate';

// What the screen a transaction was opened or created from lists: its dates, and the filters it narrows them by.
export interface ViewSelection extends CalendarDateRange {
  transactionType?: TransactionType;
  categoryId?: number;
  assignment?: AssignmentKey;
  // Home follows a record saved outside its month by opening that month; any other screen shows it in History.
  origin?: 'home';
}

// `otherFilter`: in the period, but no longer of the type, category or assignment the list is narrowed to.
export type SavedPlace = 'shown' | 'otherPeriod' | 'otherFilter';

export const whereSaved = (
  transaction: Pick<TransactionModel, 'date' | 'transactionType' | 'category' | 'assignment'>,
  selection: ViewSelection | null,
): SavedPlace => {
  if (!selection) return 'shown';
  if (!isWithinDates(transaction.date, selection)) return 'otherPeriod';

  const { transactionType, categoryId, assignment } = selection;
  const isFiltered =
    (transactionType !== undefined && transaction.transactionType !== transactionType) ||
    (categoryId !== undefined && transaction.category.id !== categoryId) ||
    (assignment !== undefined && assignmentKeyOf(transaction.assignment) !== assignment);

  return isFiltered ? 'otherFilter' : 'shown';
};

export const rangeSelection = (range: { from: Date; to: Date }): ViewSelection => pickerRangeDates(range);
