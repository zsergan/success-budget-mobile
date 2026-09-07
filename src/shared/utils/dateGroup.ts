import type { TransactionModel } from '@api/models';
import { TransactionType } from '@shared/enums';
import { compareDays } from './compare';
import { formatDateDDMMYYYY } from './transform';

export interface TransactionGroup {
  label: string;
  total?: number;
  currencyCode?: string;
  items: TransactionModel[];
}

export const formatGroupLabel = (date: Date | string) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (compareDays(date, today)) return 'Today';
  if (compareDays(date, yesterday)) return 'Yesterday';

  return formatDateDDMMYYYY(date);
};

export const groupTransactionsByDay = (
  transactions: TransactionModel[],
  baseCurrencyCode?: string,
): TransactionGroup[] => {
  const groups: TransactionGroup[] = [];

  transactions.forEach((transaction) => {
    const label = formatGroupLabel(transaction.timestamp);
    const lastGroup = groups[groups.length - 1];
    const group = lastGroup?.label === label ? lastGroup : undefined;
    const signedAmount = transaction.transactionType === TransactionType.EXPENSE ? -1 : 1;
    const countsTowardTotal = transaction.currency.code === baseCurrencyCode;

    if (group) {
      if (countsTowardTotal) {
        group.total = (group.total || 0) + signedAmount * Number(transaction.amount);
      }

      group.items.push(transaction);
    } else {
      groups.push({
        label,
        total: countsTowardTotal ? signedAmount * Number(transaction.amount) : undefined,
        currencyCode: baseCurrencyCode,
        items: [transaction],
      });
    }
  });

  return groups;
};
