import type { TransactionModel } from '@api/models';
import { formatAmount } from '@shared/utils';

// What a toast about this record's delete reports on, so a later outcome of it replaces or takes it away.
export const deleteSubject = (transactionId: string) => `transaction-delete:${transactionId}`;

// Names the saved record, so the user checks what goes; a deleted wallet has no balance left to adjust.
export const deleteMessage = (
  { amount, transactionType, category, wallet }: TransactionModel,
  currencyCode?: string,
) => {
  const summary = `${formatAmount(amount, transactionType, currencyCode)} · ${category.name} · ${wallet?.wallet_name ?? 'Deleted wallet'}.`;

  return wallet
    ? `${summary} The wallet balance will be adjusted.`
    : `${summary} It will be removed from history and period totals. No wallet balance will change.`;
};

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
