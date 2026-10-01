import type { StatisticsSummary } from '@api/dto';

export type StatsViewState = 'pending' | 'future' | 'noHistory' | 'emptyPeriod' | 'data';

// Decided by the period state and counts only: sums of "0.00" also come from real transactions.
// Without a summary nothing is concluded, so a failed load never reads as an empty period.
export const getStatsViewState = (summary: StatisticsSummary | undefined): StatsViewState => {
  if (!summary) return 'pending';
  if (summary.period.state === 'future') return 'future';
  if (!summary.has_any_transactions) return 'noHistory';
  if (summary.transactions_count === 0 && summary.last_transaction_date !== null) return 'emptyPeriod';

  return 'data';
};
