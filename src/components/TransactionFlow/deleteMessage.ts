import type { TransactionModel } from '@api/models';
import type { CalendarDate } from '@shared/utils';
import { assignmentLabel, calendarYear, deviceToday, formatAmount, formatCalendarDate } from '@shared/utils';
import { formatTransactionDate } from './format';

// What a toast about this record's delete reports on, so a later outcome of it replaces or takes it away.
export const deleteSubject = (transactionId: string) => `transaction-delete:${transactionId}`;

// The month whose figures a change of this record moves: "October", or "October 2025" outside this year.
export const totalsName = (date: CalendarDate, today: CalendarDate = deviceToday()) =>
  formatCalendarDate(date, {
    month: 'long',
    ...(calendarYear(date) !== calendarYear(today) && { year: 'numeric' }),
  });

// What its removal changes; the record itself is named beside it, so the user checks what goes.
export const deleteMessage = ({ date }: Pick<TransactionModel, 'date'>) =>
  `It will be removed from History, and ${totalsName(date)} totals, stats and limits will update. This can’t be undone.`;

export const deleteFacts = (
  { amount, transactionType, assignment, date }: TransactionModel,
  currencyCode: string | undefined,
  selfId: number | undefined,
) =>
  `${formatAmount(amount, transactionType, currencyCode)} · ${assignmentLabel(assignment, selfId)} · ${formatTransactionDate(date)}`;

// Without an answer the delete may have applied, so the text claims neither outcome; checking asks about that same
// delete, which never applies twice.
export const deleteFailureText = (notice: 'deleteFailed' | 'deleteUncertain', action: 'delete' | 'undo') => {
  const verb = action === 'undo' ? 'undo' : 'delete';

  return notice === 'deleteUncertain'
    ? `Couldn’t confirm the ${verb}. It may already have gone through; checking its status never applies it twice.`
    : `Couldn’t ${verb}. The transaction is still saved.`;
};

export const deleteFailureAction = (notice: 'deleteFailed' | 'deleteUncertain') =>
  notice === 'deleteUncertain' ? 'Check status' : 'Try again';
