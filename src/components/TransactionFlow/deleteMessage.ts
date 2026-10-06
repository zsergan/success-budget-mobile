import type { TransactionModel } from '@api/models';
import { formatAmount } from '@shared/utils';

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
