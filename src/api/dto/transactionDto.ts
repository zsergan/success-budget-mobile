import type { TransactionType } from '@shared/enums';
import type { Category } from './categoryDto';
import type { Wallet, WalletWithBalance } from './walletDto';

// The backend excludes `wallet_id`/`category_id` from every response; read them off the joined relations.
export interface Transaction {
  id: string;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description: string | null;
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
