import type { AppColor, TransactionType } from '@shared/enums';

// Exact wire values of the backend's closed CategoryIcon enum — Capitalized, space-separated for multi-word names.
export type CategoryIconApi =
  | 'Grocery'
  | 'Restaurant'
  | 'Cafe'
  | 'Housing'
  | 'Utilities'
  | 'Internet'
  | 'Transport'
  | 'Fuel'
  | 'Car'
  | 'Taxi'
  | 'Health'
  | 'Pharmacy'
  | 'Fitness'
  | 'Beauty'
  | 'Clothes'
  | 'Electronics'
  | 'Home goods'
  | 'Education'
  | 'Kids'
  | 'Pets'
  | 'Travel'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Gifts'
  | 'Charity'
  | 'Fees'
  | 'Taxes'
  | 'Savings'
  | 'Salary'
  | 'Bonus'
  | 'Freelance'
  | 'Investments'
  | 'Dividends'
  | 'Refund'
  | 'Other';

export interface CategoryLimitRef {
  id: number;
  name: string | null;
}

export interface Category {
  id: number;
  name: string;
  transaction_type: TransactionType;
  // Reads don't validate `icon` — old rows may still carry a pre-redesign legacy name, not necessarily one of the 35 current values.
  icon: CategoryIconApi | string;
  color: AppColor;
  is_active: number;
  transaction_count: number;
  limit: CategoryLimitRef | null;
  archived_at: string | null;
}

export interface GetCategoriesResponse {
  incomes: Category[];
  expenses: Category[];
  archived: Category[];
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: CategoryIconApi;
  color?: AppColor;
  is_active?: number;
}

export interface CreateCategoryRequest {
  name: string;
  transaction_type: TransactionType;
  icon: CategoryIconApi;
  color: AppColor;
}

export interface ReorderCategoriesRequest {
  category_ids: number[];
}

export interface DeleteCategoryResponse {
  archived: boolean;
}
