import type { TransactionType } from '@shared/enums';
import type { Category } from '@api/dto/categoryDto';
import type { Holding } from '@api/dto/holdingDto';

export interface Transaction {
  id: string;
  holding_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: Date;
  description: string;
  holding: Holding;
  category: Category;
}

export interface CreateTransactionRequest {
  holding_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: Date;
  description?: string;
}
