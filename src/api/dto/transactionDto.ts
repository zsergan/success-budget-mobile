import type { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { CategoryIconApi } from './categoryDto';
import type { Wallet } from './walletDto';

export interface TransactionWallet extends Wallet {
  created_at: string;
  updated_at: string;
}

// Not the Categories API item: transaction_count, limit and sort are absent.
export interface TransactionCategory {
  id: number;
  name: string;
  transaction_type: TransactionType;
  icon: CategoryIconApi | string;
  color: AppColor;
  is_active: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// One shape for the list, latest, details and every write result; `wallet_id`/`category_id` are not in it.
export interface Transaction {
  id: string;
  kind: TransactionKind;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description: string | null;
  version: number;
  wallet: TransactionWallet | null;
  category: TransactionCategory;
}

export interface CreateTransactionRequest {
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description?: string | null;
}

export interface CreateTransactionResponse {
  transaction: Transaction;
  wallet: TransactionWallet & { balance: number };
  previous_balance: number;
}

// An absent field, or one equal to the stored value, keeps it; `null` only clears the description.
export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;

export interface TransactionWalletBalance {
  id: number;
  balance: number;
  is_deleted: boolean;
}

export interface UpdateTransactionResponse {
  transaction: Transaction;
  // Every wallet the edit touched, the previous one first when it moved.
  wallets: TransactionWalletBalance[];
}
