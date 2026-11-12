import type useTransactionsData from './hooks/useTransactionsData';

// What a list of the feed takes from its data, the same whichever screen lists it.
export const feedListProps = (data: ReturnType<typeof useTransactionsData>) => ({
  groups: data.viewState === 'ready' ? data.sections : [],
  selectionKey: data.selectionKey,
  currencyCode: data.currencyCode,
  older: {
    hasMore: data.hasNextPage,
    isLoading: data.isLoadingNextPage,
    hasError: data.hasNextPageError,
    onReached: data.loadNextPage,
  },
  newer: {
    hasMore: data.hasPreviousPage,
    isLoading: data.isLoadingPreviousPage,
    hasError: data.hasPreviousPageError,
    onReached: data.loadPreviousPage,
  },
  onRetryPage: data.retry,
});
