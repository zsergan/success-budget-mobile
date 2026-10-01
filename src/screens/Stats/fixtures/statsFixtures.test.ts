import { areStatisticsConsistent } from '@redux/state/statistics/selectors';
import { getStatsViewState } from '@screens/Stats/statsViewState';
import { STATS_FIXTURES } from './statsFixtures';

const cents = (amount: string) => Math.round(Number(amount) * 100);
const sumOf = (amounts: string[]) => amounts.reduce((total, amount) => total + cents(amount), 0);

describe('STATS_FIXTURES', () => {
  it.each(Object.entries(STATS_FIXTURES))(
    '%s agrees across the three blocks',
    (_name, { summary, trend, breakdown }) => {
      expect(areStatisticsConsistent(summary, trend, breakdown)).toBe(true);
      expect(sumOf(trend.buckets.map((bucket) => bucket.income ?? '0'))).toBe(cents(summary.income.amount));
      expect(sumOf(trend.buckets.map((bucket) => bucket.expense ?? '0'))).toBe(cents(summary.expense.amount));

      const { by_category: byCategory, by_wallet: byWallet } = breakdown;
      const categoryGroups = [...byCategory.primary_items, ...(byCategory.other ? [byCategory.other] : [])];
      const walletGroups = [
        ...byWallet.primary_items,
        ...(byWallet.deleted_wallets ? [byWallet.deleted_wallets] : []),
        ...(byWallet.other ? [byWallet.other] : []),
      ];

      expect(sumOf(categoryGroups.map((group) => group.amount))).toBe(cents(summary.expense.amount));
      expect(sumOf(walletGroups.map((group) => group.amount))).toBe(cents(summary.expense.amount));
      expect(sumOf(byCategory.other?.children.map((child) => child.amount) ?? [])).toBe(
        byCategory.other ? cents(byCategory.other.amount) : 0,
      );
    },
  );

  it('lands each frame in the state the design shows', () => {
    expect(getStatsViewState(STATS_FIXTURES.month.summary)).toBe('data');
    expect(getStatsViewState(STATS_FIXTURES.zero.summary)).toBe('data');
    expect(getStatsViewState(STATS_FIXTURES.noHistory.summary)).toBe('noHistory');
    expect(getStatsViewState(STATS_FIXTURES.emptyPeriod.summary)).toBe('emptyPeriod');
    expect(getStatsViewState(STATS_FIXTURES.february.summary)).toBe('future');
    expect(STATS_FIXTURES.month.breakdown.by_category.other?.children).toHaveLength(4);
  });
});
