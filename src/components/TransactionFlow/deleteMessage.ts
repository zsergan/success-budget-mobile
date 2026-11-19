import type { TransactionModel } from '@api/models';
import { assignmentLabel, formatAmount } from '@shared/utils';
import { formatDateTime } from './format';

// What a toast about this record's delete reports on, so a later outcome of it replaces or takes it away.
export const deleteSubject = (transactionId: string) => `transaction-delete:${transactionId}`;

// The month whose figures a change of this record moves: "October", or "October 2025" outside this year.
export const totalsName = (timestamp: string, now = new Date()) => {
  const date = new Date(timestamp);

  return date.toLocaleString('en-US', {
    month: 'long',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
};

// What its removal changes; the record itself is named beside it, so the user checks what goes.
export const deleteMessage = ({ timestamp }: Pick<TransactionModel, 'timestamp'>) =>
  `It will be removed from History, and ${totalsName(timestamp)} totals, stats and limits will update. This can’t be undone.`;

export const deleteFacts = (
  { amount, transactionType, assignment, timestamp }: TransactionModel,
  currencyCode: string | undefined,
  selfId: number | undefined,
) =>
  `${formatAmount(amount, transactionType, currencyCode)} · ${assignmentLabel(assignment, selfId)} · ${formatDateTime(timestamp)}`;

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
