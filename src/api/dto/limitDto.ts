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

// The month `spent` was counted over, in the zone the request named.
export interface LimitsPeriod {
  time_zone: string;
  start_date: string;
  end_date: string;
  from: string;
  // Inclusive, to the millisecond.
  to: string;
}

export interface GetLimitsResponse {
  // Absent from servers that predate the time zone contract.
  period?: LimitsPeriod;
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
