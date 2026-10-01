import type {
  CategoryBreakdownItem,
  StatisticsBreakdown,
  StatisticsPeriod,
  StatisticsPeriodType,
  StatisticsSummary,
  StatisticsTimeState,
  StatisticsTrend,
  WalletBreakdownItem,
} from '@api/dto';
import { AppColor } from '@shared/enums';

// The design's L1–L26 data as API responses, in UTC so every machine renders the same dates.
// Amounts are in cents to keep the sums exact; the backend's grouping (six groups, then Other) is mirrored here.

const AS_OF = '2026-09-28T09:41:00.000Z';
const ZONE = 'UTC';
const PRIMARY_LIMIT = 6;

type Category = [name: string, color: AppColor, icon: string];

const CATEGORIES: Record<string, Category> = {
  housing: ['Housing', AppColor.SLATE, 'Housing'],
  groceries: ['Groceries', AppColor.EVERGREEN, 'Grocery'],
  restaurants: ['Restaurants', AppColor.CLAY, 'Restaurant'],
  transportation: ['Transportation', AppColor.INDIGO, 'Transport'],
  subscriptions: ['Subscriptions', AppColor.PLUM, 'Subscriptions'],
  kids: ['Kids & School Supply', AppColor.AMBER, 'Kids'],
  cafe: ['Cafe', AppColor.AMBER, 'Cafe'],
  health: ['Health', AppColor.CLAY, 'Health'],
  clothes: ['Clothes', AppColor.PLUM, 'Clothes'],
  gifts: ['Gifts', AppColor.CLAY, 'Gifts'],
  travel: ['Travel', AppColor.INDIGO, 'Travel'],
};

const WALLETS: Record<string, [name: string, color: AppColor]> = {
  everyday: ['Everyday', AppColor.SLATE],
  travel: ['Travel', AppColor.INDIGO],
  jointTravel: ['Joint Travel Savings', AppColor.INDIGO],
  savings: ['Savings', AppColor.EVERGREEN],
};

interface BucketSpec {
  start: string;
  end: string;
  income: number;
  expense: number;
  state?: StatisticsTimeState;
}

interface FixtureSpec {
  type: StatisticsPeriodType;
  start: string;
  end: string;
  state?: StatisticsTimeState;
  // The passed part of a current period ends here.
  actualEnd?: string;
  income: number;
  expense: number;
  previous?: { start: string; end: string; actualEnd?: string; income: number; expense: number };
  granularity: 'day' | 'week' | 'month';
  buckets: BucketSpec[];
  categories?: [key: string, cents: number][];
  archived?: string[];
  wallets?: [key: string, cents: number][];
  deletedWallets?: number;
  // Transactions of $0.00 still count.
  counts?: { income: number; expense: number };
  hasAnyTransactions?: boolean;
  lastTransactionDate?: string | null;
  // Overrides a category's display name, e.g. to try the longest one allowed.
  names?: Record<string, string>;
}

export interface StatsFixture {
  summary: StatisticsSummary;
  trend: StatisticsTrend;
  breakdown: StatisticsBreakdown;
}

const money = (cents: number) => (cents / 100).toFixed(2);
const startOf = (date: string) => `${date}T00:00:00.000Z`;
const endOf = (date: string) => `${date}T23:59:59.999Z`;
const share = (cents: number, total: number) => (total ? Math.round((cents / total) * 10000) / 100 : 0);
const count = (cents: number) => (cents > 0 ? Math.max(1, Math.round(cents / 9000)) : 0);
const change = (current: number, previous: number) => ({
  delta: money(current - previous),
  percent: previous ? Math.round(((current - previous) / previous) * 1000) / 10 : null,
});

const buildPeriod = (spec: FixtureSpec): StatisticsPeriod => {
  const state = spec.state ?? 'current';

  return {
    type: spec.type,
    time_zone: ZONE,
    start_date: spec.start,
    end_date: spec.end,
    from: startOf(spec.start),
    to: endOf(spec.end),
    as_of: AS_OF,
    actual_to: state === 'future' ? null : state === 'past' ? endOf(spec.end) : AS_OF,
    state,
  };
};

