import type { Money } from '@api/dto';
import type { TransactionFeedSummary, TransactionModel } from '@api/models';
import { getLoadState } from '@redux/api/loadState';
import type { TransactionFeedPage } from './api';

// What an empty period says about the whole history: none at all, none in it, or not yet known.
export type EmptyPeriodState = 'loading' | 'latestError' | 'trueEmpty' | 'filteredEmpty';

interface LatestQuery {
  currentData?: TransactionModel | null;
  isUninitialized: boolean;
  isFetching: boolean;
  isError: boolean;
}

export const getEmptyPeriodState = (
  latestQuery: LatestQuery,
  { from, to }: { from: Date; to: Date },
): EmptyPeriodState => {
  const { isLoading, hasError } = getLoadState(latestQuery);
  const latest = latestQuery.currentData;

  if (isLoading || latestQuery.isUninitialized) return 'loading';
  if (hasError) return 'latestError';
  if (latest === null) return 'trueEmpty';

  // A latest record inside the empty period is one just deleted; the next one decides.
  const time = latest ? new Date(latest.timestamp).getTime() : NaN;
  if (time >= from.getTime() && time <= to.getTime()) return latestQuery.isFetching ? 'loading' : 'latestError';

  return 'filteredEmpty';
};

export interface FeedView {
  items: TransactionModel[];
  // Null until a page arrives.
  summary: TransactionFeedSummary | null;
  // Income minus expense of each whole day, by local date key.
  dayNets: Record<string, Money>;
}

// Pages in list order; a record or day the server returned more than once is read from the newest response.
export const getFeedView = (pages: readonly TransactionFeedPage[]): FeedView => {
  const newest = new Map<string, { sequence: number; page: number; index: number }>();

  pages.forEach(({ items, sequence }, page) =>
    items.forEach(({ id }, index) => {
      if ((newest.get(id)?.sequence ?? -1) < sequence) newest.set(id, { sequence, page, index });
    }),
  );

  const items = pages.flatMap((pageData, page) =>
    pageData.items.filter(({ id }, index) => {
      const copy = newest.get(id);

      return copy?.page === page && copy.index === index;
    }),
  );
  const byArrival = [...pages].sort((a, b) => a.sequence - b.sequence);
  const dayNets: Record<string, Money> = {};

  byArrival.forEach(({ dayTotals }) => dayTotals.forEach(({ date, net }) => (dayNets[date] = net)));

  return { items, summary: byArrival.at(-1)?.summary ?? null, dayNets };
};
