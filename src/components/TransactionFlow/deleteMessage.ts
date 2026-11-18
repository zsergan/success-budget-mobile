import type { TransactionModel } from '@api/models';
import { assignmentLabel, formatAmount } from '@shared/utils';

// What a toast about this record's delete reports on, so a later outcome of it replaces or takes it away.
export const deleteSubject = (transactionId: string) => `transaction-delete:${transactionId}`;

// Names the saved record, so the user checks what goes, and what its removal changes.
export const deleteMessage = (
  { amount, transactionType, category, assignment }: TransactionModel,
  currencyCode: string | undefined,
  selfId: number | undefined,
) =>
  `${formatAmount(amount, transactionType, currencyCode)} · ${category.name} · ${assignmentLabel(assignment, selfId)}. ` +
  'It will be removed from History, and the period’s totals, stats and limits will update.';

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
