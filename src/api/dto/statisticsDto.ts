import type { AppColor } from '@shared/enums';
import type { CategoryIconApi } from './categoryDto';

export type StatisticsPeriodType = 'week' | 'month' | 'year' | 'custom';

export type StatisticsTimeState = 'past' | 'current' | 'future';

// Money is a decimal string with two digits ("1234.50", "-510.50"), never a number.
export type Money = string;

export interface StatisticsQuery {
  period: StatisticsPeriodType;
  time_zone: string;
  anchor_date?: string;
  from_date?: string;
  to_date?: string;
  as_of?: string;
}

export interface StatisticsPeriod {
  type: StatisticsPeriodType;
  time_zone: string;
  start_date: string;
  end_date: string;
  from: string;
  to: string;
  as_of: string;
  actual_to: string | null;
  state: StatisticsTimeState;
}

export interface MoneyCount {
  amount: Money;
  count: number;
}

interface StatisticsBlock {
  period: StatisticsPeriod;
  currency: string;
}

export interface StatisticsChange {
  delta: Money;
  percent: number | null;
}

export interface StatisticsPreviousPeriod {
  start_date: string;
  end_date: string;
  from: string;
  to: string;
  actual_to: string;
  income: MoneyCount;
  expense: MoneyCount;
  net: Money;
  transactions_count: number;
}

export interface StatisticsSummary extends StatisticsBlock {
  income: MoneyCount;
  expense: MoneyCount;
  net: Money;
  transactions_count: number;
  previous: StatisticsPreviousPeriod | null;
  change: { income: StatisticsChange; expense: StatisticsChange; net: StatisticsChange } | null;
  has_any_transactions: boolean;
  last_transaction_date: string | null;
}

export interface StatisticsTrendBucket {
  key: string;
  start_date: string;
  end_date: string;
  from: string;
  to: string;
  state: StatisticsTimeState;
  income: Money | null;
  expense: Money | null;
}

export interface StatisticsTrend extends StatisticsBlock {
  totals: { income: MoneyCount; expense: MoneyCount };
  granularity: 'day' | 'week' | 'month';
  buckets: StatisticsTrendBucket[];
}

interface BreakdownShare {
  amount: Money;
  percent: number;
}

export interface CategoryBreakdownItem extends BreakdownShare {
  kind: 'category';
  key: string;
  id: number;
  name: string;
  // Like category reads, an old row may still carry a legacy icon name.
  icon: CategoryIconApi | string;
  color: AppColor;
  is_archived: boolean;
  opens_history: true;
}

export interface WalletBreakdownItem extends BreakdownShare {
  kind: 'wallet';
  key: string;
  id: number;
  name: string;
  icon: null;
  color: AppColor;
  is_archived: false;
  opens_history: true;
}

// Service groups are named and colored by the client and open no history.
interface ServiceBreakdownItem extends BreakdownShare {
  id: null;
  name: null;
  icon: null;
  color: null;
  is_archived: false;
  opens_history: false;
}

export interface DeletedWalletsBreakdownItem extends ServiceBreakdownItem {
  kind: 'deleted_wallets';
  key: 'deleted_wallets';
  wallets_count: number;
}

export interface OtherBreakdownItem<Child> extends ServiceBreakdownItem {
  kind: 'other';
  key: 'other';
  children: Child[];
}

export interface StatisticsBreakdown extends StatisticsBlock {
  total: MoneyCount;
  by_category: {
    total_amount: Money;
    source_count: number;
    primary_items: CategoryBreakdownItem[];
    other: OtherBreakdownItem<CategoryBreakdownItem> | null;
  };
  by_wallet: {
    total_amount: Money;
    source_count: number;
    primary_items: WalletBreakdownItem[];
    deleted_wallets: DeletedWalletsBreakdownItem | null;
    other: OtherBreakdownItem<WalletBreakdownItem> | null;
  };
}
