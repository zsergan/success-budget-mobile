import type { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { CategoryIconApi } from './categoryDto';
import type { Money } from './statisticsDto';
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

// The number of rows the list returns for the same query, initial balances included.
export interface TransactionsCountResponse {
  count: number;
}

// One page of `/transactions/feed`; `summary` covers the whole selection, `day_totals` each whole day on the page.
export interface TransactionFeedResponse {
  items: Transaction[];
  page_info: {
    // Opaque; `next_cursor` leads to older records, `previous_cursor` to newer ones.
    next_cursor: string | null;
    previous_cursor: string | null;
  };
  summary: { count: number; income: Money; expense: Money };
  day_totals: { date: string; net: Money }[];
}

export interface CreateTransactionRequest {
  wallet_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description?: string | null;
  // The create's Idempotency-Key; the server never applies two creates with one id in a space.
  client_operation_id?: string;
}

export interface CreateTransactionResponse {
  transaction: Transaction;
  wallet: TransactionWallet & { balance: number };
  previous_balance: number;
}

// An absent field, or one equal to the stored value, keeps it; `null` only clears the description.
export type UpdateTransactionRequest = Partial<Omit<CreateTransactionRequest, 'client_operation_id'>>;

// What a create with this operation id did: `deleted` means it applied and the record was deleted since.
export interface TransactionOperationResponse {
  operation_id: string;
  status: 'applied' | 'deleted';
  transaction_id: string;
  created_at: string;
  deleted_at: string | null;
  transaction: Transaction | null;
}

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
