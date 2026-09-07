import type { TransactionType } from '@shared/enums';
import type { Category } from './categoryDto';
import type { Wallet } from './walletDto';
import type { Currency } from './currencyDto';

export interface Transaction {
  id: string;
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description: string;
  wallet: Wallet | null;
  category: Category;
  currency: Currency;
}

export interface CreateTransactionRequest {
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: Date;
  description?: string;
}
