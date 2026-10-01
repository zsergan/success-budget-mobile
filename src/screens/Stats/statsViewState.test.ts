import type { StatisticsSummary } from '@api/dto';
import { getStatsViewState } from './statsViewState';

const zero = { amount: '0.00', count: 0 };

const summary = (overrides: Partial<StatisticsSummary> & { state?: 'past' | 'current' | 'future' } = {}) => {
  const { state = 'current', ...rest } = overrides;

  return {
    period: { state },
    income: zero,
    expense: zero,
    net: '0.00',
    transactions_count: 2,
    has_any_transactions: true,
    last_transaction_date: '2026-09-12',
    ...rest,
  } as StatisticsSummary;
};

describe('getStatsViewState', () => {
  it('concludes nothing before the summary arrives', () => {
    expect(getStatsViewState(undefined)).toBe('pending');
  });

  it('puts a period that has not started first', () => {
    expect(getStatsViewState(summary({ state: 'future', transactions_count: 0, has_any_transactions: false }))).toBe(
      'future',
    );
  });

  it('tells no transactions ever from none in this period', () => {
    expect(
      getStatsViewState(summary({ transactions_count: 0, has_any_transactions: false, last_transaction_date: null })),
    ).toBe('noHistory');
    expect(getStatsViewState(summary({ transactions_count: 0, last_transaction_date: '2026-08-29' }))).toBe(
      'emptyPeriod',
    );
  });

  it('shows data when transactions exist even if every sum is zero', () => {
    expect(getStatsViewState(summary())).toBe('data');
  });
});
