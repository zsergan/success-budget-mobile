import type { AppColor, LimitType } from '@shared/enums';
import type { Category, CategoryIconApi } from './categoryDto';

export interface LimitCategory {
  id: number;
  name: string;
  // Wire value, same as Category.icon — reads don't validate, so old rows may still carry a legacy name.
  icon: CategoryIconApi | string;
  color: AppColor;
}

export interface LimitView {
  id: number;
  name: string | null;
  amount: string;
  spent: number;
  in_percent: number;
  categories: LimitCategory[];
}

export interface OverAllocation {
  category_total: number;
  difference: number;
}

export interface GetLimitsResponse {
  total: LimitView | null;
  categories: LimitView[];
  over_allocation: OverAllocation | null;
}

// Raw entity shape returned as-is by POST/PUT — richer than LimitView's
// trimmed nested categories (includes limit_type and full Category objects).
export interface LimitEntity {
  id: number;
  name: string | null;
  limit_type: LimitType;
  amount: string;
  created_at: string;
  updated_at: string;
  categories: Category[];
}

export interface CreateLimitRequest {
  category_ids?: number[];
  name?: string;
  amount: string;
}

export interface UpdateLimitRequest {
  category_ids?: number[];
  name?: string;
  amount?: string;
}