const group = <Item extends CategoryBreakdownItem | WalletBreakdownItem>(items: Item[], total: number) => {
  const sorted = [...items].sort((a, b) => Number(b.amount) - Number(a.amount));
  if (sorted.length <= PRIMARY_LIMIT) return { primary: sorted, other: null };

  const children = sorted.slice(PRIMARY_LIMIT);
  const cents = children.reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0);

  return {
    primary: sorted.slice(0, PRIMARY_LIMIT),
    other: {
      kind: 'other' as const,
      key: 'other' as const,
      id: null,
      name: null,
      icon: null,
      color: null,
      is_archived: false as const,
      opens_history: false as const,
      amount: money(cents),
      percent: share(cents, total),
      children,
    },
  };
};

const buildBreakdown = (spec: FixtureSpec, period: StatisticsPeriod, expenseCount: number): StatisticsBreakdown => {
  const categories = (spec.categories ?? []).map(([key, cents], index): CategoryBreakdownItem => {
    const [name, color, icon] = CATEGORIES[key];

    return {
      kind: 'category',
      key: `category:${index + 1}`,
      id: index + 1,
      name: spec.names?.[key] ?? name,
      icon,
      color,
      is_archived: !!spec.archived?.includes(key),
      opens_history: true,
      amount: money(cents),
      percent: share(cents, spec.expense),
    };
  });
  const wallets = (spec.wallets ?? []).map(([key, cents], index): WalletBreakdownItem => {
    const [name, color] = WALLETS[key];

    return {
      kind: 'wallet',
      key: `wallet:${index + 1}`,
      id: index + 1,
      name,
      icon: null,
      color,
      is_archived: false,
      opens_history: true,
      amount: money(cents),
      percent: share(cents, spec.expense),
    };
  });
  const byCategory = group(categories, spec.expense);
  const byWallet = group(wallets, spec.expense);
  const deleted = spec.deletedWallets ?? 0;

  return {
    period,
    currency: 'USD',
    total: { amount: money(spec.expense), count: expenseCount },
    by_category: {
      total_amount: money(spec.expense),
      source_count: categories.length,
      primary_items: byCategory.primary,
      other: byCategory.other,
    },
    by_wallet: {
      total_amount: money(spec.expense),
      source_count: wallets.length + (deleted ? 1 : 0),
      primary_items: byWallet.primary,
      deleted_wallets: deleted
        ? {
            kind: 'deleted_wallets',
            key: 'deleted_wallets',
            id: null,
            name: null,
            icon: null,
            color: null,
            is_archived: false,
            opens_history: false,
            wallets_count: 1,
            amount: money(deleted),
            percent: share(deleted, spec.expense),
          }
        : null,
      other: byWallet.other,
    },
  };
};

export const buildStatsFixture = (spec: FixtureSpec): StatsFixture => {
  const period = buildPeriod(spec);
  const income = { amount: money(spec.income), count: spec.counts?.income ?? count(spec.income) };
  const expense = { amount: money(spec.expense), count: spec.counts?.expense ?? count(spec.expense) };
  const transactionsCount = income.count + expense.count;
  const previous = spec.previous;

  return {
    summary: {
      period,
      currency: 'USD',
      income,
      expense,
      net: money(spec.income - spec.expense),
      transactions_count: transactionsCount,
      previous: previous
        ? {
            start_date: previous.start,
            end_date: previous.end,
            from: startOf(previous.start),
            to: endOf(previous.end),
            actual_to: previous.actualEnd ? endOf(previous.actualEnd) : endOf(previous.end),
            income: { amount: money(previous.income), count: count(previous.income) },
            expense: { amount: money(previous.expense), count: count(previous.expense) },
            net: money(previous.income - previous.expense),
            transactions_count: count(previous.income) + count(previous.expense),
          }
        : null,
      change: previous
        ? {
            income: change(spec.income, previous.income),
            expense: change(spec.expense, previous.expense),
            net: change(spec.income - spec.expense, previous.income - previous.expense),
          }
        : null,
      has_any_transactions: spec.hasAnyTransactions ?? true,
      last_transaction_date: spec.lastTransactionDate === undefined ? '2026-09-28' : spec.lastTransactionDate,
    },
    trend: {
      period,
      currency: 'USD',
      totals: { income, expense },
      granularity: spec.granularity,
      buckets: spec.buckets.map((bucket) => {
        const state = bucket.state ?? 'past';
        const isFuture = state === 'future';

        return {
          key: bucket.start,
          start_date: bucket.start,
          end_date: bucket.end,
          from: startOf(bucket.start),
          to: endOf(bucket.end),
          state,
          income: isFuture ? null : money(bucket.income),
          expense: isFuture ? null : money(bucket.expense),
        };
      }),
    },
    breakdown: buildBreakdown(spec, period, expense.count),
  };
};

