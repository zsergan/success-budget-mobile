import type { TransactionType } from '@shared/enums';
import type { Currency, Transaction, Wallet } from '@api/dto';

import type { CategoryModel } from './category';
import { mapCategory } from './category';

export interface TransactionModel {
  id: string;
  walletId: number;
  categoryId: number;
  transactionType: TransactionType;
  amount: string;
  timestamp: string;
  description: string;
  wallet: Wallet | null;
  category: CategoryModel;
  currency: Currency;
}

export const mapTransaction = (dto: Transaction): TransactionModel => ({
  id: dto.id,
  walletId: dto.wallet_id,
  categoryId: dto.category_id,
  transactionType: dto.transaction_type,
  amount: dto.amount,
  timestamp: dto.timestamp,
  description: dto.description,
  wallet: dto.wallet,
  category: mapCategory(dto.category),
  currency: dto.currency,
});
