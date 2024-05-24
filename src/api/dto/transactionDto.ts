import type { TransactionType } from '@shared/enums';
import type { Category } from '@api/dto/categoryDto';
import type { Wallet } from '@api/dto/walletDto';

export interface Transaction {
  id: string;
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: Date;
  description: string;
  wallet: Wallet | null;
  category: Category;
}

export interface CreateTransactionRequest {
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: Date;
  description?: string;
}