const MONTH_BUCKETS: BucketSpec[] = [
  { start: '2026-09-01', end: '2026-09-06', income: 320000, expense: 74210 },
  { start: '2026-09-07', end: '2026-09-13', income: 0, expense: 58840 },
  { start: '2026-09-14', end: '2026-09-20', income: 0, expense: 61320 },
  { start: '2026-09-21', end: '2026-09-27', income: 85000, expense: 88210 },
  { start: '2026-09-28', end: '2026-09-30', income: 0, expense: 3860, state: 'current' },
];

const MONTH_CATEGORIES: FixtureSpec['categories'] = [
  ['housing', 125000],
  ['groceries', 48630],
  ['restaurants', 31280],
  ['transportation', 24450],
  ['subscriptions', 16489],
  ['kids', 13500],
  ['cafe', 9640],
  ['health', 7820],
  ['clothes', 5850],
  ['gifts', 3781],
];

const MONTH: FixtureSpec = {
  type: 'month',
  start: '2026-09-01',
  end: '2026-09-30',
  income: 405000,
  expense: 286440,
  previous: { start: '2026-08-01', end: '2026-08-31', actualEnd: '2026-08-28', income: 361600, expense: 275400 },
  granularity: 'week',
  buckets: MONTH_BUCKETS,
  categories: MONTH_CATEGORIES,
  wallets: [
    ['everyday', 184210],
    ['travel', 62030],
    ['savings', 40200],
  ],
};

