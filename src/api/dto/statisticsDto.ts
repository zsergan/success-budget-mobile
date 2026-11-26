import type { AppColor, TransactionType } from '@shared/enums';
import type { CategoryIconApi } from './categoryDto';
import type { CalendarDate } from '@shared/utils/calendarDate';
import type { PersonStatus } from './transactionDto';

export type StatisticsPeriodType = 'week' | 'month' | 'year' | 'custom';

export type StatisticsTimeState = 'past' | 'current' | 'future';

// Money is a decimal string with two digits ("1234.50", "-510.50"), never a number.
export type Money = string;

export interface StatisticsQuery {
  period: StatisticsPeriodType;
  time_zone: string;
  anchor_date?: CalendarDate;
  from_date?: CalendarDate;
  to_date?: CalendarDate;
  // The load cycle's reference clock, an instant with `Z`: it tells the server which day is today in `time_zone`.
  as_of?: string;
}

// Only breakdown takes a type; summary and trend refuse it.
export interface StatisticsBreakdownQuery extends StatisticsQuery {
  transaction_type: TransactionType;
}

export interface StatisticsPeriod {
  type: StatisticsPeriodType;
  time_zone: string;
  start_date: CalendarDate;
  end_date: CalendarDate;
  as_of: string;
  // The last day counted, today for a current period; null for a future one.
  actual_end_date: CalendarDate | null;
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
  start_date: CalendarDate;
  end_date: CalendarDate;
  // The like-for-like cut of a current period, otherwise `end_date`.
  actual_end_date: CalendarDate;
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
  last_transaction_date: CalendarDate | null;
}

export interface StatisticsTrendBucket {
  key: string;
  start_date: CalendarDate;
  end_date: CalendarDate;
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

// One group per assigned user (former members too), one for the whole space, one for nobody and one for every deleted
// account; `key` is the feed's `assignment` value.
export interface AssignmentBreakdownItem extends BreakdownShare {
  kind: 'member' | 'space' | 'unassigned' | 'deleted_member';
  key: string;
  // Member only.
  user_id: number | null;
  name: string | null;
  status: Exclude<PersonStatus, 'deleted'> | null;
  opens_history: true;
}

// The small groups folded together; named by the client, it opens no history of its own.
export interface OtherBreakdownItem<Child> extends BreakdownShare {
  kind: 'other';
  key: 'other';
  id: null;
  name: null;
  icon: null;
  color: null;
  is_archived: false;
  opens_history: false;
  children: Child[];
}

// Assignment's Other carries only what names it; space and unassigned are never folded into it.
export interface AssignmentOtherItem extends BreakdownShare {
  kind: 'other';
  key: 'other';
  opens_history: false;
  children: AssignmentBreakdownItem[];
}

export interface StatisticsBreakdown extends StatisticsBlock {
  transaction_type: TransactionType;
  total: MoneyCount;
  by_category: {
    total_amount: Money;
    source_count: number;
    primary_items: CategoryBreakdownItem[];
    other: OtherBreakdownItem<CategoryBreakdownItem> | null;
  };
  by_assignment: {
    // Equal to `by_category.total_amount` and `total.amount`.
    total_amount: Money;
    source_count: number;
    primary_items: AssignmentBreakdownItem[];
    other: AssignmentOtherItem | null;
  };
}
