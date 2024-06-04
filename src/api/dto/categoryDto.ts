import type { TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';

export interface Category {
  id: number;
  name: string;
  transaction_type: TransactionType;
  icon: IconType;
  color: string;
  is_active: number;
}

export interface GetCategoriesResponse {
  incomes: Category[];
  expenses: Category[];
}

export interface UpdateCategoryRequest {
  name?: string;
  transaction_type?: TransactionType;
  icon?: string;
  color?: string;
  is_active?: number;
}

export interface CreateCategoryRequest {
  name: string;
  transaction_type: TransactionType;
  icon: string;
  color: string;
}
