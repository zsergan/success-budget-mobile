import type { TransactionType } from '@shared/enums';

export interface Category {
  id: number;
  name: string;
  transaction_type: TransactionType;
}

export interface GetCategoriesResponse {
  incomes: Category[];
  expenses: Category[];
}
