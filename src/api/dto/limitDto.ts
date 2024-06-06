import type { LimitType } from '@shared/enums';
import type { Category } from './categoryDto';

export interface Limit {
  id: number;
  limit_type: LimitType;
  amount: number;
  category: Category;
  spent: number;
  in_percent: number;
}

export interface LimitsOverall {
  spent: number;
  sum: number;
  in_percent: number;
}

export interface GetLimitsResponse {
  limits: Limit[];
  overall: LimitsOverall;
}

export interface CreateLimitRequest {
  category_id?: number;
  amount: string;
}

export interface UpdateLimitRequest {
  category_id?: number;
  amount?: string;
}
