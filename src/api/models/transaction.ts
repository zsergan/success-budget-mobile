import type { TransactionType } from '@shared/enums';
import type { Transaction, Wallet } from '@api/dto';

import type { CategoryModel } from './category';
import { mapCategory } from './category';

export interface TransactionModel {
  id: string;
  transactionType: TransactionType;
  amount: string;
  timestamp: string;
  description: string | null;
  wallet: Wallet | null;
  category: CategoryModel;
}

export const mapTransaction = (dto: Transaction): TransactionModel => ({
  id: dto.id,
  transactionType: dto.transaction_type,
  amount: dto.amount,
  timestamp: dto.timestamp,
  description: dto.description,
  wallet: dto.wallet,
  category: mapCategory(dto.category),
});
