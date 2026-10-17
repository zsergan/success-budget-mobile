import type { barDataItem } from 'react-native-gifted-charts';

import type { Money, StatisticsTrend, StatisticsTrendBucket } from '@api/dto';
import type { ThemeColors } from '@shared/theme';
import { formatDayRange, getMoneySign, parseDateKey } from '@screens/Stats/format';

export const BAR_AREA_HEIGHT = 104;
export const MIN_BAR_HEIGHT = 3;
export const PAIR_GAP = 2;
// Narrowest a group may get before the chart scrolls: its tap target and its labels need this much.
export const MIN_COLUMN_WIDTH = 18;
// A 9pt label character, generous so a label never clips.
const LABEL_CHAR_WIDTH = 5.4;

export interface TrendGroup {
  key: string;
  label: string;
  sub: string;
  dates: string;
  income: Money;
  expense: Money;
  incomeValue: number;
  expenseValue: number;
  isCurrent: boolean;
  isFuture: boolean;
  isZero: boolean;
}

export const TREND_STEP: Record<StatisticsTrend['granularity'], string> = {
  day: 'by day',
  week: 'by week',
  month: 'by month',
};

const format = (date: Date, options: Intl.DateTimeFormatOptions) => date.toLocaleString('en-US', options);

const isWholeMonth = (start: Date, end: Date) =>
  start.getDate() === 1 &&
  start.getMonth() === end.getMonth() &&
  end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

type Labels = Pick<TrendGroup, 'label' | 'sub' | 'dates'>;

const labelBucket = (bucket: StatisticsTrendBucket, index: number, trend: StatisticsTrend, now: Date): Labels => {
  const start = parseDateKey(bucket.start_date);
  const end = parseDateKey(bucket.end_date);
  const isOtherYear = start.getFullYear() !== now.getFullYear() || end.getFullYear() !== now.getFullYear();
  const previous = trend.buckets[index - 1];
  const opensMonth = !previous || parseDateKey(previous.start_date).getMonth() !== start.getMonth();
  const isCustom = trend.period.type === 'custom';

  if (trend.granularity === 'day') {
    const year = isOtherYear ? ` ${start.getFullYear()}` : '';

    return {
      label: format(start, { weekday: 'narrow' }),
      sub: `${start.getDate()}`,
      dates: `${format(start, { weekday: 'short' })}, ${start.getDate()} ${format(start, { month: 'short' })}${year}`,
    };
  }

  if (trend.granularity === 'month') {
    const opensYear = index === 0 || start.getMonth() === 0;

    return {
      label: format(start, { month: 'narrow' }),
      sub: isCustom && opensYear ? `${start.getFullYear()}` : '',
      dates: isWholeMonth(start, end)
        ? `${format(start, { month: 'short' })} ${start.getFullYear()}`
        : formatDayRange(start, end, true),
    };
  }

  // Weeks of one month are numbered and carry their days, so a short W1 or W6 never reads as a full week.
  if (trend.period.type === 'month') {
    const days = start.getTime() === end.getTime() ? `${start.getDate()}` : `${start.getDate()}–${end.getDate()}`;

    return { label: `W${index + 1}`, sub: days, dates: formatDayRange(start, end, true) };
  }

  return {
    label: `${start.getDate()}`,
    sub: opensMonth ? format(start, { month: 'short' }) : '',
    dates: formatDayRange(start, end, isOtherYear),
  };
};

const toValue = (amount: Money | null) => (amount === null ? 0 : Math.abs(Number(amount)) || 0);

// The server's calendar intervals as chart groups; a future one has no amounts, not zeroes.
export const toTrendGroups = (trend: StatisticsTrend, now = new Date()): TrendGroup[] =>
  trend.buckets.map((bucket, index) => {
    const isFuture = bucket.state === 'future' || bucket.income === null || bucket.expense === null;
    const income = bucket.income ?? '0.00';
    const expense = bucket.expense ?? '0.00';

    return {
      key: bucket.key,
      ...labelBucket(bucket, index, trend, now),
      income,
      expense,
      incomeValue: isFuture ? 0 : toValue(bucket.income),
      expenseValue: isFuture ? 0 : toValue(bucket.expense),
      isCurrent: bucket.state === 'current',
      isFuture,
      isZero: !isFuture && getMoneySign(income) === 0 && getMoneySign(expense) === 0,
    };
  });

// The tallest bar across both series, which is the shared scale.
export const getTrendMax = (groups: TrendGroup[]): { value: number; amount: Money } | null =>
  groups.reduce<{ value: number; amount: Money } | null>((max, group) => {
    const tallest =
      group.expenseValue > group.incomeValue
        ? { value: group.expenseValue, amount: group.expense }
        : { value: group.incomeValue, amount: group.income };

    return tallest.value > (max?.value ?? 0) ? tallest : max;
  }, null);

export interface TrendGeometry {
  barWidth: number;
  columnGap: number;
  columnWidth: number;
  contentWidth: number;
  // The pair's inset from each side of its column.
  inset: number;
  isScrollable: boolean;
}

export const getTrendGeometry = (groups: TrendGroup[], viewportWidth: number): TrendGeometry => {
  const count = Math.max(groups.length, 1);
  const barWidth = count <= 7 ? 11 : 5;
  const columnGap = count <= 7 ? 12 : count <= 12 ? 4 : 3;
  const pairWidth = barWidth * 2 + PAIR_GAP;
  const longestLabel = Math.max(0, ...groups.map((group) => Math.max(group.label.length, group.sub.length)));
  const minColumnWidth = Math.max(MIN_COLUMN_WIDTH, pairWidth + 2, Math.ceil(longestLabel * LABEL_CHAR_WIDTH));

  const fittedWidth = (viewportWidth - columnGap * (count - 1)) / count;
  const isScrollable = fittedWidth < minColumnWidth;
  const columnWidth = isScrollable ? minColumnWidth : fittedWidth;
  const contentWidth = isScrollable ? columnWidth * count + columnGap * (count - 1) : viewportWidth;

  return { barWidth, columnGap, columnWidth, contentWidth, inset: (columnWidth - pairWidth) / 2, isScrollable };
};

export const getColumnCenter = (index: number, geometry: TrendGeometry) =>
  index * (geometry.columnWidth + geometry.columnGap) + geometry.columnWidth / 2;

// Income and expense side by side per group, both drawn upward on one scale.
export const toBarData = (
  groups: TrendGroup[],
  geometry: TrendGeometry,
  maxValue: number,
  colors: Pick<ThemeColors, 'ok' | 'danger'>,
): barDataItem[] => {
  // A non-zero amount never draws thinner than MIN_BAR_HEIGHT; a zero draws nothing.
  const visible = (value: number) => (value > 0 ? Math.max(value, (maxValue * MIN_BAR_HEIGHT) / BAR_AREA_HEIGHT) : 0);
  const groupSpacing = geometry.columnGap + geometry.inset * 2;

  return groups.flatMap((group) => [
    { value: visible(group.incomeValue), frontColor: colors.ok, spacing: PAIR_GAP },
    { value: visible(group.expenseValue), frontColor: colors.danger, spacing: groupSpacing },
  ]);
};
