import type { TransactionType } from '@shared/enums';
import type { Category } from './categoryDto';
import type { Wallet, WalletWithBalance } from './walletDto';

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
}

export interface CreateTransactionRequest {
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description?: string;
}

// The created transaction has no `category`/`wallet` relation loaded (a
// plain create+save, no join) -- unlike GET, which eager-joins both.
export interface CreateTransactionResponse {
  transaction: Omit<Transaction, 'wallet' | 'category'>;
  wallet: WalletWithBalance;
  previous_balance: number;
}