const monthDay = (month: number, day: number) =>
  `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const lastDay = (month: number) => new Date(Date.UTC(2026, month, 0)).getUTCDate();

const YEAR_INCOME = [320000, 320000, 405000, 320000, 380000, 320000, 420000, 320000, 405000];
const YEAR_EXPENSE = [298000, 274000, 331000, 289000, 342000, 312000, 365000, 308000, 286440];

const weekBuckets = (startDay: number, month: number, values: [number, number][]) =>
  values.map(([income, expense], index): BucketSpec => {
    const start = Math.max(1, startDay + index * 7);
    const end = Math.min(lastDay(month), startDay + index * 7 + 6);

    return { start: monthDay(month, start), end: monthDay(month, end), income, expense };
  });

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export const STATS_FIXTURES = {
  // L1, L2, L3, L10, L14, L15, L22–L24
  month: buildStatsFixture(MONTH),
  // L4
  year: buildStatsFixture({
    type: 'year',
    start: '2026-01-01',
    end: '2026-12-31',
    income: sum(YEAR_INCOME),
    expense: sum(YEAR_EXPENSE),
    previous: { start: '2025-01-01', end: '2025-12-31', actualEnd: '2025-09-28', income: 2945000, expense: 2646600 },
    granularity: 'month',
    buckets: Array.from({ length: 12 }, (_, index): BucketSpec => {
      const month = index + 1;

      return {
        start: monthDay(month, 1),
        end: monthDay(month, lastDay(month)),
        income: YEAR_INCOME[index] ?? 0,
        expense: YEAR_EXPENSE[index] ?? 0,
        state: index === 8 ? 'current' : index > 8 ? 'future' : 'past',
      };
    }),
    categories: [
      ['housing', sum(YEAR_EXPENSE) - 1782441],
      ['groceries', 462040],
      ['restaurants', 301090],
      ['transportation', 233000],
      ['travel', 218000],
      ['subscriptions', 148401],
      ['cafe', 121040],
      ['health', 89019],
      ['clothes', 65051],
      ['gifts', 144800],
    ],
    wallets: [
      ['everyday', sum(YEAR_EXPENSE) - 1016400],
      ['travel', 623000],
      ['savings', 393400],
    ],
  }),
  // L8: the current week, by day, mostly ahead
  week: buildStatsFixture({
    type: 'week',
    start: '2026-09-28',
    end: '2026-10-04',
    income: 0,
    expense: 3860,
    previous: { start: '2026-09-21', end: '2026-09-27', actualEnd: '2026-09-21', income: 0, expense: 5230 },
    granularity: 'day',
    buckets: Array.from({ length: 7 }, (_, index): BucketSpec => {
      const date = new Date(Date.UTC(2026, 8, 28 + index)).toISOString().slice(0, 10);

      return {
        start: date,
        end: date,
        income: 0,
        expense: index === 0 ? 3860 : 0,
        state: index === 0 ? 'current' : 'future',
      };
    }),
    categories: [
      ['groceries', 2410],
      ['cafe', 1450],
    ],
    wallets: [['everyday', 3860]],
  }),
  // L11: a month cut into six calendar weeks
  august: buildStatsFixture({
    type: 'month',
    start: '2026-08-01',
    end: '2026-08-31',
    state: 'past',
    income: 405000,
    expense: 310675,
    previous: { start: '2026-07-01', end: '2026-07-31', income: 405000, expense: 334010 },
    granularity: 'week',
    buckets: [
      { start: '2026-08-01', end: '2026-08-02', income: 0, expense: 8420 },
      ...weekBuckets(3, 8, [
        [320000, 161240],
        [0, 48610],
        [0, 40255],
        [85000, 47830],
      ]),
      { start: '2026-08-31', end: '2026-08-31', income: 0, expense: 4320 },
    ],
    categories: [
      ['housing', 125000],
      ['groceries', 61240],
      ['restaurants', 40210],
      ['travel', 38000],
      ['transportation', 22135],
      ['subscriptions', 16489],
      ['cafe', 4800],
      ['gifts', 2801],
    ],
    wallets: [
      ['everyday', 210645],
      ['travel', 62030],
      ['savings', 38000],
    ],
  }),
  // L12: a month that has not started
  february: buildStatsFixture({
    type: 'month',
    start: '2027-02-01',
    end: '2027-02-28',
    state: 'future',
    income: 0,
    expense: 0,
    granularity: 'week',
    buckets: [],
  }),
  // L13: 14 weeks
  custom: buildStatsFixture({
    type: 'custom',
    start: '2026-07-01',
    end: '2026-09-28',
    income: 1215000,
    expense: 931125,
    granularity: 'week',
    buckets: (
      [
        ['2026-07-01', '2026-07-05', 0, 31240],
        ['2026-07-06', '2026-07-12', 320000, 158020],
        ['2026-07-13', '2026-07-19', 0, 49870],
        ['2026-07-20', '2026-07-26', 0, 52230],
        ['2026-07-27', '2026-08-02', 85000, 51070],
        ['2026-08-03', '2026-08-09', 320000, 161240],
        ['2026-08-10', '2026-08-16', 0, 48610],
        ['2026-08-17', '2026-08-23', 0, 40255],
        ['2026-08-24', '2026-08-30', 85000, 47830],
        ['2026-08-31', '2026-09-06', 320000, 78530],
        ['2026-09-07', '2026-09-13', 0, 58840],
        ['2026-09-14', '2026-09-20', 0, 61320],
        ['2026-09-21', '2026-09-27', 85000, 88210],
        ['2026-09-28', '2026-09-28', 0, 3860],
      ] as const
    ).map(([start, end, income, expense], index) => ({
      start,
      end,
      income,
      expense,
      state: index === 13 ? ('current' as const) : ('past' as const),
    })),
    categories: [
      ['housing', 375000],
      ['groceries', 159210],
      ['restaurants', 103040],
      ['transportation', 71230],
      ['travel', 62000],
      ['subscriptions', 49467],
      ['cafe', 40230],
      ['kids', 31800],
      ['health', 23148],
      ['gifts', 16000],
    ],
    wallets: [
      ['everyday', 631095],
      ['travel', 186030],
      ['savings', 114000],
    ],
  }),
  // L16
  deletedWallets: buildStatsFixture({
    ...MONTH,
    wallets: [
      ['everyday', 164210],
      ['jointTravel', 62030],
      ['savings', 40200],
    ],
    deletedWallets: 20000,
  }),
  // L17
  archived: buildStatsFixture({ ...MONTH, archived: ['subscriptions'] }),
  // L18: income only, so no breakdown
  incomeOnly: buildStatsFixture({
    ...MONTH,
    income: 170000,
    expense: 0,
    previous: { start: '2026-08-01', end: '2026-08-31', actualEnd: '2026-08-28', income: 85000, expense: 0 },
    buckets: MONTH_BUCKETS.map((bucket, index) => ({
      ...bucket,
      income: index === 1 || index === 3 ? 85000 : 0,
      expense: 0,
    })),
    categories: [],
    wallets: [],
  }),
  // L19: a finished week in deficit
  expenseOnly: buildStatsFixture({
    type: 'week',
    start: '2026-09-14',
    end: '2026-09-20',
    state: 'past',
    income: 0,
    expense: 61320,
    previous: { start: '2026-09-07', end: '2026-09-13', income: 0, expense: 58840 },
    granularity: 'day',
    buckets: [8410, 2240, 0, 31200, 9630, 5840, 4000].map((expense, index) => {
      const date = `2026-09-${14 + index}`;

      return { start: date, end: date, income: 0, expense };
    }),
    categories: [
      ['groceries', 20840],
      ['restaurants', 15630],
      ['transportation', 9810],
      ['cafe', 6420],
      ['health', 4620],
      ['subscriptions', 4000],
    ],
    wallets: [
      ['everyday', 57320],
      ['travel', 4000],
    ],
  }),
  // L20: transactions, all of $0.00
  zero: buildStatsFixture({
    type: 'week',
    start: '2026-09-07',
    end: '2026-09-13',
    state: 'past',
    income: 0,
    expense: 0,
    previous: { start: '2026-08-31', end: '2026-09-06', income: 320000, expense: 78530 },
    counts: { income: 1, expense: 2 },
    granularity: 'day',
    buckets: Array.from({ length: 7 }, (_, index) => {
      const date = `2026-09-${String(7 + index).padStart(2, '0')}`;

      return { start: date, end: date, income: 0, expense: 0 };
    }),
  }),
  // L21: one category takes the whole ring
  flat: buildStatsFixture({
    ...MONTH,
    income: 140000,
    expense: 125000,
    previous: { start: '2026-08-01', end: '2026-08-31', actualEnd: '2026-08-28', income: 140000, expense: 125000 },
    buckets: MONTH_BUCKETS.map((bucket, index) => ({
      ...bucket,
      income: index === 0 ? 140000 : 0,
      expense: index === 0 ? 125000 : 0,
    })),
    categories: [['housing', 125000]],
    wallets: [['everyday', 125000]],
  }),
  // L5: no transactions ever
  noHistory: buildStatsFixture({
    ...MONTH,
    income: 0,
    expense: 0,
    previous: undefined,
    buckets: MONTH_BUCKETS.map((bucket) => ({ ...bucket, income: 0, expense: 0 })),
    categories: [],
    wallets: [],
    hasAnyTransactions: false,
    lastTransactionDate: null,
  }),
  // L6 (a custom range) and L26 (the current month)
  emptyPeriod: buildStatsFixture({
    ...MONTH,
    income: 0,
    expense: 0,
    previous: undefined,
    buckets: MONTH_BUCKETS.map((bucket) => ({ ...bucket, income: 0, expense: 0 })),
    categories: [],
    wallets: [],
    lastTransactionDate: '2026-08-29',
  }),
  // Not in the design: the longest names and amounts the layout has to hold.
  stress: buildStatsFixture({
    ...MONTH,
    income: 123456789012,
    expense: 98765432101,
    previous: { start: '2026-08-01', end: '2026-08-31', actualEnd: '2026-08-28', income: 1000, expense: 1000 },
    buckets: MONTH_BUCKETS.map((bucket, index) => ({
      ...bucket,
      income: index === 0 ? 123456789012 : 0,
      expense: index === 0 ? 98765432101 : 0,
    })),
    categories: [
      ['kids', 98765432101 - 1000],
      ['subscriptions', 1000],
    ],
    archived: ['kids'],
    names: { kids: 'Kids & School Supply' },
    wallets: [
      ['jointTravel', 98765432101 - 1000],
      ['savings', 1000],
    ],
  }),
} satisfies Record<string, StatsFixture>;

export type StatsFixtureName = keyof typeof STATS_FIXTURES;
